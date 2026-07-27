import { useEffect, useState } from "react";
import { FaCog } from "react-icons/fa";

import "./Horarios.css";

import barberoService from "../../services/barberoService";
import horarioService from "../../services/horarioService";

import DataTable from "../../components/tables/DataTable";
import HorarioSemanaForm from "../../components/forms/HorarioSemanaForm";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";

export default function Horarios() {

    const [vista, setVista] = useState("tabla"); // "tabla" | "configurar"
    const [listaBarberos, setListaBarberos] = useState([]);
    const [barberoAConfigurar, setBarberoAConfigurar] = useState(null);
    const { toast, mostrarToast, cerrarToast } = useToast();

    
    const cargarBarberos = async () => {
        try {
            const barberos = await barberoService.obtenerBarberos();
            setListaBarberos(barberos.filter((b) => b.estado === "Activo"));
        } catch (error) {
            console.error("Error al obtener barberos:", error);
            mostrarToast("No fue posible cargar los barberos.", "error");
        }
    };

    useEffect(() => {
        cargarBarberos();
    }, []);

    const columnas = [
        { key: "nombre", label: "Barbero" },
        { key: "estado", label: "Estado" },
        {
            key: "accion",
            label: "Acción",
            render: (row) => (
                <button
                    className="btn-secondary"
                    onClick={() => {
                        setBarberoAConfigurar(row);
                        setVista("configurar");
                    }}
                >
                    <FaCog /> Configurar
                </button>
            ),
        },
    ];

    const guardarSemana = async (payload) => {
        try {
            await horarioService.crearSemana(payload);
            mostrarToast("Horario configurado correctamente.");
            setBarberoAConfigurar(null);
            setVista("tabla");
        } catch (error) {
            mostrarToast(error.response?.data?.message || "Error al guardar el horario.", "error");
        }
    };

    return (
        <div className="horarios">

            <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

            {vista === "tabla" && (
                <>
                    <div className="horarios-header">
                        <div>
                            <h1>Horarios</h1>
                            <p>Configure la disponibilidad semanal de cada barbero.</p>
                        </div>
                    </div>

                    <DataTable
                        columns={columnas}
                        data={listaBarberos}
                        showActions={false}
                    />
                </>
            )}

            {vista === "configurar" && barberoAConfigurar && (
                <HorarioSemanaForm
                    barbero={barberoAConfigurar}
                    onCancel={() => { setBarberoAConfigurar(null); setVista("tabla"); }}
                    onSave={guardarSemana}
                />
            )}

        </div>
    );
}
