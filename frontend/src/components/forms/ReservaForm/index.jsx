import { useEffect, useState } from "react";

import "./ReservaForm.css";

import clienteService from "../../../services/clienteService";
import barberoService from "../../../services/barberoService";
import servicioService from "../../../services/servicioService";
import reservaService from "../../../services/reservaService";

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
      .obtenerHorasDisponibles(barberoId, fecha, servicioId)
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
      >

        <h2>
          {reserva ? "Editar Reserva" : "Nueva Reserva"}
        </h2>

        <p>
          {reserva
            ? "Actualice la información de la reserva."
            : "Complete los datos para registrar una nueva reserva."}
        </p>

        <div className="form-group">

          <label>Cliente</label>

          <select
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

          <label>Barbero</label>

          <select
            name="barberoId"
            value={formulario.barberoId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un barbero</option>
            {barberos.map((barbero) => (
              <option key={barbero.id} value={barbero.id}>{barbero.nombre}</option>
            ))}
          </select>

        </div>

        <div className="form-group">

          <label>Servicio</label>

          <select
            name="servicioId"
            value={formulario.servicioId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un servicio</option>
            {servicios.map((servicio) => (
              <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
            ))}
          </select>

        </div>

        <div className="form-group">

          <label>Fecha</label>

          <input
            type="date"
            name="fecha"
            value={formulario.fecha}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group">

          <label>Hora disponible</label>

          <select
            name="hora"
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

          {mensajeHoras && <span className="error-text">{mensajeHoras}</span>}

        </div>

        <div className="form-group">

          <label>Observaciones</label>

          <textarea
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
