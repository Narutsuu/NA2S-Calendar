import { useEffect, useRef, type CSSProperties } from "react";
import type { Occ } from "../utils/occurrences";
import { fmtTime, label } from "../utils/tz";

const H = 48;
const mins = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

interface Props {
  cells: string[]; occs: Occ[]; tz: string; today: string;
  onNew: (day: string, time: string) => void; onEdit: (o: Occ) => void;
}

export default function TimeGrid({ cells, occs, tz, today, onNew, onEdit }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (box.current) box.current.scrollTop = 7 * H; }, []);
  const cols = `48px repeat(${cells.length}, 1fr)`;
  return (
    <div className="tg">
      <div className="tg-head" style={{ gridTemplateColumns: cols }}>
        <div />
        {cells.map((k) => <div key={k} className={"tg-day" + (k === today ? " today" : "")}>{label(k, { weekday: "short", day: "numeric" })}</div>)}
      </div>
      <div className="tg-body" ref={box}>
        <div className="tg-grid" style={{ gridTemplateColumns: cols, height: 24 * H }}>
          <div className="tg-hours">{Array.from({ length: 24 }, (_, h) => <div key={h} style={{ height: H }}>{String(h).padStart(2, "0")}:00</div>)}</div>
          {cells.map((k) => (
            <div key={k} className="tg-col" onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const m = Math.floor((e.clientY - r.top) / H * 2) * 30;
              onNew(k, `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`);
            }}>
              {occs.filter((o) => o.startKey <= k && k <= o.endKey).map((o, i) => {
                const s = o.startKey === k ? mins(fmtTime(o.startIso, tz)) : 0;
                const e = o.endKey === k ? mins(fmtTime(o.endIso, tz)) : 1440;
                if (e === 0) return null;
                return (
                  <div key={o.ev.id + i} className="tg-ev" style={{ "--c": o.ev.color, top: (s / 60) * H, height: Math.max(((e - s) / 60) * H, 22) } as CSSProperties}
                    onClick={(ev) => { ev.stopPropagation(); onEdit(o); }}>
                    <b>{o.ev.title}</b><span>{fmtTime(o.startIso, tz)} – {fmtTime(o.endIso, tz)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
