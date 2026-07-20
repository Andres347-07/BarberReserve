import { useEffect, useState } from "react";

import "./Horarios.css";

import horarioService from "../../services/horarioService";

import DataTable from "../../components/tables/DataTable";
import HorarioForm from "../../components/forms/HorarioForm";

export default function Horarios() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaHorarios, setListaHorarios] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  const cargarHorarios = async () => {

    try {

      const horarios = await horarioService.obtenerHorarios();
      setListaHorarios(horarios);

    } catch (error) {

      console.error("Error al obtener horarios:", error);

    }

  };

  useEffect(() => {

    cargarHorarios();

  }, []);

  const columnas = [
    { key: "barberoId", label: "Barbero ID" },
    { key: "diaSemana", label: "Día" },
    { key: "horaInicio", label: "Hora Inicio" },
    { key: "horaFin", label: "Hora Fin" },
    {
      key: "activo",
      label: "Estado",
      render: (row) => (row.activo ? "Activo" : "Inactivo"),
    },
  ];

  const guardarHorario = async (datosHorario) => {

    try {

      if (horarioSeleccionado) {

        await horarioService.actualizarHorario(
          horarioSeleccionado.id,
          datosHorario
        );

      } else {

        await horarioService.crearHorario(datosHorario);

      }

      await cargarHorarios();

      setHorarioSeleccionado(null);
      setMostrarFormulario(false);

    } catch (error) {

      console.error("Error al guardar horario:", error);

    }

  };

  const editarHorario = (horario) => {

    setHorarioSeleccionado(horario);
    setMostrarFormulario(true);

  };

  const eliminarHorario = async (horario) => {

    const confirmar = window.confirm(
      `¿Desea eliminar el horario del día ${horario.diaSemana}?`
    );

    if (!confirmar) return;

    try {

      await horarioService.eliminarHorario(horario.id);

      await cargarHorarios();

    } catch (error) {

      console.error("Error al eliminar horario:", error);

    }

  };

  return (

    <div className="horarios">

      {!mostrarFormulario ? (

        <>

          <div className="horarios-header">

            <div>

              <h1>Horarios</h1>

              <p>
                Administra los horarios laborales de los barberos.
              </p>

            </div>

            <button
              className="btn-primary"
              onClick={() => {

                setHorarioSeleccionado(null);
                setMostrarFormulario(true);

              }}
            >
              + Nuevo Horario
            </button>

          </div>

          <div className="horarios-toolbar">

            <input
              type="text"
              placeholder="Buscar horario..."
              className="search-input"
            />

          </div>

          <DataTable
            columns={columnas}
            data={listaHorarios}
            showActions={true}
            onEdit={editarHorario}
            onDelete={eliminarHorario}
          />

        </>

      ) : (

        <HorarioForm
          horario={horarioSeleccionado}
          onCancel={() => {

            setHorarioSeleccionado(null);
            setMostrarFormulario(false);

          }}
          onSave={guardarHorario}
        />

      )}

    </div>

  );

}