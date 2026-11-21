import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../db/supabase";
import { useAuth } from "./AuthContext";

export interface Settings { theme: string; week_start: number; timezone: string; notify: boolean; username: string; }
const DEFAULTS: Settings = { theme: "dark", week_start: 1, timezone: "Europe/Paris", notify: true, username: "" };

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => Promise<void> }>({ settings: DEFAULTS, update: async () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const uid = session?.user.id;

  useEffect(() => {
    if (!uid) return;
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle().then(({ data }) => {
      if (data) setSettings({ ...DEFAULTS, ...data, username: data.username ?? "" });
    });
  }, [uid]);

  useEffect(() => { document.documentElement.dataset.theme = settings.theme; }, [settings.theme]);

  async function update(p: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...p }));
    if (uid) await supabase.from("profiles").upsert({ id: uid, ...p });
  }
  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}
