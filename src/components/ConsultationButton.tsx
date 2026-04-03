import { useState } from "react";
import { X, Send } from "lucide-react";

const ConsultationButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97]"
        style={{ backgroundColor: "hsl(0 55% 35%)" }}
      >
        💬 Консультация с Ириной
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-card border rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              className="text-xl font-semibold text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Нужна помощь?
            </h3>

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Если при планировании ты столкнулась со сложностями в <strong className="text-foreground">постановке цели</strong> —
                не получается сформулировать, к чему ты идёшь.
              </p>

              <p>
                Если испытываешь затруднения в том, чтобы <strong className="text-foreground">выгрузить из головы все задачи</strong> или
                разбить большую задачу на более мелкие.
              </p>

              <p>
                Если в голове <strong className="text-foreground">каша или пустота</strong>, но ты хочешь навести порядок
                в делах и состоянии — и тебе нужна помощь.
              </p>

              <p className="text-foreground font-medium pt-1">
                Приходи ко мне на <strong>бесплатную диагностику</strong>. Мы разберём твой запрос
                и ситуацию, я помогу со всем разобраться 💛
              </p>
            </div>

            <a
              href="https://t.me/logacheva_irina"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "hsl(0 55% 35%)" }}
            >
              <Send className="w-4 h-4" />
              Написать в Telegram «Диагностика»
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsultationButton;
