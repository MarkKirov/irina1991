import React, { useState, useRef, useEffect } from "react";
import { useTaskContext, useCurrentStep, Task } from "@/context/TaskContext";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  GripVertical,
  Sparkles,
  ArrowLeft,
  MessageCircle,
  Loader2,
  X,
  Target,
  Download,
  ClipboardList,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Category } from "@/context/TaskContext";
import { supabase } from "@/integrations/supabase/client";
import ConsultationButton from "@/components/ConsultationButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { robotoBase64 } from "@/fonts/roboto-base64";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH = "Месяц";
const DAILY = "Ежедневно";
const HABIT = "Привычка";
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const Dashboard = () => {
  const { tasks, assignDay, toggleDone, unassignDay, goal, weekNumber, addTask, setTaskTime, removeTask } = useTaskContext();
  const { saveStep } = useCurrentStep();
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState<string>("Пн");
  const [dragging, setDragging] = useState<string | null>(null);
  const [touchSelected, setTouchSelected] = useState<string | null>(null);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Category>("home");
  const [showAddTask, setShowAddTask] = useState(false);
  const [viewingWeek, setViewingWeek] = useState<number>(weekNumber);
  const touchData = useRef<{ id: string; startY: number } | null>(null);

  const isNextWeek = viewingWeek > weekNumber;

  useEffect(() => {
    saveStep("/dashboard");
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const actionable = tasks.filter((t) => t.priority && t.priority !== "drop");
  // For the weekly grid, filter by viewed week
  const weekFilteredActionable = actionable.filter((t) => {
    // Tasks without day are unassigned — show in current week view only
    if (!t.day) return !isNextWeek;
    // Month/daily/habit tasks show in both weeks
    if (t.day === MONTH || t.day === DAILY || t.day === HABIT) return !isNextWeek;
    // Day-assigned tasks: filter by week
    const taskWeek = t.week || weekNumber;
    return taskWeek === viewingWeek;
  });
  const unassigned = actionable.filter((t) => !t.day);
  const dayTasks = (day: string) => weekFilteredActionable.filter((t) => t.day === day);

  const selDayTasks = dayTasks(selectedDay);
  const doneCount = selDayTasks.filter((t) => t.done).length;
  const progress = selDayTasks.length > 0 ? Math.round((doneCount / selDayTasks.length) * 100) : 0;

  const meTasks = actionable.filter((t) => t.category === "me");
  const meDone = meTasks.filter((t) => t.done).length;

  const handleDragStart = (id: string) => setDragging(id);

  const handleDrop = (day: string, time?: string) => {
    if (dragging) {
      assignDay(dragging, day, viewingWeek);
      if (time) setTaskTime(dragging, time);
      setDragging(null);
    }
  };

  const handleTaskTap = (id: string) => {
    setTouchSelected((prev) => (prev === id ? null : id));
  };

  const handleDayTap = (day: string, time?: string) => {
    if (touchSelected) {
      assignDay(touchSelected, day, viewingWeek);
      if (time) setTaskTime(touchSelected, time);
      setTouchSelected(null);
    } else {
      setSelectedDay(day);
    }
  };

  const fetchAiCoach = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiComment(null);

    try {
      const weekPlan = DAYS.map((day) => ({
        day,
        tasks: dayTasks(day).map((t) => ({
          text: t.text,
          category: t.category,
          priority: t.priority,
          done: t.done,
        })),
      }));

      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { tasks: weekPlan, goal },
      });

      if (error) throw error;
      setAiComment(data.comment);
    } catch (e: any) {
      console.error("AI coach error:", e);
      setAiError(e?.message || "Не удалось получить комментарий");
    } finally {
      setAiLoading(false);
    }
  };

  const buildPdfDocument = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.addFileToVFS("Roboto.ttf", robotoBase64);
    doc.addFont("Roboto.ttf", "Roboto", "normal");
    doc.addFont("Roboto.ttf", "Roboto", "bold");
    doc.setFont("Roboto", "normal");

    doc.setFontSize(18);
    doc.text("План на неделю", 105, 20, { align: "center" });

    if (goal) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Цель: ${goal}`, 105, 28, { align: "center" });
      doc.setTextColor(0);
    }

    const tableData: string[][] = [];

    [...DAYS, MONTH].forEach((day) => {
      const label = day === MONTH ? "В течение месяца" : day;
      const dt = dayTasks(day).slice().sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

      if (dt.length > 0) {
        dt.forEach((t, i) => {
          const status = t.done ? "✓" : "○";
          const cat = t.category === "home" ? "Дом" : t.category === "work" ? "Работа" : "Для себя";
          const timeLabel = t.time || "—";
          tableData.push([i === 0 ? label : "", timeLabel, `${status} ${t.text}`, cat]);
        });
      } else if (day !== MONTH) {
        tableData.push([label, "", "—", ""]);
      }
    });

    autoTable(doc, {
      startY: goal ? 34 : 28,
      head: [["День", "Время", "Задача", "Сфера"]],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        font: "Roboto",
        fontStyle: "normal",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [107, 142, 87],
        font: "Roboto",
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 22, font: "Roboto", fontStyle: "normal" },
        1: { cellWidth: 18, font: "Roboto", fontStyle: "normal" },
        2: { cellWidth: 110, font: "Roboto", fontStyle: "normal" },
        3: { cellWidth: 25, font: "Roboto", fontStyle: "normal" },
      },
    });

    return doc;
  };

  const generatePDF = async () => {
    setPdfLoading(true);
    setPdfError(null);

    try {
      const doc = buildPdfDocument();
      const blob = doc.output("blob");
      const file = new File([blob], "plan-nedeli.pdf", { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfFile(file);
      setPdfUrl(url);
    } catch (error) {
      console.error("PDF export error:", error);
      setPdfError("Не удалось подготовить PDF. Попробуй ещё раз.");
    } finally {
      setPdfLoading(false);
    }
  };

  const openPdf = () => {
    if (!pdfUrl) return;

    const openedWindow = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    if (!openedWindow) {
      window.location.href = pdfUrl;
    }
  };

  const sharePdf = async () => {
    if (!pdfFile) return;

    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };

    try {
      if (typeof nav.share === "function" && (!nav.canShare || nav.canShare({ files: [pdfFile] }))) {
        await nav.share({
          title: "План на неделю",
          text: goal ? `Моя цель: ${goal}` : "План на неделю",
          files: [pdfFile],
        });
        return;
      }

      openPdf();
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        console.error("PDF share error:", error);
        setPdfError("Не удалось открыть PDF. Попробуй кнопку «Открыть PDF».");
      }
    }
  };

  const closePdfPreview = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setPdfUrl(null);
    setPdfFile(null);
    setPdfError(null);
  };

  const priorityBadge = (t: Task) => {
    if (t.priority === "urgent") return <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔥</span>;
    if (t.priority === "important") return <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">⭐️</span>;
    return <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">⚡️</span>;
  };

  const categoryEmoji = (cat: string) => (cat === "home" ? "🏠" : cat === "work" ? "💼" : "🧘‍♀️");

  return (
    <>
      <div className="min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto">
        <button onClick={() => navigate("/filter")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        {goal && (
          <div className="mb-6 mx-auto max-w-md bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Моя цель:</span>
            <span className="font-medium text-foreground truncate">{goal}</span>
          </div>
        )}

        <div className="text-center mb-8 space-y-2">
          <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Неделя {viewingWeek} — Шаг 3 из 3</p>
          <h1 className="text-3xl md:text-4xl text-foreground" style={{ lineHeight: 1.15 }}>
            {isNextWeek ? "План на следующую неделю" : "Твой план на неделю"}
          </h1>

          {/* Week switcher */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setViewingWeek(weekNumber)}
              disabled={viewingWeek === weekNumber}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                viewingWeek === weekNumber
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Текущая неделя
            </button>
            <button
              onClick={() => setViewingWeek(weekNumber + 1)}
              disabled={viewingWeek === weekNumber + 1}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                viewingWeek === weekNumber + 1
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Следующая неделя
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            {touchSelected ? "✨ Задача выбрана — нажми на день, чтобы назначить" : "Нажми на задачу, затем на день — или перетащи (на ПК)."}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Чтобы убрать задачу со дня недели, нажми на крестик рядом с задачей.
          </p>
        </div>

        <div className={`grid grid-cols-1 ${isNextWeek ? "" : "lg:grid-cols-[280px_1fr]"} gap-6`}>
          {!isNextWeek && (
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Нераспределённые задачи</h2>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {showAddTask ? "Скрыть" : "+ Добавить"}
              </button>
            </div>

            {showAddTask && (
              <div className="mb-3 space-y-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTaskText.trim()) {
                      addTask(newTaskText.trim(), newTaskCategory, "routine");
                      setNewTaskText("");
                    }
                  }}
                  placeholder="Новая задача…"
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-1.5">
                  {(["home", "work", "me"] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewTaskCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        newTaskCategory === cat
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/20"
                      }`}
                    >
                      {categoryEmoji(cat)} {cat === "home" ? "Дом" : cat === "work" ? "Работа" : "Я"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (newTaskText.trim()) {
                      addTask(newTaskText.trim(), newTaskCategory, "routine");
                      setNewTaskText("");
                    }
                  }}
                  disabled={!newTaskText.trim()}
                  className="w-full bg-primary text-primary-foreground text-xs font-medium py-2 rounded-lg disabled:opacity-40 transition-opacity"
                >
                  Добавить задачу
                </button>
              </div>
            )}

            {unassigned.length === 0 && !showAddTask ? (
              <div className="text-center py-8 space-y-2">
                <Sparkles className="w-6 h-6 mx-auto text-primary/60" />
                <p className="text-xs text-muted-foreground">Все задачи распределены! 🎉</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {unassigned.map((t) => (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={() => handleDragStart(t.id)}
                    onClick={() => handleTaskTap(t.id)}
                    className={`flex items-center gap-2 bg-background border rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing hover:shadow-sm transition-all duration-150 ${
                      touchSelected === t.id ? "ring-2 ring-primary border-primary shadow-md" : ""
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs">{categoryEmoji(t.category)}</span>
                    <span className="flex-1 break-words min-w-0">{t.text}</span>
                    {priorityBadge(t)}
                    <button
                      onClick={(e) => { e.stopPropagation(); addTask(t.text, t.category, t.priority); }}
                      className="shrink-0 p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Дублировать задачу"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}
                      className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Удалить задачу"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Прогресс за {selectedDay}</h3>
                <span className="text-xs font-medium text-primary">{progress}% выполнено</span>
              </div>
              <Progress value={progress} className="h-2.5" />
              {meTasks.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">🧘‍♀️ Время для себя: {meDone}/{meTasks.length} личных задач выполнено</p>
              )}
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="inline-grid min-w-[900px] w-full" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
                {/* Header row */}
                <div className="sticky top-0 left-0 bg-background z-20 border-b border-border p-2" />
                {DAYS.map((day) => {
                  const dt = dayTasks(day);
                  return (
                    <div
                      key={day}
                      className={`sticky top-0 bg-background z-10 border-b border-border p-2 text-center ${
                        day === selectedDay ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className={`text-xs font-semibold tracking-wide ${day === selectedDay ? "text-primary" : "text-muted-foreground"}`}>
                        {day}
                      </span>
                      {dt.length > 0 && (
                        <span className="ml-1 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{dt.length}</span>
                      )}
                    </div>
                  );
                })}

                {/* Time slot rows */}
                {TIME_SLOTS.map((slot) => (
                  <React.Fragment key={slot}>
                    {/* Time label */}
                    <div key={`label-${slot}`} className="sticky left-0 z-10 bg-background border-b border-border/50 px-2 py-1 flex items-start">
                      <span className="text-[10px] text-muted-foreground font-medium">{slot}</span>
                    </div>

                    {/* Day cells for this time slot */}
                    {DAYS.map((day) => {
                      const slotTasks = actionable.filter((t) => t.day === day && t.time === slot);
                      const isDropTarget = touchSelected !== null || dragging !== null;

                      return (
                        <div
                          key={`${day}-${slot}`}
                          onClick={() => handleDayTap(day, slot)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(day, slot)}
                          className={`border-b border-l border-border/30 min-h-[44px] p-0.5 transition-colors duration-100 cursor-pointer ${
                            isDropTarget ? "hover:bg-primary/10" : "hover:bg-muted/30"
                          } ${day === selectedDay ? "bg-primary/[0.02]" : ""}`}
                        >
                          {slotTasks.map((t) => (
                            <div
                              key={t.id}
                              className={`flex items-start gap-1 rounded px-1.5 py-1 text-[11px] mb-0.5 transition-all duration-150 ${
                                t.done ? "bg-primary/10 line-through text-muted-foreground" : "bg-primary/5 border border-primary/20"
                              }`}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDone(t.id);
                                }}
                                className="mt-0.5 shrink-0 text-primary hover:scale-110 transition-transform"
                              >
                                {t.done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                              </button>
                              <span className="flex-1 leading-tight break-words min-w-0">{t.text}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unassignDay(t.id);
                                }}
                                className="mt-0.5 shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* "No time" row for tasks assigned to a day but without a time */}
                <div className="sticky left-0 z-10 bg-background border-b border-border/50 px-2 py-1 flex items-start">
                  <span className="text-[10px] text-muted-foreground/60 font-medium">—</span>
                </div>
                {DAYS.map((day) => {
                  const noTimeTasks = actionable.filter((t) => t.day === day && !t.time);
                  const isDropTarget = touchSelected !== null || dragging !== null;

                  return (
                    <div
                      key={`${day}-notime`}
                      onClick={() => handleDayTap(day)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(day)}
                      className={`border-b border-l border-border/30 min-h-[44px] p-0.5 transition-colors duration-100 cursor-pointer ${
                        isDropTarget ? "hover:bg-primary/10" : "hover:bg-muted/30"
                      } ${day === selectedDay ? "bg-primary/[0.02]" : ""}`}
                    >
                      {noTimeTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-start gap-1 rounded px-1.5 py-1 text-[11px] mb-0.5 transition-all duration-150 ${
                            t.done ? "bg-primary/10 line-through text-muted-foreground" : "bg-muted/50 border border-border"
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(t.id);
                            }}
                            className="mt-0.5 shrink-0 text-primary hover:scale-110 transition-transform"
                          >
                            {t.done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                          </button>
                          <span className="flex-1 leading-tight break-words min-w-0">{t.text}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignDay(t.id);
                            }}
                            className="mt-0.5 shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {!isNextWeek && unassigned.length === 0 && actionable.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl mt-0.5">✨</span>
                <p className="text-sm text-orange-900 leading-relaxed">
                  Дорогая, твой план готов! Ты только что сделала то, на что у многих уходят месяцы — выгрузила хаос из головы и нашла свои истинные точки роста на ближайшие 7 дней. Чувствуешь, как стало легче дышать? Заходи сюда каждый день для того, чтобы отметить выполненную задачу. В конце недели ты получишь отчет о проделанной работе и оценишь свой прогресс.
                </p>
              </div>
            )}

            {!isNextWeek && (() => {
              const monthTasks = actionable.filter((t) => t.day === MONTH);
              const isDropTarget = touchSelected !== null;

              return (
                <div
                  onClick={() => {
                    if (touchSelected) {
                      assignDay(touchSelected, MONTH);
                      setTouchSelected(null);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(MONTH)}
                  className={`rounded-xl border-2 p-4 min-h-[100px] transition-all duration-200 cursor-pointer ${
                    isDropTarget ? "border-dashed border-accent/60 bg-accent/5 hover:border-accent" : "border-transparent bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">📅 Сделать в течение месяца</span>
                    {monthTasks.length > 0 && (
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{monthTasks.length}</span>
                    )}
                  </div>
                  {monthTasks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {monthTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 ${
                            t.done ? "bg-primary/10 line-through text-muted-foreground" : "bg-background border"
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(t.id);
                            }}
                            className="shrink-0 text-primary hover:scale-110 transition-transform active:scale-95"
                          >
                            {t.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <span className="leading-snug">{t.text}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignDay(t.id);
                            }}
                            className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                            title="Вернуть в нераспределённые"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/40 text-center mt-4">{isDropTarget ? "↓ Перенести сюда" : "Задачи на месяц"}</p>
                  )}
                </div>
              );
            })()}

            {!isNextWeek && (() => {
              const dailyTasks = actionable.filter((t) => t.day === DAILY);
              const isDropTarget = touchSelected !== null;

              return (
                <div
                  onClick={() => {
                    if (touchSelected) {
                      assignDay(touchSelected, DAILY);
                      setTouchSelected(null);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(DAILY)}
                  className={`rounded-xl border-2 p-4 min-h-[80px] transition-all duration-200 cursor-pointer bg-orange-50/60 ${
                    isDropTarget ? "border-dashed border-orange-300 hover:border-orange-400" : "border-orange-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-orange-800">🔄 Делать каждый день</span>
                    {dailyTasks.length > 0 && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{dailyTasks.length}</span>
                    )}
                  </div>
                  {dailyTasks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {dailyTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 ${
                            t.done ? "bg-orange-100/50 line-through text-muted-foreground" : "bg-background border border-orange-200"
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(t.id);
                            }}
                            className="shrink-0 text-orange-500 hover:scale-110 transition-transform active:scale-95"
                          >
                            {t.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <span className="leading-snug">{t.text}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignDay(t.id);
                            }}
                            className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                            title="Вернуть в нераспределённые"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-orange-400 text-center mt-2">{isDropTarget ? "↓ Перенести сюда" : "Рутинные задачи на каждый день"}</p>
                  )}
                </div>
              );
            })()}

            {!isNextWeek && (() => {
              const habitTasks = actionable.filter((t) => t.day === HABIT);
              const isDropTarget = touchSelected !== null;

              return (
                <div
                  onClick={() => {
                    if (touchSelected) {
                      assignDay(touchSelected, HABIT);
                      setTouchSelected(null);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(HABIT)}
                  className={`rounded-xl border-2 p-4 min-h-[80px] transition-all duration-200 cursor-pointer bg-orange-50/60 ${
                    isDropTarget ? "border-dashed border-orange-300 hover:border-orange-400" : "border-orange-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-orange-800">🌱 Привычка / навык на месяц</span>
                    {habitTasks.length > 0 && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{habitTasks.length}</span>
                    )}
                  </div>
                  {habitTasks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {habitTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150 ${
                            t.done ? "bg-orange-100/50 line-through text-muted-foreground" : "bg-background border border-orange-200"
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(t.id);
                            }}
                            className="shrink-0 text-orange-500 hover:scale-110 transition-transform active:scale-95"
                          >
                            {t.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>
                          <span className="leading-snug">{t.text}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              unassignDay(t.id);
                            }}
                            className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                            title="Вернуть в нераспределённые"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-orange-400 text-center mt-2">{isDropTarget ? "↓ Перенести сюда" : "Навык, который развиваешь весь месяц"}</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {aiComment && (
          <div className="mt-6 bg-card border rounded-2xl p-5 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setAiComment(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Комментарий от Ирины</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{aiComment}</p>
              </div>
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive text-center">
            {aiError}
          </div>
        )}

        {pdfError && !pdfUrl && (
          <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive text-center">
            {pdfError}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 mt-10">
          <button
            onClick={generatePDF}
            disabled={actionable.filter((t) => t.day).length === 0 || pdfLoading}
            className="group inline-flex items-center gap-2.5 bg-foreground text-background px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {pdfLoading ? "Готовлю PDF…" : "Сохранить план в PDF"}
          </button>

          <button
            onClick={fetchAiCoach}
            disabled={aiLoading || actionable.filter((t) => t.day).length === 0}
            className="group inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Анализирую план…
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Получить совет от Ирины
              </>
            )}
          </button>

          <button
            onClick={() => navigate("/report")}
            disabled={actionable.filter((t) => t.day).length === 0}
            className="group inline-flex items-center gap-2.5 bg-foreground text-background px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            <ClipboardList className="w-4 h-4" />
            Отчёт за неделю
          </button>

          <button
            onClick={() => navigate("/mentorship")}
            className="group inline-flex items-center gap-2.5 bg-orange-100 text-orange-700 border border-orange-200 px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide shadow-sm hover:bg-orange-200 hover:shadow-md transition-all duration-200 active:scale-[0.97]"
          >
            <ClipboardList className="w-4 h-4" />
            Анкета предзаписи в менторскую группу
          </button>

          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Начать заново
          </button>
        </div>
      </div>

      {pdfUrl && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-background border shadow-2xl rounded-3xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-5 border-b">
              <div>
                <p className="text-base font-semibold text-foreground">PDF готов</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Теперь можно открыть файл, скачать его на телефон или поделиться им.
                </p>
              </div>
              <button onClick={closePdfPreview} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <button
                onClick={openPdf}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-foreground text-background px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Открыть PDF
              </button>

              <button
                onClick={sharePdf}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-primary text-primary-foreground px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                Поделиться PDF
              </button>

              <a
                href={pdfUrl}
                download="plan-nedeli.pdf"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 border bg-card text-foreground px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
              >
                Скачать PDF
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Consultation button */}
      <div className="flex justify-center mt-8 mb-12">
        <ConsultationButton />
      </div>
    </>
  );
};

export default Dashboard;
