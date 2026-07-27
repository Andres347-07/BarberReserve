import { useEffect, useState } from "react";

import "./Reservas.css";

import reservaService from "../../services/reservaService";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";

import DataTable from "../../components/tables/DataTable";
import ReservaForm from "../../components/forms/ReservaForm";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function Reservas() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaReservas, setListaReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [reservaAEliminar, setReservaAEliminar] = useState(null);
  const { toast, mostrarToast, cerrarToast } = useToast();

  const cargarReservas = async () => {
    try {
      const reservas = await reservaService.obtenerReservas();
      setListaReservas(reservas);
    } catch (error) {
      console.error("Error al obtener reservas:", error);
      mostrarToast("No fue posible cargar las reservas.", "error");
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

 
  const reservasFiltradas = listaReservas.filter((reserva) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;

    return (
      reserva.cliente?.nombre?.toLowerCase().includes(texto) ||
      reserva.barbero?.nombre?.toLowerCase().includes(texto) ||
      reserva.fecha?.includes(texto)
    );
  });

  const columnas = [
    { key: "fechaHora", label: "Fecha y Hora", render: (row) => `${row.fecha} ${row.hora?.slice(0, 5)}` },
    { key: "cliente", label: "Cliente", render: (row) => row.cliente?.nombre },
    { key: "servicio", label: "Servicio", render: (row) => row.servicio?.nombre },
    { key: "barbero", label: "Barbero", render: (row) => row.barbero?.nombre },
    {
      key: "estado",
      label: "Estado",
      render: (row) => <span className={`estado-badge estado-${row.estado.replace(" ", "-").toLowerCase()}`}>{row.estado}</span>,
    },
  ];

  const guardarReserva = async (datosReserva) => {
    try {
      if (reservaSeleccionada) {
        await reservaService.actualizarReserva(reservaSeleccionada.id, datosReserva);
        mostrarToast("Reserva actualizada correctamente.");
      } else {
        await reservaService.crearReserva(datosReserva);
        mostrarToast("Reserva creada correctamente.");
      }

      await cargarReservas();
      setReservaSeleccionada(null);
      setMostrarFormulario(false);
    } catch (error) {
      mostrarToast(error.response?.data?.message || "Error al guardar la reserva.", "error");
    }
  };

  
  const editarReserva = (reserva) => {
    if (reserva.estado !== "Pendiente") return;
    setReservaSeleccionada(reserva);
    setMostrarFormulario(true);
  };

  const solicitarEliminarReserva = (reserva) => {
    if (reserva.estado !== "Pendiente") return;
    setReservaAEliminar(reserva);
  };

  const confirmarEliminarReserva = async () => {
    const reserva = reservaAEliminar;
    setReservaAEliminar(null);

    try {
      await reservaService.eliminarReserva(reserva.id);
      mostrarToast("Reserva eliminada correctamente.");
      await cargarReservas();
    } catch (error) {
      mostrarToast(error.response?.data?.message || "No fue posible eliminar la reserva.", "error");
    }
  };

  return (
    <div className="reservas-page">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <ConfirmModal
        abierto={!!reservaAEliminar}
        titulo="¿Está seguro de eliminar esta reserva?"
        mensaje={reservaAEliminar ? `Se eliminará la reserva de ${reservaAEliminar.cliente?.nombre} del ${reservaAEliminar.fecha}.` : ""}
        onConfirmar={confirmarEliminarReserva}
        onCancelar={() => setReservaAEliminar(null)}
      />

      {!mostrarFormulario ? (
        <>
          <div className="reservas-header">
            <div>
              <h1>Reservas</h1>
              <p>Administra las reservas registradas en la barbería.</p>
            </div>

            <button
              className="btn-primary"
              onClick={() => { setReservaSeleccionada(null); setMostrarFormulario(true); }}
            >
              + Nueva Reserva
            </button>
          </div>

          <div className="reservas-toolbar">
            <input
              type="text"
              placeholder="Buscar por cliente, barbero o fecha (AAAA-MM-DD)..."
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <DataTable
            columns={columnas}
            data={reservasFiltradas}
            showActions={true}
            onEdit={editarReserva}
            onDelete={solicitarEliminarReserva}
            deshabilitarAcciones={(row) => row.estado !== "Pendiente" ? "Solo se puede modificar una reserva Pendiente." : ""}
          />
        </>
      ) : (
        <ReservaForm
          reserva={reservaSeleccionada}
          onCancel={() => { setReservaSeleccionada(null); setMostrarFormulario(false); }}
          onSave={guardarReserva}
        />
      )}

    </div>
  );
}
