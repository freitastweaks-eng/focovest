import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-border/70 bg-card/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="font-display font-semibold text-foreground">VestApp</div>
          <div className="mt-1 text-xs">
            Estude com foco, acompanhe seu progresso e prepare-se melhor.
          </div>
        </div>
        <nav aria-label="Informacoes legais" className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link to="/termos" className="hover:text-lime">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="hover:text-lime">
            Privacidade
          </Link>
          <Link to="/suporte" className="hover:text-lime">
            Suporte
          </Link>
        </nav>
      </div>
    </footer>
  );
}
