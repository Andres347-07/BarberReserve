import { useEffect, useState } from "react";

import "./Servicios.css";

import servicioService from "../../services/servicioService";

import DataTable from "../../components/tables/DataTable";
import ServicioForm from "../../components/forms/ServicioForm";

export default function Servicios() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaServicios, setListaServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // ===============================
  // Obtener servicios
  // ===============================
  const cargarServicios = async () => {

    try {

      const servicios = await servicioService.obtenerServicios();
      setListaServicios(servicios);

    } catch (error) {

      console.error("Error al obtener servicios:", error);

    }

  };

  useEffect(() => {

    cargarServicios();

  }, []);

  // ===============================
  // Columnas
  // ===============================
  const columnas = [

    { key: "nombre", label: "Servicio" },
    { key: "descripcion", label: "Descripción" },
    { key: "duracion", label: "Duración (min)" },
    { key: "precio", label: "Precio" },
    { key: "estado", label: "Estado" },

  ];

  // ===============================
  // Crear o actualizar
  // ===============================
  const guardarServicio = async (datosServicio) => {

    try {

      if (servicioSeleccionado) {

        await servicioService.actualizarServicio(
          servicioSeleccionado.id,
          datosServicio
        );

      } else {

        await servicioService.crearServicio(datosServicio);

      }

      await cargarServicios();

      setServicioSeleccionado(null);
      setMostrarFormulario(false);

    } catch (error) {

      console.error("Error al guardar servicio:", error);

    }

  };

  // ===============================
  // Editar
  // ===============================
  const editarServicio = (servicio) => {

    setServicioSeleccionado(servicio);
    setMostrarFormulario(true);

  };

  // ===============================
  // Eliminar
  // ===============================
  const eliminarServicio = async (id) => {

    const confirmar = window.confirm(
      "¿Desea eliminar este servicio?"
    );

    if (!confirmar) return;

    try {

      await servicioService.eliminarServicio(id);

      await cargarServicios();

    } catch (error) {

      console.error("Error al eliminar servicio:", error);

    }

  };

  return (

    <div className="servicios">

      {!mostrarFormulario ? (

        <>

          <div className="servicios-header">

            <div>

              <h1>Servicios</h1>

              <p>
                Administra los servicios disponibles de la barbería.
              </p>

            </div>

            <button
              className="btn-primary"
              onClick={() => {

                setServicioSeleccionado(null);
                setMostrarFormulario(true);

              }}
            >
              + Nuevo Servicio
            </button>

          </div>

          <div className="servicios-toolbar">

            <input
              type="text"
              placeholder="Buscar servicio..."
              className="search-input"
            />

          </div>

          <DataTable
            columns={columnas}
            data={listaServicios}
            showActions={true}
            onEdit={editarServicio}
            onDelete={eliminarServicio}
          />

        </>

      ) : (

        <ServicioForm
          servicio={servicioSeleccionado}
          onCancel={() => {

            setServicioSeleccionado(null);
            setMostrarFormulario(false);

          }}
          onSave={guardarServicio}
        />

      )}

    </div>

  );

}