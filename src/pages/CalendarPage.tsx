import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { supabase } from "../db/supabase";
import { useSettings } from "../auth/SettingsContext";
import { expand, type Occ } from "../utils/occurrences";
import { addDays, addMonths, dayKey, fmtTime, label, weekday, zonedToUtc } from "../utils/tz";
import type { CalEvent, Category } from "../types";

type View = "month" | "week" | "day";
interface Form {
  id?: string; title: string; startDay: string; endDay: string; st: string; en: string; color: string;
  category_id: string; location: string; description: string; recurrence: string; remind_min: string;
}
const blank = (day: string): Form => ({ title: "", startDay: day, endDay: day, st: "09:00", en: "10:00", color: "#7c3aed", category_id: "", location: "", description: "", recurrence: "none", remind_min: "" });

export default function CalendarPage() {
  const { settings } = useSettings();
  const tz = settings.timezone, ws = settings.week_start;
  const today = dayKey(new Date(), tz);
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(today);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState("");
  const drag = useRef<Occ | null>(null);

  let first: string, count: number;
  if (view === "month") { const m1 = anchor.slice(0, 8) + "01"; first = addDays(m1, -((weekday(m1) - ws + 7) % 7)); count = 42; }
  else if (view === "week") { first = addDays(anchor, -((weekday(anchor) - ws + 7) % 7)); count = 7; }
  else { first = anchor; count = 1; }
  const cells = Array.from({ length: count }, (_, i) => addDays(first, i));
  const last = cells[count - 1];

  const load = useCallback(async () => {
    const rs = zonedToUtc(first, "00:00", tz).toISOString();
    const re = zonedToUtc(addDays(last, 1), "00:00", tz).toISOString();
    const { data } = await supabase.from("events").select("*").lt("start_at", re).or(`recurrence.neq.none,end_at.gte.${rs}`);
    setEvents((data as CalEvent[]) ?? []);
  }, [first, last, tz]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { supabase.from("categories").select("id,name,color").then(({ data }) => setCats((data as Category[]) ?? [])); }, []);

  const occs = expand(events, first, last, tz);
  const nav = (n: number) => setAnchor(view === "month" ? addMonths(anchor, n) : addDays(anchor, view === "week" ? 7 * n : n));
  const title = view === "month" ? label(anchor, { month: "long", year: "numeric" })
    : view === "week" ? `${label(first, { day: "numeric", month: "short" })} – ${label(last, { day: "numeric", month: "short", year: "numeric" })}`
    : label(anchor, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function edit(ev: CalEvent) {
    setForm({
      id: ev.id, title: ev.title, startDay: dayKey(ev.start_at, tz), endDay: dayKey(ev.end_at, tz),
      st: fmtTime(ev.start_at, tz), en: fmtTime(ev.end_at, tz), color: ev.color, category_id: ev.category_id ?? "",
      location: ev.location ?? "", description: ev.description ?? "", recurrence: ev.recurrence,
      remind_min: ev.remind_min == null ? "" : String(ev.remind_min),
    });
    setErr("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const start = zonedToUtc(form.startDay, form.st, tz), end = zonedToUtc(form.endDay, form.en, tz);
    if (end <= start) { setErr("La fin doit être après le début."); return; }
    const payload = {
      title: form.title, color: form.color, start_at: start.toISOString(), end_at: end.toISOString(),
      category_id: form.category_id || null, location: form.location || null, description: form.description || null,
      recurrence: form.recurrence, remind_min: form.remind_min === "" ? null : Number(form.remind_min),
    };
    const { error } = form.id ? await supabase.from("events").update(payload).eq("id", form.id) : await supabase.from("events").insert(payload);
    if (error) { setErr(error.message); return; }
    setForm(null); load();
  }
  async function del() {
    if (!form?.id || !confirm("Supprimer cet événement (et toute sa série) ?")) return;
    await supabase.from("events").delete().eq("id", form.id);
    setForm(null); load();
  }
  async function drop(k: string) {
    const o = drag.current; drag.current = null;
    if (!o) return;
    const delta = Math.round((new Date(k + "T00:00:00Z").getTime() - new Date(o.startKey + "T00:00:00Z").getTime()) / 86400000);
    if (!delta) return;
    const mv = (iso: string) => zonedToUtc(addDays(dayKey(iso, tz), delta), fmtTime(iso, tz), tz).toISOString();
    await supabase.from("events").update({ start_at: mv(o.ev.start_at), end_at: mv(o.ev.end_at) }).eq("id", o.ev.id);
    load();
  }
  const set = (p: Partial<Form>) => setForm((f) => (f ? { ...f, ...p } : f));

  return (
    <>
      <PageHeader title="Calendrier" subtitle={title} />
      <div className="toolbar">
        <button className="icon-btn" onClick={() => nav(-1)}><ChevronLeft size={18} /></button>
        <button className="btn" onClick={() => setAnchor(today)}>Aujourd'hui</button>
        <button className="icon-btn" onClick={() => nav(1)}><ChevronRight size={18} /></button>
        {(["month", "week", "day"] as View[]).map((v) => (
          <button key={v} className={"chip-btn" + (view === v ? " on" : "")} onClick={() => setView(v)}>{v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}</button>
        ))}
      </div>
      <div className={"cal" + (view === "day" ? " one" : "")}>
        {view === "month" && cells.slice(0, 7).map((k) => <div key={k} className="cal-head">{label(k, { weekday: "short" })}</div>)}
        {cells.map((k) => (
          <div key={k} className={"cal-cell" + (view === "month" && k.slice(0, 7) !== anchor.slice(0, 7) ? " other" : "") + (k === today ? " today" : "")}
            onClick={() => { setForm(blank(k)); setErr(""); }} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(k)}>
            <span>{view === "month" ? Number(k.slice(8)) : label(k, { weekday: "short", day: "numeric" })}</span>
            {occs.filter((o) => o.startKey <= k && k <= o.endKey).slice(0, view === "month" ? 3 : 99).map((o, i) => (
              <div key={o.ev.id + i} className="chip" draggable style={{ background: o.ev.color }}
                onDragStart={() => (drag.current = o)} onClick={(e) => { e.stopPropagation(); edit(o.ev); }}>
                {o.startKey === k ? fmtTime(o.startIso, tz) + " " : "↔ "}{o.ev.title}
              </div>
            ))}
          </div>
        ))}
      </div>
      {form && (
        <form className="card form" style={{ marginTop: 14 }} onSubmit={save}>
          <h2>{form.id ? "Modifier l'événement" : "Nouvel événement"}</h2>
          <input required placeholder="Titre" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <div className="inline">
            <input type="date" value={form.startDay} onChange={(e) => set({ startDay: e.target.value, endDay: e.target.value > form.endDay ? e.target.value : form.endDay })} />
            <input type="time" value={form.st} onChange={(e) => set({ st: e.target.value })} />
            <span className="muted">→</span>
            <input type="date" value={form.endDay} onChange={(e) => set({ endDay: e.target.value })} />
            <input type="time" value={form.en} onChange={(e) => set({ en: e.target.value })} />
          </div>
          <div className="inline">
            <select value={form.category_id} onChange={(e) => { const c = cats.find((x) => x.id === e.target.value); set({ category_id: e.target.value, color: c ? c.color : form.color }); }}>
              <option value="">Sans catégorie</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="color" value={form.color} onChange={(e) => set({ color: e.target.value })} />
            <select value={form.recurrence} onChange={(e) => set({ recurrence: e.target.value })}>
              <option value="none">Pas de répétition</option><option value="daily">Chaque jour</option>
              <option value="weekly">Chaque semaine</option><option value="monthly">Chaque mois</option>
            </select>
            <select value={form.remind_min} onChange={(e) => set({ remind_min: e.target.value })}>
              <option value="">Sans rappel</option><option value="0">À l'heure</option><option value="10">10 min avant</option>
              <option value="60">1 h avant</option><option value="1440">1 jour avant</option>
            </select>
          </div>
          <input placeholder="Lieu (facultatif)" value={form.location} onChange={(e) => set({ location: e.target.value })} />
          <input placeholder="Description (facultatif)" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          {err && <p className="muted">{err}</p>}
          <div className="inline">
            <button className="btn" type="submit">Enregistrer</button>
            <button className="chip-btn" type="button" onClick={() => setForm(null)}>Annuler</button>
            {form.id && <button className="chip-btn" type="button" onClick={del}>Supprimer</button>}
          </div>
          <p className="muted">Heures affichées dans le fuseau : {tz}. Glissez un événement sur un autre jour pour le déplacer.</p>
        </form>
      )}
    </>
  );
}
