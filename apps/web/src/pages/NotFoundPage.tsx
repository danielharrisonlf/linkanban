import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/ui/feedback";
import { useTituloDaPagina } from "../lib/useTitulo";

export function NotFoundPage() {
  useTituloDaPagina("Página não encontrada");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Página não encontrada" />
      <EmptyState
        titulo="Esse endereço não existe"
        descricao="O link pode estar desatualizado. Você pode voltar ao resumo ou ir direto para as candidaturas."
        acao={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link to="/">Voltar ao resumo</Link>
            </Button>
            <Button asChild>
              <Link to="/candidaturas">Ver candidaturas</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
