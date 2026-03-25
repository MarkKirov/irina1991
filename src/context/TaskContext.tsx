import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Category = "home" | "work" | "me";
export type Priority = "urgent" | "important" | "routine" | "drop" | null;

export interface Task {
  id: string;
  text: string;
  category: Category;
  priority: Priority;
  day: string | null;
  done: boolean;
}

export interface ArchivedWeek {
  weekNumber: number;
  tasks: Task[];
  goal: string;
  completedAt: string; // ISO date
}

interface TaskContextType {
  tasks: Task[];
  goal: string;
  weekNumber: number;
  archivedWeeks: ArchivedWeek[];
  setGoal: (goal: string) => void;
  addTask: (text: string, category: Category, priority?: Priority) => void;
  setPriority: (id: string, priority: Priority) => void;
  assignDay: (id: string, day: string) => void;
  toggleDone: (id: string) => void;
  unassignDay: (id: string) => void;
  startNextWeek: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
};

const STORAGE_KEY_TASKS = "irina_tasks";
const STORAGE_KEY_GOAL = "irina_goal";
const STORAGE_KEY_STEP = "irina_step";
const STORAGE_KEY_WEEK = "irina_week";
const STORAGE_KEY_ARCHIVE = "irina_archive";

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const useCurrentStep = () => {
  const getStep = () => loadFromStorage<string>(STORAGE_KEY_STEP, "/");
  const saveStep = (step: string) => {
    localStorage.setItem(STORAGE_KEY_STEP, JSON.stringify(step));
  };
  return { getStep, saveStep };
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEY_TASKS, []));
  const [goal, setGoalState] = useState<string>(() => loadFromStorage(STORAGE_KEY_GOAL, ""));
  const [weekNumber, setWeekNumber] = useState<number>(() => loadFromStorage(STORAGE_KEY_WEEK, 1));
  const [archivedWeeks, setArchivedWeeks] = useState<ArchivedWeek[]>(() => loadFromStorage(STORAGE_KEY_ARCHIVE, []));

  const setGoal = (g: string) => {
    setGoalState(g);
    localStorage.setItem(STORAGE_KEY_GOAL, JSON.stringify(g));
  };

  const addTask = (text: string, category: Category, priority: Priority = null) => {
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, category, priority, day: null, done: false },
    ]);
  };

  const setPriority = (id: string, priority: Priority) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
  };

  const assignDay = (id: string, day: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, day } : t)));
  };

  const unassignDay = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, day: null } : t)));
  };

  const toggleDone = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const startNextWeek = () => {
    // Archive current week
    const currentWeekData: ArchivedWeek = {
      weekNumber,
      tasks: tasks.filter((t) => t.priority && t.priority !== "drop" && t.day && t.day !== "Месяц"),
      goal,
      completedAt: new Date().toISOString(),
    };

    const newArchive = [...archivedWeeks, currentWeekData];
    setArchivedWeeks(newArchive);
    localStorage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify(newArchive));

    // Reset: undone weekly tasks go back to unassigned, done weekly tasks removed, month tasks stay
    setTasks((prev) =>
      prev
        .filter((t) => {
          // Keep tasks without priority/day (not yet processed)
          if (!t.priority || t.priority === "drop") return false;
          // Keep month tasks
          if (t.day === "Месяц") return true;
          // Keep undone weekly tasks (reset their day)
          if (t.day && !t.done) return true;
          // Remove done weekly tasks
          if (t.day && t.done) return false;
          // Keep unassigned tasks
          if (!t.day) return true;
          return true;
        })
        .map((t) => {
          // Reset day for undone weekly tasks
          if (t.day && t.day !== "Месяц" && !t.done) {
            return { ...t, day: null };
          }
          return t;
        })
    );

    const newWeek = weekNumber + 1;
    setWeekNumber(newWeek);
    localStorage.setItem(STORAGE_KEY_WEEK, JSON.stringify(newWeek));
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  return (
    <TaskContext.Provider value={{ tasks, goal, weekNumber, archivedWeeks, setGoal, addTask, setPriority, assignDay, toggleDone, unassignDay, startNextWeek }}>
      {children}
    </TaskContext.Provider>
  );
};
