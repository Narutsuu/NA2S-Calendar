import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useReminders } from "../../utils/useReminders";
import { useSettings } from "../../auth/SettingsContext";

export default function AppLayout() {
  const { toasts, dismiss } = useReminders();
  const { settings } = useSettings();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-col">
        <div className="topbar">
          <Link to="/parametres" className="user-pill">
            <span className="avatar">{(settings.username || "?").charAt(0).toUpperCase()}</span>
            <span>{settings.username || "Mon compte"}</span>
          </Link>
        </div>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast" onClick={() => dismiss(t.id)}>🔔 {t.text}</div>
        ))}
      </div>
    </div>
  );
}
