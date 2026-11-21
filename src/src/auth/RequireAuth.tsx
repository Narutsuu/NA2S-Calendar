import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <div className="empty" style={{ margin: 40 }}>Chargement…</div>;
  return session ? <Outlet /> : <Navigate to="/connexion" replace />;
}
