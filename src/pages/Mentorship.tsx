import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Users, Target, Heart, ExternalLink } from "lucide-react";

const Mentorship = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/report")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      {/* Hero */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1
          className="text-3xl md:text-4xl text-foreground"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          Менторская группа
        </h1>
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
          «Точка опоры: Деньги и&nbsp;Состояние»
        </p>
      </div>

      {/* Main text */}
      <div className="space-y-5 text-[15px] leading-relaxed text-foreground">
        <p>
          <strong>Первая неделя — Done! ✅</strong> Ты доказала себе, что можешь держать фокус.
          Твой отчёт наглядно показывает: когда есть структура, находится и&nbsp;время, и&nbsp;энергия.
        </p>

        <p className="text-muted-foreground">
          Ты уже молодец, но я&nbsp;знаю, как легко «слиться», когда заканчивается первый запал.
          Поэтому я&nbsp;приглашаю тебя в&nbsp;среду, где слиться невозможно.
        </p>

        <div className="bg-orange-50 border border-orange-300 rounded-2xl p-5 space-y-2">
          <p className="font-medium text-foreground">
            В&nbsp;апреле я&nbsp;запускаю свою менторскую группу
          </p>
          <p className="text-muted-foreground text-sm">
            Это будет мой финальный и&nbsp;самый глубокий проект в&nbsp;2026&nbsp;году перед тем,
            как я&nbsp;уйду в&nbsp;декрет и&nbsp;полностью переключу фокус на&nbsp;материнство.
            <br />
            <strong className="text-foreground">В&nbsp;этом году это твоя единственная возможность
            поработать со&nbsp;мной в&nbsp;таком плотном формате.</strong>
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold text-foreground">В&nbsp;группе мы за&nbsp;1&nbsp;месяц:</p>

          <div className="space-y-3">
            {[
              {
                icon: <Target className="w-4 h-4 text-primary" />,
                text: "Наведём железный порядок в\u00A0твоих задачах, чтобы ты больше никогда не\u00A0чувствовала «каши» в\u00A0голове.",
              },
              {
                icon: <Users className="w-4 h-4 text-primary" />,
                text: "Сфокусируемся на\u00A0деньгах: найдём именно те действия, которые приносят тебе результат, а\u00A0не\u00A0просто создают суету.",
              },
              {
                icon: <Heart className="w-4 h-4 text-primary" />,
                text: "Вернём ресурсное состояние: я\u00A0научу тебя достигать целей бережно, без насилия над собой и\u00A0выгорания.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-card border rounded-xl p-4">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground pt-2">
          Поскольку ты уже сделала первый шаг, у&nbsp;тебя есть{" "}
          <strong className="text-foreground">приоритетное право</strong> занять место
          в&nbsp;группе (их&nbsp;будет максимум&nbsp;8) по&nbsp;самой выгодной цене.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 mt-10 mb-8">
        <a
          href="https://forms.yandex.ru/u/69c412c6493639599e32938d"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
        >
          Заполнить анкету предзаписи
          <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>

        <button
          onClick={() => navigate("/report")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться к итогам
        </button>
      </div>
    </div>
  );
};

export default Mentorship;
