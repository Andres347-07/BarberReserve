import { FaCalendarAlt, FaUsers, FaShieldAlt } from "react-icons/fa";

import barberImage from "../../assets/images/barber-login.png";
import logo from "../../assets/logo/logo-small.png";

/** Panel izquierdo con la identidad visual (mismo del inicio de sesión). */
export default function PanelMarca() {
    return (
        <div className="login-left" style={{ backgroundImage: `url(${barberImage})` }}>
            <div className="overlay">
                <img src={logo} alt="" className="logo" />
                <p className="login-marca">Barber<span>Reserve</span></p>
                <div className="separator"></div>
                <div className="features">
                    <div className="feature"><FaCalendarAlt aria-hidden="true" /><span>Reservas en línea para tus clientes</span></div>
                    <div className="feature"><FaUsers aria-hidden="true" /><span>Agenda propia para cada barbero</span></div>
                    <div className="feature"><FaShieldAlt aria-hidden="true" /><span>Tú controlas quién entra al panel</span></div>
                </div>
            </div>
        </div>
    );
}
