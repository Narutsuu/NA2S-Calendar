import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../db/supabase";
import { useAuth } from "../auth/AuthContext";

type Mode = "login" | "register" | "reset";

export default function LoginPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  if (session) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Identifiants incorrects.");
    } else if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Compte créé. Vérifiez vos e-mails pour confirmer, puis connectez-vous.");
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setMsg(error ? error.message : "E-mail envoyé. Cliquez sur le lien, puis changez le mot de passe dans Paramètres.");
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand"><div className="brand-logo">N</div><div><div className="brand-name">NA2S Calendar</div><div className="brand-sub">NACORP</div></div></div>
        <h2>{mode === "login" ? "Connexion" : mode === "register" ? "Inscription" : "Mot de passe oublié"}</h2>
        {mode === "register" && <input required placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} />}
        <input required type="email" placeholder="Adresse e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== "reset" && <input required type="password" minLength={8} placeholder="Mot de passe (8 caractères min.)" value={password} onChange={(e) => setPassword(e.target.value)} />}
        <button className="btn" type="submit">{mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}</button>
        {msg && <p className="muted">{msg}</p>}
        <div className="auth-links">
          {mode !== "login" && <a onClick={() => setMode("login")}>Connexion</a>}
          {mode !== "register" && <a onClick={() => setMode("register")}>Créer un compte</a>}
          {mode === "login" && <a onClick={() => setMode("reset")}>Mot de passe oublié</a>}
        </div>
      </form>
    </div>
  );
}
