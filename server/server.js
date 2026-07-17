const path = require('path');
const express = require('express');
const cors    = require('cors');

// Log de errores no capturados
process.on('uncaughtException',  err  => console.error('[crash] uncaughtException:', err));
process.on('unhandledRejection', err  => console.error('[crash] unhandledRejection:', err));

const STATIC_DIR = path.resolve(__dirname, '..');
console.log('[init] static dir:', STATIC_DIR);

const app = express();

app.use(cors());
app.use(express.json());

// Assets (imágenes, videos, audio) — caché de 30 días en el navegador
app.use('/assets', express.static(path.join(STATIC_DIR, 'assets'), {
  maxAge: '30d',
  immutable: true,
}));

// Resto de archivos estáticos (index.html, game.js, etc.) — sin caché
app.use(express.static(STATIC_DIR));

// Fallback explícito para la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// GET /health — para verificar que el servidor está vivo
app.get('/health', (_req, res) => res.json({ ok: true }));

// ══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PROJECT 84 server → http://localhost:${PORT}`);
});
