using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace Fio.Api.Routing;

/// <summary>Expõe aliases sem /v1 somente quando AUTH_DISABLED é habilitado no startup local.</summary>
internal sealed class LocalAliasConvention(bool enabled) : IControllerModelConvention
{
    public void Apply(ControllerModel controller)
    {
        if (!enabled || controller.ControllerType == typeof(Fio.Api.Controllers.AuthController)) return;
        foreach (var selector in controller.Selectors.Where(x => x.AttributeRouteModel?.Template?.StartsWith("v1", StringComparison.Ordinal) == true).ToArray())
        {
            var template = selector.AttributeRouteModel!.Template!;
            var alias = template == "v1" ? string.Empty : template[3..];
            controller.Selectors.Add(new SelectorModel(selector) { AttributeRouteModel = new AttributeRouteModel(selector.AttributeRouteModel) { Template = alias } });
        }
    }
}
