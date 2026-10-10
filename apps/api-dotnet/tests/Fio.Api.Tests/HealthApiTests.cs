using Microsoft.AspNetCore.Mvc.Testing;

namespace Fio.Api.Tests;

public sealed class HealthApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public HealthApiTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Health_returns_ok_without_database()
    {
        var response = await _client.GetAsync("/health");
        response.EnsureSuccessStatusCode();
        Assert.Contains("ok", await response.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }
}
