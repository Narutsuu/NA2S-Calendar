import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <Link className="btn" to="/">Retour à l'accueil</Link>
    </>
  );
}
