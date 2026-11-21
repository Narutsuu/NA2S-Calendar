import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../config/navigation";

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => "mobile-link" + (isActive ? " active" : "")}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
