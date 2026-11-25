import { useEffect, useState } from "react";

import "./ReservaForm.css";

import clienteService from "../../../services/clienteService";
import barberoService from "../../../services/barberoService";
import servicioService from "../../../services/servicioService";
import reservaService from "../../../services/reservaService";
import { hoyISO } from "../../../utils/fechas";

export default function ReservaForm({
  reserva = null,
  onCancel,
  onSave,
}) {

  const [clientes, setClientes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [consultandoHoras, setConsultandoHoras] = useState(false);
  const [mensajeHoras, setMensajeHoras] = useState("");

  const [formulario, setFormulario] = useState({
    clienteId: reserva?.clienteId || "",
    barberoId: reserva?.barberoId || "",
    servicioId: reserva?.servicioId || "",
    fecha: reserva?.fecha || "",
    hora: reserva?.hora?.slice(0, 5) || "",
    observaciones: reserva?.observaciones || "",
  });

  // ==========================
  // Cargar clientes, barberos y servicios (solo activos estos dos últimos)
  // ==========================
  useEffect(() => {

    const cargarDatos = async () => {
      try {
        const [clientesData, barberosData, serviciosData] = await Promise.all([
          clienteService.obtenerClientes(),
          barberoService.obtenerBarberos(),
          servicioService.obtenerServicios(),
        ]);

        setClientes(clientesData);
        setBarberos(barberosData.filter((b) => b.estado === "Activo"));
        setServicios(serviciosData.filter((s) => s.estado === "Activo"));

      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    cargarDatos();

  }, []);

 
  useEffect(() => {

    const { barberoId, servicioId, fecha } = formulario;

    if (!barberoId || !servicioId || !fecha) {
      setHorasDisponibles([]);
      return;
    }

    setConsultandoHoras(true);
    setMensajeHoras("");

    reservaService
      .obtenerHorasDisponibles(barberoId, fecha, servicioId, reserva?.id)
      .then((horas) => {
        setHorasDisponibles(horas);

        if (horas.length === 0) {
          setMensajeHoras("No existen horas disponibles para la fecha seleccionada.");
        }

        // Si la hora ya elegida (por ejemplo, al editar) ya no está entre
        // las disponibles, se limpia para forzar una nueva selección.
        setFormulario((prev) =>
          horas.includes(prev.hora) ? prev : { ...prev, hora: "" }
        );
      })
      .catch((error) => {
        setHorasDisponibles([]);
        setMensajeHoras(error.response?.data?.message || "No fue posible calcular la disponibilidad.");
      })
      .finally(() => setConsultandoHoras(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulario.barberoId, formulario.servicioId, formulario.fecha]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formulario);
  };

  return (

    <div className="reserva-form-container">

      <form
        className="reserva-form"
        onSubmit={handleSubmit}
        aria-labelledby="titulo-reserva-form"
      >

        <h2 id="titulo-reserva-form">
          {reserva ? "Editar Reserva" : "Nueva Reserva"}
        </h2>

        <p>
          {reserva
            ? "Actualice la información de la reserva."
            : "Complete los datos para registrar una nueva reserva."}
        </p>

        <div className="form-group">

          <label htmlFor="campo-clienteId">Cliente</label>

          <select
                        id="campo-clienteId"
            name="clienteId"
            value={formulario.clienteId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
            ))}
          </select>

        </div>

        <div className="form-group">

          <label htmlFor="campo-barberoId">Barbero</label>

          <select
                        id="campo-barberoId"
            name="barberoId"
            value={formulario.barberoId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un barbero</option>
            {barberos.map((barbero) => {
              // 2.1: un barbero con servicios asignados solo atiende esos servicios.
              const noRealiza = formulario.servicioId && barbero.servicios?.length > 0
                && !barbero.servicios.some((s) => String(s.id) === String(formulario.servicioId));
              return (
                <option key={barbero.id} value={barbero.id} disabled={noRealiza}>
                  {barbero.nombre}{noRealiza ? " (no realiza este servicio)" : ""}
                </option>
              );
            })}
          </select>

        </div>

        <div className="form-group">

          <label htmlFor="campo-servicioId">Servicio</label>

          <select
                        id="campo-servicioId"
            name="servicioId"
            value={formulario.servicioId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un servicio</option>
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>{servicio.nombre} — {servicio.duracion} min</option>
            ))}
          </select>

        </div>

        <div className="form-group">

          <label htmlFor="campo-fecha">Fecha</label>

          <input
                        id="campo-fecha"
            type="date"
            name="fecha"
            min={hoyISO()}
            value={formulario.fecha}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group">

          <label htmlFor="campo-hora">Hora disponible</label>

          <select
                        id="campo-hora"
            name="hora"
            aria-describedby={mensajeHoras ? "error-hora" : undefined}
            value={formulario.hora}
            onChange={handleChange}
            required
            disabled={!formulario.barberoId || !formulario.servicioId || !formulario.fecha || consultandoHoras}
          >
            <option value="">
              {consultandoHoras ? "Consultando disponibilidad..." : "Seleccione una hora"}
            </option>
            {horasDisponibles.map((hora) => (
              <option key={hora} value={hora}>{hora}</option>
            ))}
          </select>

          <div aria-live="polite">
            {mensajeHoras && <span className="error-text" id="error-hora">{mensajeHoras}</span>}
            {!mensajeHoras && (!formulario.barberoId || !formulario.servicioId || !formulario.fecha) && (
              <span className="campo-ayuda">Seleccione barbero, servicio y fecha para ver las horas libres.</span>
            )}
          </div>

        </div>

        <div className="form-group">

          <label htmlFor="campo-observaciones">Observaciones</label>

          <textarea
                        id="campo-observaciones"
            name="observaciones"
            rows="4"
            value={formulario.observaciones}
            onChange={handleChange}
            placeholder="Observaciones de la reserva (opcional)..."
          />

        </div>

        <div className="form-buttons">

          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={!formulario.hora}
          >
            {reserva ? "Guardar cambios" : "Guardar"}
          </button>

        </div>

      </form>

    </div>

  );

}
