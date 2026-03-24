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

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

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
    <TaskContext.Provider value={{ tasks, addTask, setPriority, assignDay, toggleDone, unassignDay }}>
      {children}
    </TaskContext.Provider>
  );
};
