import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaCut, FaUserTie, FaCalendarAlt, FaIdCard, FaCheckCircle, FaArrowLeft, FaArrowRight,
  FaClock, FaExclamationCircle, FaCopy,
} from "react-icons/fa";

import publicoService, { mensajeDeError } from "../../services/publicoService";
import Calendario from "../../components/portal/Calendario";
import { claseEstado, etiquetaEstado } from "../../utils/estados";
import { hoyISO, sumarDias, fechaLarga, hora12, moneda, duracionTexto } from "../../utils/fechas";

const PASOS = [
  { id: 1, titulo: "Servicio", icono: <FaCut aria-hidden="true" /> },
  { id: 2, titulo: "Barbero", icono: <FaUserTie aria-hidden="true" /> },
  { id: 3, titulo: "Fecha y hora", icono: <FaCalendarAlt aria-hidden="true" /> },
  { id: 4, titulo: "Tus datos", icono: <FaIdCard aria-hidden="true" /> },
];

// Mismo horizonte y mismas reglas de validación que el servidor.
// Días hacia adelante por defecto; el valor real llega de la configuración del negocio.
const DIAS_HORIZONTE = 30;
const CUALQUIERA = { id: "cualquiera", nombre: "Cualquier barbero disponible", especialidad: "Te asignamos el primer barbero libre a la hora que elijas." };
const REGEX_TELEFONO = /^[0-9]{10}$/;
const REGEX_CORREO = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validarDatos(datos) {
  const errores = {};
  const nombre = datos.nombre.trim();
  if (!nombre) errores.nombre = "Escriba su nombre completo.";
  else if (nombre.length < 3) errores.nombre = "El nombre debe tener al menos 3 caracteres.";
  else if (nombre.length > 80) errores.nombre = "El nombre no puede superar 80 caracteres.";

  if (!datos.telefono.trim()) errores.telefono = "Escriba su número de celular.";
  else if (!REGEX_TELEFONO.test(datos.telefono.trim())) errores.telefono = "El teléfono debe tener exactamente 10 dígitos, sin espacios. Ejemplo: 3001234567.";

  if (!datos.correo.trim()) errores.correo = "Escriba su correo electrónico.";
  else if (!REGEX_CORREO.test(datos.correo.trim())) errores.correo = "Escriba un correo válido. Ejemplo: nombre@correo.com.";

  if (datos.observaciones.length > 500) errores.observaciones = "Las observaciones no pueden superar 500 caracteres.";
  return errores;
}

const ETIQUETAS_CAMPOS = { nombre: "Nombre completo", telefono: "Celular", correo: "Correo electrónico", observaciones: "Observaciones" };

function agruparHoras(horas) {
  const grupos = [
    { titulo: "Mañana", horas: horas.filter((h) => h < "12:00") },
    { titulo: "Tarde", horas: horas.filter((h) => h >= "12:00" && h < "18:00") },
    { titulo: "Noche", horas: horas.filter((h) => h >= "18:00") },
  ];
  return grupos.filter((g) => g.horas.length > 0);
}

export default function Reservar() {
  const [params] = useSearchParams();
  const hoy = hoyISO();
  const [reglas, setReglas] = useState({ diasMaximos: DIAS_HORIZONTE, horasLimiteCancelacion: 2, anticipacionMinutos: 60 });
  const maxFecha = sumarDias(hoy, reglas.diasMaximos);

  const [paso, setPaso] = useState(1);
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState("");

  const [servicioId, setServicioId] = useState(params.get("servicio") || "");
  const [barberoId, setBarberoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const [mes, setMes] = useState(`${hoy.slice(0, 7)}-01`);
  const [disponibilidad, setDisponibilidad] = useState({});
  const [cargandoDias, setCargandoDias] = useState(false);
  const [horas, setHoras] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  const [datos, setDatos] = useState({ nombre: "", telefono: "", correo: "", observaciones: "" });
  const [errores, setErrores] = useState({});
  const [errorPaso, setErrorPaso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmada, setConfirmada] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const refTitulo = useRef(null);
  const refResumenErrores = useRef(null);
  const primerRender = useRef(true);

  const servicio = useMemo(() => servicios.find((s) => String(s.id) === String(servicioId)), [servicios, servicioId]);
  // Solo se muestran los barberos que realizan el servicio elegido
  // (lista de servicios vacía = el barbero hace todos).
  const barberosDelServicio = useMemo(
    () => barberos.filter((b) => !b.servicios || b.servicios.length === 0 || b.servicios.includes(Number(servicioId))),
    [barberos, servicioId]
  );
  const barbero = useMemo(
    () => (barberoId === "cualquiera" ? CUALQUIERA : barberos.find((b) => String(b.id) === String(barberoId))),
    [barberos, barberoId]
  );

  useEffect(() => {
    publicoService.obtenerConfiguracion().then(setReglas).catch(() => {});
    Promise.all([publicoService.obtenerServicios(), publicoService.obtenerBarberos()])
      .then(([s, b]) => {
        setServicios(s);
        setBarberos(b);
        if (servicioId && !s.some((x) => String(x.id) === String(servicioId))) setServicioId("");
      })
      .catch((e) => setErrorGeneral(mensajeDeError(e, "No fue posible cargar los servicios.")))
      .finally(() => setCargandoCatalogo(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de paso, el foco va al título del paso (WCAG 2.4.3).
  useEffect(() => {
    if (primerRender.current) { primerRender.current = false; return; }
    refTitulo.current?.focus();
    setErrorPaso("");
  }, [paso, confirmada]);

  // Disponibilidad por día del mes visible.
  useEffect(() => {
    if (paso !== 3 || !servicioId || !barberoId) return;
    const finMes = sumarDias(sumarDias(mes, 31).slice(0, 7) + "-01", -1);
    const desde = mes < hoy ? hoy : mes;
    const hasta = finMes > maxFecha ? maxFecha : finMes;
    if (desde > hasta) return;

    let vigente = true;
    setCargandoDias(true);
    publicoService.obtenerDiasDisponibles({ barberoId, servicioId, desde, hasta })
      .then((dias) => {
        if (!vigente) return;
        setDisponibilidad((prev) => {
          const nuevo = { ...prev };
          dias.forEach((d) => { nuevo[d.fecha] = d; });
          return nuevo;
        });
      })
      .catch((e) => vigente && setErrorPaso(mensajeDeError(e, "No fue posible consultar la disponibilidad.")))
      .finally(() => vigente && setCargandoDias(false));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, mes, servicioId, barberoId]);

  // Si el barbero elegido no hace el nuevo servicio, se deselecciona.
  useEffect(() => {
    if (barberoId && barberoId !== "cualquiera" && !barberosDelServicio.some((b) => String(b.id) === String(barberoId))) {
      setBarberoId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId, barberosDelServicio]);

  // Si cambia el servicio o el barbero, la disponibilidad anterior ya no aplica.
  useEffect(() => {
    setDisponibilidad({});
    setFecha("");
    setHora("");
    setHoras([]);
  }, [servicioId, barberoId]);

  const cargarHoras = (f) => {
    setCargandoHoras(true);
    setHora("");
    return publicoService.obtenerHorasDisponibles({ barberoId, servicioId, fecha: f })
      .then(setHoras)
      .catch((e) => { setHoras([]); setErrorPaso(mensajeDeError(e)); })
      .finally(() => setCargandoHoras(false));
  };

  const seleccionarFecha = (f) => {
    setFecha(f);
    setErrorPaso("");
    cargarHoras(f);
  };

  const continuar = () => {
    if (paso === 1 && !servicio) return setErrorPaso("Seleccione un servicio para continuar.");
    if (paso === 2 && !barbero) return setErrorPaso("Seleccione un barbero para continuar.");
    if (paso === 3 && !fecha) return setErrorPaso("Seleccione un día disponible en el calendario.");
    if (paso === 3 && !hora) return setErrorPaso("Seleccione una hora disponible.");
    setPaso((p) => p + 1);
  };

  const volver = () => setPaso((p) => Math.max(1, p - 1));

  const cambiarDato = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  };

  const confirmar = async (e) => {
    e.preventDefault();
    const nuevosErrores = validarDatos(datos);
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setTimeout(() => refResumenErrores.current?.focus(), 0);
      return;
    }

    setEnviando(true);
    setErrorPaso("");
    try {
      const reserva = await publicoService.crearReserva({
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        correo: datos.correo.trim(),
        observaciones: datos.observaciones.trim() || undefined,
        servicioId: Number(servicioId),
        barberoId: barberoId === "cualquiera" ? "cualquiera" : Number(barberoId),
        fecha,
        hora,
      });
      setConfirmada({ ...reserva, correo: datos.correo.trim() });
    } catch (error) {
      const mensaje = mensajeDeError(error, "No fue posible confirmar la reserva.");
      // Si alguien tomó ese horario mientras tanto, se vuelve a elegir la hora.
      if (/horario|reserva en ese|turno|ya pasó|disponible/i.test(mensaje) && error.response?.status === 400) {
        setPaso(3);
        await cargarHoras(fecha);
        setTimeout(() => setErrorPaso(`${mensaje} Elija otra hora, por favor.`), 0);
      } else {
        setErrorPaso(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(confirmada.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 4000);
    } catch {
      setCopiado(false);
    }
  };

  const nuevaReserva = () => {
    setConfirmada(null);
    setPaso(1);
    setServicioId("");
    setBarberoId("");
    setDatos({ nombre: "", telefono: "", correo: "", observaciones: "" });
  };

  // ------------------------------------------------------------------
  // Confirmación
  // ------------------------------------------------------------------
  if (confirmada) {
    return (
      <section className="portal-contenedor portal-pagina" aria-labelledby="titulo-confirmada">
        <div className="confirmacion-card">
          <FaCheckCircle className="confirmacion-icono" aria-hidden="true" />
          <h1 id="titulo-confirmada" ref={refTitulo} tabIndex={-1}>¡Reserva confirmada!</h1>
          <p>Guarda este código: lo necesitarás junto con tu correo para consultar o cancelar la cita.</p>

          <div className="codigo-reserva">
            <span className="codigo-etiqueta">Código de reserva</span>
            <strong className="codigo-valor">{confirmada.codigo}</strong>
            <button type="button" className="btn-secondary btn-compacto" onClick={copiarCodigo}>
              <FaCopy aria-hidden="true" /> {copiado ? "Copiado" : "Copiar código"}
            </button>
            <span className="sr-only" role="status">{copiado ? "Código copiado al portapapeles." : ""}</span>
          </div>

          <dl className="resumen-lista resumen-confirmacion">
            <div><dt>Servicio</dt><dd>{confirmada.servicio?.nombre}</dd></div>
            <div><dt>Barbero</dt><dd>{confirmada.barbero?.nombre}</dd></div>
            <div><dt>Fecha</dt><dd className="capitalizar">{fechaLarga(confirmada.fecha)}</dd></div>
            <div><dt>Hora</dt><dd>{hora12(confirmada.hora)}</dd></div>
            <div><dt>Duración</dt><dd>{duracionTexto(confirmada.duracion)}</dd></div>
            <div><dt>Valor</dt><dd>{moneda(confirmada.servicio?.precio)}</dd></div>
            <div><dt>Estado</dt><dd><span className={claseEstado(confirmada.estado)}>{etiquetaEstado(confirmada.estado, { cliente: true })}</span></dd></div>
          </dl>

          <div className="confirmacion-acciones">
            <Link
              to={`/mi-reserva?codigo=${encodeURIComponent(confirmada.codigo)}`}
              className="btn-primary"
            >
              Ver estado de mi reserva
            </Link>
            <button type="button" className="btn-secondary" onClick={nuevaReserva}>
              Hacer otra reserva
            </button>
          </div>
          <p className="campo-ayuda">
            Si no puedes asistir, cancela tu cita en “Mi reserva” hasta {reglas.horasLimiteCancelacion} horas antes para liberar el horario.
          </p>
        </div>
      </section>
    );
  }

  const pasoActual = PASOS[paso - 1];
  const totalErrores = Object.values(errores).filter(Boolean).length;

  return (
    <div className="portal-contenedor portal-pagina">
      <div className="reservar-encabezado">
        <p className="hero-eyebrow hero-eyebrow-claro">Reserva en línea</p>
        <h1 className="reservar-titulo">Reserva tu cita</h1>
        <p className="page-subtitle">No necesitas crear una cuenta. Toma menos de un minuto.</p>
      </div>

      <ol className="pasos-indicador" aria-label="Progreso de la reserva">
        {PASOS.map((p) => {
          const estado = p.id < paso ? "completo" : p.id === paso ? "actual" : "pendiente";
          return (
            <li key={p.id} className={`paso-indicador ${estado}`} aria-current={estado === "actual" ? "step" : undefined}>
              <span className="paso-indicador-circulo" aria-hidden="true">
                {estado === "completo" ? <FaCheckCircle /> : p.id}
              </span>
              <span className="paso-indicador-texto">
                {p.titulo}
                <span className="sr-only">
                  {estado === "completo" ? " (completado)" : estado === "actual" ? " (paso actual)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {errorGeneral && <p className="aviso aviso-error" role="alert">{errorGeneral}</p>}

      <div className="reservar-layout">
        <section className="reservar-panel" aria-labelledby="titulo-paso">
          <h2 id="titulo-paso" ref={refTitulo} tabIndex={-1} className="reservar-paso-titulo">
            <span className="paso-chip">Paso {paso} de {PASOS.length}</span>
            {pasoActual.titulo === "Servicio" && "¿Qué servicio deseas?"}
            {pasoActual.titulo === "Barbero" && "¿Con quién quieres tu cita?"}
            {pasoActual.titulo === "Fecha y hora" && "Elige el día y la hora"}
            {pasoActual.titulo === "Tus datos" && "Completa tus datos"}
          </h2>

          <div aria-live="assertive" className="reservar-error-paso">
            {errorPaso && (
              <p className="aviso aviso-error" role="alert">
                <FaExclamationCircle aria-hidden="true" /> {errorPaso}
              </p>
            )}
          </div>

          {/* -------------------- Paso 1: Servicio -------------------- */}
          {paso === 1 && (
            <fieldset className="opciones-fieldset">
              <legend className="sr-only">Servicios disponibles</legend>
              {cargandoCatalogo && <p role="status">Cargando servicios…</p>}
              {!cargandoCatalogo && servicios.length === 0 && !errorGeneral && (
                <p className="aviso">No hay servicios disponibles para reservar en este momento.</p>
              )}
              <div className="opciones-grid">
                {servicios.map((s) => (
                  <label key={s.id} className="opcion">
                    <input
                      type="radio"
                      name="servicio"
                      className="opcion-input"
                      value={s.id}
                      checked={String(servicioId) === String(s.id)}
                      onChange={() => { setServicioId(String(s.id)); setErrorPaso(""); }}
                    />
                    <span className="opcion-cuerpo">
                      <span className="opcion-titulo">{s.nombre}</span>
                      <span className="opcion-descripcion">{s.descripcion}</span>
                      <span className="opcion-meta">
                        <span className="opcion-precio">{moneda(s.precio)}</span>
                        <span><FaClock aria-hidden="true" /> {duracionTexto(s.duracion)}</span>
                      </span>
                      <FaCheckCircle className="opcion-check" aria-hidden="true" />
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* -------------------- Paso 2: Barbero -------------------- */}
          {paso === 2 && (
            <fieldset className="opciones-fieldset">
              <legend className="sr-only">Barberos disponibles</legend>
              {barberosDelServicio.length === 0 && <p className="aviso">Ningún barbero realiza este servicio en este momento. Elige otro servicio.</p>}
              <div className="opciones-grid">
                {(barberosDelServicio.length > 1 ? [CUALQUIERA, ...barberosDelServicio] : barberosDelServicio).map((b) => (
                  <label key={b.id} className="opcion">
                    <input
                      type="radio"
                      name="barbero"
                      className="opcion-input"
                      value={b.id}
                      checked={String(barberoId) === String(b.id)}
                      onChange={() => { setBarberoId(String(b.id)); setErrorPaso(""); }}
                    />
                    <span className="opcion-cuerpo opcion-barbero">
                      <span className={`equipo-avatar ${b.id === "cualquiera" ? "avatar-cualquiera" : ""}`} aria-hidden="true">
                        {b.id === "cualquiera" ? "★" : b.nombre.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                      </span>
                      <span>
                        <span className="opcion-titulo">{b.nombre}</span>
                        <span className="opcion-descripcion">{b.especialidad}</span>
                      </span>
                      <FaCheckCircle className="opcion-check" aria-hidden="true" />
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* -------------------- Paso 3: Fecha y hora -------------------- */}
          {paso === 3 && (
            <div className="fecha-hora-layout">
              <div>
                <h3 className="sr-only">Calendario de disponibilidad de {barbero?.nombre}</h3>
                <Calendario
                  mes={mes}
                  onCambiarMes={setMes}
                  seleccionada={fecha}
                  onSeleccionar={seleccionarFecha}
                  disponibilidad={disponibilidad}
                  minFecha={hoy}
                  maxFecha={maxFecha}
                  cargando={cargandoDias}
                />
              </div>

              <div className="horas-panel">
                {!fecha && (
                  <p className="horas-vacio">
                    <FaCalendarAlt aria-hidden="true" />
                    Elige un día del calendario para ver las horas libres.
                  </p>
                )}

                {fecha && (
                  <fieldset className="horas-fieldset">
                    <legend className="horas-legend">
                      Horas libres del <span className="capitalizar">{fechaLarga(fecha)}</span>
                    </legend>

                    <p className="sr-only" role="status">
                      {cargandoHoras ? "Consultando horas…" : `${horas.length} horas disponibles.`}
                    </p>

                    {cargandoHoras && <p className="campo-ayuda" aria-hidden="true">Consultando horas…</p>}

                    {!cargandoHoras && horas.length === 0 && (
                      <p className="aviso">Ya no quedan horas libres este día. Elige otra fecha.</p>
                    )}

                    {!cargandoHoras && agruparHoras(horas).map((grupo) => (
                      <div key={grupo.titulo} className="horas-grupo" role="group" aria-label={grupo.titulo}>
                        <p className="horas-grupo-titulo" aria-hidden="true">{grupo.titulo}</p>
                        <div className="horas-grid">
                          {grupo.horas.map((h) => (
                            <label key={h} className="hora-chip">
                              <input
                                type="radio"
                                name="hora"
                                className="opcion-input"
                                value={h}
                                checked={hora === h}
                                onChange={() => { setHora(h); setErrorPaso(""); }}
                              />
                              <span>{hora12(h)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </fieldset>
                )}
              </div>
            </div>
          )}

          {/* -------------------- Paso 4: Datos -------------------- */}
          {paso === 4 && (
            <form id="form-datos" onSubmit={confirmar} noValidate className="datos-form">
              {totalErrores > 0 && (
                <div className="resumen-errores" ref={refResumenErrores} tabIndex={-1} role="alert" aria-labelledby="titulo-errores">
                  <h3 id="titulo-errores">Revisa {totalErrores === 1 ? "este campo" : `estos ${totalErrores} campos`}:</h3>
                  <ul>
                    {Object.entries(errores).filter(([, v]) => v).map(([campo, msg]) => (
                      <li key={campo}>
                        <a href={`#reserva-${campo}`} onClick={(e) => { e.preventDefault(); document.getElementById(`reserva-${campo}`)?.focus(); }}>
                          {ETIQUETAS_CAMPOS[campo]}: {msg}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="campo-ayuda">Los campos marcados con <span aria-hidden="true" className="campo-requerido">*</span><span className="sr-only">asterisco</span> son obligatorios.</p>

              <div className="form-group">
                <label htmlFor="reserva-nombre">Nombre completo <span className="campo-requerido" aria-hidden="true">*</span></label>
                <input
                  id="reserva-nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  maxLength={80}
                  value={datos.nombre}
                  onChange={cambiarDato}
                  aria-invalid={!!errores.nombre}
                  aria-describedby={errores.nombre ? "error-reserva-nombre" : undefined}
                />
                {errores.nombre && <p className="error-text" id="error-reserva-nombre"><FaExclamationCircle aria-hidden="true" /> {errores.nombre}</p>}
              </div>

              <div className="datos-fila">
                <div className="form-group">
                  <label htmlFor="reserva-telefono">Celular <span className="campo-requerido" aria-hidden="true">*</span></label>
                  <input
                    id="reserva-telefono"
                    name="telefono"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    aria-required="true"
                    maxLength={10}
                    value={datos.telefono}
                    onChange={cambiarDato}
                    aria-invalid={!!errores.telefono}
                    aria-describedby={`ayuda-telefono${errores.telefono ? " error-reserva-telefono" : ""}`}
                  />
                  <p className="campo-ayuda" id="ayuda-telefono">10 dígitos, sin espacios.</p>
                  {errores.telefono && <p className="error-text" id="error-reserva-telefono"><FaExclamationCircle aria-hidden="true" /> {errores.telefono}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="reserva-correo">Correo electrónico <span className="campo-requerido" aria-hidden="true">*</span></label>
                  <input
                    id="reserva-correo"
                    name="correo"
                    type="email"
                    autoComplete="email"
                    required
                    aria-required="true"
                    maxLength={120}
                    value={datos.correo}
                    onChange={cambiarDato}
                    aria-invalid={!!errores.correo}
                    aria-describedby={`ayuda-correo${errores.correo ? " error-reserva-correo" : ""}`}
                  />
                  <p className="campo-ayuda" id="ayuda-correo">Lo usarás con tu código para consultar la reserva.</p>
                  {errores.correo && <p className="error-text" id="error-reserva-correo"><FaExclamationCircle aria-hidden="true" /> {errores.correo}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reserva-observaciones">Observaciones <span className="campo-opcional">(opcional)</span></label>
                <textarea
                  id="reserva-observaciones"
                  name="observaciones"
                  rows={3}
                  maxLength={500}
                  value={datos.observaciones}
                  onChange={cambiarDato}
                  aria-invalid={!!errores.observaciones}
                  aria-describedby={`ayuda-observaciones${errores.observaciones ? " error-reserva-observaciones" : ""}`}
                />
                <p className="campo-ayuda" id="ayuda-observaciones">{datos.observaciones.length} de 500 caracteres.</p>
                {errores.observaciones && <p className="error-text" id="error-reserva-observaciones">{errores.observaciones}</p>}
              </div>
            </form>
          )}

          <div className="reservar-navegacion">
            {paso > 1 ? (
              <button type="button" className="btn-secondary" onClick={volver} disabled={enviando}>
                <FaArrowLeft aria-hidden="true" /> Atrás
              </button>
            ) : <span />}

            {paso < 4 ? (
              // "key" distinta: React crea un botón nuevo en lugar de reutilizar este
              // y convertirlo en "submit" a mitad del clic (eso enviaba el paso 4 vacío).
              <button key="continuar" type="button" className="btn-primary" onClick={continuar}>
                Continuar <FaArrowRight aria-hidden="true" />
              </button>
            ) : (
              <button key="confirmar" type="submit" form="form-datos" className="btn-primary" disabled={enviando}>
                {enviando ? "Confirmando…" : "Confirmar reserva"}
              </button>
            )}
          </div>
        </section>

        <aside className="reservar-resumen" aria-labelledby="titulo-resumen">
          <h2 id="titulo-resumen">Tu reserva</h2>
          <dl className="resumen-lista">
            <div>
              <dt>Servicio</dt>
              <dd>{servicio ? servicio.nombre : <span className="resumen-pendiente">Sin elegir</span>}</dd>
            </div>
            <div>
              <dt>Barbero</dt>
              <dd>{barbero ? barbero.nombre : <span className="resumen-pendiente">Sin elegir</span>}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd className="capitalizar">{fecha ? fechaLarga(fecha) : <span className="resumen-pendiente">Sin elegir</span>}</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>{hora ? hora12(hora) : <span className="resumen-pendiente">Sin elegir</span>}</dd>
            </div>
            {servicio && (
              <>
                <div><dt>Duración</dt><dd>{duracionTexto(servicio.duracion)}</dd></div>
                <div className="resumen-total"><dt>Total</dt><dd>{moneda(servicio.precio)}</dd></div>
              </>
            )}
          </dl>
          <p className="campo-ayuda">El pago se realiza en la barbería.</p>
          <p className="campo-ayuda">
            Reservas con al menos {reglas.anticipacionMinutos} minutos de anticipación y hasta {reglas.diasMaximos} días adelante.
            Cancelación en línea hasta {reglas.horasLimiteCancelacion} horas antes.
          </p>
        </aside>
      </div>
    </div>
  );
}
