import { useEffect, useState } from "react";
import { FaBan, FaGlobe } from "react-icons/fa";
import { claseEstado, etiquetaEstado, LISTA_ESTADOS } from "../../utils/estados";

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
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
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
    if (filtroEstado && reserva.estado !== filtroEstado) return false;

    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;

    return (
      reserva.cliente?.nombre?.toLowerCase().includes(texto) ||
      reserva.barbero?.nombre?.toLowerCase().includes(texto) ||
      reserva.fecha?.includes(texto) ||
      reserva.codigo?.toLowerCase().includes(texto)
    );
  });

  const columnas = [
    { key: "fechaHora", label: "Fecha y Hora", render: (row) => `${row.fecha} ${row.hora?.slice(0, 5)}` },
    {
      key: "codigo",
      label: "Código",
      render: (row) => (
        <span className="reserva-codigo">
          {row.codigo || "—"}
          {row.origen === "web" && (
            <span className="reserva-origen-web" title="Reserva hecha desde el portal de clientes">
              <FaGlobe aria-hidden="true" /> <span>En línea</span>
            </span>
          )}
        </span>
      ),
    },
    { key: "cliente", label: "Cliente", render: (row) => row.cliente?.nombre },
    { key: "servicio", label: "Servicio", render: (row) => row.servicio?.nombre },
    { key: "barbero", label: "Barbero", render: (row) => row.barbero?.nombre },
    {
      key: "estado",
      label: "Estado",
      render: (row) => <span className={claseEstado(row.estado)}>{etiquetaEstado(row.estado)}</span>,
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
    if (!["Pendiente", "Cancelada"].includes(reserva.estado)) return;
    setReservaAEliminar(reserva);
  };

  const solicitarCancelarReserva = (reserva) => {
    if (reserva.estado !== "Pendiente") return;
    setReservaACancelar(reserva);
  };

  const confirmarCancelarReserva = async () => {
    const reserva = reservaACancelar;
    setReservaACancelar(null);

    try {
      await reservaService.cancelarReserva(reserva.id);
      mostrarToast("Reserva cancelada. El horario quedó disponible.");
      await cargarReservas();
    } catch (error) {
      mostrarToast(error.response?.data?.message || "No fue posible cancelar la reserva.", "error");
    }
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

      <ConfirmModal
        abierto={!!reservaACancelar}
        titulo="¿Cancelar esta reserva?"
        mensaje={reservaACancelar ? `La reserva de ${reservaACancelar.cliente?.nombre} del ${reservaACancelar.fecha} a las ${reservaACancelar.hora?.slice(0, 5)} quedará como Cancelada (se conserva en el historial) y el horario quedará libre.` : ""}
        confirmarTexto="Sí, cancelar reserva"
        cancelarTexto="Volver"
        onConfirmar={confirmarCancelarReserva}
        onCancelar={() => setReservaACancelar(null)}
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

          <form className="reservas-toolbar" role="search" aria-label="Filtrar reservas" onSubmit={(e) => e.preventDefault()}>
            <div className="filtro">
              <label htmlFor="reservas-estado">Estado</label>
              <select id="reservas-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos</option>
                {LISTA_ESTADOS.map((e) => <option key={e} value={e}>{etiquetaEstado(e)}</option>)}
              </select>
            </div>
            <div className="filtro filtro-crece">
              <label htmlFor="reservas-busqueda">Buscar</label>
              <input
                id="reservas-busqueda"
                type="search"
                placeholder="Cliente, barbero, código o fecha (AAAA-MM-DD)…"
                className="search-input"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </form>
          <p className="sr-only" role="status">{reservasFiltradas.length} reserva(s) en la lista.</p>

          <DataTable
            caption="Reservas registradas"
            columns={columnas}
            data={reservasFiltradas}
            showActions={true}
            onEdit={editarReserva}
            onDelete={solicitarEliminarReserva}
            deshabilitarAcciones={(row) => row.estado !== "Pendiente" ? "Solo se puede modificar una reserva Pendiente." : ""}
            deshabilitarEliminar={(row) => ["Pendiente", "Cancelada"].includes(row.estado) ? "" : "Solo se puede eliminar una reserva Pendiente o Cancelada."}
            etiquetaFila={(row) => `la reserva de ${row.cliente?.nombre} del ${row.fecha} a las ${row.hora?.slice(0, 5)}`}
            accionesExtra={(row) => (
              <button
                type="button"
                className="btn-cancelar-reserva"
                onClick={() => solicitarCancelarReserva(row)}
                disabled={row.estado !== "Pendiente"}
                aria-label={`Cancelar la reserva de ${row.cliente?.nombre} del ${row.fecha} a las ${row.hora?.slice(0, 5)}`}
                title={row.estado === "Pendiente" ? "Cancelar reserva" : "Solo se puede cancelar una reserva Pendiente."}
              >
                <FaBan aria-hidden="true" />
              </button>
            )}
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
