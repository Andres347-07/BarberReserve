/** Campo con etiqueta, ayuda y error asociados (WCAG 1.3.1, 3.3.1, 3.3.2). */
export default function CampoTexto({ id, etiqueta, ayuda, error, ...props }) {
    const describe = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    return (
        <div className="form-group">
            <label htmlFor={id}>{etiqueta}</label>
            <input id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describe} {...props} />
            {ayuda && <p className="campo-ayuda" id={`${id}-ayuda`}>{ayuda}</p>}
            {error && <p className="error-text" id={`${id}-error`}>{error}</p>}
        </div>
    );
}
