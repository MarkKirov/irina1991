import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import coachPhoto from "@/assets/coach-irina-hero.png";
import { useCurrentStep } from "@/context/TaskContext";

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getStep } = useCurrentStep();

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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "hsl(15 55% 35%)" }}>
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src={coachPhoto}
          alt="Коуч Ирина Логачева"
          className="w-full h-full object-cover object-top"
        />
        {/* Bottom fade for text readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background:
              "linear-gradient(to top, hsl(15 55% 35%) 0%, hsl(15 55% 35% / 0.85) 35%, hsl(15 55% 35% / 0) 100%)",
          }}
        />
      </div>

      {/* Top labels */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-6 text-white">
        <span className="text-[11px] tracking-[0.3em] uppercase font-medium">
          Coach · ICF
        </span>
        <span
          className="text-base"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
        >
          Irina L.
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-7 pb-8">
        <div className="max-w-lg mx-auto space-y-5">
          <h1
            className="text-white"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500,
              fontSize: "clamp(2.5rem, 9vw, 3.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            <span className="italic">Разгрузи</span>
            <br />
            <span className="italic">голову</span> за 15 мин.
          </h1>

          <p className="text-white/90 text-[15px] leading-relaxed font-medium max-w-md">
            Преврати хаос в спокойный, структурированный план на неделю — и наконец выдохни.
          </p>

          {/* Swipe to start */}
          <div
            ref={trackRef}
            className="relative h-16 rounded-full select-none touch-none"
            style={{
              backgroundColor: "hsl(15 30% 55% / 0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid hsl(0 0% 100% / 0.15)",
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
              className="absolute inset-0 flex items-center justify-center text-white text-[15px] font-medium pointer-events-none transition-opacity"
              style={{ opacity: 1 - progress * 1.5 }}
            >
              Потяни, чтобы начать
            </div>

            {/* Knob */}
            <div
              className="absolute top-1 left-1 h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragX}px)`,
                transition: dragging ? "none" : "transform 0.3s ease",
              }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: "hsl(15 55% 35%)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
