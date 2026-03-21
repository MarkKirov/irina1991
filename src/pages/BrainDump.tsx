import { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTaskContext, Category } from "@/context/TaskContext";
import { ArrowRight, Plus } from "lucide-react";

const categories: { key: Category; label: string; emoji: string }[] = [
  { key: "home", label: "Дом и семья", emoji: "🏠" },
  { key: "work", label: "Работа и проекты", emoji: "💼" },
  { key: "me", label: "Я (личное время)", emoji: "🧘‍♀️" },
];

const BrainDump = () => {
  const navigate = useNavigate();
  const { tasks, addTask } = useTaskContext();
  const [inputs, setInputs] = useState<Record<Category, string>>({ home: "", work: "", me: "" });

  const handleAdd = (cat: Category) => {
    const val = inputs[cat].trim();
    if (!val) return;
    addTask(val, cat);
    setInputs((p) => ({ ...p, [cat]: "" }));
  };

  const handleKey = (e: KeyboardEvent, cat: Category) => {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(cat); }
  };

  const catTasks = (cat: Category) => tasks.filter((t) => t.category === cat);

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-5xl mx-auto">
      <div className="text-center mb-10 space-y-2">
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Шаг 1 из 3</p>
        <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
          Выгрузка из головы
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Выпиши всё, что крутится в голове. Напиши задачу и нажми Enter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categories.map(({ key, label, emoji }) => (
          <div key={key} className="bg-card rounded-2xl border p-5 shadow-sm flex flex-col">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">{emoji}</span> {label}
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                value={inputs[key]}
                onChange={(e) => setInputs((p) => ({ ...p, [key]: e.target.value }))}
                onKeyDown={(e) => handleKey(e, key)}
                placeholder="Добавить задачу…"
                className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-base placeholder:text-muted-foreground/60 border-0 outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
              />
              <button
                onClick={() => handleAdd(key)}
                className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <ul className="space-y-1.5 flex-1 min-h-[60px]">
              {catTasks(key).map((t) => (
                <li key={t.id} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 text-sm border">
                  <span className="flex-1">{t.text}</span>
                </li>
              ))}
              {catTasks(key).length === 0 && (
                <li className="text-xs text-muted-foreground/50 italic py-4 text-center">Пока пусто</li>
              )}
            </ul>

            <p className="text-xs text-muted-foreground mt-3">{catTasks(key).length} задач</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={() => navigate("/filter")}
          disabled={tasks.length === 0}
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
        >
          Далее: Расставить приоритеты
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default BrainDump;
