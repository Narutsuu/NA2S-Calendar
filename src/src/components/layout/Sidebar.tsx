import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Download } from "lucide-react";
import { NAV_ITEMS } from "../../config/navigation";

export default function Sidebar() {
  const [prompt, setPrompt] = useState<any>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">N</div>
        <div><div className="brand-name">NA2S Calendar</div><div className="brand-sub">NACORP</div></div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {prompt && (
        <button className="btn install" onClick={() => prompt.prompt()}>
          <Download size={16} /> Installer NA2S Calendar
        </button>
      )}
    </aside>
  );
}
