import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { supabase } from "../db/supabase";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../auth/SettingsContext";
import type { Category } from "../types";

const ZONES: string[] = (Intl as any).supportedValuesOf?.("timeZone") ?? ["Europe/Paris", "UTC", "America/New_York", "Asia/Tokyo"];

export default function SettingsPage() {
  const { session } = useAuth();
  const { settings, update } = useSettings();
  const [username, setUsername] = useState(settings.username);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [cname, setCname] = useState("");
  const [ccolor, setCcolor] = useState("#7c3aed");

  useEffect(() => setUsername(settings.username), [settings.username]);
  const loadCats = () => supabase.from("categories").select("id,name,color").order("name").then(({ data }) => setCats((data as Category[]) ?? []));
  useEffect(() => { loadCats(); }, []);

  async function toggleNotify(on: boolean) {
    if (on && "Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    await update({ notify: on });
    if (on) setMsg(!("Notification" in window) ? "Ce navigateur ne gère pas les notifications : seuls les rappels dans l'application seront affichés."
      : Notification.permission === "granted" ? "Notifications navigateur activées (l'application doit rester ouverte)."
      : "Notifications navigateur non autorisées : seuls les rappels dans l'application seront affichés.");
  }
  async function savePassword() {
    const { error } = await supabase.auth.updateUser({ password });
    setMsg(error ? error.message : "Mot de passe modifié."); setPassword("");
  }
  async function addCat() {
    if (!cname.trim()) return;
    await supabase.from("categories").insert({ name: cname.trim(), color: ccolor });
    setCname(""); loadCats();
  }
  async function delCat(id: string) { await supabase.from("categories").delete().eq("id", id); loadCats(); }
  async function recolor(id: string, color: string) { await supabase.from("categories").update({ color }).eq("id", id); loadCats(); }
  async function deleteAccount() {
    if (!confirm("Supprimer définitivement votre compte et toutes vos données ?")) return;
    const { error } = await supabase.rpc("delete_my_account");
    if (error) setMsg(error.message); else await supabase.auth.signOut();
  }

  return (
    <>
      <PageHeader title="Paramètres" subtitle={session!.user.email} />
      <div className="grid-two">
        <div className="card form">
          <h2>Profil</h2>
          <input placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button className="btn" onClick={() => update({ username }).then(() => setMsg("Profil enregistré."))}>Enregistrer</button>
        </div>
        <div className="card form">
          <h2>Mot de passe</h2>
          <input type="password" placeholder="Nouveau mot de passe (8 min.)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn" disabled={password.length < 8} onClick={savePassword}>Modifier</button>
        </div>
        <div className="card form">
          <h2>Affichage</h2>
          <label className="muted">Thème</label>
          <select value={settings.theme} onChange={(e) => update({ theme: e.target.value })}><option value="dark">Sombre</option><option value="light">Clair</option></select>
          <label className="muted">Premier jour de la semaine</label>
          <select value={settings.week_start} onChange={(e) => update({ week_start: Number(e.target.value) })}><option value={1}>Lundi</option><option value={0}>Dimanche</option><option value={6}>Samedi</option></select>
          <label className="muted">Fuseau horaire</label>
          <select value={settings.timezone} onChange={(e) => update({ timezone: e.target.value })}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
        </div>
        <div className="card form">
          <h2>Notifications</h2>
          <label className="row"><input type="checkbox" checked={settings.notify} onChange={(e) => toggleNotify(e.target.checked)} /> Activer les rappels</label>
          <p className="muted">Les rappels s'affichent tant que NA2S Calendar est ouvert (site ou application installée).</p>
        </div>
        <div className="card form">
          <h2>Catégories</h2>
          {cats.map((c) => (
            <div key={c.id} className="row">
              <input type="color" value={c.color} onChange={(e) => recolor(c.id, e.target.value)} />
              <span>{c.name}</span>
              <button className="chip-btn" onClick={() => delCat(c.id)}>Supprimer</button>
            </div>
          ))}
          <div className="inline">
            <input placeholder="Nouvelle catégorie" value={cname} onChange={(e) => setCname(e.target.value)} />
            <input type="color" value={ccolor} onChange={(e) => setCcolor(e.target.value)} />
            <button className="btn" onClick={addCat}>Ajouter</button>
          </div>
        </div>
        <div className="card form">
          <h2>Compte</h2>
          <p className="muted">Installation : Chrome/Edge, bouton « Installer ». iPhone (Safari) : Partager › Sur l'écran d'accueil.</p>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
          <button className="chip-btn" onClick={deleteAccount}>Supprimer mon compte</button>
        </div>
      </div>
      {msg && <p className="muted" style={{ marginTop: 14 }}>{msg}</p>}
    </>
  );
}
