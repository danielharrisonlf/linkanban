using Fio.Application.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace Fio.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected string UserId => ((AuthPrincipal?)HttpContext.Items["auth"])?.UserId ?? throw new DomainException("Envie um token Bearer válido.", 401, "nao_autorizado");
}
