import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Paperclip,
  Send,
  Trash2,
  Plus,
  X,
  Image as ImageIcon,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageContainer, PageHeader } from "@/components/page";
import { SUBJECTS } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COMMUNITY_FILES_BUCKET,
  safeUploadFileName,
  useCommunityFileUrl,
  validateSharedUpload,
} from "@/lib/storage-url";

export const Route = createFileRoute("/comunidade")({ component: ComunidadePage });

type Post = {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  title: string;
  content: string;
  category: string;
  subject: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  created_at: string;
};

const CATEGORIES = [
  { value: "discussao", label: "Discussão", color: "bg-lime/15 text-lime-foreground" },
  { value: "duvida", label: "Dúvida", color: "bg-blue-500/15 text-blue-500" },
  { value: "material", label: "Material", color: "bg-purple-500/15 text-purple-500" },
  { value: "redacao", label: "Redação", color: "bg-orange-500/15 text-orange-500" },
  { value: "motivacao", label: "Motivação", color: "bg-pink-500/15 text-pink-500" },
];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function ComunidadePage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [openPost, setOpenPost] = useState<Post | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const list = (data ?? []) as Post[];
    setPosts(list);

    if (list.length) {
      const ids = list.map((p) => p.id);
      const [{ data: likeRows }, { data: cmtRows }] = await Promise.all([
        supabase.from("community_likes").select("post_id,user_id").in("post_id", ids),
        supabase.from("community_comments").select("post_id").in("post_id", ids),
      ]);
      const lmap: Record<string, { count: number; mine: boolean }> = {};
      (likeRows ?? []).forEach((r: { post_id: string; user_id: string }) => {
        const cur = lmap[r.post_id] ?? { count: 0, mine: false };
        cur.count += 1;
        if (user && r.user_id === user.id) cur.mine = true;
        lmap[r.post_id] = cur;
      });
      setLikes(lmap);
      const cmap: Record<string, number> = {};
      (cmtRows ?? []).forEach((r: { post_id: string }) => {
        cmap[r.post_id] = (cmap[r.post_id] ?? 0) + 1;
      });
      setCounts(cmap);
    } else {
      setLikes({});
      setCounts({});
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_likes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const cur = likes[postId];
    if (cur?.mine) {
      setLikes((s) => ({ ...s, [postId]: { count: Math.max(0, cur.count - 1), mine: false } }));
      await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      setLikes((s) => ({ ...s, [postId]: { count: (cur?.count ?? 0) + 1, mine: true } }));
      await supabase.from("community_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Excluir este post?")) return;
    await supabase.from("community_posts").delete().eq("id", postId);
    setPosts((p) => p.filter((x) => x.id !== postId));
    toast.success("Post excluído");
  };

  const filtered = useMemo(() => {
    let l = posts;
    if (filter !== "all") l = l.filter((p) => p.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      l = l.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.author_name ?? "").toLowerCase().includes(q),
      );
    }
    return l;
  }, [posts, filter, search]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Comunidade"
        title="Aprender em conjunto"
        description="Compartilhe materiais, tire dúvidas e troque experiências com outros vestibulandos."
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="press bg-lime text-lime-foreground hover:bg-lime/90"
          >
            <Plus className="size-4" /> Criar post
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar posts, autores, palavras-chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CatChip active={filter === "all"} onClick={() => setFilter("all")} label="Todos" />
          {CATEGORIES.map((c) => (
            <CatChip
              key={c.value}
              active={filter === c.value}
              onClick={() => setFilter(c.value)}
              label={c.label}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card/50 p-12 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
          <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground" />
          <div className="font-display text-lg font-semibold">Nada por aqui ainda</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Seja o primeiro a criar um post nessa categoria.
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence initial={false}>
            {filtered.map((p) => (
              <motion.article
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="group rounded-2xl border border-border bg-card/60 p-5 backdrop-blur hover:border-foreground/20"
              >
                <header className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl">
                    {p.author_avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-display font-semibold">
                        {p.author_name || "Estudante"}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <CatBadge value={p.category} />
                      {p.subject && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {p.subject}
                        </span>
                      )}
                    </div>
                  </div>
                  {user?.id === p.user_id && (
                    <button
                      onClick={() => deletePost(p.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Excluir"
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </header>

                <button onClick={() => setOpenPost(p)} className="mt-3 block w-full text-left">
                  <h3 className="font-display text-lg font-semibold leading-tight">{p.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.content}</p>
                </button>

                {p.attachment_url && (
                  <AttachmentPreview
                    url={p.attachment_url}
                    type={p.attachment_type}
                    name={p.attachment_name}
                  />
                )}

                <footer className="mt-4 flex items-center gap-4 border-t border-border pt-3">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className={cn(
                      "press inline-flex items-center gap-1.5 text-sm font-medium",
                      likes[p.id]?.mine
                        ? "text-pink-500"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Heart className={cn("size-4", likes[p.id]?.mine && "fill-pink-500")} />
                    {likes[p.id]?.count ?? 0}
                  </button>
                  <button
                    onClick={() => setOpenPost(p)}
                    className="press inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="size-4" />
                    {counts[p.id] ?? 0}
                  </button>
                </footer>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreatePostDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={load}
        authorName={profile?.display_name || "Estudante"}
        authorAvatar={profile?.avatar || "🎯"}
        userId={user?.id}
      />

      <PostDialog
        post={openPost}
        onClose={() => setOpenPost(null)}
        currentUserId={user?.id}
        authorName={profile?.display_name || "Estudante"}
        authorAvatar={profile?.avatar || "🎯"}
      />
    </PageContainer>
  );
}

function CatChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "press rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function CatBadge({ value }: { value: string }) {
  const c = CATEGORIES.find((x) => x.value === value) ?? CATEGORIES[0];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", c.color)}>
      {c.label}
    </span>
  );
}

function AttachmentPreview({
  url,
  type,
  name,
}: {
  url: string;
  type: string | null;
  name: string | null;
}) {
  const signed = useCommunityFileUrl(url);
  const href = signed ?? "#";
  const isImage = type?.startsWith("image/");
  if (isImage) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block overflow-hidden rounded-xl border border-border"
      >
        {signed ? (
          <img
            src={signed}
            alt={name ?? "anexo"}
            className="max-h-96 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-40 w-full animate-pulse bg-secondary/40" />
        )}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm font-medium hover:bg-secondary"
    >
      <FileText className="size-4" />
      <span className="truncate max-w-[260px]">{name ?? "Arquivo"}</span>
    </a>
  );
}

function CreatePostDialog({
  open,
  onClose,
  onCreated,
  authorName,
  authorAvatar,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  authorName: string;
  authorAvatar: string;
  userId?: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("discussao");
  const [subject, setSubject] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setCategory("discussao");
      setSubject("none");
      setFile(null);
    }
  }, [open]);

  const submit = async () => {
    if (!userId) return toast.error("Faça login para postar");
    if (!title.trim() || !content.trim()) return toast.error("Preencha título e conteúdo");
    setSubmitting(true);
    try {
      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      let attachment_name: string | null = null;
      if (file) {
        validateSharedUpload(file);
        const path = `${userId}/${safeUploadFileName(file)}`;
        const { error: upErr } = await supabase.storage
          .from(COMMUNITY_FILES_BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        attachment_url = path;
        attachment_type = file.type;
        attachment_name = file.name;
      }
      const { error } = await supabase.from("community_posts").insert({
        user_id: userId,
        author_name: authorName,
        author_avatar: authorAvatar,
        title: title.trim(),
        content: content.trim(),
        category,
        subject: subject === "none" ? null : subject,
        attachment_url,
        attachment_type,
        attachment_name,
      });
      if (error) throw error;
      toast.success("Post publicado!");
      onClose();
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao publicar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Novo post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder="Ex.: Como vocês estudam função quadrática?"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Conteúdo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={4000}
              rows={6}
              placeholder="Compartilhe sua dúvida, dica ou material..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Matéria (opcional)</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Anexo (opcional · até 10 MB)</Label>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm">
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
                <span className="truncate flex-1">{file.name}</span>
                <button onClick={() => setFile(null)} aria-label="Remover">
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="press inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="size-4" /> Adicionar imagem ou PDF
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-lime text-lime-foreground hover:bg-lime/90"
          >
            {submitting ? "Publicando..." : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PostDialog({
  post,
  onClose,
  currentUserId,
  authorName,
  authorAvatar,
}: {
  post: Post | null;
  onClose: () => void;
  currentUserId?: string;
  authorName: string;
  authorAvatar: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setComments((data ?? []) as Comment[]);
          setLoading(false);
        }
      });
    const ch = supabase
      .channel(`post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_comments",
          filter: `post_id=eq.${post.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("community_comments")
            .select("*")
            .eq("post_id", post.id)
            .order("created_at", { ascending: true });
          setComments((data ?? []) as Comment[]);
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [post]);

  const submit = async () => {
    if (!post || !currentUserId || !text.trim()) return;
    const { error } = await supabase.from("community_comments").insert({
      post_id: post.id,
      user_id: currentUserId,
      author_name: authorName,
      author_avatar: authorAvatar,
      content: text.trim(),
    });
    if (error) return toast.error("Erro ao comentar");
    setText("");
  };

  const removeComment = async (id: string) => {
    await supabase.from("community_comments").delete().eq("id", id);
  };

  return (
    <Dialog open={!!post} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        {post && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-xl">
                  {post.author_avatar}
                </div>
                <div>
                  <DialogTitle className="font-display text-base">{post.author_name}</DialogTitle>
                  <div className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</div>
                </div>
              </div>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <CatBadge value={post.category} />
                {post.subject && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {post.subject}
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl font-semibold">{post.title}</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{post.content}</p>
              {post.attachment_url && (
                <AttachmentPreview
                  url={post.attachment_url}
                  type={post.attachment_type}
                  name={post.attachment_name}
                />
              )}

              <div className="mt-2 border-t border-border pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Comentários ({comments.length})
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Carregando...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Seja o primeiro a comentar.</div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-base">
                          {c.author_avatar}
                        </div>
                        <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold">{c.author_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {timeAgo(c.created_at)}
                            </span>
                            {c.user_id === currentUserId && (
                              <button
                                onClick={() => removeComment(c.id)}
                                className="ml-auto text-muted-foreground hover:text-destructive"
                                aria-label="Excluir"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </div>
                          <div className="mt-0.5 text-sm">{c.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {currentUserId && (
                  <div className="mt-3 flex items-end gap-2">
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Escreva um comentário..."
                      rows={2}
                      maxLength={1000}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                      }}
                    />
                    <Button
                      onClick={submit}
                      disabled={!text.trim()}
                      className="bg-lime text-lime-foreground hover:bg-lime/90"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
