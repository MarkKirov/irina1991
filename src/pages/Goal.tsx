import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTaskContext } from "@/context/TaskContext";
import { ArrowRight, Target } from "lucide-react";

const Goal = () => {
  const navigate = useNavigate();
  const { goal, setGoal } = useTaskContext();
  const [input, setInput] = useState(goal);

  const handleContinue = () => {
    setGoal(input.trim());
    navigate("/dump");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full flex flex-col items-center text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
            Какая у тебя главная цель сейчас?
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Напиши одну ключевую цель, к которой ты идёшь. Весь план на неделю мы будем проверять через эту призму.
          </p>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Например: заработать 500 000 ₽ за этот месяц, или наладить отношения с партнёром, или запустить свой проект…"
          rows={3}
          className="w-full bg-muted/50 rounded-xl px-4 py-3 text-base placeholder:text-muted-foreground/50 border-0 outline-none focus:ring-2 focus:ring-ring/30 transition-shadow resize-none text-[16px]"
        />

        <button
          onClick={handleContinue}
          disabled={!input.trim()}
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
        >
          Далее
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default Goal;
