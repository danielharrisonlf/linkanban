using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using Fio.Application.Contracts;
using Fio.Application.Services;
using Fio.Infrastructure.Migrations;
using Fio.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Fio.Api.Tests;

public sealed class ContractApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ContractApiTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public void Update_request_tracks_omitted_and_explicit_null_properties()
    {
        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower, Converters = { new JsonStringEnumConverter() } };
        var omitted = JsonSerializer.Deserialize<UpdateCandidaturaRequest>("{}", options)!;
        var nullValue = JsonSerializer.Deserialize<UpdateCandidaturaRequest>("{\"descricao\":null}", options)!;
        var value = JsonSerializer.Deserialize<UpdateCandidaturaRequest>("{\"descricao\":\"Nova descrição\"}", options)!;

        Assert.False(omitted.Has(nameof(UpdateCandidaturaRequest.Descricao)));
        Assert.True(nullValue.Has(nameof(UpdateCandidaturaRequest.Descricao)));
        Assert.Null(nullValue.Descricao);
        Assert.True(value.Has(nameof(UpdateCandidaturaRequest.Descricao)));
        Assert.Equal("Nova descrição", value.Descricao);
    }

    [Fact]
    public void Followup_requests_track_omitted_and_explicit_null_note()
    {
        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower, Converters = { new JsonStringEnumConverter() } };
        var updateOmitted = JsonSerializer.Deserialize<UpdateFollowupRequest>("{}", options)!;
        var updateNull = JsonSerializer.Deserialize<UpdateFollowupRequest>("{\"nota\":null}", options)!;
        var resultOmitted = JsonSerializer.Deserialize<ResultadoFollowupRequest>("{\"resultado\":\"RESPONDERAM\"}", options)!;
        var resultNull = JsonSerializer.Deserialize<ResultadoFollowupRequest>("{\"resultado\":\"RESPONDERAM\",\"nota\":null}", options)!;

        Assert.False(updateOmitted.Has(nameof(UpdateFollowupRequest.Nota)));
        Assert.True(updateNull.Has(nameof(UpdateFollowupRequest.Nota)));
        Assert.Null(updateNull.Nota);
        Assert.False(resultOmitted.Has(nameof(ResultadoFollowupRequest.Nota)));
        Assert.True(resultNull.Has(nameof(ResultadoFollowupRequest.Nota)));
        Assert.Null(resultNull.Nota);
    }

    [Theory]
    [InlineData("Nome")]
    [InlineData("Vaga_nome")]
    [InlineData("Empresa_id")]
    [InlineData("Candidatura_id")]
    public void Required_text_fields_reject_whitespace_after_trim(string field)
    {
        object request = field switch
        {
            "Nome" => new EmpresaRequest { Nome = " \t " },
            "Vaga_nome" => new CreateCandidaturaRequest { Vaga_nome = "\r\n", Empresa_id = "empresa" },
            "Empresa_id" => new CreateCandidaturaRequest { Vaga_nome = "Vaga", Empresa_id = "  " },
            "Candidatura_id" => new CreateFollowupRequest { Candidatura_id = " ", Data_prevista = DateTimeOffset.UtcNow },
            _ => throw new ArgumentOutOfRangeException(nameof(field))
        };
        var results = new List<ValidationResult>();

        Assert.False(Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true));
        Assert.NotEmpty(results);
    }

    [Fact]
    public async Task Migration_catalog_uses_legacy_names_and_normalized_sha256_hashes()
    {
        var localMigrations = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../migrations"));
        var legacyMigrations = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../api/prisma/migrations"));
        var migrations = Directory.Exists(localMigrations) ? localMigrations : legacyMigrations;
        var catalog = await LegacySqlMigrator.ReadCatalogAsync(migrations);
        var first = Assert.Single(catalog, x => x.Name == "legacy:20260327165549_init");
        var sql = await File.ReadAllTextAsync(Path.Combine(migrations, "20260327165549_init", "migration.sql"));
        var expected = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(MigrationEntry.Normalize(sql)))).ToLowerInvariant();

        Assert.Equal(expected, first.Hash);
        Assert.Contains("drizzle:0000_legacy_baseline", catalog.Select(x => x.Name));
        Assert.Contains(first.Hash, first.CompatibleHashes);
    }

    [Fact]
    public async Task Migration_catalog_finds_drizzle_when_the_published_bundle_places_it_beside_migrations()
    {
        var localRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../.."));
        var legacyApi = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../api"));
        var sourceApi = Directory.Exists(Path.Combine(localRoot, "migrations")) ? localRoot : legacyApi;
        var migrationsDir = Directory.Exists(Path.Combine(localRoot, "migrations"))
            ? Path.Combine(localRoot, "migrations")
            : Path.Combine(legacyApi, "prisma", "migrations");
        var temporaryRoot = Path.Combine(Path.GetTempPath(), $"linkanban-dotnet-catalog-{Guid.NewGuid():N}");
        var migrations = Path.Combine(temporaryRoot, "app", "migrations");
        try
        {
            Directory.CreateDirectory(Path.Combine(migrations, "20260327165549_init"));
            Directory.CreateDirectory(Path.Combine(temporaryRoot, "app", "drizzle", "meta"));
            File.Copy(Path.Combine(migrationsDir, "20260327165549_init", "migration.sql"), Path.Combine(migrations, "20260327165549_init", "migration.sql"));
            File.Copy(Path.Combine(sourceApi, "drizzle", "meta", "_journal.json"), Path.Combine(temporaryRoot, "app", "drizzle", "meta", "_journal.json"));
            File.Copy(Path.Combine(sourceApi, "drizzle", "baseline.json"), Path.Combine(temporaryRoot, "app", "drizzle", "baseline.json"));
            File.Copy(Path.Combine(sourceApi, "drizzle", "0000_legacy_baseline.sql"), Path.Combine(temporaryRoot, "app", "drizzle", "0000_legacy_baseline.sql"));

            var catalog = await LegacySqlMigrator.ReadCatalogAsync(migrations);

            Assert.Contains(catalog, entry => entry.Name == "legacy:20260327165549_init");
            Assert.Contains(catalog, entry => entry.Name == "drizzle:0000_legacy_baseline");
        }
        finally
        {
            if (Directory.Exists(temporaryRoot)) Directory.Delete(temporaryRoot, recursive: true);
        }
    }

    [Fact]
    public void Weekly_activity_starts_on_monday_utc_and_returns_current_plus_seven_previous_weeks()
    {
        var now = new DateTimeOffset(2026, 3, 29, 23, 59, 0, TimeSpan.Zero); // Sunday
        var current = AtividadeSemanal.InicioDaSemanaUtc(now);
        var buckets = AtividadeSemanal.CriarBuckets(now, new Dictionary<DateTime, int> { [current] = 2 });

        Assert.Equal(new DateTime(2026, 3, 23), current);
        Assert.Equal(8, buckets.Count);
        Assert.Equal("2026-02-02T00:00:00.000Z", buckets[0].Semana);
        Assert.Equal("2026-03-23T00:00:00.000Z", buckets[^1].Semana);
        Assert.Equal(2, buckets[^1].Candidaturas);
        Assert.All(buckets, bucket => Assert.Equal("00:00:00.000Z", bucket.Semana[11..]));
    }

    [Fact]
    public async Task Bootstrap_cli_request_without_body_reaches_the_bootstrap_service()
    {
        using var factory = _factory.WithWebHostBuilder(builder => builder.UseSetting("LINKANBAN_BOOTSTRAP_TOKEN", "test-bootstrap-token"));
        using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/auth/bootstrap");
        request.Headers.Add("x-linkanban-bootstrap-token", "not-the-token");

        var response = await factory.CreateClient().SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("nao_autorizado", body?.Codigo);
    }

    [Fact]
    public async Task Binding_json_validation_and_unsupported_media_type_use_the_legacy_error_envelope()
    {
        using var factory = _factory.WithWebHostBuilder(builder => builder.UseSetting("AUTH_DISABLED", "true"));
        var client = factory.CreateClient();

        var malformed = await client.PostAsync("/v1/candidaturas", new StringContent("{ invalid", Encoding.UTF8, "application/json"));
        var validation = await client.PostAsJsonAsync("/v1/candidaturas", new { });
        var unsupported = await client.PostAsync("/v1/candidaturas", new StringContent("{}", Encoding.UTF8, "text/plain"));

        await AssertError(malformed, HttpStatusCode.BadRequest);
        await AssertError(validation, HttpStatusCode.BadRequest);
        await AssertError(unsupported, HttpStatusCode.UnsupportedMediaType);
    }

    [Fact]
    public async Task Unknown_route_is_404_without_bearer_token()
    {
        var response = await _factory.CreateClient().GetAsync("/nao-existe");
        await AssertError(response, HttpStatusCode.NotFound, "nao_encontrado");
    }

    [Fact]
    public async Task Protected_controller_endpoint_without_bearer_token_is_401()
    {
        var response = await _factory.CreateClient().GetAsync("/v1/resumo");
        await AssertError(response, HttpStatusCode.Unauthorized, "nao_autorizado");
    }

    private static async Task AssertError(HttpResponseMessage response, HttpStatusCode expectedStatus, string expectedCode = "validacao")
    {
        var raw = await response.Content.ReadAsStringAsync();
        var body = JsonSerializer.Deserialize<ErrorResponse>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.Equal(expectedStatus, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body?.Error), raw);
        Assert.Equal(expectedCode, body?.Codigo);
    }
}

public sealed class DatabaseIntegrationTests
{
    [PostgresFact]
    public async Task Migrator_adopts_completed_prisma_migrations_when_a_test_database_is_configured()
    {
        var connectionString = Environment.GetEnvironmentVariable("LINKANBAN_TEST_DATABASE_URL")?.Trim();
        Assert.False(string.IsNullOrEmpty(connectionString));

        var factory = new PostgresConnectionFactory(() => connectionString);
        var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../api/prisma/migrations"));
        await new LegacySqlMigrator(factory).ApplyAsync(root, CancellationToken.None);
    }
}

/// <summary>Apenas a ausência explícita da base de testes torna a integração skipável.</summary>
public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("LINKANBAN_TEST_DATABASE_URL")))
        {
            Skip = "LINKANBAN_TEST_DATABASE_URL não está configurada.";
        }
    }
}
