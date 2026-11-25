import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Política de seguridad de contenido (CSP) en la versión compilada.
 * El navegador solo ejecuta scripts del propio sitio y solo se conecta a la
 * API de Barber Reserve: aunque alguien lograra inyectar código, no podría
 * cargar scripts, anuncios ni enviar datos a otro dominio.
 */
function politicaSeguridad(apiUrl) {
  let conexiones = "'self'"
  try {
    if (/^https?:\/\//i.test(apiUrl || '')) conexiones += ` ${new URL(apiUrl).origin}`
    else if (apiUrl && !apiUrl.startsWith('/')) conexiones += ` https://${apiUrl.replace(/\/.*$/, '')}`
  } catch {
    // URL inválida: solo el mismo origen
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    `connect-src ${conexiones}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    name: 'barberreserve-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), politicaSeguridad(env.VITE_API_URL || 'http://localhost:4000/api')],
    build: {
      // Sin mapas de código fuente en producción
      sourcemap: false,
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',  // <-- Backend
          changeOrigin: true
        }
      }
    }
  }
})
