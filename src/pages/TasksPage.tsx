import { useCallback, useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { supabase } from "../db/supabase";
import { ymd } from "../utils/date";
import { PRIORITIES, type Task, type TaskPriority } from "../types";

type Filter = "all" | "today" | "late" | "done";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [prio, setPrio] = useState<TaskPriority>("normal");
  const today = ymd(new Date());

  const load = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").order("due_date", { nullsFirst: false });
    setTasks((data as Task[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    await supabase.from("tasks").insert({ title, due_date: due || null, priority: prio });
    setTitle(""); setDue(""); load();
  }
  async function toggle(t: Task) { await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id); load(); }
  async function del(id: string) { await supabase.from("tasks").delete().eq("id", id); load(); }

  const shown = tasks.filter((t) =>
    filter === "done" ? t.done :
    filter === "today" ? !t.done && t.due_date === today :
    filter === "late" ? !t.done && !!t.due_date && t.due_date < today :
    !t.done);

  return (
    <>
      <PageHeader title="Tâches" subtitle="Priorités et dates limites" />
      <form className="card inline" onSubmit={add}>
        <input required placeholder="Nouvelle tâche" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <select value={prio} onChange={(e) => setPrio(e.target.value as TaskPriority)}>
          {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn" type="submit">Ajouter</button>
      </form>
      <div className="toolbar" style={{ marginTop: 14 }}>
        {([["all", "À faire"], ["today", "Aujourd'hui"], ["late", "En retard"], ["done", "Terminées"]] as [Filter, string][]).map(([k, v]) => (
          <button key={k} className={"chip-btn" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>{v}</button>
        ))}
      </div>
      <div className="card">
        {shown.length === 0 && <EmptyState text="Aucune tâche." />}
        {shown.map((t) => (
          <div key={t.id} className="row">
            <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
            <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
            <span className={"prio " + t.priority}>{PRIORITIES[t.priority]}</span>
            <span className="muted">{t.due_date ?? ""}</span>
            <button className="icon-btn" onClick={() => del(t.id)}><X size={16} /></button>
          </div>
        ))}
      </div>
    </>
  );
}
