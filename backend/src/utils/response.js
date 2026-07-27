
function ok(res, status, data, message) {
    return res.status(status).json({
        success: true,
        ...(message && { message }),
        data,
    });
}

function fail(res, status, message, detalles) {
    return res.status(status).json({
        success: false,
        message,
        ...(detalles && { detalles }),
    });
}

module.exports = { ok, fail };
