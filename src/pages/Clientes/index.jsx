import { useEffect, useState } from "react";

import "./Clientes.css";

import clienteService from "../../services/clienteService";

import DataTable from "../../components/tables/DataTable";
import ClienteForm from "../../components/forms/ClienteForm";

export default function Clientes() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaClientes, setListaClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);


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

    }

  };


  useEffect(() => {

    cargarClientes();

  }, []);



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


        alert(
          "Cliente actualizado correctamente."
        );


      } else {


        await clienteService.crearCliente(datosCliente);


        alert(
          "Cliente registrado correctamente."
        );


      }



      await cargarClientes();


      setClienteSeleccionado(null);

      setMostrarFormulario(false);



    } catch (error) {


      alert(

        error.response?.data?.message ||

        "Ocurrió un error al guardar el cliente."

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
  // Eliminar
  // ===============================
  const eliminarCliente = async (cliente) => {


    const confirmar = window.confirm(

      `¿Desea eliminar al cliente ${cliente.nombre}?`

    );



    if (!confirmar) return;



    try {


      await clienteService.eliminarCliente(

        cliente.id

      );



      alert(

        "Cliente eliminado correctamente."

      );



      await cargarClientes();



    } catch (error) {


      alert(

        error.response?.data?.message ||

        "No fue posible eliminar el cliente."

      );



      console.error(

        "Error al eliminar cliente:",

        error

      );


    }


  };



  return (

    <div className="clientes">


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

              type="text"

              placeholder="Buscar cliente..."

              className="search-input"

            />


          </div>




          <DataTable

            columns={columnas}

            data={listaClientes}

            showActions={true}

            onEdit={editarCliente}

            onDelete={eliminarCliente}

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