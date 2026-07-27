import { useEffect, useState } from "react";
import { FaKey } from "react-icons/fa";

import "./Usuarios.css";

import authService from "../../services/authService";

import DataTable from "../../components/tables/DataTable";
import UsuarioForm from "../../components/forms/UsuarioForm";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/Toast";
import useToast from "../../hooks/useToast";


export default function Usuarios() {

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [usuarioARestablecer, setUsuarioARestablecer] = useState(null);
    const [credencialesNuevas, setCredencialesNuevas] = useState(null);

    const { toast, mostrarToast, cerrarToast } = useToast();

    const cargarUsuarios = async () => {
        try {
            const usuarios = await authService.obtenerUsuarios();
            setListaUsuarios(usuarios);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            mostrarToast("No fue posible cargar los usuarios.", "error");
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const columnas = [
        { key: "nombre", label: "Nombre" },
        { key: "email", label: "Correo" },
        { key: "rol", label: "Rol", render: (row) => row.rol === "admin" ? "Administrador" : "Barbero" },
        { key: "barbero", label: "Barbero asociado", render: (row) => row.barbero?.nombre || "—" },
        {
            key: "activo",
            label: "Estado",
            render: (row) => (
                <span className={`estado-badge ${row.activo ? "estado-en-proceso" : "estado-finalizada"}`}>
                    {row.activo ? "Activo" : "Inactivo"}
                </span>
            ),
        },
        {
            key: "restablecer",
            label: "Contraseña",
            render: (row) => (
                <button className="btn-secondary" onClick={() => solicitarRestablecerPassword(row)}>
                    <FaKey /> Restablecer
                </button>
            ),
        },
    ];

    const guardarUsuario = async (datos) => {
        try {
            if (usuarioSeleccionado) {
                await authService.actualizarUsuario(usuarioSeleccionado.id, datos);
                mostrarToast("Usuario actualizado correctamente.");
                await cargarUsuarios();
                setUsuarioSeleccionado(null);
                setMostrarFormulario(false);
            } else {
                const respuesta = await authService.crearUsuario(datos);
                await cargarUsuarios();
                setMostrarFormulario(false);
                setCredencialesNuevas({ email: respuesta.data.email });
            }
        } catch (error) {
            mostrarToast(error.response?.data?.message || "Ocurrió un error al guardar el usuario.", "error");
        }
    };

    const editarUsuario = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setMostrarFormulario(true);
    };

    const solicitarRestablecerPassword = (usuario) => {
        setUsuarioARestablecer(usuario);
    };

    const confirmarRestablecerPassword = async () => {
        const usuario = usuarioARestablecer;
        setUsuarioARestablecer(null);

        try {
            const respuesta = await authService.restablecerPassword(usuario.id);
            setCredencialesNuevas({ email: usuario.email, passwordTemporal: respuesta.data.passwordTemporal });
        } catch (error) {
            mostrarToast(error.response?.data?.message || "No fue posible restablecer la contraseña.", "error");
        }
    };

    return (
        <div className="usuarios">

            <Toast mensaje={toast.mensaje} tipo={toast.tipo} cerrar={cerrarToast} />

            <ConfirmModal
                abierto={!!usuarioARestablecer}
                titulo="¿Restablecer la contraseña de este usuario?"
                mensaje={usuarioARestablecer ? `Se generará una nueva contraseña temporal para ${usuarioARestablecer.nombre}. La contraseña actual dejará de funcionar.` : ""}
                confirmarTexto="Sí, restablecer"
                onConfirmar={confirmarRestablecerPassword}
                onCancelar={() => setUsuarioARestablecer(null)}
            />

            <ConfirmModal
                abierto={!!credencialesNuevas}
                titulo={credencialesNuevas?.passwordTemporal ? "Contraseña restablecida" : "Usuario creado correctamente"}
                soloInformativo={true}
                confirmarTexto="Entendido"
                mensaje={
                    credencialesNuevas && (
                        <>
                            Comparta estas credenciales con el usuario. Esta contraseña no volverá a mostrarse.
                            <div className="password-temporal-box">
                                {credencialesNuevas.email}
                                {credencialesNuevas.passwordTemporal && <><br />{credencialesNuevas.passwordTemporal}</>}
                            </div>
                        </>
                    )
                }
                onConfirmar={() => setCredencialesNuevas(null)}
            />

            {!mostrarFormulario ? (
                <>
                    <div className="usuarios-header">
                        <div>
                            <h1>Gestión de Usuarios</h1>
                            <p>Administra las cuentas de acceso al sistema.</p>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => { setUsuarioSeleccionado(null); setMostrarFormulario(true); }}
                        >
                            + Nuevo Usuario
                        </button>
                    </div>

                    <DataTable
                        columns={columnas}
                        data={listaUsuarios}
                        showActions={true}
                        onEdit={editarUsuario}
                    />
                    <p className="usuarios-nota">
                        Las cuentas nunca se eliminan de forma permanente; para revocar el acceso, edite el usuario y márquelo como Inactivo.
                    </p>
                </>
            ) : (
                <UsuarioForm
                    usuario={usuarioSeleccionado}
                    onCancel={() => { setUsuarioSeleccionado(null); setMostrarFormulario(false); }}
                    onSave={guardarUsuario}
                />
            )}

        </div>
    );
}
