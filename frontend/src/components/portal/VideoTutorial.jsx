import { FaClosedCaptioning } from "react-icons/fa";

import "./VideoTutorial.css";

/**
 * Video "Cómo reservar tu cita" (B6 — accesibilidad auditiva y multimedia):
 *  - controles nativos del navegador (operables con teclado),
 *  - subtítulos en español activados por defecto (pista WebVTT),
 *  - transcripción completa en texto,
 *  - sin reproducción automática.
 */
export default function VideoTutorial() {
  return (
    <section className="portal-seccion portal-seccion-alterna" aria-labelledby="titulo-video">
      <div className="portal-contenedor video-layout">
        <div className="video-texto">
          <h2 id="titulo-video" className="seccion-titulo">Cómo reservar tu cita</h2>
          <p>
            En menos de un minuto te mostramos cómo elegir el servicio, el barbero, el día y la hora, y cómo
            consultar o cancelar después tu reserva.
          </p>
          <p className="video-nota">
            <FaClosedCaptioning aria-hidden="true" /> Subtítulos en español activados. El video no se reproduce solo.
          </p>
        </div>

        <figure className="video-figura">
          <video
            className="video-tutorial"
            controls
            preload="metadata"
            playsInline
            poster="/video/como-reservar-poster.jpg"
            aria-describedby="video-descripcion"
          >
            <source src="/video/como-reservar.mp4" type="video/mp4" />
            <track kind="captions" src="/video/como-reservar.vtt" srcLang="es" label="Español" default />
            Tu navegador no puede reproducir este video. Puedes leer la transcripción más abajo.
          </video>
          <figcaption id="video-descripcion" className="sr-only">
            Video tutorial con subtítulos en español sobre cómo reservar una cita en Barber Reserve.
          </figcaption>

          <details className="video-transcripcion">
            <summary>Ver la transcripción del video</summary>
            <ol>
              <li>Entra a la página de Barber Reserve y elige “Reservar ahora”.</li>
              <li>Paso 1: elige el servicio. Verás el precio y cuánto dura.</li>
              <li>Paso 2: elige tu barbero, o “Cualquier barbero disponible” si te da igual.</li>
              <li>Paso 3: en el calendario, los días con horas libres están en azul. Elige un día y luego una hora.</li>
              <li>Paso 4: escribe tu nombre, tu celular de 10 dígitos y tu correo.</li>
              <li>Revisa el resumen y confirma. Recibirás un código de reserva: guárdalo.</li>
              <li>En “Mi reserva” puedes consultar el estado con tu código y tu correo, o cancelar hasta 2 horas antes.</li>
            </ol>
          </details>
        </figure>
      </div>
    </section>
  );
}
