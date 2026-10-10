using Fio.Application.Contracts;
using Microsoft.AspNetCore.Diagnostics;
using Npgsql;

namespace Fio.Api.Middleware;

internal sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, error, code) = exception switch
        {
            DomainException domain => (domain.Status, domain.Message, domain.Codigo),
            BadHttpRequestException => (400, "Confira os dados enviados.", "validacao"),
            PostgresException { SqlState: "23503" } => (409, "Esse registro tem outros ligados a ele e não pode ser excluído agora.", "em_uso"),
            PostgresException { SqlState: "23505" } => (409, "Já existe um registro com esses dados.", "em_uso"),
            _ => (500, "Algo falhou do nosso lado. Tente de novo em instantes.", "interno")
        };
        if (status == 500) logger.LogError(exception, "Falha não tratada na API");
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ErrorResponse(error, code), cancellationToken: ct);
        return true;
    }
}
