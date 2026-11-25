import { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";

import "./DataTable.css";

const FILAS_POR_PAGINA = 10;

/**
 * Tabla compartida del panel.
 *  - caption: descripción de la tabla para lectores de pantalla (WCAG 1.3.1).
 *  - etiquetaFila(row): texto que identifica la fila; se usa para que cada
 *    botón de acción tenga un nombre único ("Editar Juan Pérez").
 *  - accionesExtra(row): botones adicionales por fila.
 */
export default function DataTable({
  columns,
  data,
  showActions = false,
  onEdit,
  onDelete,
  deshabilitarAcciones,
  deshabilitarEliminar,
  caption,
  etiquetaFila,
  accionesExtra,
  textoVacio = "No hay registros.",
}) {

  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(data.length / FILAS_POR_PAGINA));

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [data.length, pagina, totalPaginas]);

  const inicio = (pagina - 1) * FILAS_POR_PAGINA;
  const filasVisibles = data.slice(inicio, inicio + FILAS_POR_PAGINA);

  const nombreFila = (row) => (etiquetaFila ? etiquetaFila(row) : row.nombre || `registro ${row.id}`);

  return (

    <div className="tabla-container">

      <div className="tabla-scroll" role="region" aria-label={caption || "Tabla de registros"} tabIndex={0}>

      <table>

        {caption && (
          <caption className="sr-only">
            {caption}
            {data.length > FILAS_POR_PAGINA ? ` — página ${pagina} de ${totalPaginas}` : ""}
          </caption>
        )}

        <thead>

          <tr>

            {columns.map((col) => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}

            {showActions && <th scope="col">Acciones</th>}

          </tr>

        </thead>

        <tbody>

          {filasVisibles.length === 0 ? (

            <tr>

              <td
                colSpan={columns.length + (showActions ? 1 : 0)}
                className="tabla-vacia"
              >
                {textoVacio}
              </td>

            </tr>

          ) : (

            filasVisibles.map((row) => {

              const motivoBloqueo = deshabilitarAcciones?.(row) || "";
              const motivoBloqueoEliminar = deshabilitarEliminar ? (deshabilitarEliminar(row) || "") : motivoBloqueo;

              return (

              <tr key={row.id}>

                {columns.map((col) => (

                  <td key={col.key} data-label={col.label}>

                    {col.render
                      ? col.render(row)
                      : row[col.key]}

                  </td>

                ))}

                {showActions && (

                  <td className="acciones-celda" data-label="Acciones">

                    <div className="acciones">

                    {accionesExtra?.(row)}

                    {onEdit && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => onEdit(row)}
                        disabled={!!motivoBloqueo}
                        aria-label={`Editar ${nombreFila(row)}`}
                        title={motivoBloqueo || "Editar"}
                      >
                        <FaPen aria-hidden="true" />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => onDelete(row)}
                        disabled={!!motivoBloqueoEliminar}
                        aria-label={`Eliminar ${nombreFila(row)}`}
                        title={motivoBloqueoEliminar || "Eliminar"}
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    )}

                    </div>

                  </td>

                )}

              </tr>

              );

            })

          )}

        </tbody>

      </table>

      </div>

      {data.length > FILAS_POR_PAGINA && (
        <nav className="tabla-paginacion" aria-label="Paginación de la tabla">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            <span aria-hidden="true">←</span> Anterior
          </button>

          <span aria-live="polite">Página {pagina} de {totalPaginas}</span>

          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Siguiente <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}

    </div>

  );

}
