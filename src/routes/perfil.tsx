import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page";
import { UserAvatar } from "@/components/user-avatar";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { VESTIBULARES } from "@/lib/data";
import { COMMUNITY_FILES_BUCKET } from "@/lib/storage-url";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { computeStreak, useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/perfil")({ component: PerfilPage });

const AVATARS = ["🎯", "🚀", "📚", "🧠", "⚡", "🌟", "🔥", "✅", "🏆", "💡"];
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function avatarFileName(file: File) {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return `profile/avatar-${Date.now()}.${ext}`;
}

function PerfilPage() {
  const { user: authUser, profile, refreshProfile, updateProfile } = useAuth();
  const {
    theme,
    setTheme,
    soundsEnabled,
    setSoundsEnabled,
    pomodoroDurations,
    setPomodoroDurations,
    sessions,
    drafts,
    completedContent,
    streakDays,
    clearAll,
  } = useAppStore();
  const streak = computeStreak(streakDays);
  const totalHours = (sessions.reduce((a, s) => a + s.duration, 0) / 60).toFixed(1);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? "🎯");
  const [vestibular, setVestibular] = useState(profile?.vestibular ?? VESTIBULARES[0]);
  const [targetScore, setTargetScore] = useState(profile?.target_score ?? 800);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setAvatar(profile?.avatar ?? "🎯");
    setVestibular(profile?.vestibular ?? VESTIBULARES[0]);
    setTargetScore(profile?.target_score ?? 800);
  }, [profile]);

  const saveProfile = async () => {
    if (!authUser) {
      toast.error("Faca login para editar seu perfil.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        display_name: name.trim() || "Estudante",
        avatar,
        vestibular,
        target_score: Number(targetScore) || 800,
      });
      await refreshProfile();
      toast.success("Perfil atualizado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar o perfil.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File | undefined) => {
    if (!file || !authUser) return;
    if (!IMAGE_TYPES.has(file.type)) {
      toast.error("Use uma imagem PNG, JPG ou WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Imagem maxima: 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const path = `${authUser.id}/${avatarFileName(file)}`;
      const { error } = await supabase.storage
        .from(COMMUNITY_FILES_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;

      setAvatar(path);
      await updateProfile({ avatar: path });
      await refreshProfile();
      toast.success("Foto de perfil atualizada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.";
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: number; active: boolean }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ts = d.getTime();
    days.push({ date: ts, active: streakDays.includes(ts) });
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader eyebrow="Perfil" title="Sua jornada" />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Foto e dados
          </div>

          <div className="mb-4 flex items-center gap-4">
            <UserAvatar avatar={avatar} name={name} className="size-20 text-4xl" />
            <div className="min-w-0 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => uploadAvatar(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !authUser}
                className="press inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-semibold hover:bg-secondary/80 disabled:opacity-60"
              >
                <Upload className="size-4" />
                {uploading ? "Enviando..." : "Adicionar imagem"}
              </button>
              <div className="mt-2 text-xs text-muted-foreground">PNG, JPG ou WebP ate 2 MB.</div>
            </div>
          </div>

          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Avatar rapido
          </div>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAvatar(item)}
                className={cn(
                  "press flex aspect-square items-center justify-center rounded-xl border text-2xl transition-colors",
                  avatar === item
                    ? "border-lime bg-lime/10"
                    : "border-border bg-secondary/40 hover:bg-secondary",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nome
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />

          <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Vestibular alvo
          </label>
          <select
            value={vestibular}
            onChange={(event) => setVestibular(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          >
            {VESTIBULARES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nota desejada
          </label>
          <input
            type="number"
            value={targetScore}
            onChange={(event) => setTargetScore(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-lime"
          />

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || !authUser}
            className="press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-3 py-2 text-sm font-semibold text-lime-foreground hover:bg-lime/90 disabled:opacity-60"
          >
            {saving ? <Camera className="size-4 animate-pulse" /> : <Save className="size-4" />}
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Horas estudadas" value={totalHours} />
            <Stat label="Redacoes" value={drafts.length} />
            <Stat label="Conteudos" value={completedContent.length} />
            <Stat label="Streak" value={streak} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Calendario de estudos</h3>
              <span className="text-xs text-muted-foreground">Ultimas 12 semanas</span>
            </div>
            <div className="grid auto-cols-min grid-flow-col grid-rows-7 gap-1">
              {days.map((item) => (
                <div
                  key={item.date}
                  className={cn("size-3 rounded-[3px]", item.active ? "bg-lime" : "bg-secondary")}
                  title={new Date(item.date).toLocaleDateString("pt-BR")}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 font-display text-base font-semibold">Configuracoes</h3>

            <Row label="Tema do App" hint={theme === "dark" ? "Escuro" : "Claro"}>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(value) => setTheme(value ? "dark" : "light")}
                aria-label="Alternar tema do aplicativo"
                className="h-7 w-12 data-[state=checked]:bg-lime data-[state=unchecked]:bg-secondary [&>span]:size-6 data-[state=checked]:[&>span]:translate-x-5"
              />
            </Row>

            <Row label="Sons de notificacao" hint={soundsEnabled ? "Ativados" : "Desativados"}>
              <Switch
                checked={soundsEnabled}
                onCheckedChange={setSoundsEnabled}
                aria-label="Alternar sons de notificacao"
                className="h-7 w-12 data-[state=checked]:bg-lime data-[state=unchecked]:bg-secondary [&>span]:size-6 data-[state=checked]:[&>span]:translate-x-5"
              />
            </Row>

            <div className="my-4 h-px bg-border" />

            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pomodoro
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Num
                label="Foco"
                value={pomodoroDurations.focus}
                onChange={(value) => setPomodoroDurations({ focus: value })}
              />
              <Num
                label="Pausa curta"
                value={pomodoroDurations.shortBreak}
                onChange={(value) => setPomodoroDurations({ shortBreak: value })}
              />
              <Num
                label="Pausa longa"
                value={pomodoroDurations.longBreak}
                onChange={(value) => setPomodoroDurations({ longBreak: value })}
              />
            </div>

            <div className="my-4 h-px bg-border" />

            {!confirm ? (
              <button
                onClick={() => setConfirm(true)}
                className="press inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="size-4" /> Apagar todos os dados
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
                <p className="mb-2 font-semibold text-red-400">
                  Tem certeza? Isso apaga sessoes, redacoes e favoritos.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      clearAll();
                      setConfirm(false);
                      toast.success("Dados apagados");
                    }}
                    className="press rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Sim, apagar
                  </button>
                  <button
                    onClick={() => setConfirm(false)}
                    className="press rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <input
        type="number"
        value={value}
        min={1}
        max={120}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-lime"
      />
    </div>
  );
}
