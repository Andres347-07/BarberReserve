import "./DataTable.css";

export default function DataTable({
  columns,
  data,
  showActions = false,
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

          {data.map((row) => (
            <tr key={row.id}>

              {columns.map((col) => (
                <td key={col.key}>
                  {row[col.key]}
                </td>
              ))}

              {showActions && (

                <td className="acciones">

                  <button className="btn-edit">
                    ✏️
                  </button>

                  <button className="btn-delete">
                    🗑️
                  </button>

                </td>

              )}

            </tr>
          ))}

        </tbody>

      </table>
    </div>
  );
}