import { useEffect, useRef, useState } from "react";
import { FaKey, FaCrown, FaExchangeAlt } from "react-icons/fa";

import "./Usuarios.css";

import authService from "../../services/authService";

import DataTable from "../../components/tables/DataTable";
import UsuarioForm from "../../components/forms/UsuarioForm";
import ConfirmModal from "../../components/common/ConfirmModal";
import Toast from "../../components/Toast";
import useToast from "../../hooks/useToast";
import useDialogo from "../../hooks/useDialogo";
import { useAuth } from "../../contexts/useAuth";
import CodigoRecuperacion from "../../components/acceso/CodigoRecuperacion";
import "../../components/acceso/Acceso.css";

/**
 * Traspaso de la propiedad: el dueño elige a otro administrador activo y
 * confirma con su contraseña. Al terminar muestra el código de recuperación
 * del nuevo dueño para entregárselo.
 */
function TraspasoPropiedad({ administradores, onCerrar, onTraspasado }) {
    const ref = useRef(null);
    const [usuarioId, setUsuarioId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState(null);

    useDialogo(ref, { activo: true, onCerrar: resultado ? () => onTraspasado(resultado) : onCerrar });

    const enviar = async (e) => {
        e.preventDefault();
        if (!usuarioId || !password) {
            setError("Elige el nuevo dueño y escribe tu contraseña.");
            return;
        }
        setEnviando(true);
        try {
            setResultado(await authService.transferirPropiedad(Number(usuarioId), password));
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo traspasar la propiedad.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="confirm-modal-overlay">
            <div ref={ref} className="confirm-modal traspaso-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-traspaso">
                {resultado ? (
                    <>
                        <h2 id="titulo-traspaso" className="confirm-modal-titulo">Propiedad traspasada</h2>
                        <p className="confirm-modal-mensaje">
                            <strong>{resultado.nuevoDueño.nombre}</strong> es ahora el dueño del negocio. Tú sigues como
                            administrador. Entrégale este código de recuperación en persona; solo se muestra esta vez.
                        </p>
                        <CodigoRecuperacion codigo={resultado.codigoRecuperacion} email={resultado.nuevoDueño.email} />
                        <div className="confirm-modal-buttons">
                            <button type="button" className="btn-primary" onClick={() => onTraspasado(resultado)}>Entendido</button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={enviar} noValidate className="acceso-form">
                        <h2 id="titulo-traspaso" className="confirm-modal-titulo">Traspasar la propiedad del negocio</h2>
                        <p className="confirm-modal-mensaje">
                            Úsalo si vendes o entregas la barbería. El nuevo dueño podrá gestionar a los administradores.
                            Tú quedarás como administrador y él podrá desactivarte.
                        </p>
                        {error && <p className="acceso-error-general" role="alert">{error}</p>}
                        {administradores.length === 0 ? (
                            <p className="acceso-aviso">Primero crea la cuenta del nuevo dueño como Administrador.</p>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label htmlFor="traspaso-usuario">Nuevo dueño</label>
                                    <select id="traspaso-usuario" value={usuarioId} onChange={(e) => { setUsuarioId(e.target.value); setError(""); }}>
                                        <option value="">Elige un administrador…</option>
                                        {administradores.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="traspaso-password">Tu contraseña</label>
                                    <input id="traspaso-password" type="password" autoComplete="current-password"
                                        value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
                                    <p className="campo-ayuda">Confirma que eres tú.</p>
                                </div>
                            </>
                        )}
                        <div className="confirm-modal-buttons">
                            <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
                            {administradores.length > 0 && (
                                <button type="submit" className="btn-danger" disabled={enviando}>
                                    {enviando ? "Traspasando…" : "Traspasar propiedad"}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}


export default function Usuarios() {

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [usuarioARestablecer, setUsuarioARestablecer] = useState(null);
    const [credencialesNuevas, setCredencialesNuevas] = useState(null);

    const [traspasoAbierto, setTraspasoAbierto] = useState(false);

    const { toast, mostrarToast, cerrarToast } = useToast();
    const { usuario: yo, actualizarUsuarioLocal } = useAuth();
    const soyDueño = !!yo?.esPropietario;

    // Jerarquía: Dueño > Administrador > Barbero
    const puedeGestionar = (row) =>
        !row.esPropietario && (row.rol === "barbero" || soyDueño || row.id === yo?.id);
    // Cada quien puede editar su propio nombre y correo
    const puedeEditar = (row) => row.id === yo?.id || puedeGestionar(row);

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
        {
            key: "rol",
            label: "Rol",
            render: (row) =>
                row.esPropietario ? (
                    <span className="rol-dueno"><FaCrown aria-hidden="true" /> Dueño</span>
                ) : row.rol === "admin" ? "Administrador" : "Barbero",
        },
        { key: "barbero", label: "Barbero asociado", render: (row) => row.barbero?.nombre || "—" },
        {
            key: "activo",
            label: "Estado",
            render: (row) => (
                <span className={`estado-badge ${row.activo ? "estado-activo" : "estado-inactivo"}`}>
                    {row.activo ? "Activo" : "Inactivo"}
                </span>
            ),
        },
        {
            key: "restablecer",
            label: "Contraseña",
            render: (row) => (row.id === yo?.id ? <span className="texto-suave">Cámbiala desde tu perfil</span> : !puedeGestionar(row) ? (
                <span className="texto-suave">{row.esPropietario ? "Usa su código de recuperación" : "Solo el dueño"}</span>
            ) : (
                <button
                    type="button"
                    className="btn-secondary btn-compacto"
                    onClick={() => solicitarRestablecerPassword(row)}
                    aria-label={`Restablecer contraseña de ${row.nombre}`}
                >
                    <FaKey aria-hidden="true" /> Restablecer
                </button>
            )),
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

            {traspasoAbierto && (
                <TraspasoPropiedad
                    administradores={listaUsuarios.filter((u) => u.rol === "admin" && u.activo && u.id !== yo?.id)}
                    onCerrar={() => setTraspasoAbierto(false)}
                    onTraspasado={() => {
                        setTraspasoAbierto(false);
                        actualizarUsuarioLocal({ esPropietario: false });
                        cargarUsuarios();
                        mostrarToast("Propiedad traspasada correctamente.");
                    }}
                />
            )}

            {!mostrarFormulario ? (
                <>
                    <div className="usuarios-header">
                        <div>
                            <h1>Gestión de Usuarios</h1>
                            <p>Administra las cuentas de acceso al sistema.</p>
                        </div>

                        <div className="usuarios-header-acciones">
                            {soyDueño && (
                                <button type="button" className="btn-secondary" onClick={() => setTraspasoAbierto(true)}>
                                    <FaExchangeAlt aria-hidden="true" /> Traspasar propiedad
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => { setUsuarioSeleccionado(null); setMostrarFormulario(true); }}
                            >
                                + Nuevo Usuario
                            </button>
                        </div>
                    </div>

                    <DataTable
                        caption="Cuentas de usuario del sistema"
                        columns={columnas}
                        data={listaUsuarios}
                        showActions={true}
                        onEdit={editarUsuario}
                        etiquetaFila={(row) => row.nombre}
                        deshabilitarAcciones={(row) =>
                            puedeEditar(row) ? "" : row.esPropietario ? "La cuenta del dueño solo la edita el dueño" : "Solo el dueño gestiona administradores"
                        }
                    />
                    <p className="usuarios-nota">
                        Las cuentas nunca se eliminan de forma permanente; para revocar el acceso, edite el usuario y márquelo como Inactivo.
                        La sesión de una cuenta desactivada se cierra de inmediato.
                    </p>
                    <p className="usuarios-nota">
                        <strong>Jerarquía:</strong> el <strong>dueño</strong> gestiona a todos y es el único que crea
                        administradores. Los <strong>administradores</strong> gestionan barberos, reservas y horarios.
                        Los <strong>barberos</strong> ven su propia agenda.
                    </p>
                </>
            ) : (
                <UsuarioForm
                    usuario={usuarioSeleccionado}
                    puedeCrearAdmin={soyDueño}
                    esPropio={usuarioSeleccionado?.id === yo?.id}
                    onCancel={() => { setUsuarioSeleccionado(null); setMostrarFormulario(false); }}
                    onSave={guardarUsuario}
                />
            )}

        </div>
    );
}
