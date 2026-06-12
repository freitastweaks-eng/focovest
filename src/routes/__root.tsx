import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VestApp — Sua aprovação começa aqui" },
      {
        name: "description",
        content:
          "Plataforma de estudos para vestibulares: conteúdos completos, timer Pomodoro, repertório e redações nota 1000.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro", "/esqueci-senha", "/reset-password"]);
const AUTH_ONLY_PATHS = new Set(["/", "/login", "/cadastro", "/esqueci-senha"]);

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Gate />
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              className: "!bg-card !text-foreground !border !border-border !rounded-xl",
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function Gate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const isPublic = PUBLIC_PATHS.has(pathname);
  const isOnboarding = pathname === "/onboarding";

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      navigate({ to: "/login" });
    } else if (user && AUTH_ONLY_PATHS.has(pathname)) {
      // logged in user shouldn't see landing/login
      if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
      else navigate({ to: "/dashboard" });
    } else if (user && profile?.onboarded && isOnboarding) {
      navigate({ to: "/dashboard", replace: true });
    } else if (user && profile && !profile.onboarded && !isOnboarding && !isPublic) {
      navigate({ to: "/onboarding" });
    }
  }, [user, profile, loading, pathname, isPublic, isOnboarding, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-lime border-t-transparent" />
      </div>
    );
  }

  if (isPublic || isOnboarding) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  return <AppShell />;
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
