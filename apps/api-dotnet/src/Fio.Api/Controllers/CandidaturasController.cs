using Fio.Application.Contracts;
using Fio.Application.Ports;
using Microsoft.AspNetCore.Mvc;

namespace Fio.Api.Controllers;

[Route("v1/candidaturas")]
public sealed class CandidaturasController(ICandidaturaService service) : ApiControllerBase
{
    [HttpGet] public async Task<ActionResult<CandidaturasResponse>> List([FromQuery] string? busca, [FromQuery] StatusCandidatura? status, [FromQuery] bool? incluirArquivadas, [FromQuery] string? ordenar, [FromQuery] int? pagina, [FromQuery] int? limite, CancellationToken ct) => Ok(await service.ListAsync(UserId, new CandidaturasQuery(busca, status, incluirArquivadas ?? false, ordenar, pagina, limite), ct));
    [HttpGet("{id}")] public async Task<ActionResult<CandidaturaResponse>> Get(string id, CancellationToken ct) => Ok(await service.GetAsync(UserId, id, ct));
    [HttpPost] public async Task<ActionResult<CandidaturaResponse>> Create([FromBody] CreateCandidaturaRequest request, CancellationToken ct) => Created("/v1/candidaturas", await service.CreateAsync(UserId, request, ct));
    [HttpPost("restaurar")] public async Task<ActionResult<CandidaturaResponse>> Restore([FromBody] RestaurarCandidaturaRequest request, CancellationToken ct) => Created("/v1/candidaturas", await service.RestoreAsync(UserId, request, ct));
    [HttpPut("{id}")] public async Task<ActionResult<CandidaturaResponse>> Update(string id, [FromBody] UpdateCandidaturaRequest request, CancellationToken ct) => Ok(await service.UpdateAsync(UserId, id, request, ct));
    [HttpPatch("{id}/status")] public async Task<ActionResult<CandidaturaResponse>> Status(string id, [FromBody] StatusRequest request, CancellationToken ct) => Ok(await service.SetStatusAsync(UserId, id, request.Status, ct));
    [HttpPatch("{id}/arquivar")] public async Task<ActionResult<CandidaturaResponse>> Arquivar(string id, [FromBody] ArquivarRequest request, CancellationToken ct) => Ok(await service.SetAtivaAsync(UserId, id, request.Ativa, ct));
    [HttpDelete("{id}")] public async Task<ActionResult<CandidaturaResponse>> Delete(string id, CancellationToken ct) => Ok(await service.DeleteAsync(UserId, id, ct));
}
