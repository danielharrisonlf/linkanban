import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { ToastProvider } from "./components/ui/toast";
import { RegistrarProvider } from "./registrar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O produto é consultado algumas vezes por dia: meio minuto de cache evita
      // refetch a cada troca de tela sem servir dado velho por muito tempo.
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export function Root() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <RegistrarProvider>
              <App />
            </RegistrarProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
