import { useState, useRef } from "react";
import { useTaskContext, Task } from "@/context/TaskContext";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, GripVertical, Sparkles, ArrowLeft, MessageCircle, Loader2, X, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const Dashboard = () => {
  const { tasks, assignDay, toggleDone, goal } = useTaskContext();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string>("Пн");
  const [dragging, setDragging] = useState<string | null>(null);
  const touchData = useRef<{ id: string; startY: number } | null>(null);

  // AI coach state
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const actionable = tasks.filter((t) => t.priority && t.priority !== "drop");
  const unassigned = actionable.filter((t) => !t.day);
  const dayTasks = (day: string) => actionable.filter((t) => t.day === day);

  const selDayTasks = dayTasks(selectedDay);
  const doneCount = selDayTasks.filter((t) => t.done).length;
  const progress = selDayTasks.length > 0 ? Math.round((doneCount / selDayTasks.length) * 100) : 0;

  const meTasks = actionable.filter((t) => t.category === "me");
  const meDone = meTasks.filter((t) => t.done).length;

  const handleDragStart = (id: string) => setDragging(id);
  const handleDrop = (day: string) => {
    if (dragging) { assignDay(dragging, day); setDragging(null); }
  };

  const [touchSelected, setTouchSelected] = useState<string | null>(null);

  const handleTaskTap = (id: string) => {
    setTouchSelected((prev) => (prev === id ? null : id));
  };

  const handleDayTap = (day: string) => {
    if (touchSelected) {
      assignDay(touchSelected, day);
      setTouchSelected(null);
    } else {
      setSelectedDay(day);
    }
  };

  const fetchAiCoach = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiComment(null);
    try {
      const weekPlan = DAYS.map((day) => ({
        day,
        tasks: dayTasks(day).map((t) => ({
          text: t.text,
          category: t.category,
          priority: t.priority,
          done: t.done,
        })),
      }));

      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { tasks: weekPlan },
      });

      if (error) throw error;
      setAiComment(data.comment);
    } catch (e: any) {
      console.error("AI coach error:", e);
      setAiError(e?.message || "Не удалось получить комментарий");
    } finally {
      setAiLoading(false);
    }
  };

  const priorityBadge = (t: Task) => {
    if (t.priority === "urgent") return <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔥</span>;
    if (t.priority === "important") return <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">⭐️</span>;
    return <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">⚡️</span>;
  };

  const categoryEmoji = (cat: string) => cat === "home" ? "🏠" : cat === "work" ? "💼" : "🧘‍♀️";

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto">
      {goal && (
        <div className="mb-6 mx-auto max-w-md bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm">
          <Target className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Моя цель:</span>
          <span className="font-medium text-foreground truncate">{goal}</span>
        </div>
      )}
      <div className="text-center mb-8 space-y-2">
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Шаг 3 из 3</p>
        <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
          Твой план на неделю
        </h1>
        <p className="text-sm text-muted-foreground">
          {touchSelected
            ? "✨ Задача выбрана — нажми на день, чтобы назначить"
            : "Нажми на задачу, затем на день — или перетащи (на ПК)."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 text-foreground">Нераспределённые задачи</h2>
          {unassigned.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-primary/60" />
              <p className="text-xs text-muted-foreground">Все задачи распределены! 🎉</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {unassigned.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={() => handleDragStart(t.id)}
                  onClick={() => handleTaskTap(t.id)}
                  className={`flex items-center gap-2 bg-background border rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing hover:shadow-sm transition-all duration-150 ${
                    touchSelected === t.id ? "ring-2 ring-primary border-primary shadow-md" : ""
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs">{categoryEmoji(t.category)}</span>
                  <span className="flex-1 truncate">{t.text}</span>
                  {priorityBadge(t)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Прогресс за {selectedDay}</h3>
              <span className="text-xs font-medium text-primary">{progress}% выполнено</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            {meTasks.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                🧘‍♀️ Время для себя: {meDone}/{meTasks.length} личных задач выполнено
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const dt = dayTasks(day);
              const isSelected = day === selectedDay;
              const isDropTarget = touchSelected !== null;
              return (
                <div
                  key={day}
                  onClick={() => handleDayTap(day)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(day)}
                  className={`rounded-xl border-2 p-3 min-h-[180px] transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : isDropTarget
                        ? "border-dashed border-primary/40 bg-primary/5 hover:border-primary"
                        : "border-transparent bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold tracking-wide ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                    {dt.length > 0 && (
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                        {dt.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {dt.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-all duration-150 ${
                          t.done ? "bg-primary/10 line-through text-muted-foreground" : "bg-background border"
                        }`}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleDone(t.id); }}
                          className="mt-0.5 shrink-0 text-primary hover:scale-110 transition-transform active:scale-95"
                        >
                          {t.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                        </button>
                        <span className="flex-1 leading-snug break-words">{t.text}</span>
                      </div>
                    ))}
                  </div>

                  {dt.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/40 text-center mt-8">
                      {isDropTarget ? "↓ Назначить сюда" : "Перетащи сюда"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Coach Card */}
      {aiComment && (
        <div className="mt-6 bg-card border rounded-2xl p-5 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setAiComment(null)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Комментарий от Ирины</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{aiComment}</p>
            </div>
          </div>
        </div>
      )}

      {aiError && (
        <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive text-center">
          {aiError}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 mt-10">
        <button
          onClick={fetchAiCoach}
          disabled={aiLoading || actionable.filter((t) => t.day).length === 0}
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Анализирую план…
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              Получить совет от Ирины
            </>
          )}
        </button>

        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Начать заново
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
