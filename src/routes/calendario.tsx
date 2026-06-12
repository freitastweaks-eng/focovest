import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Check,
  Clock,
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

export const Route = createFileRoute("/calendario")({ component: CalendarioPage });

type CalEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  event_type: string;
  color: string;
  starts_at: string;
  ends_at: string;
  completed: boolean;
};

const EVENT_TYPES = [
  { value: "study", label: "Estudo", color: "#B8FF4F" },
  { value: "review", label: "Revisão", color: "#7DD3FC" },
  { value: "essay", label: "Redação", color: "#F9A8D4" },
  { value: "exam", label: "Prova", color: "#FCA5A5" },
] as const;

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function fmtLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CalendarioPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch events for current month range
  useEffect(() => {
    if (!user) return;
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    setLoading(true);
    supabase
      .from("calendar_events")
      .select("*")
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .order("starts_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Erro ao carregar eventos");
        } else {
          setEvents((data as CalEvent[]) || []);
        }
        setLoading(false);
      });
  }, [user, cursor]);

  const monthGrid = useMemo(() => {
    const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    // leading
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(-i);
      cells.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    return cells;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.starts_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const openCreate = (date?: Date) => {
    setEditing(null);
    setSelectedDate(date || new Date());
    setModalOpen(true);
  };
  const openEdit = (ev: CalEvent) => {
    setEditing(ev);
    setSelectedDate(new Date(ev.starts_at));
    setModalOpen(true);
  };

  const handleSave = async (payload: Omit<CalEvent, "id" | "user_id" | "completed">) => {
    if (!user) return;
    if (editing) {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (error) return toast.error("Erro ao salvar");
      setEvents((prev) => prev.map((e) => (e.id === editing.id ? (data as CalEvent) : e)));
      toast.success("Evento atualizado");
    } else {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) return toast.error("Erro ao criar");
      setEvents((prev) => [...prev, data as CalEvent]);
      toast.success("Evento criado");
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Evento excluído");
    setModalOpen(false);
  };

  const toggleComplete = async (ev: CalEvent) => {
    const { data, error } = await supabase
      .from("calendar_events")
      .update({ completed: !ev.completed })
      .eq("id", ev.id)
      .select()
      .single();
    if (error) return toast.error("Erro");
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? (data as CalEvent) : e)));
  };

  const todayKey = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
  })();

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => new Date(e.starts_at) >= new Date())
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
        .slice(0, 5),
    [events],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Calendário"
        title="Sua agenda de estudos"
        description="Planeje sessões de estudo, revisões, redações e provas."
        actions={
          <button
            onClick={() => openCreate()}
            className="press inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-lime-foreground"
          >
            <Plus className="size-4" /> Novo evento
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-lime" />
              <h2 className="font-display text-xl font-semibold capitalize">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="press flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/40 hover:bg-secondary"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(1);
                  setCursor(d);
                }}
                className="press rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium hover:bg-secondary"
              >
                Hoje
              </button>
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="press flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/40 hover:bg-secondary"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map(({ date, inMonth }, i) => {
              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayEvents = eventsByDay.get(key) || [];
              const isToday = key === todayKey;
              return (
                <button
                  key={i}
                  onClick={() => openCreate(date)}
                  className={cn(
                    "press group relative aspect-square min-h-[64px] rounded-lg border border-border/60 p-1.5 text-left transition hover:border-lime/50 hover:bg-secondary/40 sm:aspect-auto sm:min-h-[88px]",
                    !inMonth && "opacity-40",
                    isToday && "border-lime bg-lime/5",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      isToday ? "bg-lime text-lime-foreground" : "text-foreground",
                    )}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(ev);
                        }}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                          ev.completed && "opacity-50 line-through",
                        )}
                        style={{ backgroundColor: `${ev.color}33`, color: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {loading && (
            <div className="mt-3 text-center text-xs text-muted-foreground">Carregando…</div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-4 text-lime" />
            <h3 className="font-display text-lg font-semibold">Próximos</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento próximo. Clique em um dia para criar!
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((ev) => {
                const d = new Date(ev.starts_at);
                return (
                  <button
                    key={ev.id}
                    onClick={() => openEdit(ev)}
                    className="lift press w-full rounded-xl border border-border bg-secondary/40 p-3 text-left"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="mt-1 size-2 shrink-0 rounded-full"
                        style={{ background: ev.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-sm font-semibold",
                            ev.completed && "line-through opacity-50",
                          )}
                        >
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ·{" "}
                          {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {ev.subject && ` · ${ev.subject}`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <EventDialog
            key={editing?.id || "new"}
            open={modalOpen}
            onOpenChange={setModalOpen}
            editing={editing}
            defaultDate={selectedDate || new Date()}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleComplete={toggleComplete}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

function EventDialog({
  open,
  onOpenChange,
  editing,
  defaultDate,
  onSave,
  onDelete,
  onToggleComplete,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  editing: CalEvent | null;
  defaultDate: Date;
  onSave: (p: Omit<CalEvent, "id" | "user_id" | "completed">) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (ev: CalEvent) => void;
}) {
  const initialStart = editing
    ? new Date(editing.starts_at)
    : (() => {
        const d = new Date(defaultDate);
        d.setHours(9, 0, 0, 0);
        return d;
      })();
  const initialEnd = editing
    ? new Date(editing.ends_at)
    : (() => {
        const d = new Date(initialStart);
        d.setHours(d.getHours() + 1);
        return d;
      })();

  const [title, setTitle] = useState(editing?.title || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [subject, setSubject] = useState(editing?.subject || "");
  const [eventType, setEventType] = useState(editing?.event_type || "study");
  const [startsAt, setStartsAt] = useState(fmtLocalInput(initialStart));
  const [endsAt, setEndsAt] = useState(fmtLocalInput(initialEnd));

  const typeMeta = EVENT_TYPES.find((t) => t.value === eventType) || EVENT_TYPES[0];

  const submit = () => {
    if (!title.trim()) return toast.error("Dê um título ao evento");
    const sa = new Date(startsAt);
    const ea = new Date(endsAt);
    if (ea <= sa) return toast.error("A hora final deve ser depois do início");
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      subject: subject || null,
      event_type: eventType,
      color: typeMeta.color,
      starts_at: sa.toISOString(),
      ends_at: ea.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editing ? "Editar evento" : "Novo evento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Revisão de funções"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: t.color }} />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Matéria</Label>
              <Select
                value={subject || "_none"}
                onValueChange={(v) => setSubject(v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhuma</SelectItem>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Fim</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas, capítulos, exercícios…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            {editing && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onToggleComplete(editing);
                    onOpenChange(false);
                  }}
                >
                  <Check className="size-4" /> {editing.completed ? "Reabrir" : "Concluir"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(editing.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={submit}
              className="bg-lime text-lime-foreground hover:bg-lime/90"
            >
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
