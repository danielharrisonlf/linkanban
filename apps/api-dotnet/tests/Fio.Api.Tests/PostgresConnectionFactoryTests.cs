using Fio.Infrastructure.Persistence;
using Npgsql;

namespace Fio.Api.Tests;

public sealed class PostgresConnectionFactoryTests
{
    [Theory]
    [InlineData("postgresql://test_user:test_password@localhost:55432/linkanban_test?schema=public")]
    [InlineData("postgres://test_user:test_password@localhost:55432/linkanban_test?schema=public")]
    public void Open_converts_postgres_uri_and_preserves_public_schema(string connectionUrl)
    {
        using var connection = new PostgresConnectionFactory(() => connectionUrl).Open();
        var builder = new NpgsqlConnectionStringBuilder(connection.ConnectionString);

        Assert.Equal("localhost", builder.Host);
        Assert.Equal(55432, builder.Port);
        Assert.Equal("linkanban_test", builder.Database);
        Assert.Equal("test_user", builder.Username);
        // NpgsqlDataSource intentionally redacts the password from connections it creates.
        Assert.DoesNotContain("test_password", connection.ConnectionString, StringComparison.Ordinal);
        Assert.Equal("public", builder.SearchPath);
    }

    [Fact]
    public void Open_accepts_a_traditional_npgsql_connection_string()
    {
        using var connection = new PostgresConnectionFactory(() => "Host=localhost;Port=55432;Database=linkanban_test;Username=test_user;Password=test_password;Search Path=public").Open();
        var builder = new NpgsqlConnectionStringBuilder(connection.ConnectionString);

        Assert.Equal("localhost", builder.Host);
        Assert.Equal("public", builder.SearchPath);
    }

    [Fact]
    public void Open_rejects_a_non_public_schema_without_exposing_the_connection_url()
    {
        var exception = Assert.Throws<InvalidOperationException>(() => new PostgresConnectionFactory(() => "postgresql://test_user:test_password@localhost:55432/linkanban_test?schema=private").Open());

        Assert.Contains("schema não suportado", exception.Message);
        Assert.DoesNotContain("test_password", exception.Message);
    }

    [Theory]
    [InlineData("Host=localhost;Database=linkanban_test;Username=test_user;Password=test_password;Search Path=private")]
    [InlineData("Host=localhost;Database=linkanban_test;Username=test_user;Password=test_password;Options=-c search_path=private")]
    public void Open_rejects_non_public_schema_settings_in_a_traditional_connection_string(string connectionString)
    {
        var exception = Assert.Throws<InvalidOperationException>(() => new PostgresConnectionFactory(() => connectionString).Open());

        Assert.DoesNotContain("test_password", exception.Message);
    }
}
