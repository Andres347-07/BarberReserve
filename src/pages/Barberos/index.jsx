import { useEffect, useState } from "react";

import "./Barberos.css";

import barberoService from "../../services/barberoService";

import DataTable from "../../components/tables/DataTable";
import BarberoForm from "../../components/forms/BarberoForm";

export default function Barberos() {

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [listaBarberos, setListaBarberos] = useState([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);

  // ===============================
  // Obtener barberos
  // ===============================
  const cargarBarberos = async () => {

    try {

      const barberos = await barberoService.obtenerBarberos();
      setListaBarberos(barberos);

    } catch (error) {

      console.error("Error al obtener barberos:", error);

    }

  };

  useEffect(() => {

    cargarBarberos();

  }, []);

  // ===============================
  // Columnas
  // ===============================
  const columnas = [

    { key: "nombre", label: "Nombre" },
    { key: "especialidad", label: "Especialidad" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "estado", label: "Estado" },

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

      } else {

        await barberoService.crearBarbero(datosBarbero);

      }

      await cargarBarberos();

      setBarberoSeleccionado(null);
      setMostrarFormulario(false);

    } catch (error) {

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
      // Eliminar
      // ===============================
      const eliminarBarbero = async (barbero) => {

          const confirmar = window.confirm(
          `¿Desea eliminar al barbero ${barbero.nombre}?`
         );


         if (!confirmar) return;


         try {


           await barberoService.eliminarBarbero(
            barbero.id
           );


           await cargarBarberos();



         } catch (error) {


           console.error(
             "Error al eliminar barbero:",
           error
           );


         }

       };

  return (

    <div className="barberos">

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
              type="text"
              placeholder="Buscar barbero..."
              className="search-input"
            />

          </div>

          <DataTable
            columns={columnas}
            data={listaBarberos}
            showActions={true}
            onEdit={editarBarbero}
            onDelete={eliminarBarbero}
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