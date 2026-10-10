using Dapper;
using Fio.Application.Contracts;
using Fio.Application.Ports;
using Fio.Infrastructure.Persistence;

namespace Fio.Infrastructure.Repositories;

public sealed class CandidaturaRepository(PostgresConnectionFactory connections) : ICandidaturaRepository
{
    private const string CandidateColumns = "c.id,c.vaga_nome,c.empresa_id,c.status::text AS status,c.data_aplicacao,c.descricao,c.link_vaga,c.salario_estimado,c.origem,c.observacoes,c.ativa,c.etapa_desde,c.motivo_recusa,c.created_at,c.updated_at";
    private const string CompanyColumns = "e.id,e.nome,e.stack_principal,e.site,e.estado,e.modelo_trabalho,e.observacoes,e.created_at";
    public async Task<CandidaturasResponse> ListAsync(string userId, CandidaturasQuery q, CancellationToken ct)
    {
        await using var db = connections.Open();
        var from = "FROM candidaturas c JOIN empresas e ON e.id=c.empresa_id AND e.user_id=c.user_id";
        var where = new System.Text.StringBuilder("WHERE c.user_id=@userId");
        var args = new DynamicParameters(new { userId });
        if (!q.IncluirArquivadas) where.Append(" AND c.ativa=true");
        if (q.Status is not null) { where.Append(" AND c.status::text=@status"); args.Add("status", q.Status.Value.ToString()); }
        if (!string.IsNullOrWhiteSpace(q.Busca)) { where.Append(" AND (c.vaga_nome ILIKE @search ESCAPE '\\' OR c.origem ILIKE @search ESCAPE '\\' OR e.nome ILIKE @search ESCAPE '\\')"); args.Add("search", "%" + EscapeLike(q.Busca) + "%"); }

        var paginada = q.Pagina is not null || q.Limite is not null;
        var pagina = q.Pagina ?? 1;
        var limite = q.Limite ?? 50;
        if (paginada && (pagina < 1 || limite is < 1 or > 100))
            throw new DomainException("A página deve ser maior que zero e o limite deve ficar entre 1 e 100.");

        var total = 0;
        if (paginada)
            total = await db.ExecuteScalarAsync<int>(new CommandDefinition($"SELECT count(*)::int {from} {where}", args, cancellationToken: ct));

        var sql = $"SELECT {CandidateColumns},{CompanyColumns} {from} {where} ORDER BY " + q.Ordenar switch { "antigas" => "c.data_aplicacao ASC", "paradas" => "c.etapa_desde ASC", "empresa" => "e.nome ASC", "etapa" => "c.status ASC,c.etapa_desde ASC", _ => "c.data_aplicacao DESC" };
        if (paginada)
        {
            args.Add("limit", limite);
            args.Add("offset", ((long)pagina - 1) * limite);
            sql += " LIMIT @limit OFFSET @offset";
        }

        var empresas = new Dictionary<string, EmpresaResponse>(StringComparer.Ordinal);
        var rows = await db.QueryAsync<CandidaturaRow, EmpresaRow, CandidaturaResponse>(new CommandDefinition(sql, args, cancellationToken: ct), (c, e) =>
        {
            if (!empresas.TryGetValue(e.Id, out var empresa))
            {
                empresa = RowMapping.Empresa(e);
                empresas.Add(e.Id, empresa);
            }
            return RowMapping.Candidatura(c, empresa);
        }, splitOn: "id");
        var result = rows.ToArray();
        return new CandidaturasResponse(result, paginada ? total : result.Length);
    }
    public async Task<CandidaturaResponse?> FindAsync(string userId, string id, bool includeFollowups, CancellationToken ct)
    {
        await using var db = connections.Open();
        var result = (await db.QueryAsync<CandidaturaRow, EmpresaRow, CandidaturaResponse>(new CommandDefinition($"SELECT {CandidateColumns},{CompanyColumns} FROM candidaturas c JOIN empresas e ON e.id=c.empresa_id AND e.user_id=c.user_id WHERE c.id=@id AND c.user_id=@userId", new { id, userId }, cancellationToken: ct), (c, e) => RowMapping.Candidatura(c, RowMapping.Empresa(e)), splitOn: "id")).SingleOrDefault();
        if (result is null || !includeFollowups) return result;
        var followups = await FollowupQueries.ForCandidaturaAsync(db, userId, id, result, ct);
        return result with { Followups = followups };
    }
    public async Task<CandidaturaResponse> CreateAsync(string userId, string? id, CreateCandidaturaRequest r, CancellationToken ct)
    {
        await using var db = connections.Open(); var candidateId = id ?? Guid.NewGuid().ToString();
        await db.ExecuteAsync(new CommandDefinition("INSERT INTO candidaturas(id,user_id,vaga_nome,empresa_id,status,data_aplicacao,descricao,link_vaga,salario_estimado,origem,observacoes,motivo_recusa,etapa_desde) VALUES(@candidateId,@userId,@vaga,@empresa,CAST(@status AS \"StatusCandidatura\"),@data,@descricao,@link,@salario,@origem,@observacoes,@motivo,now())", new { candidateId, userId, vaga = r.Vaga_nome.Trim(), empresa = r.Empresa_id, status = (r.Status ?? StatusCandidatura.APLICADO).ToString(), data = r.Data_aplicacao?.UtcDateTime ?? DateTime.UtcNow, descricao = Empty(r.Descricao), link = Empty(r.Link_vaga), salario = Empty(r.Salario_estimado), origem = Empty(r.Origem), observacoes = Empty(r.Observacoes), motivo = Empty(r.Motivo_recusa) }, cancellationToken: ct));
        return await FindAsync(userId, candidateId, false, ct) ?? throw new InvalidOperationException("Candidatura criada não pôde ser lida.");
    }
    public async Task<CandidaturaResponse?> UpdateAsync(string userId, string id, UpdateCandidaturaRequest r, bool updateStage, CancellationToken ct)
    {
        await using var db = connections.Open();
        var updates = new List<string> { "updated_at=now()" }; var p = new DynamicParameters(new { id, userId });
        Add(r, updates, p, nameof(r.Vaga_nome), "vaga_nome", r.Vaga_nome, "vaga", false);
        Add(r, updates, p, nameof(r.Empresa_id), "empresa_id", r.Empresa_id, "empresa", false);
        if (r.Has(nameof(r.Status))) { updates.Add("status=CAST(@status AS \"StatusCandidatura\")"); p.Add("status", r.Status!.Value.ToString()); }
        if (r.Has(nameof(r.Data_aplicacao))) { updates.Add("data_aplicacao=@data"); p.Add("data", r.Data_aplicacao!.Value.UtcDateTime); }
        Add(r, updates, p, nameof(r.Descricao), "descricao", r.Descricao, "descricao", true);
        Add(r, updates, p, nameof(r.Link_vaga), "link_vaga", r.Link_vaga, "link", true);
        Add(r, updates, p, nameof(r.Salario_estimado), "salario_estimado", r.Salario_estimado, "salario", true);
        Add(r, updates, p, nameof(r.Origem), "origem", r.Origem, "origem", true);
        Add(r, updates, p, nameof(r.Observacoes), "observacoes", r.Observacoes, "observacoes", true);
        Add(r, updates, p, nameof(r.Motivo_recusa), "motivo_recusa", r.Motivo_recusa, "motivo", true);
        if (updateStage) updates.Add("etapa_desde=now()");
        var found = await db.ExecuteAsync(new CommandDefinition($"UPDATE candidaturas SET {string.Join(',', updates)} WHERE id=@id AND user_id=@userId", p, cancellationToken: ct));
        return found == 0 ? null : await FindAsync(userId, id, false, ct);
    }
    public async Task<CandidaturaResponse?> SetStatusAsync(string userId, string id, StatusCandidatura s, CancellationToken ct) { await using var db = connections.Open(); var n = await db.ExecuteAsync(new CommandDefinition("UPDATE candidaturas SET status=CAST(@s AS \"StatusCandidatura\"),etapa_desde=now(),updated_at=now() WHERE id=@id AND user_id=@userId", new { s = s.ToString(), id, userId }, cancellationToken: ct)); return n == 0 ? null : await FindAsync(userId, id, false, ct); }
    public async Task<CandidaturaResponse?> SetAtivaAsync(string userId, string id, bool a, CancellationToken ct) { await using var db = connections.Open(); var n = await db.ExecuteAsync(new CommandDefinition("UPDATE candidaturas SET ativa=@a,updated_at=now() WHERE id=@id AND user_id=@userId", new { a, id, userId }, cancellationToken: ct)); return n == 0 ? null : await FindAsync(userId, id, false, ct); }
    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct) { await using var db = connections.Open(); return await db.ExecuteAsync(new CommandDefinition("DELETE FROM candidaturas WHERE id=@id AND user_id=@userId", new { id, userId }, cancellationToken: ct)) == 1; }
    private static string? Empty(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
    private static string EscapeLike(string s) => s.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
    private static void Add(UpdateCandidaturaRequest request, List<string> updates, DynamicParameters p, string property, string column, string? value, string name, bool allowsNull)
    {
        if (!request.Has(property) || (!allowsNull && value is null) || value is not null && string.IsNullOrWhiteSpace(value)) return;
        updates.Add($"{column}=@{name}");
        p.Add(name, value is null ? null : Empty(value));
    }
}
