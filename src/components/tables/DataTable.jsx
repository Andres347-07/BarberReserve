import "./DataTable.css";

export default function DataTable({
  columns,
  data,
  showActions = false,
  onEdit,
  onDelete,
}) {

  return (

    <div className="tabla-container">

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

          {data.length === 0 ? (

            <tr>

              <td
                colSpan={columns.length + (showActions ? 1 : 0)}
                style={{ textAlign: "center" }}
              >
                No hay registros.
              </td>

            </tr>

          ) : (

            data.map((row) => (

              <tr key={row.id}>

                {columns.map((col) => (
                  <td key={col.key}>
                    {row[col.key]}
                  </td>
                ))}

                {showActions && (

                  <td className="acciones">

                    <button
                      className="btn-edit"
                      onClick={() => onEdit && onEdit(row)}
                    >
                      ✏️
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => onDelete && onDelete(row.id)}
                    >
                      🗑️
                    </button>

                  </td>

                )}

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}