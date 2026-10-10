using Fio.Application.Contracts;
using Fio.Application.Ports;
using Microsoft.AspNetCore.Mvc;

namespace Fio.Api.Controllers;

[Route("v1/followups")]
public sealed class FollowupsController(IFollowupService service) : ApiControllerBase
{
    [HttpGet] public async Task<ActionResult<IReadOnlyList<FollowupResponse>>> List(CancellationToken ct) => Ok(await service.ListAsync(UserId, ct));
    [HttpPost] public async Task<ActionResult<FollowupResponse>> Create([FromBody] CreateFollowupRequest request, CancellationToken ct) => Created("/v1/followups", await service.CreateAsync(UserId, request, ct));
    [HttpPatch("{id}")] public async Task<ActionResult<FollowupResponse>> Update(string id, [FromBody] UpdateFollowupRequest request, CancellationToken ct) => Ok(await service.UpdateAsync(UserId, id, request, ct));
    [HttpPost("{id}/resultado")] public async Task<ActionResult<FollowupResponse>> Result(string id, [FromBody] ResultadoFollowupRequest request, CancellationToken ct) => Ok(await service.ResultAsync(UserId, id, request, ct));
    [HttpDelete("{id}")] public async Task<ActionResult<FollowupResponse>> Delete(string id, CancellationToken ct) => Ok(await service.DeleteAsync(UserId, id, ct));
}
