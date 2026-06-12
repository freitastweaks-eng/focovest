import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

export type Theme = "light" | "dark";

export type SessionLog = {
  id: string;
  subject: string;
  duration: number; // minutes
  timestamp: number;
};

export type EssayDraft = {
  id: string;
  theme: string;
  body: string;
  status: "Rascunho" | "Concluída";
  updatedAt: number;
};

export type UserProfile = {
  name: string;
  avatar: string; // emoji
  vestibular: string;
  targetScore: number;
};

type AppState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  user: UserProfile;
  setUser: (u: Partial<UserProfile>) => void;

  bookmarksContent: string[];
  toggleBookmarkContent: (id: string) => void;

  bookmarksRepertoire: string[];
  toggleBookmarkRepertoire: (id: string) => void;

  completedContent: string[];
  toggleCompleteContent: (id: string) => void;

  sessions: SessionLog[];
  addSession: (s: SessionLog) => void;

  pomodoroDurations: { focus: number; shortBreak: number; longBreak: number };
  setPomodoroDurations: (p: Partial<AppState["pomodoroDurations"]>) => void;

  soundsEnabled: boolean;
  setSoundsEnabled: (v: boolean) => void;

  drafts: EssayDraft[];
  saveDraft: (d: EssayDraft) => void;
  removeDraft: (id: string) => void;

  streakDays: number[]; // timestamps (day-start) of study days
  registerStudyDay: () => void;

  clearAll: () => void;
  hydrateFromCloud: (userId: string) => Promise<void>;
};

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),

      user: {
        name: "Estudante",
        avatar: "🎯",
        vestibular: "ENEM",
        targetScore: 850,
      },
      setUser: (u) => set({ user: { ...get().user, ...u } }),

      bookmarksContent: [],
      toggleBookmarkContent: (id) => {
        const has = get().bookmarksContent.includes(id);
        set({
          bookmarksContent: has
            ? get().bookmarksContent.filter((x) => x !== id)
            : [...get().bookmarksContent, id],
        });
        supabase.auth.getUser().then(({ data }) => {
          const uid = data.user?.id;
          if (!uid) return;
          if (has) {
            supabase.from("content_favorites").delete().eq("user_id", uid).eq("content_id", id);
          } else {
            supabase.from("content_favorites").insert({ user_id: uid, content_id: id });
          }
        });
      },

      bookmarksRepertoire: [],
      toggleBookmarkRepertoire: (id) => {
        const has = get().bookmarksRepertoire.includes(id);
        set({
          bookmarksRepertoire: has
            ? get().bookmarksRepertoire.filter((x) => x !== id)
            : [...get().bookmarksRepertoire, id],
        });
        supabase.auth.getUser().then(({ data }) => {
          const uid = data.user?.id;
          if (!uid) return;
          if (has) {
            supabase
              .from("repertoire_favorites")
              .delete()
              .eq("user_id", uid)
              .eq("repertoire_id", id);
          } else {
            supabase.from("repertoire_favorites").insert({ user_id: uid, repertoire_id: id });
          }
        });
      },

      completedContent: [],
      toggleCompleteContent: (id) =>
        set({
          completedContent: get().completedContent.includes(id)
            ? get().completedContent.filter((x) => x !== id)
            : [...get().completedContent, id],
        }),

      sessions: [],
      addSession: (s) => {
        set({ sessions: [s, ...get().sessions] });
        get().registerStudyDay();
        supabase.auth.getUser().then(({ data }) => {
          const uid = data.user?.id;
          if (!uid) return;
          supabase.from("study_sessions").insert({
            user_id: uid,
            subject: s.subject,
            duration_minutes: s.duration,
          });
        });
      },

      pomodoroDurations: { focus: 25, shortBreak: 5, longBreak: 10 },
      setPomodoroDurations: (p) => set({ pomodoroDurations: { ...get().pomodoroDurations, ...p } }),

      soundsEnabled: true,
      setSoundsEnabled: (v) => set({ soundsEnabled: v }),

      drafts: [],
      saveDraft: (d) => {
        const existing = get().drafts.find((x) => x.id === d.id);
        if (existing) {
          set({ drafts: get().drafts.map((x) => (x.id === d.id ? d : x)) });
        } else {
          set({ drafts: [d, ...get().drafts] });
        }
      },
      removeDraft: (id) => set({ drafts: get().drafts.filter((x) => x.id !== id) }),

      streakDays: [],
      registerStudyDay: () => {
        const t = todayStart();
        if (!get().streakDays.includes(t)) {
          set({ streakDays: [...get().streakDays, t] });
        }
      },

      clearAll: () =>
        set({
          bookmarksContent: [],
          bookmarksRepertoire: [],
          completedContent: [],
          sessions: [],
          drafts: [],
          streakDays: [],
        }),

      hydrateFromCloud: async (userId: string) => {
        const { data: sessions } = await supabase
          .from("study_sessions")
          .select("id,subject,duration_minutes")
          .eq("user_id", userId)
          .limit(200);

        const patch: Partial<AppState> = {};
        if (sessions) {
          const now = Date.now();
          patch.sessions = sessions.map((r) => ({
            id: r.id,
            subject: r.subject,
            duration: r.duration_minutes,
            timestamp: now,
          }));
        }
        set(patch as AppState);
      },
    }),
    { name: "vestapp-store" },
  ),
);

export function computeStreak(days: number[]) {
  if (days.length === 0) return 0;
  const sorted = [...days].sort((a, b) => b - a);
  const oneDay = 86400000;
  let streak = 0;
  let cursor = todayStart();
  for (const d of sorted) {
    if (d === cursor) {
      streak++;
      cursor -= oneDay;
    } else if (d === cursor - oneDay) {
      // skipped today, fine
      cursor = d - oneDay;
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
