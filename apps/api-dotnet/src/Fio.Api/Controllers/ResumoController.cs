using Fio.Application.Contracts;
using Fio.Application.Ports;
using Microsoft.AspNetCore.Mvc;

namespace Fio.Api.Controllers;

[Route("v1")]
public sealed class ResumoController(IResumoService service) : ApiControllerBase
{
    [HttpGet("resumo")] public async Task<ActionResult<ResumoResponse>> Resumo(CancellationToken ct) => Ok(await service.GetAsync(UserId, ct));
    [HttpGet("dashboard")] public async Task<ActionResult<ResumoResponse>> Dashboard(CancellationToken ct) => Ok(await service.GetAsync(UserId, ct));
}
