using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Dapper;
using Fio.Infrastructure.Persistence;
using Npgsql;

namespace Fio.Infrastructure.Migrations;

/// <summary>Executa o catálogo e ledger da API Bun, apenas via --migrate.</summary>
public sealed class LegacySqlMigrator(PostgresConnectionFactory connections)
{
    private const int LockNamespace = 178542091;
    private const int LockKey = 1;

    public async Task ApplyAsync(string migrationsDirectory, CancellationToken ct)
    {
        var catalog = await ReadCatalogAsync(migrationsDirectory, ct);
        var legacy = catalog.Where(x => x.Name.StartsWith("legacy:", StringComparison.Ordinal)).ToArray();
        await using var db = connections.Open();
        await db.OpenAsync(ct);
        var locked = false;
        try
        {
            await db.ExecuteAsync(new CommandDefinition("SELECT pg_advisory_lock(@namespace, @key)", new { @namespace = LockNamespace, key = LockKey }, cancellationToken: ct));
            locked = true;
            if (await db.ExecuteScalarAsync<string?>(new CommandDefinition("SELECT current_schema()", cancellationToken: ct)) != "public")
                throw new InvalidOperationException("Somente search_path public é suportado.");

            await using (var tx = await db.BeginTransactionAsync(ct))
            {
                var applied = await ReadAndValidateHistoryAsync(db, tx, catalog, legacy, ct);
                var ledgerCount = await db.ExecuteScalarAsync<int>(new CommandDefinition("SELECT count(*)::int FROM linkanban_migrations", transaction: tx, cancellationToken: ct));
                var legacyCount = legacy.Count(x => applied.ContainsKey(x.Name));
                // Após migrations Drizzle, a estrutura pode ter evoluído além do snapshot legado.
                if (ledgerCount <= legacy.Length + 1) await ValidateLegacySchemaAsync(db, tx, legacy, legacyCount, ct);
                for (var position = 0; position < catalog.Count; position++)
                {
                    var migration = catalog[position];
                    if (!applied.ContainsKey(migration.Name)) continue;
                    await db.ExecuteAsync(new CommandDefinition("INSERT INTO linkanban_migrations(position,name,hash) VALUES(@position,@name,@hash) ON CONFLICT(position) DO NOTHING", new { position, migration.Name, migration.Hash }, tx, cancellationToken: ct));
                }
                await tx.CommitAsync(ct);
            }

            // Commit por arquivo: uma migration que cria enum pode ser seguida por outra que o usa.
            for (var position = 0; position < catalog.Count; position++)
            {
                var migration = catalog[position];
                if (await IsAppliedAsync(db, migration.Name, ct)) continue;
                await using var tx = await db.BeginTransactionAsync(ct);
                try
                {
                    if (!migration.Baseline) await db.ExecuteAsync(new CommandDefinition(migration.Sql, transaction: tx, cancellationToken: ct));
                    await db.ExecuteAsync(new CommandDefinition("INSERT INTO linkanban_migrations(position,name,hash) VALUES(@position,@name,@hash)", new { position, migration.Name, migration.Hash }, tx, cancellationToken: ct));
                    await tx.CommitAsync(ct);
                }
                catch
                {
                    await tx.RollbackAsync(CancellationToken.None);
                    throw;
                }
            }
        }
        finally
        {
            if (locked) await db.ExecuteAsync(new CommandDefinition("SELECT pg_advisory_unlock(@namespace, @key)", new { @namespace = LockNamespace, key = LockKey }, cancellationToken: CancellationToken.None));
        }
    }

    /// <summary>Catálogo equivalente ao de apps/api/scripts/migrate.ts.</summary>
    public static async Task<IReadOnlyList<MigrationEntry>> ReadCatalogAsync(string migrationsDirectory, CancellationToken ct = default)
    {
        if (!Directory.Exists(migrationsDirectory)) throw new DirectoryNotFoundException(migrationsDirectory);
        var legacy = new List<MigrationEntry>();
        foreach (var directory in Directory.EnumerateDirectories(migrationsDirectory).OrderBy(x => x, StringComparer.Ordinal))
        {
            var file = Path.Combine(directory, "migration.sql");
            if (File.Exists(file)) legacy.Add(MigrationEntry.Create($"legacy:{Path.GetFileName(directory)}", await File.ReadAllTextAsync(file, ct)));
        }

        // Desenvolvimento: apps/api/prisma/migrations -> raiz apps/api.
        // Imagem publicada: /app/migrations -> raiz /app, com /app/drizzle ao lado.
        var catalogDirectory = new DirectoryInfo(Path.GetFullPath(migrationsDirectory));
        var root = new[] { catalogDirectory.Parent, catalogDirectory.Parent?.Parent }
            .OfType<DirectoryInfo>()
            .Select(candidate => candidate.FullName)
            .FirstOrDefault(candidate => File.Exists(Path.Combine(candidate, "drizzle", "meta", "_journal.json")));
        if (root is null) return legacy;
        var journalPath = Path.Combine(root, "drizzle", "meta", "_journal.json");
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var journal = JsonSerializer.Deserialize<DrizzleJournal>(await File.ReadAllTextAsync(journalPath, ct), jsonOptions) ?? throw new InvalidOperationException("Journal Drizzle inválido.");
        var baseline = JsonSerializer.Deserialize<DrizzleBaseline>(await File.ReadAllTextAsync(Path.Combine(root, "drizzle", "baseline.json"), ct), jsonOptions) ?? throw new InvalidOperationException("Baseline Drizzle inválido.");
        if (journal.Entries.FirstOrDefault()?.Tag != baseline.Tag) throw new InvalidOperationException("Baseline Drizzle incompatível.");

        var all = new List<MigrationEntry>(legacy);
        for (var index = 0; index < journal.Entries.Count; index++)
        {
            var tag = journal.Entries[index].Tag;
            var entry = MigrationEntry.Create($"drizzle:{tag}", await File.ReadAllTextAsync(Path.Combine(root, "drizzle", $"{tag}.sql"), ct), index == 0);
            if (index == 0 && !string.Equals(entry.Hash, baseline.Hash, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Checksum do baseline Drizzle divergiu.");
            all.Add(entry);
        }
        return all;
    }

    private static async Task<Dictionary<string, string>> ReadAndValidateHistoryAsync(NpgsqlConnection db, NpgsqlTransaction tx, IReadOnlyList<MigrationEntry> catalog, IReadOnlyList<MigrationEntry> legacy, CancellationToken ct)
    {
        await db.ExecuteAsync(new CommandDefinition("CREATE TABLE IF NOT EXISTS linkanban_migrations (position integer PRIMARY KEY, name text UNIQUE NOT NULL, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())", transaction: tx, cancellationToken: ct));
        var relations = await db.QuerySingleAsync<Relations>(new CommandDefinition("SELECT to_regclass('_prisma_migrations')::text AS prisma, to_regclass('linkanban_migrations')::text AS ledger", transaction: tx, cancellationToken: ct));
        var applied = new Dictionary<string, string>(StringComparer.Ordinal);
        if (relations.Prisma is not null)
        {
            var prismaRows = await db.QueryAsync<PrismaHistory>(new CommandDefinition("SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at", transaction: tx, cancellationToken: ct));
            foreach (var row in prismaRows)
            {
                var migration = legacy.SingleOrDefault(x => x.Name == $"legacy:{row.Migration_name}") ?? throw new InvalidOperationException($"Migração Prisma desconhecida: {row.Migration_name}");
                if (row.Rolled_back_at is not null) continue;
                if (row.Finished_at is null || !migration.CompatibleHashes.Contains(row.Checksum, StringComparer.OrdinalIgnoreCase)) throw new InvalidOperationException($"Histórico Prisma inválido: {row.Migration_name}");
                if (!applied.TryAdd(migration.Name, migration.Hash)) throw new InvalidOperationException("Histórico Prisma duplicado.");
            }
            EnsureNoGaps(legacy, applied, "Histórico Prisma tem uma lacuna.");
        }
        if (relations.Ledger is not null)
        {
            var rows = (await db.QueryAsync<LedgerHistory>(new CommandDefinition("SELECT position, name, hash FROM linkanban_migrations ORDER BY position", transaction: tx, cancellationToken: ct))).ToArray();
            for (var index = 0; index < rows.Length; index++)
            {
                var row = rows[index];
                var migration = index < catalog.Count ? catalog[index] : null;
                if (row.Position != index || migration is null || migration.Name != row.Name || !migration.CompatibleHashes.Contains(row.Hash, StringComparer.OrdinalIgnoreCase)) throw new InvalidOperationException($"Histórico Linkanban inválido: {row.Name}");
                applied[migration.Name] = migration.Hash;
            }
        }
        EnsureNoGaps(catalog, applied, "Histórico de migrations tem uma lacuna.");
        return applied;
    }

    private static void EnsureNoGaps(IEnumerable<MigrationEntry> migrations, IReadOnlyDictionary<string, string> applied, string message)
    {
        var missing = false;
        foreach (var migration in migrations)
        {
            if (!applied.ContainsKey(migration.Name)) missing = true;
            else if (missing) throw new InvalidOperationException(message);
        }
    }

    private static async Task<bool> IsAppliedAsync(NpgsqlConnection db, string name, CancellationToken ct) => await db.ExecuteScalarAsync<int>(new CommandDefinition("SELECT count(*)::int FROM linkanban_migrations WHERE name=@name", new { name }, cancellationToken: ct)) > 0;

    private static async Task ValidateLegacySchemaAsync(NpgsqlConnection db, NpgsqlTransaction tx, IReadOnlyList<MigrationEntry> legacy, int count, CancellationToken ct)
    {
        var target = await db.ExecuteScalarAsync<string?>(new CommandDefinition("SELECT current_schema()", transaction: tx, cancellationToken: ct)) ?? throw new InvalidOperationException("Schema PostgreSQL indisponível.");
        var actual = await FingerprintAsync(db, target, tx, ct);
        var reference = "linkanban_reference_" + Guid.NewGuid().ToString("N");
        await db.ExecuteAsync(new CommandDefinition("SAVEPOINT schema_reference", transaction: tx, cancellationToken: ct));
        try
        {
            await db.ExecuteAsync(new CommandDefinition($"CREATE SCHEMA \"{reference}\"", transaction: tx, cancellationToken: ct));
            await db.ExecuteAsync(new CommandDefinition($"SET LOCAL search_path TO \"{reference}\"", transaction: tx, cancellationToken: ct));
            foreach (var migration in legacy.Take(count)) await db.ExecuteAsync(new CommandDefinition(migration.Sql, transaction: tx, cancellationToken: ct));
            var expected = await FingerprintAsync(db, reference, tx, ct);
            if (!actual.SequenceEqual(expected, StringComparer.Ordinal)) throw new InvalidOperationException("Schema diverge do histórico reconhecido; reconcilie antes de migrar.");
        }
        finally
        {
            await db.ExecuteAsync(new CommandDefinition("ROLLBACK TO SAVEPOINT schema_reference", transaction: tx, cancellationToken: ct));
            await db.ExecuteAsync(new CommandDefinition("RELEASE SAVEPOINT schema_reference", transaction: tx, cancellationToken: ct));
        }
    }

    private static async Task<string[]> FingerprintAsync(NpgsqlConnection db, string schema, NpgsqlTransaction tx, CancellationToken ct)
    {
        const string sql = """
            SELECT 'column:' || c.relname || ':' || a.attname || ':' || format_type(a.atttypid,a.atttypmod) || ':' || a.attnotnull || ':' || coalesce(pg_get_expr(d.adbin,d.adrelid),'') AS definition FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname=@schema AND c.relname=ANY(@tables) AND c.relkind='r'
            UNION ALL SELECT 'constraint:' || c.relname || ':' || co.conname || ':' || pg_get_constraintdef(co.oid) FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=@schema AND c.relname=ANY(@tables)
            UNION ALL SELECT 'index:' || tablename || ':' || indexname || ':' || indexdef FROM pg_indexes WHERE schemaname=@schema AND tablename=ANY(@tables)
            UNION ALL SELECT 'enum:' || t.typname || ':' || e.enumsortorder || ':' || e.enumlabel FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname=@schema AND t.typname IN ('StatusCandidatura','ResultadoFollowup')
            """;
        var rows = await db.QueryAsync<string>(new CommandDefinition(sql, new { schema, tables = new[] { "empresas", "candidaturas", "followups", "users", "workspaces", "api_tokens" } }, tx, cancellationToken: ct));
        return rows.Select(x => x.Replace($"\"{schema}\".", "").Replace($"{schema}.", "")).OrderBy(x => x, StringComparer.Ordinal).ToArray();
    }

    private sealed class Relations { public string? Prisma { get; init; } public string? Ledger { get; init; } }
    private sealed class PrismaHistory { public required string Migration_name { get; init; } public required string Checksum { get; init; } public DateTime? Finished_at { get; init; } public DateTime? Rolled_back_at { get; init; } }
    private sealed class LedgerHistory { public int Position { get; init; } public required string Name { get; init; } public required string Hash { get; init; } }
    private sealed class DrizzleJournal { public List<DrizzleJournalEntry> Entries { get; init; } = []; }
    private sealed class DrizzleJournalEntry { public required string Tag { get; init; } }
    private sealed class DrizzleBaseline { public required string Tag { get; init; } public required string Hash { get; init; } }
}

public sealed record MigrationEntry(string Name, string Sql, string Hash, IReadOnlySet<string> CompatibleHashes, bool Baseline)
{
    public static MigrationEntry Create(string name, string sql, bool baseline = false)
    {
        var normalized = Normalize(sql);
        var rawHash = Digest(sql);
        var normalizedHash = Digest(normalized);
        var crlfHash = Digest(normalized.Replace("\n", "\r\n", StringComparison.Ordinal));
        return new MigrationEntry(name, sql, normalizedHash, new HashSet<string>([rawHash, normalizedHash, crlfHash], StringComparer.OrdinalIgnoreCase), baseline);
    }
    public static string Normalize(string sql) => sql.Replace("\r\n", "\n", StringComparison.Ordinal).Replace("\r", "\n", StringComparison.Ordinal);
    private static string Digest(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
