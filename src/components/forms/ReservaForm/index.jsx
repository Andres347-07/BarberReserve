import { useEffect, useState } from "react";

import "./ReservaForm.css";

import clienteService from "../../../services/clienteService";
import barberoService from "../../../services/barberoService";
import servicioService from "../../../services/servicioService";

export default function ReservaForm({
  reserva = null,
  onCancel,
  onSave,
}) {

  const [clientes, setClientes] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [formulario, setFormulario] = useState({
    clienteId: reserva?.clienteId || "",
    barberoId: reserva?.barberoId || "",
    servicioId: reserva?.servicioId || "",
    fecha: reserva?.fecha || "",
    hora: reserva?.hora || "",
    estado: reserva?.estado || "Pendiente",
    observaciones: reserva?.observaciones || "",
  });

  // ==========================
  // Cargar datos
  // ==========================

  const cargarDatos = async () => {

    try {

      const [
        clientesData,
        barberosData,
        serviciosData,
      ] = await Promise.all([

        clienteService.obtenerClientes(),
        barberoService.obtenerBarberos(),
        servicioService.obtenerServicios(),

      ]);

      setClientes(clientesData);
      setBarberos(barberosData);
      setServicios(serviciosData);

    } catch (error) {

      console.error("Error cargando datos:", error);

    }

  };

  useEffect(() => {

    cargarDatos();

  }, []);

  // ==========================
  // Eventos
  // ==========================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormulario((prev) => ({

      ...prev,
      [name]: value,

    }));

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

          {reserva
            ? "Editar Reserva"
            : "Nueva Reserva"}

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

            <option value="">
              Seleccione un cliente
            </option>

            {clientes.map((cliente) => (

              <option
                key={cliente.id}
                value={cliente.id}
              >

                {cliente.nombre}

              </option>

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

            <option value="">
              Seleccione un barbero
            </option>

            {barberos.map((barbero) => (

              <option
                key={barbero.id}
                value={barbero.id}
              >

                {barbero.nombre}

              </option>

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

            <option value="">
              Seleccione un servicio
            </option>

            {servicios.map((servicio) => (

              <option
                key={servicio.id}
                value={servicio.id}
              >

                {servicio.nombre}

              </option>

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

          <label>Hora</label>

          <input
            type="time"
            name="hora"
            value={formulario.hora}
            onChange={handleChange}
            required
          />

        </div>

        {reserva && (

          <div className="form-group">

            <label>Estado</label>

            <select
              name="estado"
              value={formulario.estado}
              onChange={handleChange}
            >

              <option value="Pendiente">
                Pendiente
              </option>

              <option value="En proceso">
                En proceso
              </option>

              <option value="Finalizada">
                Finalizada
              </option>

              <option value="Cancelada">
                Cancelada
              </option>

            </select>

          </div>

        )}

        <div className="form-group">

          <label>Observaciones</label>

          <textarea
            name="observaciones"
            rows="4"
            value={formulario.observaciones}
            onChange={handleChange}
            placeholder="Observaciones de la reserva..."
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
          >

            {reserva
              ? "Guardar cambios"
              : "Guardar"}

          </button>

        </div>

      </form>

    </div>

  );

}