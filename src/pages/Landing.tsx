import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Sparkles, Heart } from "lucide-react";
import coachPhoto from "@/assets/coach-irina.png";
import { useCurrentStep } from "@/context/TaskContext";

const Landing = () => {
  const navigate = useNavigate();
  const { getStep } = useCurrentStep();

  useEffect(() => {
    const navType = window.performance?.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
    const isDirectLoad = !navType || navType.type === "navigate" || navType.type === "reload";
    if (isDirectLoad) {
      const saved = getStep();
      if (saved && saved !== "/") {
        navigate(saved, { replace: true });
      }
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src={coachPhoto}
          alt="Коуч Ирина Логачева"
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end px-6 pb-12 pt-24">
        <div className="max-w-lg w-full flex flex-col items-center text-center space-y-6">
          <p className="text-xs font-medium text-muted-foreground tracking-[0.25em] uppercase">
            С коучем ICF Ириной Логачевой
          </p>

          <h1
            className="text-4xl md:text-5xl leading-tight text-foreground"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Разгрузи голову за&nbsp;15&nbsp;минут
          </h1>

          <p
            className="text-base text-muted-foreground max-w-sm leading-relaxed"
            style={{ textWrap: "pretty" as any }}
          >
            Преврати хаос в голове в спокойный, структурированный план на неделю
            — и наконец выдохни.
          </p>

          <button
            onClick={() => navigate("/goal")}
            className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
          >
            Начать
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 15 мин
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Бесплатно
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Без регистрации
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
