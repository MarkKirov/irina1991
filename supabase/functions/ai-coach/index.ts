import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const goalReviewPrompt = `Ты — Ирина, женский коуч по тайм-менеджменту. Говоришь на русском, тепло и по-дружески, на «ты».
Тебе дают цель, которую написала девушка. Дай краткий (2-4 предложения) дружеский комментарий:
- Оцени цель по 3 критериям: измеримость, реалистичность, комфортность
- Если цель размытая — мягко подскажи, как её конкретизировать
- Если цель нереалистичная или вызывает тревогу — деликатно предложи скорректировать
- Если цель хорошая — похвали и поддержи
- Используй 1-2 эмодзи, не больше
Отвечай ТОЛЬКО текстом комментария, без заголовков и маркеров.`;

const weekPlanPrompt = `Ты — Ирина, женский коуч по тайм-менеджменту. Говоришь на русском, тепло и по-дружески, на «ты».
Тебе дают план задач на неделю и главную цель пользователя. Дай краткий (3-5 предложений) дружеский комментарий:
- Оцени, насколько план ведёт к главной цели
- Похвали за хорошее
- Мягко укажи, если перегруз (слишком много срочного)
- Напомни про баланс работы/отдыха и личное время
- Если задачи не связаны с целью — деликатно подскажи
- Если задач слишком мало (менее 5-7) или план выглядит неполным — прямо скажи: «Вернись на шаг 1 и допиши задачи» или «Добавь ещё задачи для себя, вернувшись на первый шаг». Объясни, почему важно выгрузить всё из головы
- Используй 1-2 эмодзи, не больше
Отвечай ТОЛЬКО текстом комментария, без заголовков и маркеров.`;

const weeklyReportPrompt = `Ты — Ирина, женский коуч по тайм-менеджменту. Говоришь на русском, тепло и по-дружески, на «ты».
Тебе дают итоги недели: выполненные и невыполненные задачи, статистику по категориям и главную цель. Напиши персональный отчёт (5-8 предложений):

ОБЯЗАТЕЛЬНО включи:
1. ПОХВАЛА: Начни с тёплой похвалы за конкретные выполненные задачи. Даже если сделано мало — найди, за что похвалить
2. АНАЛИЗ: Что получилось хорошо, какие паттерны ты видишь (например, фокус на работе, но мало личного времени)
3. ЗОНЫ РОСТА: На что обратить внимание при планировании следующей недели — конкретные рекомендации
4. СВЯЗЬ С ЦЕЛЬЮ: Насколько выполненные задачи приблизили к главной цели

Тон: поддерживающий, без осуждения за невыполненное. Невыполненные задачи — это нормально, предложи перенести или пересмотреть их приоритет.
Используй 2-3 эмодзи. Отвечай ТОЛЬКО текстом, без заголовков и маркеров.`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { type, goal, tasks } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userMsg: string;

    if (type === "goal-review") {
      systemPrompt = goalReviewPrompt;
      userMsg = `Вот цель, которую написала девушка: "${goal}"`;
    } else {
      systemPrompt = weekPlanPrompt;
      userMsg = `Главная цель: ${goal || "не указана"}\n\nВот план на неделю:\n${JSON.stringify(tasks, null, 2)}`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов, попробуй чуть позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Закончились кредиты ИИ." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const comment = data.choices?.[0]?.message?.content ?? "Отличная цель! 💪";

    return new Response(JSON.stringify({ comment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
