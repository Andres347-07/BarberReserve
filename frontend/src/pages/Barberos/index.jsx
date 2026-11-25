import { useEffect, useState } from "react";

import "./Barberos.css";

import barberoService from "../../services/barberoService";

import DataTable from "../../components/tables/DataTable";
import BarberoForm from "../../components/forms/BarberoForm";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/Toast";
import useToast from "../../hooks/useToast";

export default function Barberos() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaBarberos, setListaBarberos] = useState([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [barberoAEliminar, setBarberoAEliminar] = useState(null);
  const [credencialesNuevas, setCredencialesNuevas] = useState(null);

  const { toast, mostrarToast, cerrarToast } = useToast();

  // ===============================
  // Obtener barberos
  // ===============================
  const cargarBarberos = async () => {

    try {

      const barberos = await barberoService.obtenerBarberos();
      setListaBarberos(barberos);

    } catch (error) {

      console.error("Error al obtener barberos:", error);
      mostrarToast("No fue posible cargar los barberos.", "error");

    }

  };

  useEffect(() => {

    cargarBarberos();

  }, []);


  // ===============================
  // Búsqueda por nombre
  // ===============================
  const barberosFiltrados = listaBarberos.filter((barbero) => {

    const texto = busqueda.trim().toLowerCase();

    if (!texto) return true;

    return barbero.nombre?.toLowerCase().includes(texto);

  });


  // ===============================
  // Columnas
  // ===============================
  const columnas = [

    { key: "nombre", label: "Nombre" },
    { key: "especialidad", label: "Especialidad" },
    {
      key: "servicios",
      label: "Servicios",
      render: (row) => (row.servicios && row.servicios.length > 0
        ? row.servicios.map((s) => s.nombre).join(", ")
        : <span className="texto-suave">Todos</span>),
    },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    {
      key: "estado",
      label: "Estado",
      render: (row) => <span className={`estado-badge estado-${String(row.estado).toLowerCase()}`}>{row.estado}</span>,
    },

  ];

  // ===============================
  // Crear o actualizar
  // ===============================
  const guardarBarbero = async (datosBarbero) => {

    try {

      if (barberoSeleccionado) {

        await barberoService.actualizarBarbero(
          barberoSeleccionado.id,
          datosBarbero
        );

        mostrarToast("Barbero actualizado correctamente.");

        await cargarBarberos();
        setBarberoSeleccionado(null);
        setMostrarFormulario(false);

      } else {

        const respuesta = await barberoService.crearBarbero(datosBarbero);

        await cargarBarberos();
        setBarberoSeleccionado(null);
        setMostrarFormulario(false);

        
        setCredencialesNuevas({
          correo: respuesta.data.correo,
          passwordTemporal: respuesta.data.passwordTemporal,
        });

      }

    } catch (error) {

      mostrarToast(
        error.response?.data?.message || "Ocurrió un error al guardar el barbero.",
        "error"
      );

      console.error("Error al guardar barbero:", error);

    }

  };

  // ===============================
  // Editar
  // ===============================
  const editarBarbero = (barbero) => {

    setBarberoSeleccionado(barbero);
    setMostrarFormulario(true);

  };

  // ===============================
  // Eliminar (con modal de confirmación)
  // ===============================
  const solicitarEliminarBarbero = (barbero) => {

    setBarberoAEliminar(barbero);

  };

  const confirmarEliminarBarbero = async () => {

    const barbero = barberoAEliminar;
    setBarberoAEliminar(null);

    try {

      await barberoService.eliminarBarbero(barbero.id);

      mostrarToast("Barbero eliminado correctamente.");

      await cargarBarberos();

    } catch (error) {

      mostrarToast(
        error.response?.data?.message ||
        "No es posible eliminar este barbero porque posee información relacionada.",
        "error"
      );

      console.error("Error al eliminar barbero:", error);

    }

  };

  return (

    <div className="barberos">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <ConfirmModal
        abierto={!!barberoAEliminar}
        titulo="¿Está seguro de eliminar este barbero?"
        mensaje={barberoAEliminar ? `Esta acción eliminará a ${barberoAEliminar.nombre} de forma permanente. Si el barbero tiene horarios o reservas asociadas, no podrá eliminarse; márquelo como Inactivo en su lugar.` : ""}
        onConfirmar={confirmarEliminarBarbero}
        onCancelar={() => setBarberoAEliminar(null)}
      />

      <ConfirmModal
        abierto={!!credencialesNuevas}
        titulo="Usuario creado correctamente"
        soloInformativo={true}
        confirmarTexto="Entendido"
        mensaje={
          credencialesNuevas && (
            <>
              Comparta estas credenciales temporales con el barbero. Esta contraseña no volverá a mostrarse.
              <div className="password-temporal-box">
                {credencialesNuevas.correo}
                <br />
                {credencialesNuevas.passwordTemporal}
              </div>
            </>
          )
        }
        onConfirmar={() => setCredencialesNuevas(null)}
      />

      {!mostrarFormulario ? (

        <>

          <div className="barberos-header">

            <div>

              <h1>Barberos</h1>

              <p>
                Administra los barberos registrados.
              </p>

            </div>

            <button
              className="btn-primary"
              onClick={() => {

                setBarberoSeleccionado(null);
                setMostrarFormulario(true);

              }}
            >
              + Nuevo Barbero
            </button>

          </div>

          <div className="barberos-toolbar">

            <input
              type="search"
              aria-label="Buscar barberos por nombre"
              placeholder="Buscar barbero por nombre..."
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

          </div>

          <DataTable
            caption="Barberos registrados"
            columns={columnas}
            data={barberosFiltrados}
            showActions={true}
            onEdit={editarBarbero}
            onDelete={solicitarEliminarBarbero}
          />

        </>

      ) : (

        <BarberoForm
          barbero={barberoSeleccionado}
          onCancel={() => {

            setBarberoSeleccionado(null);
            setMostrarFormulario(false);

          }}
          onSave={guardarBarbero}
        />

      )}

    </div>

  );

}
