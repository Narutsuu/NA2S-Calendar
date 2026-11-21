import { useCallback, useEffect, useState } from "react";
import { supabase } from "../db/supabase";
import { useSettings } from "../auth/SettingsContext";
import { expand } from "./occurrences";
import { addDays, dayKey, fmtTime } from "./tz";
import type { CalEvent } from "../types";

export interface Toast { id: string; text: string; }
const KEY = "na2s_notified";

// Les rappels ne fonctionnent que lorsque l'application est ouverte (onglet ou app installée).
export function useReminders() {
  const { settings } = useSettings();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    if (!settings.notify) return;
    const tz = settings.timezone;

    function fire(id: string, text: string, done: Set<string>) {
      done.add(id);
      localStorage.setItem(KEY, JSON.stringify([...done].slice(-300)));
      setToasts((t) => [...t, { id, text }]);
      if ("Notification" in window && Notification.permission === "granted") new Notification("NA2S Calendar", { body: text });
    }

    async function check() {
      let done: Set<string>;
      try { done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { done = new Set(); }
      const now = Date.now();
      const today = dayKey(new Date(), tz);
      const { data: evs } = await supabase.from("events").select("*").not("remind_min", "is", null).limit(300);
      for (const o of expand((evs as CalEvent[]) ?? [], today, addDays(today, 2), tz)) {
        const t = new Date(o.startIso).getTime();
        const id = `${o.ev.id}|${o.startIso}`;
        if (!done.has(id) && now >= t - (o.ev.remind_min ?? 0) * 60000 && now < t)
          fire(id, `${o.ev.title} à ${fmtTime(o.startIso, tz)}`, done);
      }
      const { data: tasks } = await supabase.from("tasks").select("id,title").eq("done", false).eq("due_date", today);
      for (const t of tasks ?? []) {
        const id = `task|${t.id}|${today}`;
        if (!done.has(id)) fire(id, `Tâche à terminer aujourd'hui : ${t.title}`, done);
      }
    }
    check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, [settings.notify, settings.timezone]);

  return { toasts, dismiss };
}
