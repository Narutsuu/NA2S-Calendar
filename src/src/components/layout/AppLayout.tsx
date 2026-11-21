import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useReminders } from "../../utils/useReminders";

export default function AppLayout() {
  const { toasts, dismiss } = useReminders();
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <MobileNav />
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast" onClick={() => dismiss(t.id)}>🔔 {t.text}</div>
        ))}
      </div>
    </div>
  );
}
