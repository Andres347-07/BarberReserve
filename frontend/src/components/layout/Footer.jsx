import { Link } from "react-router-dom";

export default function Footer({ variante = "admin" }) {
  return (
    <footer className={`app-footer app-footer-${variante}`}>
      <p>© {new Date().getFullYear()} Barber Reserve · Gestión de barberías y reservas en línea</p>
      <nav aria-label="Enlaces del pie de página" className="footer-enlaces">
        <Link to="/accesibilidad">Declaración de accesibilidad</Link>
        {variante === "admin" && <Link to="/">Portal de clientes</Link>}
      </nav>
    </footer>
  );
}
