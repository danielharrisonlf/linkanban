using System.Security.Cryptography;
using System.Text;
using Fio.Application.Contracts;
using Fio.Application.Ports;

namespace Fio.Application.Services;

public static class TokenHasher
{
    public static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
    public static string NewToken() => "lkb_" + Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    public static bool SameSecret(string left, string right) => CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(left), Encoding.UTF8.GetBytes(right));
}

public sealed class AuthService(IAuthRepository repository, Func<string?> bootstrapToken) : IAuthService
{
    private const string LocalUser = "00000000-0000-4000-8000-000000000001";
    public async Task<BootstrapResponse> BootstrapAsync(string? secret, BootstrapRequest request, CancellationToken ct)
    {
        var expected = bootstrapToken()?.Trim();
        if (string.IsNullOrEmpty(expected)) throw new DomainException("O bootstrap está desabilitado: configure LINKANBAN_BOOTSTRAP_TOKEN.", 503, "bootstrap_indisponivel");
        if (string.IsNullOrWhiteSpace(secret) || !TokenHasher.SameSecret(secret, expected)) throw new DomainException("O token de bootstrap é inválido.", 401, "nao_autorizado");
        var token = TokenHasher.NewToken();
        var owner = await repository.CreateBootstrapAsync(TokenHasher.Hash(token), request, ct) ?? throw new DomainException("O bootstrap já foi utilizado.", 409, "bootstrap_utilizado");
        return new BootstrapResponse(token, "Bearer", owner.User_id, new UsuarioResponse(owner.User_id, owner.User_email, owner.User_nome));
    }
    public async Task<AuthPrincipal> AuthenticateAsync(string? authorization, bool authDisabled, CancellationToken ct)
    {
        if (authDisabled) return new AuthPrincipal(LocalUser, null);
        var pieces = authorization?.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        if (pieces is not [var scheme, var token] || !scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(token)) throw Unauthorized();
        return await repository.FindActiveAsync(TokenHasher.Hash(token), ct) ?? throw Unauthorized();
    }
    private static DomainException Unauthorized() => new("Envie um token Bearer válido.", 401, "nao_autorizado");
}

public sealed class EmpresaService(IEmpresaRepository repository) : IEmpresaService
{
    public Task<IReadOnlyList<EmpresaResponse>> ListAsync(string userId, CancellationToken ct) => repository.ListAsync(userId, ct);
    public async Task<OpcoesResponse> OpcoesAsync(string userId, CancellationToken ct) => new(await repository.OrigensAsync(userId, ct));
    public Task<EmpresaResponse> CreateAsync(string userId, EmpresaRequest request, CancellationToken ct) => repository.CreateAsync(userId, request, ct);
    public async Task<EmpresaResponse> UpdateAsync(string userId, string id, EmpresaRequest request, CancellationToken ct) => await repository.UpdateAsync(userId, id, request, ct) ?? throw NotFound("Essa empresa");
    public async Task DeleteAsync(string userId, string id, CancellationToken ct)
    {
        if (await repository.FindAsync(userId, id, ct) is null) throw NotFound("Essa empresa");
        var linked = await repository.CountCandidaturasAsync(userId, id, ct);
        if (linked > 0) throw new DomainException(linked == 1 ? "Essa empresa tem 1 candidatura ligada a ela. Exclua ou mova essa candidatura antes de excluir essa empresa." : $"Essa empresa tem {linked} candidaturas ligadas a ela. Exclua ou mova essas candidaturas antes de excluir essa empresa.", 409, "em_uso");
        if (!await repository.DeleteAsync(userId, id, ct)) throw NotFound("Essa empresa");
    }
    private static DomainException NotFound(string name) => new($"{name} não existe mais.", 404, "nao_encontrado");
}

public sealed class CandidaturaService(ICandidaturaRepository repository, IEmpresaRepository empresas) : ICandidaturaService
{
    public Task<CandidaturasResponse> ListAsync(string userId, CandidaturasQuery q, CancellationToken ct) => repository.ListAsync(userId, q, ct);
    public async Task<CandidaturaResponse> GetAsync(string userId, string id, CancellationToken ct) => await repository.FindAsync(userId, id, true, ct) ?? throw NotFound("Essa candidatura");
    public async Task<CandidaturaResponse> CreateAsync(string userId, CreateCandidaturaRequest r, CancellationToken ct) { await CheckEmpresa(userId, r.Empresa_id, ct); return await repository.CreateAsync(userId, null, r, ct); }
    public async Task<CandidaturaResponse> RestoreAsync(string userId, RestaurarCandidaturaRequest r, CancellationToken ct) { await CheckEmpresa(userId, r.Empresa_id, ct); return await repository.CreateAsync(userId, r.Id, r.ToCreate(), ct); }
    public async Task<CandidaturaResponse> UpdateAsync(string userId, string id, UpdateCandidaturaRequest r, CancellationToken ct)
    {
        var current = await repository.FindAsync(userId, id, false, ct) ?? throw NotFound("Essa candidatura");
        if (r.Has(nameof(UpdateCandidaturaRequest.Empresa_id))) await CheckEmpresa(userId, r.Empresa_id!, ct);
        return await repository.UpdateAsync(userId, id, r, r.Has(nameof(UpdateCandidaturaRequest.Status)) && r.Status != current.Status, ct) ?? throw NotFound("Essa candidatura");
    }
    public async Task<CandidaturaResponse> SetStatusAsync(string userId, string id, StatusCandidatura s, CancellationToken ct) => await repository.SetStatusAsync(userId, id, s, ct) ?? throw NotFound("Essa candidatura");
    public async Task<CandidaturaResponse> SetAtivaAsync(string userId, string id, bool a, CancellationToken ct) => await repository.SetAtivaAsync(userId, id, a, ct) ?? throw NotFound("Essa candidatura");
    public async Task<CandidaturaResponse> DeleteAsync(string userId, string id, CancellationToken ct)
    {
        var existing = await repository.FindAsync(userId, id, true, ct) ?? throw NotFound("Essa candidatura");
        if (!await repository.DeleteAsync(userId, id, ct)) throw NotFound("Essa candidatura");
        return existing;
    }
    private async Task CheckEmpresa(string userId, string id, CancellationToken ct) { if (await empresas.FindAsync(userId, id, ct) is null) throw new DomainException("Escolha uma empresa cadastrada para essa candidatura."); }
    private static DomainException NotFound(string name) => new($"{name} não existe mais.", 404, "nao_encontrado");
}

public sealed class FollowupService(IFollowupRepository repository, ICandidaturaRepository candidaturas) : IFollowupService
{
    public Task<IReadOnlyList<FollowupResponse>> ListAsync(string userId, CancellationToken ct) => repository.ListAsync(userId, ct);
    public async Task<FollowupResponse> CreateAsync(string userId, CreateFollowupRequest r, CancellationToken ct) { if (await candidaturas.FindAsync(userId, r.Candidatura_id, false, ct) is null) throw new DomainException("Escolha uma candidatura cadastrada para agendar o follow-up."); return await repository.CreateAsync(userId, r, ct); }
    public async Task<FollowupResponse> UpdateAsync(string userId, string id, UpdateFollowupRequest r, CancellationToken ct) => await repository.UpdateAsync(userId, id, r, ct) ?? throw NotFound();
    public async Task<FollowupResponse> ResultAsync(string userId, string id, ResultadoFollowupRequest r, CancellationToken ct) { if (r.Resultado == ResultadoFollowup.ADIARAM && r.Reagendar_para is null) throw new DomainException("Para adiar, informe a nova data de cobrança."); return await repository.RegisterResultAsync(userId, id, r, ct) ?? throw NotFound(); }
    public async Task<FollowupResponse> DeleteAsync(string userId, string id, CancellationToken ct) { var existing = await repository.FindAsync(userId, id, ct) ?? throw NotFound(); if (!await repository.DeleteAsync(userId, id, ct)) throw NotFound(); return existing; }
    private static DomainException NotFound() => new("Esse follow-up não existe mais.", 404, "nao_encontrado");
}

public sealed class ResumoService(IResumoRepository repository, TimeProvider timeProvider) : IResumoService
{ public Task<ResumoResponse> GetAsync(string userId, CancellationToken ct) => repository.GetAsync(userId, timeProvider.GetUtcNow(), ct); }

/// <summary>Regras puras para os buckets semanais estáveis do resumo.</summary>
public static class AtividadeSemanal
{
    public const int QuantidadeDeSemanas = 8;

    public static DateTime InicioDaSemanaUtc(DateTimeOffset instant)
    {
        var utc = instant.UtcDateTime.Date;
        var recuo = ((int)utc.DayOfWeek + 6) % 7; // DayOfWeek.Monday = 1
        return utc.AddDays(-recuo);
    }

    public static IReadOnlyList<AtividadeSemanalResponse> CriarBuckets(DateTimeOffset now, IReadOnlyDictionary<DateTime, int> contagens)
    {
        var atual = InicioDaSemanaUtc(now);
        return Enumerable.Range(0, QuantidadeDeSemanas).Select(i =>
        {
            var inicio = atual.AddDays((i - (QuantidadeDeSemanas - 1)) * 7);
            return new AtividadeSemanalResponse($"{inicio:yyyy-MM-dd}T00:00:00.000Z", inicio.ToString("dd/MM"), contagens.GetValueOrDefault(inicio));
        }).ToArray();
    }
}
