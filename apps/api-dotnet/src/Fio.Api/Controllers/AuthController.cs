using Fio.Application.Contracts;
using Fio.Application.Ports;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Fio.Api.Controllers;

[ApiController]
[Route("v1/auth")]
public sealed class AuthController(IAuthService service) : ControllerBase
{
    [HttpPost("bootstrap")]
    [ProducesResponseType<BootstrapResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BootstrapResponse>> Bootstrap([FromHeader(Name = "x-linkanban-bootstrap-token")] string? token, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] BootstrapRequest? request, CancellationToken ct)
    {
        var result = await service.BootstrapAsync(token, request ?? new BootstrapRequest(), ct);
        return Created("/v1/auth/bootstrap", result);
    }
}
