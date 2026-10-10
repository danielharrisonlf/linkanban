using Fio.Api.Controllers;
using Fio.Application.Contracts;
using Fio.Application.Ports;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Fio.Api.Middleware;

internal sealed class BearerAuthenticationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAuthService auth, IConfiguration configuration)
    {
        var action = context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>();
        // UseRouting já selecionou a action. Apenas controllers de negócio, que
        // derivam de ApiControllerBase, exigem Bearer; endpoints públicos e URLs
        // inexistentes seguem para o restante do pipeline.
        if (context.Request.Method == HttpMethods.Options || action is null || !typeof(ApiControllerBase).IsAssignableFrom(action.ControllerTypeInfo)) { await next(context); return; }
        var disabled = bool.TryParse(configuration["AUTH_DISABLED"], out var configured) && configured;
        context.Items["auth"] = await auth.AuthenticateAsync(context.Request.Headers["Authorization"].FirstOrDefault(), disabled, context.RequestAborted);
        await next(context);
    }
}
