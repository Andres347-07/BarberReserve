import { Link } from "react-router-dom";

/**
 * Declaración de accesibilidad (entregable E5). Se publica dentro de la
 * aplicación, enlazada desde el pie de página del portal y del panel.
 */
const FECHA_REVISION = "24 de noviembre de 2026";

export default function Accesibilidad() {
  return (
    <article className="portal-contenedor portal-pagina declaracion" aria-labelledby="titulo-declaracion">
      <p className="hero-eyebrow hero-eyebrow-claro">Compromiso de accesibilidad</p>
      <h1 id="titulo-declaracion" className="reservar-titulo">Declaración de accesibilidad</h1>
      <p className="page-subtitle">Última revisión: {FECHA_REVISION}.</p>

      <section aria-labelledby="dec-compromiso">
        <h2 id="dec-compromiso">Nuestro compromiso</h2>
        <p>
          Barber Reserve busca que cualquier persona pueda reservar su cita y que el equipo de la barbería pueda
          gestionar su agenda, incluidas las personas con discapacidad visual, auditiva, motriz o cognitiva, y quienes
          usan lectores de pantalla, solo el teclado, ampliación de pantalla o un celular.
        </p>
      </section>

      <section aria-labelledby="dec-nivel">
        <h2 id="dec-nivel">Nivel de conformidad</h2>
        <p>
          El objetivo es cumplir las Pautas de Accesibilidad para el Contenido Web <strong>WCAG 2.1 nivel AA</strong> del W3C.
          Además, se aplican estos criterios de <strong>nivel AAA</strong>:
        </p>
        <ul>
          <li><strong>1.4.6 Contraste mejorado:</strong> con la opción “Alto contraste” activa, el texto alcanza al menos 7:1.</li>
          <li><strong>2.3.3 Animación por interacción:</strong> la opción “Reducir animaciones” desactiva el movimiento (y se respeta la preferencia del sistema).</li>
          <li><strong>2.4.8 Ubicación:</strong> el asistente de reserva indica en qué paso está la persona (“Paso 2 de 4”).</li>
          <li><strong>2.5.5 Tamaño del objetivo:</strong> los botones y controles principales miden al menos 44 × 44 píxeles.</li>
          <li><strong>3.3.5 Ayuda:</strong> los campos con formato (teléfono, código, horarios) traen instrucciones y ejemplos.</li>
        </ul>
        <p>Estado actual: <strong>parcialmente conforme</strong> (ver “Limitaciones conocidas”).</p>
      </section>

      <section aria-labelledby="dec-funciones">
        <h2 id="dec-funciones">Funciones de accesibilidad</h2>
        <ul>
          <li>Todo el sistema se puede usar solo con el teclado, con un indicador de foco visible y el enlace “Saltar al contenido principal”.</li>
          <li>El calendario de reservas se recorre con las flechas; cada día anuncia cuántas horas tiene disponibles.</li>
          <li>Todos los campos tienen etiqueta; los errores explican cómo corregirlos y llevan el cursor al campo con problema.</li>
          <li>Los estados (por ejemplo, Pendiente o Cancelada) se muestran con texto, no solo con color.</li>
          <li>Los avisos del sistema se anuncian a los lectores de pantalla y permanecen entre 6 y 10 segundos, con botón para cerrarlos.</li>
          <li>El video “Cómo reservar tu cita” tiene subtítulos en español, controles accesibles, transcripción y no se reproduce solo.</li>
          <li>
            Botón <strong>“Accesibilidad”</strong> con preferencias: alto contraste, tamaño del texto (hasta 150 %),
            reducir animaciones, subrayar enlaces y aumentar el espaciado del texto.
          </li>
          <li>Diseño adaptable a celular y a ampliación del navegador al 200 %.</li>
        </ul>
      </section>

      <section aria-labelledby="dec-limitaciones">
        <h2 id="dec-limitaciones">Limitaciones conocidas</h2>
        <ul>
          <li>Las pruebas con lectores de pantalla y con usuarios con discapacidad se están realizando; sus resultados se publicarán en la próxima revisión.</li>
          <li>Las reservas creadas antes de la versión 2.0 no tienen código y no se pueden consultar en línea.</li>
          <li>Las preferencias de accesibilidad se guardan en el navegador; si se borran los datos del navegador, hay que volver a elegirlas.</li>
        </ul>
      </section>

      <section aria-labelledby="dec-normativa">
        <h2 id="dec-normativa">Marco normativo</h2>
        <ul>
          <li>W3C. <em>Web Content Accessibility Guidelines (WCAG) 2.1</em>, Recomendación del W3C (2018, actualizada 2023).</li>
          <li>Icontec. <em>NTC 5854: Accesibilidad a páginas web</em> (2011).</li>
          <li>Ministerio TIC de Colombia. <em>Resolución 1519 de 2020, Anexo 1: Directrices de accesibilidad web</em> (exige WCAG 2.1 AA a los sujetos obligados).</li>
          <li>Congreso de Colombia. <em>Ley Estatutaria 1618 de 2013</em>, sobre los derechos de las personas con discapacidad.</li>
        </ul>
      </section>

      <section aria-labelledby="dec-evaluacion">
        <h2 id="dec-evaluacion">Cómo se evaluó</h2>
        <p>
          Revisión automática con WAVE, axe DevTools y Lighthouse sobre las vistas principales; revisión manual de navegación
          con teclado, orden del foco, contraste (Colour Contrast Analyser) y ampliación al 200 %.
        </p>
      </section>

      <section aria-labelledby="dec-contacto">
        <h2 id="dec-contacto">¿Encontraste una barrera?</h2>
        <p>
          Si algo no te funciona, comunícate con la barbería por sus canales de contacto e indica la página y lo que
          intentabas hacer. Mientras tanto, puedes reservar tu cita por teléfono o directamente en el local.
        </p>
        <p><Link to="/reservar" className="btn-primary">Reservar una cita</Link></p>
      </section>
    </article>
  );
}
