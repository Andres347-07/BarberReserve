import "./Login.css";

import barberImage from "../../assets/images/barber-login.png";
import logo from "../../assets/logo/logo.png";

export default function Login() {
  return (
    <div className="login">

      <div
        className="login-left"
        style={{ backgroundImage: `url(${barberImage})` }}
      >
        <div className="overlay">

          <img src={logo} alt="Logo" className="logo" />

          <h1>
            Barber<span>Reserve</span>
          </h1>

          <div className="separator"></div>

          <p className="description">
            La forma más sencilla de organizar las reservas de tu barbería.
          </p>

          <div className="features">

            <div className="feature">
              📅
              <span>Gestiona reservas fácilmente</span>
            </div>

            <div className="feature">
              👥
              <span>Administra clientes y barberos</span>
            </div>

            <div className="feature">
              📊
              <span>Optimiza la organización de tu barbería</span>
            </div>

          </div>

        </div>
      </div>

      <div className="login-right">

        <div className="card">

          <img src={logo} alt="" className="card-logo"/>

          <h2>Bienvenido a BarberReserve</h2>

          <p>
            Inicia sesión para acceder a la plataforma
          </p>

          <label>Correo electrónico</label>

          <input
            type="email"
            placeholder="ejemplo@correo.com"
          />

          <label>Contraseña</label>

          <input
            type="password"
            placeholder="Ingresa tu contraseña"
          />

          <div className="options">

            <label className="remember">
              <input type="checkbox"/>
              Recordarme
            </label>

            <a href="#">
              ¿Olvidaste tu contraseña?
            </a>

          </div>

          <button>
            Iniciar sesión
          </button>

          <div className="divider">
            <span>o continúa con</span>
          </div>

          <div className="social">

            <button>
              Google
            </button>

            <button>
              Apple
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}