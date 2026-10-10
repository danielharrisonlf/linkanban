import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/button";

interface State {
  error: Error | null;
}

/**
 * Sem isto, um erro de render derruba a aplicação inteira numa tela branca.
 * A ordem da mensagem importa: o que aconteceu, se os dados estão a salvo, o que
 * fazer. E o detalhe técnico vai para o console, não para a tela.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado na aplicação:", error, info.componentStack);
  }

  override render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-base p-6">
        <div className="w-full max-w-md rounded-card border border-line bg-surface-raised p-5">
          <h1 className="font-display text-title text-ink-primary">A tela não carregou</h1>
          <p className="mt-1.5 text-body text-ink-secondary">
            Suas candidaturas continuam salvas. Recarregar a página costuma resolver.
          </p>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
            <Button variant="secondary" onClick={() => this.setState({ error: null })}>
              Tentar de novo
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
