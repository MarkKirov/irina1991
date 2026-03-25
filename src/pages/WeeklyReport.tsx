import { useState, useEffect } from "react";
import { useTaskContext, useCurrentStep, Task } from "@/context/TaskContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Target,
  TrendingUp,
  Award,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const WeeklyReport = () => {
  const { tasks, goal, weekNumber, startNextWeek } = useTaskContext();
  const { saveStep } = useCurrentStep();
  const navigate = useNavigate();

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    saveStep("/report");
  }, []);

  const actionable = tasks.filter((t) => t.priority && t.priority !== "drop");
  const weeklyTasks = actionable.filter((t) => t.day && t.day !== "Месяц");
  const doneTasks = weeklyTasks.filter((t) => t.done);
  const undoneTasks = weeklyTasks.filter((t) => !t.done);
  const totalProgress = weeklyTasks.length > 0 ? Math.round((doneTasks.length / weeklyTasks.length) * 100) : 0;

  const categoryStats = (cat: string) => {
    const catTasks = weeklyTasks.filter((t) => t.category === cat);
    const catDone = catTasks.filter((t) => t.done).length;
    return { total: catTasks.length, done: catDone };
  };

  const homeStats = categoryStats("home");
  const workStats = categoryStats("work");
  const meStats = categoryStats("me");

  const categoryEmoji = (cat: string) => (cat === "home" ? "🏠" : cat === "work" ? "💼" : "🧘‍♀️");
  const categoryLabel = (cat: string) => (cat === "home" ? "Дом" : cat === "work" ? "Работа" : "Для себя");

  const fetchAiReport = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);

    try {
      const weekPlan = DAYS.map((day) => ({
        day,
        tasks: actionable
          .filter((t) => t.day === day)
          .map((t) => ({
            text: t.text,
            category: t.category,
            priority: t.priority,
            done: t.done,
          })),
      }));

      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          type: "weekly-report",
          tasks: weekPlan,
          goal,
          stats: {
            total: weeklyTasks.length,
            done: doneTasks.length,
            undone: undoneTasks.length,
            homeStats,
            workStats,
            meStats,
          },
        },
      });

      if (error) throw error;
      setAiReport(data.comment);
    } catch (e: any) {
      console.error("AI report error:", e);
      setAiError(e?.message || "Не удалось получить отчёт");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (weeklyTasks.length > 0) {
      fetchAiReport();
    }
  }, []);

  const handleNextWeek = () => {
    startNextWeek();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-2xl mx-auto">
      {goal && (
        <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm">
          <Target className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Моя цель:</span>
          <span className="font-medium text-foreground truncate">{goal}</span>
        </div>
      )}

      <div className="text-center mb-8 space-y-2">
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
          Неделя {weekNumber} — Отчёт
        </p>
        <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
          Итоги недели
        </h1>
        <p className="text-sm text-muted-foreground">Посмотри, чего ты достигла за эту неделю</p>
      </div>

      {/* Overall progress */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Общий прогресс</h3>
          </div>
          <span className="text-lg font-bold text-primary">{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} className="h-3 mb-3" />
        <p className="text-sm text-muted-foreground">
          Выполнено {doneTasks.length} из {weeklyTasks.length} задач
        </p>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { key: "home", stats: homeStats },
          { key: "work", stats: workStats },
          { key: "me", stats: meStats },
        ].map(({ key, stats }) => (
          <div key={key} className="bg-card border rounded-xl p-4 text-center">
            <span className="text-2xl">{categoryEmoji(key)}</span>
            <p className="text-xs font-medium text-muted-foreground mt-1">{categoryLabel(key)}</p>
            <p className="text-lg font-bold text-foreground">
              {stats.done}/{stats.total}
            </p>
          </div>
        ))}
      </div>

      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Выполнено — ты молодец! 🎉
          </h3>
          <ul className="space-y-2">
            {doneTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs">{categoryEmoji(t.category)}</span>
                <span className="text-foreground">{t.text}</span>
                <span className="text-xs text-muted-foreground ml-auto">{t.day}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Undone tasks */}
      {undoneTasks.length > 0 && (
        <div className="bg-card border rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Circle className="w-4 h-4 text-muted-foreground" />
            Не выполнено — перенесём на следующую неделю
          </h3>
          <ul className="space-y-2">
            {undoneTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs">{categoryEmoji(t.category)}</span>
                <span className="text-muted-foreground">{t.text}</span>
                <span className="text-xs text-muted-foreground ml-auto">{t.day}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Report */}
      {aiLoading && (
        <div className="bg-card border rounded-2xl p-5 mb-4 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Ирина анализирует твою неделю…</span>
        </div>
      )}

      {aiReport && (
        <div className="bg-card border rounded-2xl p-5 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Обратная связь от Ирины</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{aiReport}</p>
            </div>
          </div>
        </div>
      )}

      {aiError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive text-center mb-4">
          {aiError}
          <button onClick={fetchAiReport} className="block mx-auto mt-2 text-xs underline">
            Попробовать снова
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <button
          onClick={handleNextWeek}
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
        >
          <RefreshCw className="w-4 h-4" />
          Спланировать следующую неделю
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Вернуться к дашборду
        </button>
      </div>
    </div>
  );
};

export default WeeklyReport;
