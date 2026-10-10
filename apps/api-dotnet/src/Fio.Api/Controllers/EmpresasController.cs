using Fio.Application.Contracts;
using Fio.Application.Ports;
using Microsoft.AspNetCore.Mvc;

namespace Fio.Api.Controllers;

[Route("v1/empresas")]
public sealed class EmpresasController(IEmpresaService service) : ApiControllerBase
{
    [HttpGet] public async Task<ActionResult<IReadOnlyList<EmpresaResponse>>> List(CancellationToken ct) => Ok(await service.ListAsync(UserId, ct));
    [HttpPost] public async Task<ActionResult<EmpresaResponse>> Create([FromBody] EmpresaRequest request, CancellationToken ct) => Created("/v1/empresas", await service.CreateAsync(UserId, request, ct));
    [HttpPut("{id}")] public async Task<ActionResult<EmpresaResponse>> Update(string id, [FromBody] EmpresaRequest request, CancellationToken ct) => Ok(await service.UpdateAsync(UserId, id, request, ct));
    [HttpDelete("{id}")] public async Task<IActionResult> Delete(string id, CancellationToken ct) { await service.DeleteAsync(UserId, id, ct); return NoContent(); }
}

[Route("v1/opcoes")]
public sealed class OpcoesController(IEmpresaService service) : ApiControllerBase
{ [HttpGet] public async Task<ActionResult<OpcoesResponse>> Get(CancellationToken ct) => Ok(await service.OpcoesAsync(UserId, ct)); }
