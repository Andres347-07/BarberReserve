import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaCalendarCheck, FaClock, FaCut, FaSearch, FaUserTie, FaArrowRight, FaShieldAlt } from "react-icons/fa";

import publicoService, { mensajeDeError } from "../../services/publicoService";
import { moneda, duracionTexto } from "../../utils/fechas";
import heroImagen from "../../assets/images/barber-hero.jpg";
import VideoTutorial from "../../components/portal/VideoTutorial";

export default function Inicio() {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const { hash } = useLocation();
  const refServicios = useRef(null);

  useEffect(() => {
    Promise.all([publicoService.obtenerServicios(), publicoService.obtenerBarberos()])
      .then(([s, b]) => { setServicios(s); setBarberos(b); })
      .catch((e) => setError(mensajeDeError(e, "No fue posible cargar los servicios.")))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (hash === "#servicios" && !cargando) {
      refServicios.current?.scrollIntoView({ behavior: "smooth" });
      refServicios.current?.focus({ preventScroll: true });
    }
  }, [hash, cargando]);

  return (
    <>
      <section className="hero" aria-labelledby="hero-titulo" style={{ "--hero-img": `url(${heroImagen})` }}>
        <div className="portal-contenedor hero-contenido">
          <p className="hero-eyebrow">Reservas en línea · sin crear cuenta</p>
          <h1 id="hero-titulo">
            Tu próximo corte, <span>reservado en un minuto</span>
          </h1>
          <p className="hero-texto">
            Elige el servicio, tu barbero de confianza y la hora que más te convenga.
            Te mostramos solo los horarios realmente disponibles.
          </p>
          <div className="hero-acciones">
            <Link to="/reservar" className="btn-primary btn-grande">
              <FaCalendarCheck aria-hidden="true" /> Reservar ahora
            </Link>
            <Link to="/mi-reserva" className="btn-hero-secundario btn-grande">
              <FaSearch aria-hidden="true" /> Consultar mi reserva
            </Link>
          </div>

          <ul className="hero-indicadores" aria-label="Datos de la barbería">
            <li><strong>{cargando ? "—" : servicios.length}</strong> <span>servicios</span></li>
            <li><strong>{cargando ? "—" : barberos.length}</strong> <span>barberos</span></li>
            <li><strong>24/7</strong> <span>reservas en línea</span></li>
          </ul>
        </div>
      </section>

      <section className="portal-seccion" aria-labelledby="como-funciona">
        <div className="portal-contenedor">
          <h2 id="como-funciona" className="seccion-titulo">¿Cómo funciona?</h2>
          <ol className="pasos-lista">
            <li className="paso-card">
              <span className="paso-numero" aria-hidden="true">1</span>
              <FaCut aria-hidden="true" className="paso-icono" />
              <h3>Elige el servicio</h3>
              <p>Consulta precios y duración antes de reservar.</p>
            </li>
            <li className="paso-card">
              <span className="paso-numero" aria-hidden="true">2</span>
              <FaUserTie aria-hidden="true" className="paso-icono" />
              <h3>Escoge tu barbero</h3>
              <p>Cada barbero tiene su propia agenda y especialidad.</p>
            </li>
            <li className="paso-card">
              <span className="paso-numero" aria-hidden="true">3</span>
              <FaClock aria-hidden="true" className="paso-icono" />
              <h3>Selecciona día y hora</h3>
              <p>El calendario solo muestra los horarios libres.</p>
            </li>
            <li className="paso-card">
              <span className="paso-numero" aria-hidden="true">4</span>
              <FaShieldAlt aria-hidden="true" className="paso-icono" />
              <h3>Confirma y listo</h3>
              <p>Recibes un código para consultar o cancelar tu cita.</p>
            </li>
          </ol>
        </div>
      </section>

      <VideoTutorial />

      <section
        id="servicios"
        ref={refServicios}
        tabIndex={-1}
        className="portal-seccion"
        aria-labelledby="titulo-servicios"
      >
        <div className="portal-contenedor">
          <div className="seccion-encabezado">
            <h2 id="titulo-servicios" className="seccion-titulo">Servicios y precios</h2>
            <p>Precios en pesos colombianos. La duración es aproximada.</p>
          </div>

          {error && <p className="aviso aviso-error" role="alert">{error}</p>}
          {cargando && <p className="aviso" role="status">Cargando servicios…</p>}

          {!cargando && !error && servicios.length === 0 && (
            <p className="aviso">Por ahora no hay servicios disponibles para reservar en línea.</p>
          )}

          <ul className="servicios-grid">
            {servicios.map((s) => (
              <li key={s.id} className="servicio-card">
                <div className="servicio-card-cabecera">
                  <span className="servicio-icono" aria-hidden="true"><FaCut /></span>
                  <h3>{s.nombre}</h3>
                </div>
                <p className="servicio-descripcion">{s.descripcion}</p>
                <dl className="servicio-datos">
                  <div>
                    <dt>Precio</dt>
                    <dd className="servicio-precio">{moneda(s.precio)}</dd>
                  </div>
                  <div>
                    <dt>Duración</dt>
                    <dd><FaClock aria-hidden="true" /> {duracionTexto(s.duracion)}</dd>
                  </div>
                </dl>
                <Link to={`/reservar?servicio=${s.id}`} className="btn-outline servicio-cta">
                  Reservar<span className="sr-only"> {s.nombre}</span> <FaArrowRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {barberos.length > 0 && (
        <section className="portal-seccion" aria-labelledby="titulo-equipo">
          <div className="portal-contenedor">
            <h2 id="titulo-equipo" className="seccion-titulo">Nuestro equipo</h2>
            <ul className="equipo-grid">
              {barberos.map((b) => (
                <li key={b.id} className="equipo-card">
                  <span className="equipo-avatar" aria-hidden="true">
                    {b.nombre.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                  </span>
                  <div>
                    <h3>{b.nombre}</h3>
                    <p>{b.especialidad}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="portal-seccion" aria-labelledby="titulo-cta">
        <div className="portal-contenedor">
          <div className="cta-banda">
            <div>
              <h2 id="titulo-cta">¿Ya tienes una reserva?</h2>
              <p>Consulta su estado o cancélala con tu código y tu correo.</p>
            </div>
            <Link to="/mi-reserva" className="btn-primary btn-grande">
              Consultar mi reserva
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
