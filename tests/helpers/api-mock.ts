import type { Page, Route } from "@playwright/test";
import {
  INITIAL_CANDIDATURAS,
  INITIAL_EMPRESAS,
  INITIAL_FOLLOWUPS,
  type StatusCandidatura,
  type TestCandidatura,
  type TestEmpresa,
  type TestFollowUp,
  buildResumoMock,
  generateId,
} from "../data/seed-data";

export class ApiMockController {
  public empresas: TestEmpresa[] = [];
  public candidaturas: TestCandidatura[] = [];
  public followups: TestFollowUp[] = [];
  public deletedCandidaturas: Map<string, TestCandidatura> = new Map();

  constructor() {
    this.reset();
  }

  public reset(
    empresas = INITIAL_EMPRESAS,
    candidaturas = INITIAL_CANDIDATURAS,
    followups = INITIAL_FOLLOWUPS,
  ) {
    this.empresas = JSON.parse(JSON.stringify(empresas));
    this.candidaturas = JSON.parse(JSON.stringify(candidaturas));
    this.followups = JSON.parse(JSON.stringify(followups));
    this.deletedCandidaturas.clear();
  }

  public async install(page: Page) {
    // Intercepta requisições de API (ignora requisições de documento HTML para navegação SPA)
    await page.route(
      (url) =>
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/v1/") ||
        url.port === "3333" ||
        url.pathname === "/resumo" ||
        url.pathname === "/opcoes" ||
        url.pathname.startsWith("/followups"),
      async (route: Route) => {
        const req = route.request();
        if (req.resourceType() === "document") {
          return route.continue();
        }

        const url = new URL(req.url());
        const method = req.method();
        const path = url.pathname.replace(/^\/api/, "").replace(/^\/v1/, "");

        // 1. Resumo
        if (path === "/resumo" && method === "GET") {
          const resumo = buildResumoMock(this.candidaturas, this.followups);
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(resumo),
          });
        }

        // 2. Opções
        if (path === "/opcoes" && method === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              origens: ["LinkedIn", "Gupy", "Indicação", "Greenhouse", "Site da Empresa", "Outro"],
            }),
          });
        }

        // 3. Empresas
        if (path === "/empresas" && method === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(this.empresas),
          });
        }

        if (path === "/empresas" && method === "POST") {
          const body = JSON.parse(req.postData() || "{}");
          if (!body.nome || !body.nome.trim()) {
            return route.fulfill({
              status: 400,
              contentType: "application/json",
              body: JSON.stringify({ mensagem: "Informe o nome da empresa.", codigo: "validacao" }),
            });
          }
          const novaEmpresa: TestEmpresa = {
            id: generateId("emp"),
            nome: body.nome.trim(),
            stack_principal: body.tecnologias || null,
            estado: body.estado || null,
            modelo_trabalho: body.modelo_trabalho || null,
            site: body.site || null,
            observacoes: body.observacoes || null,
            created_at: new Date().toISOString(),
          };
          this.empresas.push(novaEmpresa);
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(novaEmpresa),
          });
        }

        const matchEmpresaId = path.match(/^\/empresas\/([^/]+)$/);
        if (matchEmpresaId && matchEmpresaId[1]) {
          const id = matchEmpresaId[1];
          if (method === "PUT") {
            const body = JSON.parse(req.postData() || "{}");
            const idx = this.empresas.findIndex((e) => e.id === id);
            if (idx === -1) {
              return route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({ mensagem: "Essa empresa não existe mais.", codigo: "nao_encontrado" }),
              });
            }
            this.empresas[idx] = {
              ...this.empresas[idx]!,
              nome: body.nome,
              stack_principal: body.tecnologias || null,
              estado: body.estado || null,
              modelo_trabalho: body.modelo_trabalho || null,
              site: body.site || null,
              observacoes: body.observacoes || null,
            };
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(this.empresas[idx]),
            });
          }
          if (method === "DELETE") {
            const ligadas = this.candidaturas.filter((c) => c.empresa_id === id).length;
            if (ligadas > 0) {
              return route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({
                  mensagem: `Essa empresa tem ${ligadas} candidatura ligada a ela. Exclua ou mova antes de excluir.`,
                  codigo: "em_uso",
                }),
              });
            }
            this.empresas = this.empresas.filter((e) => e.id !== id);
            return route.fulfill({ status: 204 });
          }
        }

        // 4. Candidaturas
        if (path === "/candidaturas" && method === "GET") {
          let lista = [...this.candidaturas];
          const busca = url.searchParams.get("busca")?.toLowerCase();
          const status = url.searchParams.get("status") as StatusCandidatura | null;
          const incluirArquivadas = url.searchParams.get("incluirArquivadas") === "true";

          if (!incluirArquivadas) {
            lista = lista.filter((c) => c.ativa);
          }
          if (status) {
            lista = lista.filter((c) => c.status === status);
          }
          if (busca) {
            lista = lista.filter(
              (c) =>
                c.vaga_nome.toLowerCase().includes(busca) ||
                c.empresa.nome.toLowerCase().includes(busca) ||
                (c.descricao && c.descricao.toLowerCase().includes(busca)),
            );
          }

          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ itens: lista, total: lista.length }),
          });
        }

        if (path === "/candidaturas" && method === "POST") {
          const body = JSON.parse(req.postData() || "{}");
          if (!body.vaga_nome || !body.vaga_nome.trim() || !body.empresa_id) {
            return route.fulfill({
              status: 400,
              contentType: "application/json",
              body: JSON.stringify({ mensagem: "Confira os dados enviados.", codigo: "validacao" }),
            });
          }
          const empresa = this.empresas.find((e) => e.id === body.empresa_id) || {
            id: body.empresa_id,
            nome: "Empresa Cadastrada",
            created_at: new Date().toISOString(),
          };
          const agora = new Date().toISOString();
          const nova: TestCandidatura = {
            id: generateId("cand"),
            vaga_nome: body.vaga_nome.trim(),
            empresa_id: body.empresa_id,
            empresa,
            status: body.status || "APLICADO",
            data_aplicacao: body.data_aplicacao || agora,
            salario_estimado: body.salario_estimado || null,
            link_vaga: body.link_vaga || null,
            origem: body.origem || null,
            descricao: body.descricao || null,
            observacoes: body.observacoes || null,
            ativa: true,
            etapa_desde: agora,
            motivo_recusa: body.motivo_recusa || null,
            created_at: agora,
            updated_at: agora,
          };
          this.candidaturas.unshift(nova);
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(nova),
          });
        }

        if (path === "/candidaturas/restaurar" && method === "POST") {
          const body = JSON.parse(req.postData() || "{}");
          const restaurada = this.deletedCandidaturas.get(body.id) || body;
          this.candidaturas.unshift(restaurada);
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(restaurada),
          });
        }

        const matchCandStatus = path.match(/^\/candidaturas\/([^/]+)\/status$/);
        if (matchCandStatus && matchCandStatus[1] && method === "PATCH") {
          const id = matchCandStatus[1];
          const body = JSON.parse(req.postData() || "{}");
          const item = this.candidaturas.find((c) => c.id === id);
          if (item) {
            item.status = body.status;
            item.etapa_desde = new Date().toISOString();
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(item),
            });
          }
        }

        const matchCandArquivar = path.match(/^\/candidaturas\/([^/]+)\/arquivar$/);
        if (matchCandArquivar && matchCandArquivar[1] && method === "PATCH") {
          const id = matchCandArquivar[1];
          const body = JSON.parse(req.postData() || "{}");
          const item = this.candidaturas.find((c) => c.id === id);
          if (item) {
            item.ativa = body.ativa;
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(item),
            });
          }
        }

        const matchCandId = path.match(/^\/candidaturas\/([^/]+)$/);
        if (matchCandId && matchCandId[1]) {
          const id = matchCandId[1];
          const item = this.candidaturas.find((c) => c.id === id);
          if (method === "GET") {
            if (!item) return route.fulfill({ status: 404 });
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(item),
            });
          }
          if (method === "PUT") {
            const body = JSON.parse(req.postData() || "{}");
            if (!item) return route.fulfill({ status: 404 });
            Object.assign(item, body);
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(item),
            });
          }
          if (method === "DELETE") {
            if (item) {
              this.deletedCandidaturas.set(id, item);
              this.candidaturas = this.candidaturas.filter((c) => c.id !== id);
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(item || {}),
            });
          }
        }

        // 5. Follow-ups
        if (path === "/followups" && method === "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(this.followups),
          });
        }

        if (path === "/followups" && method === "POST") {
          const body = JSON.parse(req.postData() || "{}");
          const cand = this.candidaturas.find((c) => c.id === body.candidatura_id);
          const novo: TestFollowUp = {
            id: generateId("fol"),
            candidatura_id: body.candidatura_id,
            candidatura: cand || this.candidaturas[0]!,
            data_prevista: body.data_prevista,
            feito: false,
            nota: body.nota || null,
            created_at: new Date().toISOString(),
          };
          this.followups.unshift(novo);
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(novo),
          });
        }

        const matchFolResultado = path.match(/^\/followups\/([^/]+)\/resultado$/);
        if (matchFolResultado && matchFolResultado[1] && method === "POST") {
          const id = matchFolResultado[1];
          const body = JSON.parse(req.postData() || "{}");
          const item = this.followups.find((f) => f.id === id);
          if (item) {
            item.feito = true;
            item.resultado = body.resultado;
            item.nota = body.nota || item.nota;
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(item),
            });
          }
        }

        const matchFolId = path.match(/^\/followups\/([^/]+)$/);
        if (matchFolId && matchFolId[1]) {
          const id = matchFolId[1];
          const item = this.followups.find((f) => f.id === id);
          if (method === "PATCH") {
            const body = JSON.parse(req.postData() || "{}");
            if (item) {
              Object.assign(item, body);
              return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(item),
              });
            }
          }
          if (method === "DELETE") {
            this.followups = this.followups.filter((f) => f.id !== id);
            return route.fulfill({ status: 204 });
          }
        }

        // Fallback default
        return route.continue();
      },
    );
  }
}
