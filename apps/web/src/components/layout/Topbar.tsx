import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  BellRing,
  Building2,
  Columns3,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { type ComponentType, forwardRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useRegistrar } from "../../registrar";
import { FioMark } from "../brand/FioMark";
import { Button } from "../ui/button";
import { NAV_ITEMS, NAV_SECUNDARIA, type NavItem } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

const ICONES: Record<string, ComponentType<{ className?: string }>> = {
  "/": LayoutDashboard,
  "/quadro": Columns3,
  "/candidaturas": ListTodo,
  "/follow-ups": BellRing,
  "/empresas": Building2,
};

function Marca({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2 rounded-control py-1", compact && "min-w-0")}
      aria-label="Fio — ir para o resumo"
    >
      <span className="rail-brand-mark shrink-0">
        <FioMark className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lead font-semibold leading-none text-ink-primary">
          Fio
        </span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.13em] text-ink-tertiary">
          busca em curso
        </span>
      </span>
    </Link>
  );
}

const ItemNavegacao = forwardRef<
  HTMLAnchorElement,
  {
    item: NavItem;
    mobile?: boolean;
    aoNavegar?: () => void;
  } & Omit<React.ComponentPropsWithoutRef<typeof NavLink>, "to">
>(function ItemNavegacao({ item, mobile = false, aoNavegar, onClick, ...props }, ref) {
  const Icon = ICONES[item.to] ?? LayoutDashboard;

  return (
    <NavLink
      ref={ref}
      to={item.to}
      end={item.to === "/"}
      onClick={(e) => {
        onClick?.(e);
        aoNavegar?.();
      }}
      className={({ isActive }) =>
        cn(
          mobile ? "flex min-h-12 items-center gap-3 rounded-control px-3" : "rail-link",
          isActive && (mobile ? "bg-accent-weak text-accent" : "rail-link-active"),
          !isActive && "text-ink-secondary hover:text-ink-primary",
        )
      }
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-body font-medium">{item.label}</span>
        <span className="hidden text-micro text-ink-tertiary lg:block">{item.descricao}</span>
      </span>
    </NavLink>
  );
});

function NavegacaoDesktop() {
  const { pathname } = useLocation();
  const secundariaAtiva = NAV_SECUNDARIA.some((item) => pathname.startsWith(item.to));

  return (
    <aside className="app-rail hidden lg:flex" aria-label="Navegação principal">
      <div className="rail-brand">
        <Marca />
      </div>

      <p className="rail-section-label">Operação</p>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <ItemNavegacao item={item} key={item.to} />
        ))}
      </nav>

      <div className="mt-7">
        <p className="rail-section-label">Cadastros</p>
        <nav className="flex flex-col gap-1">
          {NAV_SECUNDARIA.map((item) => (
            <ItemNavegacao item={item} key={item.to} />
          ))}
        </nav>
        {secundariaAtiva ? <span className="apenas-leitor">Cadastro ativo</span> : null}
      </div>

      <div className="rail-foot">
        <div className="flex items-center gap-2 text-micro font-medium uppercase tracking-[0.08em] text-ink-secondary">
          <span className="status-indicator" aria-hidden="true" />
          Busca ativa
        </div>
        <p className="mt-2 text-micro leading-relaxed text-ink-tertiary">
          Dados locais. A tela é o seu lembrete.
        </p>
        <div className="mt-3 flex items-center gap-2 text-micro text-ink-tertiary">
          <span>Registrar</span>
          <kbd className="keycap">R</kbd>
        </div>
      </div>
    </aside>
  );
}

function MenuMobile() {
  const [aberto, setAberto] = useState(false);

  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={setAberto}>
      <DialogPrimitive.Trigger
        aria-label="Abrir menu"
        aria-expanded={aberto}
        className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-secondary transition-colors duration-100 hover:bg-surface-hover hover:text-ink-primary lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="dialog-overlay"
          className="fixed inset-0 z-50 bg-scrim/35 lg:hidden"
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface-overlay p-4 shadow-overlay lg:hidden"
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title asChild>
              <div>
                <Marca compact />
              </div>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-tertiary hover:bg-surface-hover hover:text-ink-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <p className="mt-6 rail-section-label px-0">Operação</p>
          <nav aria-label="Navegação principal" className="mt-2 flex flex-col gap-1">
            {[...NAV_ITEMS, ...NAV_SECUNDARIA].map((item) => (
              <DialogPrimitive.Close asChild key={item.to}>
                <ItemNavegacao item={item} mobile />
              </DialogPrimitive.Close>
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Topbar() {
  const { abrir } = useRegistrar();

  return (
    <>
      <NavegacaoDesktop />
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <MenuMobile />
          <div className="lg:hidden">
            <Marca compact />
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="eyebrow">Fio / operação</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
            <span className="tech-meta">dados locais · sessão ativa</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden items-center gap-2 text-micro font-medium uppercase tracking-[0.08em] text-ink-tertiary sm:flex">
              <span className="status-indicator" aria-hidden="true" />
              Busca ativa
            </span>
            <Button onClick={abrir} title="Registrar candidatura (atalho: R)">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="max-sm:hidden">Registrar candidatura</span>
              <span className="sm:hidden">Registrar</span>
            </Button>
          </div>
        </div>

        <p className="apenas-leitor">
          Atalhos de teclado: R registra uma candidatura, barra foca a busca, e G seguido de R, Q,
          C, F ou E abre Resumo, Quadro, Candidaturas, Follow-ups ou Empresas.
        </p>
      </header>
    </>
  );
}
