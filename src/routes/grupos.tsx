import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Lock,
  Plus,
  Send,
  FileText,
  CalendarDays,
  LogIn,
  LogOut,
  Trash2,
  Crown,
  X,
  Globe2,
  Share2,
} from "lucide-react";
import type { Subscription } from "@/lib/subscription";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page";
import { UserAvatar } from "@/components/user-avatar";

function Page({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader title={title} description={subtitle} actions={actions} />
      {children}
    </PageContainer>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  GROUP_FILES_BUCKET,
  safeUploadFileName,
  useGroupFileUrl,
  validateSharedUpload,
} from "@/lib/storage-url";

export const Route = createFileRoute("/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos de Estudo — VestApp" },
      { name: "description", content: "Estude com seus amigos em grupos colaborativos." },
    ],
  }),
  component: GruposPage,
});

type Group = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  subject: string | null;
  emoji: string;
  visibility: "public" | "private";
  created_at: string;
};

type Member = {
  group_id: string;
  user_id: string;
  display_name: string;
  avatar: string;
};

type Post = {
  id: string;
  group_id: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  created_at: string;
};

type Material = {
  id: string;
  group_id: string;
  user_id: string;
  author_name: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
};

type GEvent = {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
};

function GruposPage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <Page title="Grupos de Estudo" subtitle="Carregando grupos...">
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Carregando acesso aos grupos.
        </div>
      </Page>
    );
  }

  return <GroupsApp user={user} profile={profile} />;
}

/* ---------------- GROUPS APP (unlocked path) ---------------- */

function GroupsApp({
  user,
  profile,
}: {
  user: { id: string } | null;
  profile: { display_name: string; avatar: string } | null;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Group | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joiningInvite, setJoiningInvite] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [{ data: gs }, { data: ms }] = await Promise.all([
      supabase.from("study_groups").select("*").order("created_at", { ascending: false }),
      supabase.from("study_group_members").select("group_id").eq("user_id", user.id),
    ]);
    setGroups((gs ?? []) as Group[]);
    setMyMemberships(new Set((ms ?? []).map((m) => m.group_id)));
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const inviteToken = url.searchParams.get("convite");
    if (!inviteToken) return;

    url.searchParams.delete("convite");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setJoiningInvite(true);

    void (async () => {
      try {
        const { error } = await supabase.rpc("join_study_group_by_invite", {
          _invite_token: inviteToken,
        });
        if (error) {
          toast.error("Este convite não é válido ou não está mais disponível.");
          return;
        }
        toast.success("Você entrou no grupo privado!");
        await loadAll();
      } finally {
        setJoiningInvite(false);
      }
    })();
  }, [loadAll, user]);

  const myGroups = useMemo(
    () => groups.filter((g) => myMemberships.has(g.id)),
    [groups, myMemberships],
  );
  const discover = useMemo(
    () => groups.filter((g) => g.visibility === "public" && !myMemberships.has(g.id)),
    [groups, myMemberships],
  );

  const join = async (g: Group) => {
    if (!user) return;
    const { error } = await supabase.rpc("join_public_study_group", { _group_id: g.id });
    if (error) return toast.error("Erro ao entrar");
    toast.success(`Bem-vindo a ${g.name}!`);
    loadAll();
  };

  const shareInvite = async (g: Group) => {
    const { data: token, error } = await supabase.rpc("get_study_group_invite_token", {
      _group_id: g.id,
    });
    if (error || !token) {
      toast.error("Não foi possível gerar o convite.");
      return;
    }

    const inviteUrl = `${window.location.origin}/grupos?convite=${encodeURIComponent(token)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${g.name}`,
          text: `Entre no meu grupo de estudos ${g.name} no VestApp.`,
          url: inviteUrl,
        });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Link de convite copiado!");
  };

  const leave = async (g: Group) => {
    if (!user) return;
    await supabase.from("study_group_members").delete().eq("group_id", g.id).eq("user_id", user.id);
    toast.success("Você saiu do grupo");
    if (active?.id === g.id) setActive(null);
    loadAll();
  };

  return (
    <Page
      title="Grupos de Estudo"
      subtitle="Estude com sua galera"
      actions={
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90"
        >
          <Plus className="size-4" /> Criar grupo
        </Button>
      }
    >
      {joiningInvite && (
        <div className="mb-6 rounded-xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm">
          Entrando no grupo pelo convite...
        </div>
      )}
      {active ? (
        <GroupDetail
          group={active}
          user={user!}
          profile={profile!}
          onBack={() => setActive(null)}
          onLeave={() => leave(active)}
          isOwner={active.owner_id === user?.id}
          onShareInvite={() => shareInvite(active)}
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Meus grupos</h2>
            {myGroups.length === 0 ? (
              <EmptyState text="Você ainda não entrou em nenhum grupo." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {myGroups.map((g) => (
                  <GroupCard key={g.id} group={g} joined onOpen={() => setActive(g)} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Descobrir</h2>
            {discover.length === 0 ? (
              <EmptyState text="Nenhum grupo disponível. Crie o primeiro!" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {discover.map((g) => (
                  <GroupCard key={g.id} group={g} onJoin={() => join(g)} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        user={user}
        onCreated={loadAll}
      />
    </Page>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function GroupCard({
  group,
  joined,
  onJoin,
  onOpen,
}: {
  group: Group;
  joined?: boolean;
  onJoin?: () => void;
  onOpen?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-2xl">
          {group.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold leading-tight">{group.name}</div>
          {group.subject && (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {group.subject}
            </Badge>
          )}
          <Badge variant="outline" className="mt-1 ml-1 text-[10px]">
            {group.visibility === "public" ? (
              <Globe2 className="mr-1 size-3" />
            ) : (
              <Lock className="mr-1 size-3" />
            )}
            {group.visibility === "public" ? "Aberto" : "Privado"}
          </Badge>
        </div>
      </div>
      {group.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{group.description}</p>
      )}
      <div className="mt-4">
        {joined ? (
          <Button size="sm" variant="secondary" className="w-full rounded-xl" onClick={onOpen}>
            Abrir grupo
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full rounded-xl bg-lime text-lime-foreground hover:bg-lime/90"
            onClick={onJoin}
          >
            <LogIn className="size-3.5" /> Entrar
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- CREATE GROUP ---------------- */

function CreateGroupDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: { id: string } | null;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setSubject("");
    setEmoji("📚");
    setVisibility("public");
  };

  const submit = async () => {
    if (!user || !name.trim()) return;
    setLoading(true);
    const { error } = await supabase.rpc("create_study_group", {
      _name: name.trim(),
      _description: description.trim() || null,
      _subject: subject.trim() || null,
      _emoji: emoji,
      _visibility: visibility,
    });
    if (error) {
      setLoading(false);
      return toast.error("Erro ao criar grupo");
    }
    setLoading(false);
    toast.success("Grupo criado! 🎉");
    reset();
    onOpenChange(false);
    onCreated();
  };

  const EMOJIS = ["📚", "🧠", "🎯", "🔥", "💡", "🚀", "⚗️", "🧮", "📝", "🌎"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Novo grupo de estudo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Ícone</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border text-xl",
                    emoji === e
                      ? "border-lime bg-lime/10"
                      : "border-border bg-secondary hover:bg-secondary/80",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nome do grupo</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vestibulandos 2026"
              maxLength={80}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Matéria (opcional)
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Matemática"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que esse grupo trata?"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Visibilidade</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  visibility === "public"
                    ? "border-lime bg-lime/10"
                    : "border-border bg-secondary/40 hover:bg-secondary",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Globe2 className="size-4" /> Aberto
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Aparece em Descobrir e qualquer pessoa pode entrar.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  visibility === "private"
                    ? "border-lime bg-lime/10"
                    : "border-border bg-secondary/40 hover:bg-secondary",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="size-4" /> Privado
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Somente pessoas com o link de convite podem entrar.
                </span>
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={loading || !name.trim()}
            className="bg-lime text-lime-foreground hover:bg-lime/90"
          >
            {loading ? "Criando..." : "Criar grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- GROUP DETAIL ---------------- */

function GroupDetail({
  group,
  user,
  profile,
  onBack,
  onLeave,
  isOwner,
  onShareInvite,
}: {
  group: Group;
  user: { id: string };
  profile: { display_name: string; avatar: string };
  onBack: () => void;
  onLeave: () => void;
  isOwner: boolean;
  onShareInvite: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [events, setEvents] = useState<GEvent[]>([]);
  const [newPost, setNewPost] = useState("");

  const load = useCallback(async () => {
    const [m, p, mat, ev] = await Promise.all([
      supabase.from("study_group_members").select("*").eq("group_id", group.id),
      supabase
        .from("study_group_posts")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("study_group_materials")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("study_group_events")
        .select("*")
        .eq("group_id", group.id)
        .order("starts_at", { ascending: true }),
    ]);
    setMembers((m.data ?? []) as Member[]);
    setPosts((p.data ?? []) as Post[]);
    setMaterials((mat.data ?? []) as Material[]);
    setEvents((ev.data ?? []) as GEvent[]);
  }, [group.id]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`group-${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_group_posts",
          filter: `group_id=eq.${group.id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_group_materials",
          filter: `group_id=eq.${group.id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_group_events",
          filter: `group_id=eq.${group.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id, load]);

  const sendPost = async () => {
    if (!newPost.trim()) return;
    const content = newPost.trim();
    setNewPost("");
    await supabase.from("study_group_posts").insert({
      group_id: group.id,
      user_id: user.id,
      author_name: profile.display_name,
      author_avatar: profile.avatar,
      content,
    });
  };

  const deletePost = async (id: string) => {
    await supabase.from("study_group_posts").delete().eq("id", id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </button>
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-xl">
            {group.emoji}
          </div>
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{group.name}</div>
            <div className="text-xs text-muted-foreground">
              {members.length} {members.length === 1 ? "membro" : "membros"}
              {isOwner && " · Você é o dono"}
            </div>
          </div>
        </div>
        {isOwner && group.visibility === "private" ? (
          <Button variant="outline" size="sm" onClick={onShareInvite} className="rounded-xl">
            <Share2 className="size-3.5" /> Compartilhar convite
          </Button>
        ) : !isOwner ? (
          <Button variant="outline" size="sm" onClick={onLeave} className="rounded-xl">
            <LogOut className="size-3.5" /> Sair
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="feed">
        <TabsList className="bg-secondary">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="calendar">Agenda</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Compartilhe algo com o grupo..."
              rows={2}
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={sendPost}
                disabled={!newPost.trim()}
                className="bg-lime text-lime-foreground hover:bg-lime/90"
              >
                <Send className="size-3.5" /> Postar
              </Button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {posts.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    avatar={p.user_id === user.id ? profile.avatar : p.author_avatar}
                    name={p.author_name}
                    className="size-10 shrink-0 text-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-sm font-semibold">{p.author_name}</div>
                      {p.user_id === user.id && (
                        <button
                          onClick={() => deletePost(p.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("pt-BR")}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{p.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {posts.length === 0 && <EmptyState text="Sem posts ainda. Seja o primeiro!" />}
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <MaterialsTab
            group={group}
            user={user}
            profile={profile}
            materials={materials}
            onChange={load}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <EventsTab group={group} user={user} events={events} onChange={load} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="grid gap-2 md:grid-cols-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <UserAvatar
                  avatar={m.user_id === user.id ? profile.avatar : m.avatar}
                  name={m.display_name}
                  className="size-10 shrink-0 text-xl"
                />
                <div className="text-sm font-medium">{m.display_name || "Estudante"}</div>
                {m.user_id === group.owner_id && <Crown className="ml-auto size-3.5 text-lime" />}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- MATERIALS ---------------- */

function MaterialsTab({
  group,
  user,
  profile,
  materials,
  onChange,
}: {
  group: Group;
  user: { id: string };
  profile: { display_name: string };
  materials: Material[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    let file_url: string | null = null;
    let file_name: string | null = null;
    let file_type: string | null = null;
    if (file) {
      try {
        validateSharedUpload(file);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Arquivo invalido");
        setLoading(false);
        return;
      }
      const path = `${group.id}/${user.id}/${safeUploadFileName(file)}`;
      const { error: upErr } = await supabase.storage
        .from(GROUP_FILES_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        toast.error("Erro no upload");
        setLoading(false);
        return;
      }
      file_url = path;
      file_name = file.name;
      file_type = file.type;
    }
    const { error } = await supabase.from("study_group_materials").insert({
      group_id: group.id,
      user_id: user.id,
      author_name: profile.display_name,
      title: title.trim(),
      description: description.trim() || null,
      file_url,
      file_name,
      file_type,
    });
    setLoading(false);
    if (error) return toast.error("Erro ao adicionar");
    setTitle("");
    setDescription("");
    setFile(null);
    setOpen(false);
    onChange();
  };

  const remove = async (id: string) => {
    await supabase.from("study_group_materials").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90"
      >
        <Plus className="size-4" /> Adicionar material
      </Button>

      {materials.length === 0 ? (
        <EmptyState text="Sem materiais ainda." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {materials.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-secondary">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">por {m.author_name}</div>
                  </div>
                </div>
                {m.user_id === user.id && (
                  <button
                    onClick={() => remove(m.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              {m.description && (
                <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
              )}
              {m.file_url && <MaterialDownloadLink path={m.file_url} name={m.file_name} />}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Novo material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={2}
            />
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={loading || !title.trim()}
              className="bg-lime text-lime-foreground hover:bg-lime/90"
            >
              {loading ? "Enviando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- EVENTS ---------------- */

function EventsTab({
  group,
  user,
  events,
  onChange,
}: {
  group: Group;
  user: { id: string };
  events: GEvent[];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const now = new Date();
  const [start, setStart] = useState(toLocal(now));
  const [end, setEnd] = useState(toLocal(new Date(now.getTime() + 60 * 60 * 1000)));

  function toLocal(d: Date) {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  }

  const submit = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from("study_group_events").insert({
      group_id: group.id,
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      starts_at: new Date(start).toISOString(),
      ends_at: new Date(end).toISOString(),
    });
    if (error) return toast.error("Erro ao criar evento");
    setTitle("");
    setDescription("");
    setOpen(false);
    onChange();
  };

  const remove = async (id: string) => {
    await supabase.from("study_group_events").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90"
      >
        <Plus className="size-4" /> Novo evento
      </Button>

      {events.length === 0 ? (
        <EmptyState text="Sem eventos agendados." />
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex size-10 flex-col items-center justify-center rounded-xl bg-lime/15 text-lime">
                <CalendarDays className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold">{e.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(e.starts_at).toLocaleString("pt-BR")} →{" "}
                  {new Date(e.ends_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {e.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                )}
              </div>
              {e.user_id === user.id && (
                <button
                  onClick={() => remove(e.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Novo evento do grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <Input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={!title.trim()}
              className="bg-lime text-lime-foreground hover:bg-lime/90"
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MaterialDownloadLink({ path, name }: { path: string; name: string | null }) {
  const url = useGroupFileUrl(path);
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-lime hover:underline"
    >
      Baixar {name ?? "arquivo"}
    </a>
  );
}
