import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Sparkles, Heart } from "lucide-react";
import coachPhoto from "@/assets/coach-irina.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full flex flex-col items-center text-center space-y-8">
        <div className="w-28 h-28 rounded-full border-4 border-accent shadow-md overflow-hidden">
          <img src={coachPhoto} alt="Коуч Ирина" className="w-full h-full object-cover" />
        </div>

        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
          С коучем Ириной
        </p>

        <h1 className="text-4xl md:text-5xl leading-tight tracking-tight text-foreground" style={{ lineHeight: 1.15 }}>
          Разгрузи голову за&nbsp;15&nbsp;минут
        </h1>

        <p className="text-base text-muted-foreground max-w-sm leading-relaxed" style={{ textWrap: "pretty" as any }}>
          Преврати хаос в голове в спокойный, структурированный план на неделю — и наконец выдохни.
        </p>

        <button
          onClick={() => navigate("/dump")}
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
        >
          Начать
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 15 мин</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Бесплатно</span>
          <span className="inline-flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Без регистрации</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
