import { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";

import "./DataTable.css";

const FILAS_POR_PAGINA = 10;

export default function DataTable({
  columns,
  data,
  showActions = false,
  onEdit,
  onDelete,
  deshabilitarAcciones,
}) {

  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(data.length / FILAS_POR_PAGINA));

 
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [data.length, pagina, totalPaginas]);

  const inicio = (pagina - 1) * FILAS_POR_PAGINA;
  const filasVisibles = data.slice(inicio, inicio + FILAS_POR_PAGINA);

  return (

    <div className="tabla-container">

      <div className="tabla-scroll">

      <table>

        <thead>

          <tr>

            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}

            {showActions && <th>Acciones</th>}

          </tr>

        </thead>

        <tbody>

          {filasVisibles.length === 0 ? (

            <tr>

              <td
                colSpan={columns.length + (showActions ? 1 : 0)}
                style={{ textAlign: "center" }}
              >
                No hay registros.
              </td>

            </tr>

          ) : (

            filasVisibles.map((row) => (

              <tr key={row.id}>

                {columns.map((col) => (

                  <td key={col.key}>

                    {col.render
                      ? col.render(row)
                      : row[col.key]}

                  </td>

                ))}

                {showActions && (

                  <td className="acciones">

                    {onEdit && (
                      <button
                        className="btn-edit"
                        onClick={() => onEdit(row)}
                        disabled={!!deshabilitarAcciones?.(row)}
                        title={deshabilitarAcciones?.(row) || "Editar"}
                      >
                        <FaPen />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        className="btn-delete"
                        onClick={() => onDelete(row)}
                        disabled={!!deshabilitarAcciones?.(row)}
                        title={deshabilitarAcciones?.(row) || "Eliminar"}
                      >
                        <FaTrash />
                      </button>
                    )}

                  </td>

                )}

              </tr>

            ))

          )}

        </tbody>

      </table>

      </div>

      {data.length > FILAS_POR_PAGINA && (
        <div className="tabla-paginacion">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            ← Anterior
          </button>

          <span>Página {pagina} de {totalPaginas}</span>

          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Siguiente →
          </button>
        </div>
      )}

    </div>

  );

}
