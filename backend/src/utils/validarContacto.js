

const REGEX_TELEFONO = /^[0-9]{10}$/;
const REGEX_CORREO = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validarNombre(nombre, etiqueta = "El nombre") {
    if (!nombre || !nombre.trim()) {
        throw new Error(`${etiqueta} es obligatorio.`);
    }

    if (nombre.trim().length < 3) {
        throw new Error(`${etiqueta} debe contener mínimo 3 caracteres.`);
    }
}

function validarTelefono(telefono) {
    if (!telefono || !telefono.trim()) {
        throw new Error("El teléfono es obligatorio.");
    }

    if (!REGEX_TELEFONO.test(telefono)) {
        throw new Error("El teléfono debe contener exactamente 10 dígitos.");
    }
}

function validarCorreo(correo) {
    if (!correo || !correo.trim()) {
        throw new Error("El correo electrónico es obligatorio.");
    }

    if (!REGEX_CORREO.test(correo)) {
        throw new Error("Ingrese un correo electrónico válido.");
    }
}

module.exports = { validarNombre, validarTelefono, validarCorreo };
