using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Fio.Application.Contracts;

public enum StatusCandidatura { APLICADO, EM_ANALISE, ENTREVISTA, TESTE_TECNICO, PROPOSTA, REJEITADO, APROVADO }
public enum ResultadoFollowup { RESPONDERAM, SEM_RESPOSTA, ADIARAM, ENCERRARAM }

/// <summary>Rejeita campos textuais obrigatórios que contenham somente espaços.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class NotBlankAttribute : ValidationAttribute
{
    public NotBlankAttribute() : base("Confira os dados enviados.") { }
    public override bool IsValid(object? value) => value is string text && !string.IsNullOrWhiteSpace(text);
}

/// <summary>Payload do primeiro acesso protegido.</summary>
public sealed record BootstrapRequest
{
    [EmailAddress, MaxLength(254)] public string? Email { get; init; }
    [MaxLength(120)] public string? Nome { get; init; }
}

/// <summary>Token emitido uma única vez pelo bootstrap.</summary>
public sealed record BootstrapResponse(string Token, string Token_type, string User_id, UsuarioResponse User);
/// <summary>Usuário autenticado.</summary>
public sealed record UsuarioResponse(string Id, string Email, string Nome);
/// <summary>Empresa retornada pela API.</summary>
public sealed record EmpresaResponse(string Id, string Nome, string? Stack_principal, string? Site, string? Estado, string? Modelo_trabalho, string? Observacoes, DateTimeOffset Created_at, ContagemCandidaturasResponse? _count = null);
/// <summary>Contagem de candidaturas associadas a uma empresa.</summary>
public sealed record ContagemCandidaturasResponse(int Candidaturas);
/// <summary>Payload para criar ou atualizar uma empresa.</summary>
public sealed record EmpresaRequest
{
    [Required, NotBlank, StringLength(120, MinimumLength = 1)] public required string Nome { get; init; }
    [StringLength(200)] public string? Tecnologias { get; init; }
    [StringLength(60)] public string? Estado { get; init; }
    [StringLength(40)] public string? Modelo_trabalho { get; init; }
    [StringLength(300)] public string? Site { get; init; }
    [StringLength(2000)] public string? Observacoes { get; init; }
}
/// <summary>Valores sugeridos para formulários.</summary>
public sealed record OpcoesResponse(IReadOnlyList<string> Origens);
/// <summary>Payload para criar uma candidatura.</summary>
public sealed record CreateCandidaturaRequest
{
    [Required, NotBlank, StringLength(160, MinimumLength = 1)] public required string Vaga_nome { get; init; }
    [Required, NotBlank] public required string Empresa_id { get; init; }
    public StatusCandidatura? Status { get; init; }
    public DateTimeOffset? Data_aplicacao { get; init; }
    [StringLength(2000)] public string? Descricao { get; init; }
    [StringLength(500)] public string? Link_vaga { get; init; }
    [StringLength(80)] public string? Salario_estimado { get; init; }
    [StringLength(80)] public string? Origem { get; init; }
    [StringLength(2000)] public string? Observacoes { get; init; }
    [StringLength(500)] public string? Motivo_recusa { get; init; }
}
/// <summary>
/// Payload parcial para atualizar uma candidatura. Os setters registram a presença
/// no JSON para distinguir uma propriedade omitida de uma propriedade enviada como
/// <c>null</c> (que limpa os campos textuais opcionais, como no contrato legado).
/// </summary>
public sealed class UpdateCandidaturaRequest : IValidatableObject
{
    private readonly HashSet<string> _presentes = new(StringComparer.Ordinal);
    private string? _vagaNome;
    private string? _empresaId;
    private StatusCandidatura? _status;
    private DateTimeOffset? _dataAplicacao;
    private string? _descricao;
    private string? _linkVaga;
    private string? _salarioEstimado;
    private string? _origem;
    private string? _observacoes;
    private string? _motivoRecusa;

    [StringLength(160, MinimumLength = 1)] public string? Vaga_nome { get => _vagaNome; set { _presentes.Add(nameof(Vaga_nome)); _vagaNome = value; } }
    public string? Empresa_id { get => _empresaId; set { _presentes.Add(nameof(Empresa_id)); _empresaId = value; } }
    public StatusCandidatura? Status { get => _status; set { _presentes.Add(nameof(Status)); _status = value; } }
    public DateTimeOffset? Data_aplicacao { get => _dataAplicacao; set { _presentes.Add(nameof(Data_aplicacao)); _dataAplicacao = value; } }
    [StringLength(2000)] public string? Descricao { get => _descricao; set { _presentes.Add(nameof(Descricao)); _descricao = value; } }
    [StringLength(500)] public string? Link_vaga { get => _linkVaga; set { _presentes.Add(nameof(Link_vaga)); _linkVaga = value; } }
    [StringLength(80)] public string? Salario_estimado { get => _salarioEstimado; set { _presentes.Add(nameof(Salario_estimado)); _salarioEstimado = value; } }
    [StringLength(80)] public string? Origem { get => _origem; set { _presentes.Add(nameof(Origem)); _origem = value; } }
    [StringLength(2000)] public string? Observacoes { get => _observacoes; set { _presentes.Add(nameof(Observacoes)); _observacoes = value; } }
    [StringLength(500)] public string? Motivo_recusa { get => _motivoRecusa; set { _presentes.Add(nameof(Motivo_recusa)); _motivoRecusa = value; } }

    [JsonIgnore] public IReadOnlySet<string> Presentes => _presentes;
    public bool Has(string propertyName) => _presentes.Contains(propertyName);

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Has(nameof(Vaga_nome)) && string.IsNullOrWhiteSpace(Vaga_nome)) yield return Invalid(nameof(Vaga_nome));
        if (Has(nameof(Empresa_id)) && string.IsNullOrWhiteSpace(Empresa_id)) yield return Invalid(nameof(Empresa_id));
        if (Has(nameof(Status)) && Status is null) yield return Invalid(nameof(Status));
        if (Has(nameof(Data_aplicacao)) && Data_aplicacao is null) yield return Invalid(nameof(Data_aplicacao));
    }

    private static ValidationResult Invalid(string field) => new("Confira os dados enviados.", [field]);
}
/// <summary>Etapa de uma candidatura.</summary>
public sealed record StatusRequest { [Required] public required StatusCandidatura Status { get; init; } }
/// <summary>Estado de arquivamento de uma candidatura.</summary>
public sealed record ArquivarRequest { public required bool Ativa { get; init; } }
/// <summary>Filtros da lista de candidaturas.</summary>
public sealed record CandidaturasQuery(
    string? Busca,
    StatusCandidatura? Status,
    bool IncluirArquivadas,
    string? Ordenar,
    int? Pagina = null,
    int? Limite = null);
/// <summary>Página de candidaturas.</summary>
public sealed record CandidaturasResponse(IReadOnlyList<CandidaturaResponse> Itens, int Total);
/// <summary>Candidatura retornada pela API.</summary>
public sealed record CandidaturaResponse(string Id, string Vaga_nome, string Empresa_id, EmpresaResponse Empresa, StatusCandidatura Status, DateTimeOffset Data_aplicacao, string? Descricao, string? Link_vaga, string? Salario_estimado, string? Origem, string? Observacoes, bool Ativa, DateTimeOffset Etapa_desde, string? Motivo_recusa, DateTimeOffset Created_at, DateTimeOffset Updated_at, IReadOnlyList<FollowupResponse>? Followups = null);
/// <summary>Payload para restaurar candidatura apagada localmente.</summary>
public sealed record RestaurarCandidaturaRequest
{
    [Required, NotBlank] public required string Id { get; init; }
    [Required, NotBlank, StringLength(160, MinimumLength = 1)] public required string Vaga_nome { get; init; }
    [Required, NotBlank] public required string Empresa_id { get; init; }
    public StatusCandidatura? Status { get; init; }
    public DateTimeOffset? Data_aplicacao { get; init; }
    [StringLength(2000)] public string? Descricao { get; init; }
    [StringLength(500)] public string? Link_vaga { get; init; }
    [StringLength(80)] public string? Salario_estimado { get; init; }
    [StringLength(80)] public string? Origem { get; init; }
    [StringLength(2000)] public string? Observacoes { get; init; }
    public CreateCandidaturaRequest ToCreate() => new() { Vaga_nome = Vaga_nome, Empresa_id = Empresa_id, Status = Status, Data_aplicacao = Data_aplicacao, Descricao = Descricao, Link_vaga = Link_vaga, Salario_estimado = Salario_estimado, Origem = Origem, Observacoes = Observacoes };
}
/// <summary>Payload para criar um follow-up.</summary>
public sealed record CreateFollowupRequest { [Required, NotBlank] public required string Candidatura_id { get; init; } public required DateTimeOffset Data_prevista { get; init; } [StringLength(1000)] public string? Nota { get; init; } }
/// <summary>Payload parcial para atualizar um follow-up.</summary>
public sealed class UpdateFollowupRequest
{
    private readonly HashSet<string> _presentes = new(StringComparer.Ordinal);
    private bool? _feito;
    private DateTimeOffset? _dataPrevista;
    private string? _nota;

    public bool? Feito { get => _feito; init { _presentes.Add(nameof(Feito)); _feito = value; } }
    public DateTimeOffset? Data_prevista { get => _dataPrevista; init { _presentes.Add(nameof(Data_prevista)); _dataPrevista = value; } }
    [StringLength(1000)] public string? Nota { get => _nota; init { _presentes.Add(nameof(Nota)); _nota = value; } }

    [JsonIgnore] public IReadOnlySet<string> Presentes => _presentes;
    public bool Has(string propertyName) => _presentes.Contains(propertyName);
}
/// <summary>Resultado de um contato de follow-up.</summary>
public sealed class ResultadoFollowupRequest : IValidatableObject
{
    private readonly HashSet<string> _presentes = new(StringComparer.Ordinal);
    private ResultadoFollowup _resultado;
    private string? _nota;
    private DateTimeOffset? _reagendarPara;

    public ResultadoFollowup Resultado { get => _resultado; init { _presentes.Add(nameof(Resultado)); _resultado = value; } }
    [StringLength(1000)] public string? Nota { get => _nota; init { _presentes.Add(nameof(Nota)); _nota = value; } }
    public DateTimeOffset? Reagendar_para { get => _reagendarPara; init { _presentes.Add(nameof(Reagendar_para)); _reagendarPara = value; } }

    [JsonIgnore] public IReadOnlySet<string> Presentes => _presentes;
    public bool Has(string propertyName) => _presentes.Contains(propertyName);

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!Has(nameof(Resultado))) yield return new ValidationResult("Confira os dados enviados.", [nameof(Resultado)]);
    }
}
/// <summary>Follow-up retornado pela API.</summary>
public sealed record FollowupResponse(string Id, string Candidatura_id, CandidaturaResponse Candidatura, DateTimeOffset Data_prevista, bool Feito, ResultadoFollowup? Resultado, string? Nota, DateTimeOffset Created_at, DateTimeOffset Updated_at);
/// <summary>Ponto de atividade semanal.</summary>
public sealed record AtividadeSemanalResponse(string Semana, string Label, int Candidaturas);
/// <summary>Candidatura que precisa de atenção.</summary>
public sealed record ParadaResponse(CandidaturaResponse Candidatura, int Dias, string Motivo);
/// <summary>Resumo agregado do pipeline.</summary>
public sealed record ResumoResponse(int Total, int Ativas, IReadOnlyDictionary<string, int> Por_status, string Taxa_conversao, int Total_entrevistas, string Taxa_resposta, int Total_respondidas, int Total_pendentes, int Sem_resposta, IReadOnlyList<ParadaResponse> Paradas, int Followups_pendentes, int Followups_vencidos, IReadOnlyList<AtividadeSemanalResponse> Atividade_semanal);
/// <summary>Envelope de falha compatível com a API existente.</summary>
public sealed record ErrorResponse(string Error, string Codigo);

public sealed class DomainException(string message, int status = 400, string codigo = "regra_violada") : Exception(message)
{ public int Status { get; } = status; public string Codigo { get; } = codigo; }
public sealed record AuthPrincipal(string UserId, string? TokenId);
