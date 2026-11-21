import type { CalEvent } from "../types";
import { dayKey } from "./tz";

export interface Occ { ev: CalEvent; startKey: string; endKey: string; startIso: string; endIso: string; }

// Développe les événements (dont récurrents) sur la plage de jours [rs, re] (clés AAAA-MM-JJ).
export function expand(events: CalEvent[], rs: string, re: string, tz: string): Occ[] {
  const out: Occ[] = [];
  for (const ev of events) {
    const s = new Date(ev.start_at);
    const dur = new Date(ev.end_at).getTime() - s.getTime();
    for (let i = 0; i < 1000; i++) {
      let st: Date;
      if (ev.recurrence === "daily") st = new Date(s.getTime() + i * 86400000);
      else if (ev.recurrence === "weekly") st = new Date(s.getTime() + i * 7 * 86400000);
      else if (ev.recurrence === "monthly") { st = new Date(s); st.setUTCMonth(st.getUTCMonth() + i); }
      else if (i > 0) break;
      else st = s;
      const sk = dayKey(st, tz);
      if (sk > re) break;
      const en = new Date(st.getTime() + dur);
      const ek = dayKey(en, tz);
      if (ek >= rs) out.push({ ev, startKey: sk, endKey: ek, startIso: st.toISOString(), endIso: en.toISOString() });
    }
  }
  return out.sort((a, b) => a.startIso.localeCompare(b.startIso));
}
