import { useNavigate } from "react-router-dom";
import { useTaskContext, Priority, Category } from "@/context/TaskContext";
import { ArrowRight } from "lucide-react";

const priorities: { value: Priority; label: string; emoji: string; color: string }[] = [
  { value: "urgent", label: "Urgent", emoji: "🔥", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
  { value: "important", label: "Important", emoji: "⭐️", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
  { value: "routine", label: "Routine", emoji: "⚡️", color: "bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200" },
  { value: "drop", label: "Drop", emoji: "🗑", color: "bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200" },
];

const categoryLabels: Record<Category, { label: string; emoji: string }> = {
  home: { label: "Home & Family", emoji: "🏠" },
  work: { label: "Work & Projects", emoji: "💼" },
  me: { label: "Me (Personal)", emoji: "🧘‍♀️" },
};

const Filtering = () => {
  const navigate = useNavigate();
  const { tasks, setPriority } = useTaskContext();

  const grouped = (["home", "work", "me"] as Category[]).map((cat) => ({
    ...categoryLabels[cat],
    cat,
    tasks: tasks.filter((t) => t.category === cat),
  }));

  const allTagged = tasks.length > 0 && tasks.every((t) => t.priority !== null);

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-3xl mx-auto">
      <div className="text-center mb-10 space-y-2">
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Step 2 of 3</p>
        <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
          Prioritize
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tag each task with a priority. Be honest — not everything is urgent!
        </p>
      </div>

      <div className="space-y-8">
        {grouped.map(({ label, emoji, cat, tasks: catTasks }) =>
          catTasks.length > 0 ? (
            <div key={cat}>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">{emoji}</span> {label}
              </h2>
              <div className="space-y-2">
                {catTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 bg-card border rounded-xl px-4 py-3 transition-all duration-200 ${task.priority === "drop" ? "opacity-50" : ""}`}
                  >
                    <span className={`flex-1 text-sm ${task.priority === "drop" ? "line-through" : ""}`}>
                      {task.text}
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {priorities.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPriority(task.id, task.priority === p.value ? null : p.value)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 active:scale-95 ${
                            task.priority === p.value
                              ? p.color + " ring-2 ring-offset-1 ring-current/20"
                              : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                          }`}
                        >
                          {p.emoji} {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={() => navigate("/dashboard")}
          disabled={!allTagged}
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
        >
          Generate My Plan
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      {!allTagged && tasks.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Tag all tasks to continue
        </p>
      )}
    </div>
  );
};

export default Filtering;
