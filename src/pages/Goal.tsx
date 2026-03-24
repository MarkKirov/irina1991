import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTaskContext, useCurrentStep } from "@/context/TaskContext";
import { ArrowRight, Target, CheckCircle, MessageCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const goalTips = [
  { emoji: "📏", label: "Измеримая", desc: "Чтобы ты могла понять, достигла ли ты её" },
  { emoji: "🎯", label: "Реалистичная", desc: "Амбициозная, но достижимая для тебя сейчас" },
  { emoji: "💚", label: "Комфортная", desc: "Вдохновляет, а не вызывает тревогу" },
];

const Goal = () => {
  const navigate = useNavigate();
  const { goal, setGoal } = useTaskContext();
  const [input, setInput] = useState(goal);

  const [aiComment, setAiComment] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleContinue = () => {
    setGoal(input.trim());
    navigate("/dump");
  };

  const analyzeGoal = async () => {
    if (!input.trim()) return;
    setAiLoading(true);
    setAiComment(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { type: "goal-review", goal: input.trim() },
      });
      if (error) throw error;
      setAiComment(data.comment);
    } catch (e: any) {
      console.error("Goal AI error:", e);
      setAiComment("Не удалось получить рекомендацию. Попробуй ещё раз.");
    } finally {
      setAiLoading(false);
    }
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

        {/* Goal criteria tips */}
        <div className="w-full bg-card border rounded-xl p-4 text-left space-y-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Хорошая цель — это:</p>
          {goalTips.map((tip) => (
            <div key={tip.label} className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">{tip.emoji}</span>
              <div>
                <span className="text-sm font-medium text-foreground">{tip.label}</span>
                <span className="text-sm text-muted-foreground"> — {tip.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Например: заработать 500 000 ₽ за этот месяц, или наладить отношения с партнёром, или запустить свой проект…"
          rows={3}
          className="w-full bg-muted/50 rounded-xl px-4 py-3 text-base placeholder:text-muted-foreground/50 border-0 outline-none focus:ring-2 focus:ring-ring/30 transition-shadow resize-none text-[16px]"
        />

        {/* AI feedback */}
        {aiComment && (
          <div className="w-full bg-card border rounded-xl p-4 text-left animate-in fade-in slide-in-from-bottom-3 duration-400 relative">
            <button
              onClick={() => setAiComment(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2.5 pr-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Рекомендация от Ирины</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{aiComment}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={analyzeGoal}
            disabled={!input.trim() || aiLoading}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Анализирую цель…
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Получить рекомендацию от Ирины
              </>
            )}
          </button>

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
    </div>
  );
};

export default Goal;
