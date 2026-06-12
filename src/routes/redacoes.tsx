import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/redacoes")({ component: RedacoesLayout });

const TABS = [
  { to: "/redacoes", label: "Modelos 1000", exact: true },
  { to: "/redacoes/temas", label: "Temas" },
  { to: "/redacoes/escrever", label: "Escrever" },
  { to: "/redacoes/minhas", label: "Minhas Redações" },
];

function RedacoesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Redações"
        title="Hub de Redação"
        description="Modelos nota 1000, temas recorrentes, editor com repertório e suas próprias redações."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "press relative px-4 py-2 text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute -bottom-2 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-lime" />
              )}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </PageContainer>
  );
}
