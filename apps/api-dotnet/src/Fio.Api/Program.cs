using System.Text.Json;
using System.Text.Json.Serialization;
using Fio.Api.Middleware;
using Fio.Api.Routing;
using Fio.Application.Ports;
using Fio.Application.Services;
using Fio.Infrastructure.Migrations;
using Fio.Infrastructure.Persistence;
using Fio.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
var authDisabled = bool.TryParse(builder.Configuration["AUTH_DISABLED"], out var disabled) && disabled;
builder.Services.AddControllers(options =>
    {
        options.Conventions.Add(new LocalAliasConvention(authDisabled));
        options.Filters.Add<LegacyErrorEnvelopeFilter>();
    })
    .AddJsonOptions(options => { options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower; options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); });
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options => { options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower; options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()); });
builder.Services.AddOpenApi();
builder.Services.Configure<ApiBehaviorOptions>(options => options.InvalidModelStateResponseFactory = _ => new BadRequestObjectResult(new Fio.Application.Contracts.ErrorResponse("Confira os dados enviados.", "validacao")));
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").WithHeaders("Content-Type", "Authorization", "X-Linkanban-Bootstrap-Token")));
builder.Services.AddSingleton(new PostgresConnectionFactory(() => builder.Configuration["DATABASE_URL"] ?? builder.Configuration.GetConnectionString("Fio")));
builder.Services.AddSingleton<TimeProvider>(TimeProvider.System);
builder.Services.AddScoped<IAuthRepository, AuthRepository>(); builder.Services.AddScoped<IEmpresaRepository, EmpresaRepository>(); builder.Services.AddScoped<ICandidaturaRepository, CandidaturaRepository>(); builder.Services.AddScoped<IFollowupRepository, FollowupRepository>(); builder.Services.AddScoped<IResumoRepository, ResumoRepository>();
builder.Services.AddScoped<IAuthService>(sp => new AuthService(sp.GetRequiredService<IAuthRepository>(), () => builder.Configuration["LINKANBAN_BOOTSTRAP_TOKEN"]));
builder.Services.AddScoped<IEmpresaService, EmpresaService>(); builder.Services.AddScoped<ICandidaturaService, CandidaturaService>(); builder.Services.AddScoped<IFollowupService, FollowupService>(); builder.Services.AddScoped<IResumoService, ResumoService>(); builder.Services.AddScoped<LegacySqlMigrator>();
PostgresConnectionFactory.ConfigureDapper();

var app = builder.Build();
app.UseExceptionHandler();
app.UseStatusCodePages(async status =>
{
    var response = status.HttpContext.Response;
    var error = response.StatusCode switch
    {
        StatusCodes.Status404NotFound => new Fio.Application.Contracts.ErrorResponse("Esse endereço não existe.", "nao_encontrado"),
        StatusCodes.Status400BadRequest or StatusCodes.Status415UnsupportedMediaType => new Fio.Application.Contracts.ErrorResponse("Confira os dados enviados.", "validacao"),
        _ => null
    };
    if (error is not null) await response.WriteAsJsonAsync(error);
});
app.UseRouting();
app.UseCors();
app.UseMiddleware<BearerAuthenticationMiddleware>();
app.MapOpenApi();
app.MapControllers();

if (args.Contains("--migrate", StringComparer.Ordinal))
{
    using var scope = app.Services.CreateScope();
    var configuredRoot = builder.Configuration["LINKANBAN_MIGRATIONS_DIRECTORY"];
    var bundledRoot = Path.Combine(app.Environment.ContentRootPath, "migrations");
    var localAppRoot = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "../../migrations"));
    var legacyPrismaRoot = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "../../../api/prisma/migrations"));
    var developmentRoot = Directory.Exists(localAppRoot) ? localAppRoot : legacyPrismaRoot;
    var root = !string.IsNullOrWhiteSpace(configuredRoot) ? configuredRoot : Directory.Exists(bundledRoot) ? bundledRoot : developmentRoot;
    await scope.ServiceProvider.GetRequiredService<LegacySqlMigrator>().ApplyAsync(root, CancellationToken.None);
    return;
}

app.Run();
public partial class Program { }
