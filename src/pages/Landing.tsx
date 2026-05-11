import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import coachPhoto from "@/assets/coach-irina-hero.jpg";
import { useCurrentStep } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getStep } = useCurrentStep();
  const { user, signOut } = useAuth();

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const maxXRef = useRef(0);

  useEffect(() => {
    if (location.state?.fromBack) return;
    const saved = getStep();
    if (saved && saved !== "/") {
      navigate(saved, { replace: true });
    }
  }, []);

  const computeMax = () => {
    if (!trackRef.current) return 0;
    // track width minus knob (64px) minus padding (8px)
    return trackRef.current.clientWidth - 64 - 8;
  };

  const onStart = (clientX: number) => {
    maxXRef.current = computeMax();
    startXRef.current = clientX - dragX;
    setDragging(true);
  };

  const onMove = (clientX: number) => {
    if (!dragging) return;
    const next = Math.max(0, Math.min(maxXRef.current, clientX - startXRef.current));
    setDragX(next);
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX >= maxXRef.current * 0.85) {
      setDragX(maxXRef.current);
      setTimeout(() => navigate("/goal"), 150);
    } else {
      setDragX(0);
    }
  };

  const progress = maxXRef.current > 0 ? dragX / maxXRef.current : 0;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src={coachPhoto}
          alt="Коуч Ирина Логачева"
          className="w-full h-full object-cover object-top"
        />
        {/* Bottom white fade for text readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-3/4"
          style={{
            background:
              "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.92) 40%, hsl(var(--background) / 0) 100%)",
          }}
        />
      </div>

      {/* Top label */}
      <div className="relative z-10 flex justify-center items-center px-6 pt-10">
        <span className="text-[11px] tracking-[0.3em] uppercase font-medium text-foreground/60">
          С коучем ICF Ириной Логачевой
        </span>
      </div>

      {/* Auth link — top right */}
      <div className="absolute top-8 right-5 z-20">
        {user ? (
          <button
            onClick={() => signOut()}
            className="text-[12px] font-medium text-foreground/70 bg-background/70 backdrop-blur px-3 py-1.5 rounded-full border border-foreground/10"
          >
            Выйти
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="text-[12px] font-medium text-primary bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border border-primary/30"
          >
            Войти
          </button>
        )}
      </div>

      {/* Bottom content — lifted above mobile browser chrome */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-7 pb-24">
        <div className="max-w-lg mx-auto space-y-5">
          <h1
            className="text-foreground text-center"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontWeight: 400,
              fontSize: "clamp(2.25rem, 8.5vw, 3.25rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            Разгрузи голову
            <br />
            за 15 минут
          </h1>

          <p className="text-foreground/70 text-[15px] leading-relaxed text-center max-w-md mx-auto">
            Преврати хаос в голове в спокойный, структурированный план на неделю — и наконец выдохни.
          </p>

          {/* Swipe to start */}
          <div
            ref={trackRef}
            className="relative h-16 rounded-full select-none touch-none border border-primary/30"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onMouseDown={(e) => onStart(e.clientX)}
            onMouseMove={(e) => onMove(e.clientX)}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={(e) => onStart(e.touches[0].clientX)}
            onTouchMove={(e) => onMove(e.touches[0].clientX)}
            onTouchEnd={onEnd}
          >
            {/* Label */}
            <div
              className="absolute inset-0 flex items-center justify-center text-primary text-[15px] font-medium pointer-events-none transition-opacity"
              style={{ opacity: 1 - progress * 1.5 }}
            >
              Потяни, чтобы начать
            </div>

            {/* Knob */}
            <div
              className="absolute top-1 left-1 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragX}px)`,
                transition: dragging ? "none" : "transform 0.3s ease",
              }}
            >
              <ArrowRight className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
