import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Timer,
  Library,
  PenLine,
  User,
  Sparkles,
  LogOut,
  CalendarDays,
  CreditCard,
  Users,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/user-avatar";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/conteudos", label: "Conteúdos", icon: BookOpen },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/timer", label: "Timer", icon: Timer },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/grupos", label: "Grupos", icon: UsersRound },
  { to: "/assinatura", label: "Assinatura", icon: CreditCard },
  { to: "/redacoes", label: "Redações", icon: PenLine },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success("Você saiu. Até já! 👋");
    navigate({ to: "/login" });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground accent-glow">
          <Sparkles className="size-4" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display text-lg font-semibold leading-none">VestApp</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Aprovação
          </div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-secondary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="active-nav-bar"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-lime"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative size-4" strokeWidth={2} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="m-3 rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatar={profile.avatar}
              name={profile.display_name}
              className="size-10 text-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-semibold">
                {profile.display_name || "Estudante"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Meta: {profile.vestibular} · {profile.target_score}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="press mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      )}
    </aside>
  );
}
