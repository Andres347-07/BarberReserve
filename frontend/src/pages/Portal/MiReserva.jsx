import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaSearch, FaBan, FaExclamationCircle, FaCalendarCheck } from "react-icons/fa";

import publicoService, { mensajeDeError } from "../../services/publicoService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { claseEstado, etiquetaEstado } from "../../utils/estados";
import { fechaLarga, hora12, moneda, duracionTexto, hoyISO } from "../../utils/fechas";

const REGEX_CODIGO = /^BR-[A-Z0-9]{6}$/;

const DESCRIPCION_ESTADO = {
  "Pendiente": "Tu cita está confirmada y te esperamos a la hora indicada.",
  "En espera": "Ya registramos tu llegada. En un momento te atiende tu barbero.",
  "No asistió": "La cita quedó registrada como inasistencia porque no llegaste dentro del tiempo de tolerancia.",
  "En proceso": "Tu servicio está en curso.",
  "Finalizada": "Esta cita ya fue atendida. ¡Gracias por visitarnos!",
  "Cancelada": "Esta reserva fue cancelada y el horario quedó libre para otros clientes.",
};



export default function MiReserva() {
  const [params] = useSearchParams();
  const [formulario, setFormulario] = useState({ codigo: params.get("codigo") || "", correo: "" });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [reserva, setReserva] = useState(null);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [horasLimite, setHorasLimite] = useState(2);
  // Momento de la última consulta (para calcular si aún se puede cancelar).
  const [momentoConsulta, setMomentoConsulta] = useState(() => Date.now());

  const refResultado = useRef(null);
  const refCorreo = useRef(null);

  useEffect(() => {
    publicoService.obtenerConfiguracion().then((c) => setHorasLimite(c.horasLimiteCancelacion)).catch(() => {});
  }, []);

  useEffect(() => {
    if (params.get("codigo")) refCorreo.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: name === "codigo" ? value.toUpperCase() : value }));
    setErrores((prev) => ({ ...prev, [name]: undefined }));
  };

  const consultar = async (e) => {
    e.preventDefault();
    const codigo = formulario.codigo.trim().toUpperCase();
    const correo = formulario.correo.trim();
    const nuevos = {};
    if (!codigo) nuevos.codigo = "Escriba el código de su reserva.";
    else if (!REGEX_CODIGO.test(codigo)) nuevos.codigo = "El código tiene el formato BR- seguido de 6 letras o números. Ejemplo: BR-7K3P9Q.";
    if (!correo) nuevos.correo = "Escriba el correo con el que hizo la reserva.";
    setErrores(nuevos);
    setErrorGeneral("");
    setMensajeExito("");

    if (Object.keys(nuevos).length) {
      setTimeout(() => e.target.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setConsultando(true);
    try {
      const datos = await publicoService.consultarReserva({ codigo, correo });
      setMomentoConsulta(Date.now());
      setReserva(datos);
      setTimeout(() => refResultado.current?.focus(), 0);
    } catch (error) {
      setReserva(null);
      setErrorGeneral(mensajeDeError(error, "No fue posible consultar la reserva."));
    } finally {
      setConsultando(false);
    }
  };

  const cancelar = async () => {
    setConfirmarCancelacion(false);
    setCancelando(true);
    setErrorGeneral("");
    try {
      const datos = await publicoService.cancelarReserva({
        codigo: formulario.codigo.trim().toUpperCase(),
        correo: formulario.correo.trim(),
      });
      setReserva(datos);
      setMensajeExito("Tu reserva fue cancelada. El horario quedó disponible para otros clientes.");
      setTimeout(() => refResultado.current?.focus(), 0);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error, "No fue posible cancelar la reserva."));
    } finally {
      setCancelando(false);
    }
  };

  // Misma regla que el servidor: cancelación en línea hasta N horas antes.
  const minutosParaLaCita = reserva
    ? (new Date(`${reserva.fecha}T${reserva.hora}:00`).getTime() - momentoConsulta) / 60000
    : 0;
  const enPlazo = minutosParaLaCita >= horasLimite * 60;
  const puedeCancelar = reserva?.estado === "Pendiente" && reserva.fecha >= hoyISO() && enPlazo;

  return (
    <div className="portal-contenedor portal-pagina mi-reserva">
      <div className="reservar-encabezado">
        <p className="hero-eyebrow hero-eyebrow-claro">Consulta sin iniciar sesión</p>
        <h1 className="reservar-titulo">Consultar mi reserva</h1>
        <p className="page-subtitle">Ingresa el código que recibiste al reservar y el correo que registraste.</p>
      </div>

      <div className="mi-reserva-layout">
        <form className="consulta-form card-base" onSubmit={consultar} noValidate aria-labelledby="titulo-consulta">
          <h2 id="titulo-consulta">Buscar reserva</h2>

          <div className="form-group">
            <label htmlFor="consulta-codigo">Código de reserva</label>
            <input
              id="consulta-codigo"
              name="codigo"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="BR-XXXXXX"
              maxLength={9}
              value={formulario.codigo}
              onChange={cambiar}
              aria-invalid={!!errores.codigo}
              aria-describedby={`ayuda-codigo${errores.codigo ? " error-codigo" : ""}`}
              className="input-codigo"
            />
            <p className="campo-ayuda" id="ayuda-codigo">Ejemplo: BR-7K3P9Q</p>
            {errores.codigo && <p className="error-text" id="error-codigo"><FaExclamationCircle aria-hidden="true" /> {errores.codigo}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="consulta-correo">Correo electrónico</label>
            <input
              ref={refCorreo}
              id="consulta-correo"
              name="correo"
              type="email"
              autoComplete="email"
              value={formulario.correo}
              onChange={cambiar}
              aria-invalid={!!errores.correo}
              aria-describedby={errores.correo ? "error-correo" : undefined}
            />
            {errores.correo && <p className="error-text" id="error-correo"><FaExclamationCircle aria-hidden="true" /> {errores.correo}</p>}
          </div>

          <button type="submit" className="btn-primary btn-bloque" disabled={consultando}>
            <FaSearch aria-hidden="true" /> {consultando ? "Consultando…" : "Consultar"}
          </button>

          <div aria-live="assertive">
            {errorGeneral && <p className="aviso aviso-error" role="alert">{errorGeneral}</p>}
          </div>
        </form>

        <section className="resultado-consulta" aria-labelledby="titulo-resultado">
          {!reserva ? (
            <div className="resultado-vacio card-base">
              <FaCalendarCheck aria-hidden="true" />
              <h2 id="titulo-resultado">¿Aún no tienes una reserva?</h2>
              <p>Agenda tu cita en línea en pocos pasos.</p>
              <Link to="/reservar" className="btn-outline">Reservar una cita</Link>
            </div>
          ) : (
            <article className="resultado-card card-base">
              <div className="resultado-cabecera">
                <div>
                  <p className="codigo-etiqueta">Reserva</p>
                  <h2 id="titulo-resultado" ref={refResultado} tabIndex={-1} className="codigo-valor codigo-valor-sm">
                    {reserva.codigo}
                  </h2>
                </div>
                <span className={claseEstado(reserva.estado)}>
                  <span className="sr-only">Estado: </span>{etiquetaEstado(reserva.estado, { cliente: true })}
                </span>
              </div>

              <div role="status" aria-live="polite">
                {mensajeExito && <p className="aviso aviso-exito">{mensajeExito}</p>}
              </div>

              <p className="resultado-descripcion">{DESCRIPCION_ESTADO[reserva.estado]}</p>

              <dl className="resumen-lista">
                <div><dt>Cliente</dt><dd>{reserva.cliente?.nombre}</dd></div>
                <div><dt>Servicio</dt><dd>{reserva.servicio?.nombre}</dd></div>
                <div><dt>Barbero</dt><dd>{reserva.barbero?.nombre}</dd></div>
                <div><dt>Fecha</dt><dd className="capitalizar">{fechaLarga(reserva.fecha)}</dd></div>
                <div><dt>Hora</dt><dd>{hora12(reserva.hora)}</dd></div>
                <div><dt>Duración</dt><dd>{duracionTexto(reserva.duracion)}</dd></div>
                {reserva.servicio?.precio && <div><dt>Valor</dt><dd>{moneda(reserva.servicio.precio)}</dd></div>}
              </dl>

              {puedeCancelar && (
                <div className="resultado-acciones">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setConfirmarCancelacion(true)}
                    disabled={cancelando}
                  >
                    <FaBan aria-hidden="true" /> {cancelando ? "Cancelando…" : "Cancelar reserva"}
                  </button>
                  <p className="campo-ayuda">Puedes cancelar en línea hasta {horasLimite} horas antes de la cita.</p>
                </div>
              )}

              {reserva.estado === "Pendiente" && !enPlazo && reserva.fecha >= hoyISO() && (
                <p className="aviso">
                  Faltan menos de {horasLimite} horas para tu cita, por eso ya no se puede cancelar en línea. Comunícate con la barbería.
                </p>
              )}

              {reserva.estado === "Cancelada" && (
                <Link to="/reservar" className="btn-primary">Hacer una nueva reserva</Link>
              )}
            </article>
          )}
        </section>
      </div>

      <ConfirmModal
        abierto={confirmarCancelacion}
        titulo="¿Cancelar tu reserva?"
        mensaje={reserva ? `Se cancelará tu cita de ${reserva.servicio?.nombre} con ${reserva.barbero?.nombre} el ${fechaLarga(reserva.fecha)} a las ${hora12(reserva.hora)}. Esta acción no se puede deshacer.` : ""}
        confirmarTexto="Sí, cancelar"
        cancelarTexto="No, conservarla"
        onConfirmar={cancelar}
        onCancelar={() => setConfirmarCancelacion(false)}
      />
    </div>
  );
}
