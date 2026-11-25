import { useEffect, useState } from "react";
import { FaCog, FaArrowLeft, FaCalendarWeek, FaCalendarDay, FaLock } from "react-icons/fa";

import "./Horarios.css";

import barberoService from "../../services/barberoService";
import horarioService from "../../services/horarioService";

import DataTable from "../../components/tables/DataTable";
import HorarioSemanaForm from "../../components/forms/HorarioSemanaForm";
import PlantillaSemanal from "../../components/horarios/PlantillaSemanal";
import BloqueosPanel from "../../components/horarios/BloqueosPanel";
import Tabs from "../../components/common/Tabs";
import useToast from "../../hooks/useToast";
import Toast from "../../components/Toast";

export default function Horarios() {

    const [vista, setVista] = useState("tabla"); // "tabla" | "configurar"
    const [listaBarberos, setListaBarberos] = useState([]);
    const [barberoAConfigurar, setBarberoAConfigurar] = useState(null);
    const [pestana, setPestana] = useState("plantilla");
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
        {
            key: "estado",
            label: "Estado",
            render: (row) => <span className={`estado-badge estado-${String(row.estado).toLowerCase()}`}>{row.estado}</span>,
        },
        {
            key: "accion",
            label: "Acción",
            render: (row) => (
                <button
                    type="button"
                    className="btn-secondary btn-compacto"
                    aria-label={`Configurar horario de ${row.nombre}`}
                    onClick={() => {
                        setBarberoAConfigurar(row);
                        setPestana("plantilla");
                        setVista("configurar");
                    }}
                >
                    <FaCog aria-hidden="true" /> Configurar
                </button>
            ),
        },
    ];

    const guardarSemana = async (payload) => {
        try {
            await horarioService.crearSemana(payload);
            mostrarToast("Horario de la semana guardado correctamente.");
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
                            <p>Configure el horario de trabajo de cada barbero: corrido o partido, excepciones y bloqueos.</p>
                        </div>
                    </div>

                    <DataTable
                        caption="Barberos y configuración de horarios"
                        columns={columnas}
                        data={listaBarberos}
                        showActions={false}
                    />
                </>
            )}

            {vista === "configurar" && barberoAConfigurar && (
                <div className="horario-gestion">
                    <button
                        type="button"
                        className="btn-ghost horario-volver"
                        onClick={() => { setBarberoAConfigurar(null); setVista("tabla"); }}
                    >
                        <FaArrowLeft aria-hidden="true" /> Volver a la lista de barberos
                    </button>

                    <h1>Horario de {barberoAConfigurar.nombre}</h1>

                    <Tabs
                        etiqueta={`Configuración del horario de ${barberoAConfigurar.nombre}`}
                        activa={pestana}
                        onCambiar={setPestana}
                        pestanas={[
                            { id: "plantilla", etiqueta: "Plantilla semanal", icono: <FaCalendarWeek /> },
                            { id: "semana", etiqueta: "Semana específica", icono: <FaCalendarDay /> },
                            { id: "bloqueos", etiqueta: "Bloqueos", icono: <FaLock /> },
                        ]}
                    >
                        {pestana === "plantilla" && <PlantillaSemanal barbero={barberoAConfigurar} mostrarToast={mostrarToast} />}
                        {pestana === "semana" && <HorarioSemanaForm barbero={barberoAConfigurar} onSave={guardarSemana} />}
                        {pestana === "bloqueos" && <BloqueosPanel barberoId={barberoAConfigurar.id} mostrarToast={mostrarToast} />}
                    </Tabs>
                </div>
            )}

        </div>
    );
}
