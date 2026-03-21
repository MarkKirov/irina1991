import { useState } from "react";
import { useTaskContext, Task } from "@/context/TaskContext";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, GripVertical, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Dashboard = () => {
  const { tasks, assignDay, unassignDay, toggleDone } = useTaskContext();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string>("Mon");
  const [dragging, setDragging] = useState<string | null>(null);

  // Only actionable tasks (not "drop")
  const actionable = tasks.filter((t) => t.priority && t.priority !== "drop");
  const unassigned = actionable.filter((t) => !t.day);
  const dayTasks = (day: string) => actionable.filter((t) => t.day === day);

  // Progress for selected day
  const selDayTasks = dayTasks(selectedDay);
  const doneCount = selDayTasks.filter((t) => t.done).length;
  const progress = selDayTasks.length > 0 ? Math.round((doneCount / selDayTasks.length) * 100) : 0;

  // "Me" time stats
  const meTasks = actionable.filter((t) => t.category === "me");
  const meDone = meTasks.filter((t) => t.done).length;

  const handleDragStart = (id: string) => setDragging(id);
  const handleDrop = (day: string) => {
    if (dragging) { assignDay(dragging, day); setDragging(null); }
  };

  const priorityBadge = (t: Task) => {
    if (t.priority === "urgent") return <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔥</span>;
    if (t.priority === "important") return <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">⭐️</span>;
    return <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">⚡️</span>;
  };

  const categoryEmoji = (cat: string) => cat === "home" ? "🏠" : cat === "work" ? "💼" : "🧘‍♀️";

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Step 3 of 3</p>
        <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
          Your Weekly Plan
        </h1>
        <p className="text-sm text-muted-foreground">
          Drag tasks to days, or click a task then click a day to assign it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: unassigned tasks */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 text-foreground">Unassigned Tasks</h2>
          {unassigned.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-primary/60" />
              <p className="text-xs text-muted-foreground">All tasks assigned! 🎉</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {unassigned.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={() => handleDragStart(t.id)}
                  className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
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

        {/* Weekly grid */}
        <div className="space-y-4">
          {/* Day progress bar */}
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{selectedDay} Progress</h3>
              <span className="text-xs font-medium text-primary">{progress}% done</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            {meTasks.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                🧘‍♀️ Me-time: {meDone}/{meTasks.length} personal tasks completed
              </p>
            )}
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const dt = dayTasks(day);
              const isSelected = day === selectedDay;
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(day)}
                  className={`rounded-xl border-2 p-3 min-h-[180px] transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
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
                      Drop here
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Start over
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
