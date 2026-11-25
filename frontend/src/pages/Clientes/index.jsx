import { useEffect, useState } from "react";

import "./Clientes.css";

import clienteService from "../../services/clienteService";

import DataTable from "../../components/tables/DataTable";
import ClienteForm from "../../components/forms/ClienteForm";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/Toast";
import useToast from "../../hooks/useToast";

export default function Clientes() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [clienteAEliminar, setClienteAEliminar] = useState(null);

  const { toast, mostrarToast, cerrarToast } = useToast();

  // ===============================
  // Obtener clientes
  // ===============================
  const cargarClientes = async () => {

    try {

      const clientes = await clienteService.obtenerClientes();

      setListaClientes(clientes);

    } catch (error) {

      console.error(
        "Error al obtener clientes:",
        error
      );

      mostrarToast("No fue posible cargar los clientes.", "error");

    }

  };


  useEffect(() => {

    cargarClientes();

  }, []);



  // ===============================
  // Búsqueda por nombre o teléfono
  // ===============================
  const clientesFiltrados = listaClientes.filter((cliente) => {

    const texto = busqueda.trim().toLowerCase();

    if (!texto) return true;

    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.telefono?.toLowerCase().includes(texto)
    );

  });



  // ===============================
  // Columnas tabla
  // ===============================
  const columnas = [

    { key: "nombre", label: "Nombre" },

    { key: "telefono", label: "Teléfono" },

    { key: "correo", label: "Correo" },

    { key: "ultimaCita", label: "Última cita" },

    { key: "totalVisitas", label: "Visitas" },

  ];



  // ===============================
  // Crear o actualizar
  // ===============================
  const guardarCliente = async (datosCliente) => {

    try {


      if (clienteSeleccionado) {


        await clienteService.actualizarCliente(

          clienteSeleccionado.id,

          datosCliente

        );


        mostrarToast("Cliente actualizado correctamente.");


      } else {


        await clienteService.crearCliente(datosCliente);


        mostrarToast("Cliente registrado correctamente.");


      }



      await cargarClientes();


      setClienteSeleccionado(null);

      setMostrarFormulario(false);



    } catch (error) {


      mostrarToast(

        error.response?.data?.message ||

        "Ocurrió un error al guardar el cliente.",

        "error"

      );


      console.error(

        "Error al guardar cliente:",

        error

      );


    }

  };




  // ===============================
  // Editar
  // ===============================
  const editarCliente = (cliente) => {

    setClienteSeleccionado(cliente);

    setMostrarFormulario(true);

  };




  // ===============================
  // Eliminar (con modal de confirmación)
  // ===============================
  const solicitarEliminarCliente = (cliente) => {

    setClienteAEliminar(cliente);

  };

  const confirmarEliminarCliente = async () => {

    const cliente = clienteAEliminar;
    setClienteAEliminar(null);

    try {

      await clienteService.eliminarCliente(cliente.id);

      mostrarToast("Cliente eliminado correctamente.");

      await cargarClientes();

    } catch (error) {

      mostrarToast(

        error.response?.data?.message ||

        "No es posible eliminar este cliente porque posee reservas asociadas.",

        "error"

      );

      console.error(

        "Error al eliminar cliente:",

        error

      );

    }

  };



  return (

    <div className="clientes">

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

      <ConfirmModal
        abierto={!!clienteAEliminar}
        titulo="¿Está seguro de eliminar este cliente?"
        mensaje={clienteAEliminar ? `Esta acción eliminará a ${clienteAEliminar.nombre} de forma permanente.` : ""}
        onConfirmar={confirmarEliminarCliente}
        onCancelar={() => setClienteAEliminar(null)}
      />

      {!mostrarFormulario ? (


        <>


          <div className="clientes-header">


            <div>


              <h1>
                Clientes
              </h1>


              <p>
                Administra los clientes registrados en la barbería.
              </p>


            </div>



            <button

              className="btn-primary"

              onClick={() => {

                setClienteSeleccionado(null);

                setMostrarFormulario(true);

              }}

            >

              + Nuevo Cliente

            </button>


          </div>



          <div className="clientes-toolbar">


            <input

              type="search"
              aria-label="Buscar clientes por nombre o teléfono"

              placeholder="Buscar por nombre o teléfono..."

              className="search-input"

              value={busqueda}

              onChange={(e) => setBusqueda(e.target.value)}

            />


          </div>



          <DataTable

            caption="Clientes registrados"

            columns={columnas}

            data={clientesFiltrados}

            showActions={true}

            onEdit={editarCliente}

            onDelete={solicitarEliminarCliente}

          />


        </>


      ) : (



        <ClienteForm

          cliente={clienteSeleccionado}


          onCancel={() => {


            setClienteSeleccionado(null);

            setMostrarFormulario(false);


          }}


          onSave={guardarCliente}


        />


      )}



    </div>


  );

}
