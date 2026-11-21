export type TaskPriority = "low" | "normal" | "high" | "urgent";
export interface CalEvent {
  id: string; user_id: string; title: string; color: string; start_at: string; end_at: string;
  description?: string | null; location?: string | null; category_id?: string | null;
  recurrence: string; remind_min: number | null;
}
export interface Task { id: string; title: string; due_date: string | null; priority: TaskPriority; done: boolean; }
export interface Category { id: string; name: string; color: string; }
export const PRIORITIES: Record<TaskPriority, string> = { low: "Faible", normal: "Normale", high: "Importante", urgent: "Urgente" };
