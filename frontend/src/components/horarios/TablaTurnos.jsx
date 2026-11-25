import { horasDelTurno, formatoHoras } from "./utilHorario";

/**
 * Tabla editable de turnos por día. Cada fila permite:
 *  - Descanso, o
 *  - Horario corrido (entrada/salida), o
 *  - Horario partido (entrada/salida + pausa, p. ej. almuerzo).
 * Todos los campos tienen nombre accesible con su día, y los errores se
 * asocian a la fila con aria-describedby.
 */
export default function TablaTurnos({ dias, onCambiar, errores = {}, caption, mostrarFecha = false }) {
    const cambiar = (i, campo, valor) => onCambiar(i, campo, valor);

    return (
        <div className="turnos-scroll" role="region" aria-label={caption} tabIndex={0}>
            <table className="turnos-tabla">
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col">Día</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Entrada</th>
                        <th scope="col">Salida</th>
                        <th scope="col">Pausa desde <span className="turnos-opcional">(opcional)</span></th>
                        <th scope="col">Pausa hasta</th>
                        <th scope="col">Horas</th>
                    </tr>
                </thead>
                <tbody>
                    {dias.map((dia, i) => {
                        const nombre = dia.dia;
                        const descanso = dia.estado === "Descanso";
                        const error = errores[i];
                        const idError = `turno-error-${i}`;
                        const describe = error ? idError : undefined;
                        return (
                            <tr key={dia.fecha || dia.diaSemana} className={descanso ? "turno-descanso" : ""}>
                                <th scope="row">
                                    {nombre}
                                    {mostrarFecha && <span className="turno-fecha">{dia.fecha.split("-").reverse().join("/")}</span>}
                                    {dia.origen === "excepcion" && <span className="turno-origen">Excepción</span>}
                                    {error && <span className="turno-error" id={idError} role="alert">{error}</span>}
                                </th>
                                <td>
                                    <select
                                        aria-label={`Estado del ${nombre}`}
                                        value={dia.estado}
                                        onChange={(e) => cambiar(i, "estado", e.target.value)}
                                    >
                                        <option value="Activo">Trabaja</option>
                                        <option value="Descanso">Descanso</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="time" step="900" aria-label={`Hora de entrada del ${nombre}`} disabled={descanso}
                                        value={dia.horaInicio || ""} aria-invalid={!!error} aria-describedby={describe}
                                        onChange={(e) => cambiar(i, "horaInicio", e.target.value)} />
                                </td>
                                <td>
                                    <input type="time" step="900" aria-label={`Hora de salida del ${nombre}`} disabled={descanso}
                                        value={dia.horaFin || ""} aria-invalid={!!error} aria-describedby={describe}
                                        onChange={(e) => cambiar(i, "horaFin", e.target.value)} />
                                </td>
                                <td>
                                    <input type="time" step="900" aria-label={`Inicio de la pausa del ${nombre} (opcional)`} disabled={descanso}
                                        value={dia.pausaInicio || ""} aria-describedby={describe}
                                        onChange={(e) => cambiar(i, "pausaInicio", e.target.value)} />
                                </td>
                                <td>
                                    <input type="time" step="900" aria-label={`Fin de la pausa del ${nombre}`} disabled={descanso}
                                        value={dia.pausaFin || ""} aria-describedby={describe}
                                        onChange={(e) => cambiar(i, "pausaFin", e.target.value)} />
                                </td>
                                <td className="turno-horas">{descanso ? "—" : formatoHoras(horasDelTurno(dia))}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
