import { useState } from "react";

import "./Clientes.css";

import clientes from "../../mocks/clientes";

import DataTable from "../../components/tables/DataTable";
import ClienteForm from "../../components/forms/ClienteForm";

export default function Clientes() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [listaClientes, setListaClientes] = useState(clientes);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const columnas = [
    { key: "nombre", label: "Nombre" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "ultimaCita", label: "Última cita" },
    { key: "totalVisitas", label: "Visitas" },
  ];

  const guardarCliente = (datosCliente) => {

    if (clienteSeleccionado) {

      setListaClientes((clientesActuales) =>
        clientesActuales.map((cliente) =>
          cliente.id === clienteSeleccionado.id
            ? {
                ...cliente,
                nombre: datosCliente.nombre,
                telefono: datosCliente.telefono,
                correo: datosCliente.correo,
              }
            : cliente
        )
      );

    } else {

      const nuevoCliente = {
        id: listaClientes.length + 1,
        ...datosCliente,
        ultimaCita: "Sin citas",
        totalVisitas: 0,
      };

      setListaClientes((clientesActuales) => [
        ...clientesActuales,
        nuevoCliente,
      ]);

    }

    setClienteSeleccionado(null);
    setMostrarFormulario(false);

  };

  return (

    <div className="clientes">

      {!mostrarFormulario ? (

        <>

          <div className="clientes-header">

            <div>

              <h1>Clientes</h1>

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