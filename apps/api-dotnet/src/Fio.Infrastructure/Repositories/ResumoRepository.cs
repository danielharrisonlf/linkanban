using Dapper;
using Fio.Application.Contracts;
using Fio.Application.Ports;
using Fio.Application.Services;
using Fio.Infrastructure.Persistence;

namespace Fio.Infrastructure.Repositories;

public sealed class ResumoRepository(PostgresConnectionFactory connections) : IResumoRepository
{
    public async Task<ResumoResponse> GetAsync(string userId, DateTimeOffset now, CancellationToken ct)
    {
        await using var db = connections.Open();
        var statusRows = await db.QueryAsync<StatusCount>(new CommandDefinition("SELECT status::text AS status,count(*)::int AS total FROM candidaturas WHERE user_id=@userId AND ativa=true GROUP BY status", new { userId }, cancellationToken: ct));
        var map = statusRows.ToDictionary(x => x.Status, x => x.Total); var total = await db.ExecuteScalarAsync<int>(new CommandDefinition("SELECT count(*)::int FROM candidaturas WHERE user_id=@userId", new { userId }, cancellationToken: ct)); var ativas = map.Values.Sum();
        var open = new[] { "APLICADO", "EM_ANALISE", "ENTREVISTA", "TESTE_TECNICO", "PROPOSTA" }; var interviews = Get(map,"ENTREVISTA") + Get(map,"TESTE_TECNICO") + Get(map,"PROPOSTA") + Get(map,"APROVADO"); var answered = ativas - Get(map,"APLICADO");
        var follow = await db.QuerySingleAsync<FollowupCount>(new CommandDefinition("SELECT count(*) FILTER (WHERE NOT feito)::int AS pendentes,count(*) FILTER (WHERE NOT feito AND data_prevista < now())::int AS vencidos FROM followups WHERE user_id=@userId", new { userId }, cancellationToken: ct));
        var currentWeek = AtividadeSemanal.InicioDaSemanaUtc(now);
        var weekStart = currentWeek.AddDays(-7 * (AtividadeSemanal.QuantidadeDeSemanas - 1));
        var weekEnd = currentWeek.AddDays(7);
        var activityRows = await db.QueryAsync<WeekCount>(new CommandDefinition("SELECT date_trunc('week',data_aplicacao) AS semana,count(*)::int AS candidaturas FROM candidaturas WHERE user_id=@userId AND ativa=true AND data_aplicacao >= @weekStart AND data_aplicacao < @weekEnd GROUP BY 1 ORDER BY 1", new { userId, weekStart, weekEnd }, cancellationToken: ct));
        var byWeek = activityRows.ToDictionary(x => x.Semana.Date, x => x.Candidaturas);
        var activity = AtividadeSemanal.CriarBuckets(now, byWeek);
        var pausedSql = "SELECT c.id,c.vaga_nome,c.empresa_id,c.status::text AS status,c.data_aplicacao,c.descricao,c.link_vaga,c.salario_estimado,c.origem,c.observacoes,c.ativa,c.etapa_desde,c.motivo_recusa,c.created_at,c.updated_at,e.id,e.nome,e.stack_principal,e.site,e.estado,e.modelo_trabalho,e.observacoes,e.created_at FROM candidaturas c JOIN empresas e ON e.id=c.empresa_id AND e.user_id=c.user_id WHERE c.user_id=@userId AND c.ativa=true AND c.status::text = ANY(@open) AND c.etapa_desde < @limit ORDER BY c.etapa_desde LIMIT 12";
        var paused = await db.QueryAsync<CandidaturaRow,EmpresaRow,CandidaturaResponse>(new CommandDefinition(pausedSql, new { userId, open, limit = now.AddDays(-14).UtcDateTime }, cancellationToken: ct), (c,e) => RowMapping.Candidatura(c, RowMapping.Empresa(e)), splitOn:"id");
        var paradas = new List<ParadaResponse>(); foreach (var item in paused) { var f = (await FollowupQueries.ForCandidaturaAsync(db, userId, item.Id, item, ct)).FirstOrDefault(); var reason = f is not null && !f.Feito && f.Data_prevista < now ? "followup-vencido" : f is null ? "sem-followup" : "sem-retorno"; paradas.Add(new ParadaResponse(item, (int)Math.Floor((now - item.Etapa_desde).TotalDays), reason)); }
        return new ResumoResponse(total, ativas, map, Rate(interviews, ativas), interviews, Rate(answered, ativas), answered, Get(map,"APLICADO"), Get(map,"APLICADO"), paradas, follow.Pendentes, follow.Vencidos, activity);
    }
    private static int Get(IReadOnlyDictionary<string,int> map, string key) => map.GetValueOrDefault(key);
    private static string Rate(int part, int whole) => whole == 0 ? "0%" : $"{(part * 100d / whole):0.0}%";
    private sealed class StatusCount { public required string Status { get; init; } public int Total { get; init; } }
    private sealed class FollowupCount { public int Pendentes { get; init; } public int Vencidos { get; init; } }
    private sealed class WeekCount { public DateTime Semana { get; init; } public int Candidaturas { get; init; } }
}
