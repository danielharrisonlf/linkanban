using Fio.Application.Contracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Fio.Api.Middleware;

/// <summary>Converte falhas produzidas pelo MVC antes da ação (como 415) no contrato legado.</summary>
internal sealed class LegacyErrorEnvelopeFilter : IAsyncAlwaysRunResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        var status = context.Result switch
        {
            ObjectResult result => result.StatusCode,
            StatusCodeResult result => result.StatusCode,
            _ => null
        };

        if (status is StatusCodes.Status400BadRequest or StatusCodes.Status415UnsupportedMediaType && context.Result is not ObjectResult { Value: ErrorResponse })
        {
            context.Result = new ObjectResult(new ErrorResponse("Confira os dados enviados.", "validacao")) { StatusCode = status };
        }

        await next();
    }
}
