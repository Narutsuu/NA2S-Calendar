import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CalendarRange, ListChecks } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { supabase } from "../db/supabase";
import { formatLongDate, ymd } from "../utils/date";
import type { CalEvent, Task } from "../types";

export default function DashboardPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [week, setWeek] = useState(0);

  useEffect(() => {
    const now = new Date();
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
    supabase.from("events").select("id,title,color,start_at,end_at").gte("start_at", now.toISOString()).order("start_at").limit(50)
      .then(({ data }) => {
        const list = (data as CalEvent[]) ?? [];
        setEvents(list);
        setWeek(list.filter((e) => new Date(e.start_at) < weekEnd).length);
      });
    supabase.from("tasks").select("*").eq("done", false).order("due_date", { nullsFirst: false })
      .then(({ data }) => setTasks((data as Task[]) ?? []));
  }, []);

  const today = ymd(new Date());
  const late = tasks.filter((t) => t.due_date && t.due_date < today).length;
  const stats = [
    { label: "Événements à venir", icon: CalendarClock, v: events.length },
    { label: "Tâches à effectuer", icon: ListChecks, v: tasks.length },
    { label: "Tâches en retard", icon: AlertCircle, v: late },
    { label: "7 prochains jours", icon: CalendarRange, v: week },
  ];

  return (
    <>
      <PageHeader title="Bonjour" subtitle={formatLongDate()} />
      <section className="grid-stats">
        {stats.map(({ label, icon: Icon, v }) => (
          <div className="card stat" key={label}>
            <Icon size={18} className="stat-icon" />
            <div className="stat-value">{v}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </section>
      <section className="grid-two">
        <div className="card">
          <h2>Prochains événements</h2>
          {events.length === 0 && <EmptyState text="Aucun événement à venir." />}
          {events.slice(0, 5).map((e) => (
            <div key={e.id} className="row"><span className="dot" style={{ background: e.color }} />
              <span>{e.title}</span><span className="muted">{new Date(e.start_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span></div>
          ))}
        </div>
        <div className="card">
          <h2>Tâches à effectuer</h2>
          {tasks.length === 0 && <EmptyState text="Aucune tâche en cours." />}
          {tasks.slice(0, 5).map((t) => (
            <div key={t.id} className="row"><span>{t.title}</span><span className="muted">{t.due_date ?? ""}</span></div>
          ))}
        </div>
      </section>
    </>
  );
}
