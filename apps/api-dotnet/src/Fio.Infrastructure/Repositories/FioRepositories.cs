using System.Data;
using Dapper;
using Fio.Application.Contracts;
using Fio.Application.Ports;
using Fio.Infrastructure.Persistence;
using Npgsql;

namespace Fio.Infrastructure.Repositories;

public sealed class AuthRepository(PostgresConnectionFactory connections) : IAuthRepository
{
    private const string LocalId = "00000000-0000-4000-8000-000000000001";
    public async Task<AuthPrincipal?> FindActiveAsync(string tokenHash, CancellationToken ct)
    {
        await using var db = connections.Open();
        const string sql = "SELECT id, user_id FROM api_tokens WHERE token_hash = @tokenHash AND revoked_at IS NULL LIMIT 1";
        var row = await db.QuerySingleOrDefaultAsync<AuthRow>(new CommandDefinition(sql, new { tokenHash }, cancellationToken: ct));
        return row is null ? null : new AuthPrincipal(row.User_id, row.Id);
    }
    public async Task<BootstrapOwner?> CreateBootstrapAsync(string tokenHash, BootstrapRequest request, CancellationToken ct)
    {
        await using var db = connections.Open(); await db.OpenAsync(ct);
        await using var tx = await db.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        await db.ExecuteAsync(new CommandDefinition("LOCK TABLE api_tokens IN ACCESS EXCLUSIVE MODE", transaction: tx, cancellationToken: ct));
        var count = await db.ExecuteScalarAsync<long>(new CommandDefinition("SELECT count(*) FROM api_tokens", transaction: tx, cancellationToken: ct));
        if (count > 0) { await tx.RollbackAsync(ct); return null; }
        var owner = await db.QuerySingleOrDefaultAsync<BootstrapOwner>(new CommandDefinition("SELECT id AS user_id, email AS user_email, nome AS user_nome FROM users WHERE id=@id", new { id = LocalId }, tx, cancellationToken: ct));
        if (owner is null)
        {
            var email = request.Email ?? $"bootstrap-{Guid.NewGuid():N}@local.invalid"; var nome = request.Nome ?? "Usuário local";
            await db.ExecuteAsync(new CommandDefinition("INSERT INTO users(id,email,nome) VALUES(@id,@email,@nome)", new { id = LocalId, email, nome }, tx, cancellationToken: ct));
            owner = new BootstrapOwner(LocalId, email, nome);
        }
        await db.ExecuteAsync(new CommandDefinition("INSERT INTO api_tokens(id,token_hash,user_id) VALUES(@id,@tokenHash,@userId)", new { id = Guid.NewGuid().ToString(), tokenHash, userId = owner.User_id }, tx, cancellationToken: ct));
        await tx.CommitAsync(ct); return owner;
    }
    private sealed class AuthRow { public required string Id { get; init; } public required string User_id { get; init; } }
}

public sealed class EmpresaRepository(PostgresConnectionFactory connections) : IEmpresaRepository
{
    private const string Columns = "id,nome,stack_principal,site,estado,modelo_trabalho,observacoes,created_at";
    public async Task<IReadOnlyList<EmpresaResponse>> ListAsync(string userId, CancellationToken ct)
    {
        await using var db = connections.Open();
        // Aggregate candidaturas once per empresa before joining. This avoids multiplying
        // the company rowset and lets PostgreSQL use the user/company composite index.
        var sql = $"""
            SELECT e.{Columns.Replace(",", ",e.")}, COALESCE(counts.candidaturas_total, 0)::int AS candidaturas_total
            FROM empresas e
            LEFT JOIN (
                SELECT user_id, empresa_id, count(*)::int AS candidaturas_total
                FROM candidaturas
                WHERE user_id = @userId
                GROUP BY user_id, empresa_id
            ) counts ON counts.empresa_id = e.id AND counts.user_id = e.user_id
            WHERE e.user_id = @userId
            ORDER BY e.created_at DESC
            """;
        var rows = await db.QueryAsync<EmpresaRow>(new CommandDefinition(sql, new { userId }, cancellationToken: ct));
        return rows.Select(x => RowMapping.Empresa(x, x.Candidaturas_total)).ToArray();
    }
    public async Task<EmpresaResponse?> FindAsync(string userId, string id, CancellationToken ct) { await using var db = connections.Open(); var row = await db.QuerySingleOrDefaultAsync<EmpresaRow>(new CommandDefinition($"SELECT {Columns} FROM empresas WHERE id=@id AND user_id=@userId", new { id, userId }, cancellationToken: ct)); return row is null ? null : RowMapping.Empresa(row); }
    public async Task<EmpresaResponse> CreateAsync(string userId, EmpresaRequest r, CancellationToken ct) { await using var db = connections.Open(); var id = Guid.NewGuid().ToString(); var row = await db.QuerySingleAsync<EmpresaRow>(new CommandDefinition($"INSERT INTO empresas(id,user_id,nome,stack_principal,estado,modelo_trabalho,site,observacoes) VALUES(@id,@userId,@nome,@tecnologias,@estado,@modelo,@site,@observacoes) RETURNING {Columns}", new { id, userId, nome = r.Nome.Trim(), tecnologias = Empty(r.Tecnologias), estado = Empty(r.Estado), modelo = Empty(r.Modelo_trabalho), site = Empty(r.Site), observacoes = Empty(r.Observacoes) }, cancellationToken: ct)); return RowMapping.Empresa(row); }
    public async Task<EmpresaResponse?> UpdateAsync(string userId, string id, EmpresaRequest r, CancellationToken ct) { await using var db = connections.Open(); var row = await db.QuerySingleOrDefaultAsync<EmpresaRow>(new CommandDefinition($"UPDATE empresas SET nome=@nome,stack_principal=@tecnologias,estado=@estado,modelo_trabalho=@modelo,site=@site,observacoes=@observacoes WHERE id=@id AND user_id=@userId RETURNING {Columns}", new { id, userId, nome = r.Nome.Trim(), tecnologias = Empty(r.Tecnologias), estado = Empty(r.Estado), modelo = Empty(r.Modelo_trabalho), site = Empty(r.Site), observacoes = Empty(r.Observacoes) }, cancellationToken: ct)); return row is null ? null : RowMapping.Empresa(row); }
    public async Task<int> CountCandidaturasAsync(string userId, string id, CancellationToken ct) { await using var db = connections.Open(); return await db.ExecuteScalarAsync<int>(new CommandDefinition("SELECT count(*)::int FROM candidaturas WHERE empresa_id=@id AND user_id=@userId", new { id, userId }, cancellationToken: ct)); }
    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct) { await using var db = connections.Open(); return await db.ExecuteAsync(new CommandDefinition("DELETE FROM empresas WHERE id=@id AND user_id=@userId", new { id, userId }, cancellationToken: ct)) == 1; }
    public async Task<IReadOnlyList<string>> OrigensAsync(string userId, CancellationToken ct) { await using var db = connections.Open(); return (await db.QueryAsync<string>(new CommandDefinition("SELECT DISTINCT origem FROM candidaturas WHERE user_id=@userId AND origem IS NOT NULL ORDER BY origem", new { userId }, cancellationToken: ct))).ToArray(); }
    private static string? Empty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
