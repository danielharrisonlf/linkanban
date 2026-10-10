# syntax=docker/dockerfile:1
# Build context: repository root. Use --target development only with the source mount.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src
COPY apps/api-dotnet/src/Fio.Application/Fio.Application.csproj apps/api-dotnet/src/Fio.Application/
COPY apps/api-dotnet/src/Fio.Infrastructure/Fio.Infrastructure.csproj apps/api-dotnet/src/Fio.Infrastructure/
COPY apps/api-dotnet/src/Fio.Api/Fio.Api.csproj apps/api-dotnet/src/Fio.Api/
RUN dotnet restore apps/api-dotnet/src/Fio.Api/Fio.Api.csproj

FROM restore AS build
COPY apps/api-dotnet/ apps/api-dotnet/
RUN dotnet publish apps/api-dotnet/src/Fio.Api/Fio.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS development
WORKDIR /workspace/apps/api-dotnet
EXPOSE 3333
ENV ASPNETCORE_URLS=http://+:3333
ENTRYPOINT ["dotnet", "watch", "--project", "src/Fio.Api", "run", "--no-hot-reload"]

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS production
WORKDIR /app
COPY --from=build /app/publish ./
# O catálogo é empacotado para que `docker run IMAGE --migrate` seja explícito e independente do SDK/source.
COPY apps/api-dotnet/migrations ./migrations
COPY apps/api-dotnet/drizzle ./drizzle
EXPOSE 3333
ENV ASPNETCORE_URLS=http://+:3333
ENTRYPOINT ["dotnet", "Fio.Api.dll"]
