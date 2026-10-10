using System.Data;
using Dapper;
using Fio.Application.Contracts;
using Fio.Application.Ports;
using Fio.Infrastructure.Persistence;

namespace Fio.Infrastructure.Repositories;

public sealed class FollowupRepository(PostgresConnectionFactory connections) : IFollowupRepository
{
    public async Task<IReadOnlyList<FollowupResponse>> ListAsync(string userId, CancellationToken ct) { await using var db = connections.Open(); return await FollowupQueries.ListAsync(db, userId, ct); }
    public async Task<FollowupResponse?> FindAsync(string userId, string id, CancellationToken ct) { await using var db = connections.Open(); return await FollowupQueries.OneAsync(db, userId, id, ct); }
    public async Task<FollowupResponse> CreateAsync(string userId, CreateFollowupRequest r, CancellationToken ct) { await using var db = connections.Open(); var id = Guid.NewGuid().ToString(); await db.ExecuteAsync(new CommandDefinition("INSERT INTO followups(id,user_id,candidatura_id,data_prevista,nota) VALUES(@id,@userId,@c,@d,@n)", new { id, userId, c = r.Candidatura_id, d = r.Data_prevista.UtcDateTime, n = Empty(r.Nota) }, cancellationToken: ct)); return await FollowupQueries.OneAsync(db, userId, id, ct) ?? throw new InvalidOperationException(); }
    public async Task<FollowupResponse?> UpdateAsync(string userId, string id, UpdateFollowupRequest r, CancellationToken ct)
    {
        await using var db = connections.Open();
        var sets = new List<string> { "updated_at=now()" };
        var parameters = new DynamicParameters(new { userId, id });
        if (r.Feito is not null) { sets.Add("feito=@feito"); parameters.Add("feito", r.Feito); }
        if (r.Data_prevista is not null) { sets.Add("data_prevista=@data"); parameters.Add("data", r.Data_prevista.Value.UtcDateTime); }
        // A presença no JSON importa: null limpa a nota; ausência a preserva.
        if (r.Has(nameof(UpdateFollowupRequest.Nota))) { sets.Add("nota=@nota"); parameters.Add("nota", Empty(r.Nota)); }
        var updated = await db.ExecuteAsync(new CommandDefinition($"UPDATE followups SET {string.Join(',', sets)} WHERE id=@id AND user_id=@userId", parameters, cancellationToken: ct));
        return updated == 0 ? null : await FollowupQueries.OneAsync(db, userId, id, ct);
    }
    public async Task<FollowupResponse?> RegisterResultAsync(string userId, string id, ResultadoFollowupRequest r, CancellationToken ct)
    {
        await using var db = connections.Open(); await db.OpenAsync(ct); await using var tx = await db.BeginTransactionAsync(ct);
        var existing = await FollowupQueries.OneAsync(db, userId, id, ct, tx); if (existing is null) return null;
        var isDelay = r.Resultado == ResultadoFollowup.ADIARAM;
        var sets = new List<string> { "resultado=CAST(@resultado AS \"ResultadoFollowup\")", "feito=@feito", "updated_at=now()" };
        var parameters = new DynamicParameters(new { resultado = r.Resultado.ToString(), feito = !isDelay, id, userId });
        if (isDelay) { sets.Add("data_prevista=@reagendar"); parameters.Add("reagendar", r.Reagendar_para?.UtcDateTime); }
        // Como no Bun, nota omitida não toca na coluna e null explícito a limpa.
        if (r.Has(nameof(ResultadoFollowupRequest.Nota))) { sets.Add("nota=@nota"); parameters.Add("nota", Empty(r.Nota)); }
        await db.ExecuteAsync(new CommandDefinition($"UPDATE followups SET {string.Join(',', sets)} WHERE id=@id AND user_id=@userId", parameters, tx, cancellationToken: ct));
        if (!isDelay && r.Resultado == ResultadoFollowup.RESPONDERAM) await db.ExecuteAsync(new CommandDefinition("UPDATE candidaturas SET status='EM_ANALISE',etapa_desde=now(),updated_at=now() WHERE id=@c AND user_id=@userId AND status='APLICADO'", new { c = existing.Candidatura_id, userId }, tx, cancellationToken: ct));
        if (!isDelay && r.Resultado == ResultadoFollowup.ENCERRARAM) await db.ExecuteAsync(new CommandDefinition("UPDATE candidaturas SET status='REJEITADO',etapa_desde=now(),updated_at=now() WHERE id=@c AND user_id=@userId AND status IN ('APLICADO','EM_ANALISE','ENTREVISTA','TESTE_TECNICO','PROPOSTA')", new { c = existing.Candidatura_id, userId }, tx, cancellationToken: ct));
        var updated = await FollowupQueries.OneAsync(db, userId, id, ct, tx) ?? throw new InvalidOperationException();
        await tx.CommitAsync(ct);
        // O include legado é montado antes da transição de status da candidatura.
        return updated with { Candidatura = existing.Candidatura };
    }
    public async Task<bool> DeleteAsync(string userId, string id, CancellationToken ct) { await using var db = connections.Open(); return await db.ExecuteAsync(new CommandDefinition("DELETE FROM followups WHERE id=@id AND user_id=@userId", new { id, userId }, cancellationToken: ct)) == 1; }
    private static string? Empty(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}

internal static class FollowupQueries
{
    private const string Sql = "SELECT f.id,f.candidatura_id,f.data_prevista,f.feito,f.resultado::text AS resultado,f.nota,f.created_at,f.updated_at,c.id,c.vaga_nome,c.empresa_id,c.status::text AS status,c.data_aplicacao,c.descricao,c.link_vaga,c.salario_estimado,c.origem,c.observacoes,c.ativa,c.etapa_desde,c.motivo_recusa,c.created_at,c.updated_at,e.id,e.nome,e.stack_principal,e.site,e.estado,e.modelo_trabalho,e.observacoes,e.created_at FROM followups f JOIN candidaturas c ON c.id=f.candidatura_id AND c.user_id=f.user_id JOIN empresas e ON e.id=c.empresa_id AND e.user_id=c.user_id WHERE f.user_id=@userId";
    public static async Task<IReadOnlyList<FollowupResponse>> ListAsync(IDbConnection db, string userId, CancellationToken ct) => (await db.QueryAsync<FollowupRow,CandidaturaRow,EmpresaRow,FollowupResponse>(new CommandDefinition(Sql + " ORDER BY f.data_prevista ASC", new { userId }, cancellationToken: ct), Map, splitOn: "id,id")).ToArray();
    public static async Task<FollowupResponse?> OneAsync(IDbConnection db, string userId, string id, CancellationToken ct, IDbTransaction? tx = null) => (await db.QueryAsync<FollowupRow,CandidaturaRow,EmpresaRow,FollowupResponse>(new CommandDefinition(Sql + " AND f.id=@id", new { userId, id }, tx, cancellationToken: ct), Map, splitOn: "id,id")).SingleOrDefault();
    public static async Task<IReadOnlyList<FollowupResponse>> ForCandidaturaAsync(IDbConnection db, string userId, string c, CandidaturaResponse candidate, CancellationToken ct) { var rows = await db.QueryAsync<FollowupRow>(new CommandDefinition("SELECT id,candidatura_id,data_prevista,feito,resultado::text AS resultado,nota,created_at,updated_at FROM followups WHERE user_id=@userId AND candidatura_id=@c ORDER BY data_prevista DESC", new { userId, c }, cancellationToken: ct)); return rows.Select(x => Map(x, null!, null!, candidate)).ToArray(); }
    private static FollowupResponse Map(FollowupRow f, CandidaturaRow c, EmpresaRow e) => Map(f, c, e, null);
    private static FollowupResponse Map(FollowupRow f, CandidaturaRow? c, EmpresaRow? e, CandidaturaResponse? existing) { var candidatura = existing ?? RowMapping.Candidatura(c!, RowMapping.Empresa(e!)); return new FollowupResponse(f.Id, f.Candidatura_id, candidatura, RowMapping.Utc(f.Data_prevista), f.Feito, f.Resultado is null ? null : Enum.Parse<ResultadoFollowup>(f.Resultado), f.Nota, RowMapping.Utc(f.Created_at), RowMapping.Utc(f.Updated_at)); }
}
