import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { CandidaturaDialog } from "./components/CandidaturaDialog";
import { Topbar } from "./components/layout/Topbar";
import { SkeletonTela } from "./components/ui/feedback";
import { useAtalhos } from "./lib/useAtalhos";
import { CandidaturasPage } from "./pages/CandidaturasPage";
import { EmpresasPage } from "./pages/EmpresasPage";
import { FollowupsPage } from "./pages/FollowupsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useRegistrar } from "./registrar";

/**
 * Resumo e Quadro carregam sob demanda: são as rotas que trazem bibliotecas
 * grandes (Recharts e dnd-kit) e uma sessão normalmente começa por uma delas. As
 * listas ficam no bundle inicial por serem leves e serem o passo seguinte.
 */
const ResumoPage = lazy(() =>
  import("./pages/ResumoPage").then((modulo) => ({ default: modulo.ResumoPage })),
);
const QuadroPage = lazy(() =>
  import("./pages/QuadroPage").then((modulo) => ({ default: modulo.QuadroPage })),
);

export default function App() {
  const { aberto, abrir, fechar } = useRegistrar();
  useAtalhos({ aoRegistrar: abrir });

  return (
    <div className="app-frame min-h-dvh text-ink-primary">
      <a
        href="#conteudo"
        className="apenas-leitor focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:border focus:border-accent focus:bg-surface-overlay focus:px-3 focus:py-2 focus:text-label"
      >
        Pular para o conteúdo
      </a>
      <Topbar />
      <div className="app-main">
        <main id="conteudo" className="page-main">
          <Suspense fallback={<SkeletonTela />}>
            <Routes>
              <Route path="/" element={<ResumoPage />} />
              <Route path="/quadro" element={<QuadroPage />} />
              <Route path="/candidaturas" element={<CandidaturasPage />} />
              <Route path="/empresas" element={<EmpresasPage />} />
              <Route path="/follow-ups" element={<FollowupsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* O diálogo de registro vive no shell: é a ação mais frequente do produto
          e precisa estar a um clique (ou a uma tecla) de qualquer tela. */}
      <CandidaturaDialog open={aberto} onOpenChange={(o) => (o ? undefined : fechar())} />
    </div>
  );
}
