using Dapper;
using Fio.Application.Contracts;
using Npgsql;

namespace Fio.Infrastructure.Persistence;

public sealed class PostgresConnectionFactory(Func<string?> connectionStringProvider) : IDisposable
{
    private readonly object sync = new();
    private NpgsqlDataSource? dataSource;

    public NpgsqlConnection Open()
    {
        // CreateConnection returns a pooled logical connection without doing synchronous I/O.
        // Dapper opens it asynchronously when executing the first command.
        return GetDataSource().CreateConnection();
    }

    public void Dispose()
    {
        lock (sync)
        {
            dataSource?.Dispose();
            dataSource = null;
        }
    }

    private NpgsqlDataSource GetDataSource()
    {
        var current = Volatile.Read(ref dataSource);
        if (current is not null) return current;
        lock (sync)
        {
            if (dataSource is not null) return dataSource;
            var connectionString = connectionStringProvider();
            if (string.IsNullOrWhiteSpace(connectionString)) throw new DomainException("A API não está conectada ao banco de dados.", 503, "banco_indisponivel");
            dataSource = NpgsqlDataSource.Create(NormalizeConnectionString(connectionString));
            return dataSource;
        }
    }

    private static string NormalizeConnectionString(string value)
    {
        if (Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
            (uri.Scheme.Equals("postgresql", StringComparison.OrdinalIgnoreCase) || uri.Scheme.Equals("postgres", StringComparison.OrdinalIgnoreCase)))
        {
            return NormalizePostgresUri(uri);
        }

        var builder = new NpgsqlConnectionStringBuilder(value);
        ValidateSearchPath(builder.SearchPath);
        ValidateOptions(builder.Options);
        return builder.ConnectionString;
    }

    private static string NormalizePostgresUri(Uri uri)
    {
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.Trim('/'))
        };

        var userInfo = uri.UserInfo;
        var separator = userInfo.IndexOf(':');
        builder.Username = Uri.UnescapeDataString(separator < 0 ? userInfo : userInfo[..separator]);
        if (separator >= 0) builder.Password = Uri.UnescapeDataString(userInfo[(separator + 1)..]);

        foreach (var (key, parameterValue) in ParseQuery(uri.Query))
        {
            switch (key)
            {
                case "schema":
                    ValidateSearchPath(parameterValue);
                    if (!string.IsNullOrWhiteSpace(parameterValue)) builder.SearchPath = parameterValue;
                    break;
                case "options":
                    ValidateOptions(parameterValue);
                    builder.Options = parameterValue;
                    break;
                case "search_path":
                    ValidateSearchPath(parameterValue);
                    if (!string.IsNullOrWhiteSpace(parameterValue)) builder.SearchPath = parameterValue;
                    break;
                case "application_name":
                    builder.ApplicationName = parameterValue;
                    break;
                case "connect_timeout":
                    builder.Timeout = int.Parse(parameterValue, System.Globalization.CultureInfo.InvariantCulture);
                    break;
                case "command_timeout":
                    builder.CommandTimeout = int.Parse(parameterValue, System.Globalization.CultureInfo.InvariantCulture);
                    break;
                case "connection_limit":
                case "max_pool_size":
                    builder.MaxPoolSize = int.Parse(parameterValue, System.Globalization.CultureInfo.InvariantCulture);
                    break;
                case "min_pool_size":
                    builder.MinPoolSize = int.Parse(parameterValue, System.Globalization.CultureInfo.InvariantCulture);
                    break;
                case "max_auto_prepare":
                    builder.MaxAutoPrepare = int.Parse(parameterValue, System.Globalization.CultureInfo.InvariantCulture);
                    break;
                case "auto_prepare_min_usages":
                    builder.AutoPrepareMinUsages = int.Parse(parameterValue, System.Globalization.CultureInfo.InvariantCulture);
                    break;
                case "sslmode":
                    builder.SslMode = Enum.Parse<SslMode>(parameterValue.Replace("-", string.Empty), ignoreCase: true);
                    break;
                case "sslrootcert":
                    builder.RootCertificate = parameterValue;
                    break;
                case "sslcert":
                    builder.SslCertificate = parameterValue;
                    break;
                case "sslkey":
                    builder.SslKey = parameterValue;
                    break;
            }
        }

        return builder.ConnectionString;
    }

    private static IEnumerable<(string Key, string Value)> ParseQuery(string query)
    {
        foreach (var item in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var separator = item.IndexOf('=');
            var key = Uri.UnescapeDataString((separator < 0 ? item : item[..separator]).Replace("+", " "));
            var value = Uri.UnescapeDataString((separator < 0 ? string.Empty : item[(separator + 1)..]).Replace("+", " "));
            yield return (key, value);
        }
    }

    private static void ValidateSearchPath(string? searchPath)
    {
        if (!string.IsNullOrWhiteSpace(searchPath) && !string.Equals(searchPath, "public", StringComparison.Ordinal))
            throw new InvalidOperationException("DATABASE_URL aponta para um schema não suportado; apenas public é suportado.");
    }

    private static void ValidateOptions(string? options)
    {
        if (!string.IsNullOrWhiteSpace(options) && options != "-c search_path=public")
            throw new InvalidOperationException("DATABASE_URL contém options incompatível com search_path=public.");
    }

    public static void ConfigureDapper() => DefaultTypeMap.MatchNamesWithUnderscores = true;
}

internal static class RowMapping
{
    public static DateTimeOffset Utc(DateTime value) => new(DateTime.SpecifyKind(value, DateTimeKind.Utc));
    public static EmpresaResponse Empresa(EmpresaRow row, int? count = null) => new(row.Id, row.Nome, row.Stack_principal, row.Site, row.Estado, row.Modelo_trabalho, row.Observacoes, Utc(row.Created_at), count is null ? null : new ContagemCandidaturasResponse(count.Value));
    public static CandidaturaResponse Candidatura(CandidaturaRow row, EmpresaResponse empresa, IReadOnlyList<FollowupResponse>? followups = null) => new(row.Id, row.Vaga_nome, row.Empresa_id, empresa, Enum.Parse<StatusCandidatura>(row.Status), Utc(row.Data_aplicacao), row.Descricao, row.Link_vaga, row.Salario_estimado, row.Origem, row.Observacoes, row.Ativa, Utc(row.Etapa_desde), row.Motivo_recusa, Utc(row.Created_at), Utc(row.Updated_at), followups);
}
internal sealed class EmpresaRow { public required string Id { get; init; } public required string Nome { get; init; } public string? Stack_principal { get; init; } public string? Site { get; init; } public string? Estado { get; init; } public string? Modelo_trabalho { get; init; } public string? Observacoes { get; init; } public DateTime Created_at { get; init; } public int Candidaturas_total { get; init; } }
internal sealed class CandidaturaRow { public required string Id { get; init; } public required string Vaga_nome { get; init; } public required string Empresa_id { get; init; } public required string Status { get; init; } public DateTime Data_aplicacao { get; init; } public string? Descricao { get; init; } public string? Link_vaga { get; init; } public string? Salario_estimado { get; init; } public string? Origem { get; init; } public string? Observacoes { get; init; } public bool Ativa { get; init; } public DateTime Etapa_desde { get; init; } public string? Motivo_recusa { get; init; } public DateTime Created_at { get; init; } public DateTime Updated_at { get; init; } }
internal sealed class FollowupRow { public required string Id { get; init; } public required string Candidatura_id { get; init; } public DateTime Data_prevista { get; init; } public bool Feito { get; init; } public string? Resultado { get; init; } public string? Nota { get; init; } public DateTime Created_at { get; init; } public DateTime Updated_at { get; init; } }
