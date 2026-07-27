import { useEffect, useState } from "react";

import "./Servicios.css";

import servicioService from "../../services/servicioService";

import DataTable from "../../components/tables/DataTable";
import ServicioForm from "../../components/forms/ServicioForm";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/Toast";
import useToast from "../../hooks/useToast";

export default function Servicios() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaServicios, setListaServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [servicioAEliminar, setServicioAEliminar] = useState(null);

  const { toast, mostrarToast, cerrarToast } = useToast();

  // ===============================
  // Obtener servicios
  // ===============================
  const cargarServicios = async () => {

    try {

      const servicios = await servicioService.obtenerServicios();
      setListaServicios(servicios);

    } catch (error) {

      console.error("Error al obtener servicios:", error);
      mostrarToast("No fue posible cargar los servicios.", "error");

    }

  };

  useEffect(() => {

    cargarServicios();

  }, []);


  // ===============================
  // Búsqueda por nombre
  // ===============================
  const serviciosFiltrados = listaServicios.filter((servicio) => {

    const texto = busqueda.trim().toLowerCase();

    if (!texto) return true;

    return servicio.nombre?.toLowerCase().includes(texto);

  });


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

        mostrarToast("Servicio actualizado correctamente.");

      } else {

        await servicioService.crearServicio(datosServicio);

        mostrarToast("Servicio registrado correctamente.");

      }

      await cargarServicios();
      setServicioSeleccionado(null);
      setMostrarFormulario(false);

    } catch (error) {

      mostrarToast(
        error.response?.data?.message || "Ocurrió un error al guardar el servicio.",
        "error"
      );

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
  // Eliminar (con modal de confirmación)
  // ===============================
  const solicitarEliminarServicio = (servicio) => {

    setServicioAEliminar(servicio);

  };

  const confirmarEliminarServicio = async () => {

    const servicio = servicioAEliminar;
    setServicioAEliminar(null);

    try {

      await servicioService.eliminarServicio(servicio.id);

      mostrarToast("Servicio eliminado correctamente.");

      await cargarServicios();

    } catch (error) {

      mostrarToast(
        error.response?.data?.message ||
        "No es posible eliminar este servicio porque posee reservas asociadas.",
        "error"
      );

      console.error("Error al eliminar servicio:", error);

    }

  };

  return (

    <div className="servicios">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <ConfirmModal
        abierto={!!servicioAEliminar}
        titulo="¿Está seguro de eliminar este servicio?"
        mensaje={servicioAEliminar ? `Esta acción eliminará "${servicioAEliminar.nombre}" de forma permanente. Si tiene reservas asociadas, no podrá eliminarse; márquelo como Inactivo en su lugar.` : ""}
        onConfirmar={confirmarEliminarServicio}
        onCancelar={() => setServicioAEliminar(null)}
      />

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
              placeholder="Buscar servicio por nombre..."
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

          </div>

          <DataTable
            columns={columnas}
            data={serviciosFiltrados}
            showActions={true}
            onEdit={editarServicio}
            onDelete={solicitarEliminarServicio}
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
