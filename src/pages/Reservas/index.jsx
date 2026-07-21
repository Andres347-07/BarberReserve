import { useEffect, useState } from "react";

import "./Reservas.css";

import reservaService from "../../services/reservaService";

import DataTable from "../../components/tables/DataTable";
import ReservaForm from "../../components/forms/ReservaForm";

export default function Reservas() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaReservas, setListaReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  // ==========================
  // Cargar reservas
  // ==========================

  const cargarReservas = async () => {

    try {

      const reservas = await reservaService.obtenerReservas();

      setListaReservas(reservas);

    } catch (error) {

      console.error("Error al obtener reservas:", error);

    }

  };

  useEffect(() => {

    cargarReservas();

  }, []);

  // ==========================
  // Columnas
  // ==========================

  const columnas = [

    {
      key: "fechaHora",
      label: "Fecha y Hora",
      render: (row) => `${row.fecha} ${row.hora}`
    },

    {
      key: "cliente",
      label: "Cliente",
      render: (row) => row.cliente?.nombre
    },

    {
      key: "servicio",
      label: "Servicio",
      render: (row) => row.servicio?.nombre
    },

    {
      key: "barbero",
      label: "Barbero",
      render: (row) => row.barbero?.nombre
    },

    {
      key: "estado",
      label: "Estado"
    }

  ];

  // ==========================
  // Guardar
  // ==========================

  const guardarReserva = async (datosReserva) => {

    try {

      if (reservaSeleccionada) {

        await reservaService.actualizarReserva(
          reservaSeleccionada.id,
          datosReserva
        );

      } else {

        await reservaService.crearReserva(datosReserva);

      }

      await cargarReservas();

      setReservaSeleccionada(null);
      setMostrarFormulario(false);

    } catch (error) {

      console.error("Error al guardar reserva:", error);

    }

  };

  // ==========================
  // Editar
  // ==========================

  const editarReserva = (reserva) => {

    setReservaSeleccionada(reserva);
    setMostrarFormulario(true);

  };

  // ==========================
  // Eliminar
  // ==========================

  const eliminarReserva = async (reserva) => {

    const confirmar = window.confirm(

      `¿Desea eliminar la reserva del cliente ${reserva.cliente?.nombre}?`

    );

    if (!confirmar) return;

    try {

      await reservaService.eliminarReserva(reserva.id);

      await cargarReservas();

    } catch (error) {

      console.error("Error al eliminar reserva:", error);

    }

  };

  return (

    <div className="reservas-page">

      {!mostrarFormulario ? (

        <>

          <div className="reservas-header">

            <div>

              <h1>Reservas</h1>

              <p>

                Administra las reservas registradas en la barbería.

              </p>

            </div>

            <button
              className="btn-primary"
              onClick={() => {

                setReservaSeleccionada(null);
                setMostrarFormulario(true);

              }}
            >

              + Nueva Reserva

            </button>

          </div>

          <div className="reservas-toolbar">

            <input
              type="text"
              placeholder="Buscar reserva..."
              className="search-input"
            />

          </div>

          <DataTable
            columns={columnas}
            data={listaReservas}
            showActions={true}
            onEdit={editarReserva}
            onDelete={eliminarReserva}
          />

        </>

      ) : (

        <ReservaForm
          reserva={reservaSeleccionada}
          onCancel={() => {

            setReservaSeleccionada(null);
            setMostrarFormulario(false);

          }}
          onSave={guardarReserva}
        />

      )}

    </div>

  );

}