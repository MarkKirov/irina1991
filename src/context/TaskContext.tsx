import React, { createContext, useContext, useState, ReactNode } from "react";

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

interface TaskContextType {
  tasks: Task[];
  goal: string;
  setGoal: (goal: string) => void;
  addTask: (text: string, category: Category) => void;
  setPriority: (id: string, priority: Priority) => void;
  assignDay: (id: string, day: string) => void;
  toggleDone: (id: string) => void;
  unassignDay: (id: string) => void;
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

  // Persist to localStorage on every change
  const setGoal = (g: string) => {
    setGoalState(g);
    localStorage.setItem(STORAGE_KEY_GOAL, JSON.stringify(g));
  };

  const addTask = (text: string, category: Category) => {
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, category, priority: null, day: null, done: false },
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

  return (
    <TaskContext.Provider value={{ tasks, goal, setGoal, addTask, setPriority, assignDay, toggleDone, unassignDay }}>
      {children}
    </TaskContext.Provider>
  );
};
