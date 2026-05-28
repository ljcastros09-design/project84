const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const twilio  = require('twilio');

const app    = express();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM   = process.env.TWILIO_PHONE_NUMBER;

app.use(cors());
app.use(express.json());

// Sirve el juego desde la carpeta raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// Número del jugador (en memoria por sesión)
let playerPhone = null;

// ══════════════════════════════════════════════════════
// TODOS LOS MENSAJES DEL JUEGO — ES / EN
// ══════════════════════════════════════════════════════
const MESSAGES = {
  es: {
    // Bienvenida
    welcome:             'Bienvenido a PROJECT 84. Mantén tu teléfono cerca. Siempre.',

    // Fase 1 — Obstáculo 1 (charco y piedras)
    obstaculo1a:         'Ten cuidado con lo que hay en el suelo. Salta tan pronto se aproxime el peligro.',
    obstaculo1b:         'Sigue. No te detengas.',

    // Fase 1 — Obstáculo 2 (reja y palanca)
    obstaculo2a:         'Retrocede. Hay algo detrás de ti que necesitas activar.',
    obstaculo2b:         'Bien hecho. Continúa. No mires a los lados.',
    codigo_pista1:       'Las revoluciones la prometieron. Los gobiernos la prometieron. El mercado la prometió. Ninguno cumplió.',
    codigo_pista2:       'Ha existido en la mente de todos pero en las manos de muy pocos.',
    codigo_pista3:       'Empieza con L.',
    codigo_pista4:       'L - I - B - _ - _ - _ - _',
    codigo_pista5:       'La respuesta era LIBERTAD. Qué curioso que necesitaras ayuda para encontrarla.',

    // Fase 2 — Diálogo cabra
    cabra1:              '¿Con quién hablas? Nadie te dio permiso de detenerte.',
    cabra2:              'Esa criatura te está mintiendo. Sigue tu camino.',
    cabra3:              'CONTINÚA. AHORA.',

    // Fase 3 — Bifurcación
    bifurcacion1:        'Para. Escucha. El camino derecho es una trampa. La criatura que viste ha matado a todos los que pasaron por ahí. No es tu aliada.',
    bifurcacion2:        'Todo lo que te dijo es mentira. Es una resentida. Nosotros somos los únicos que te protegen.',
    bifurcacion3:        'Ve a la IZQUIERDA. Es la única salida segura. Confía en nosotros. Siempre hemos estado contigo.',
    bifurcacion4:        '¿Qué esperas? VE A LA IZQUIERDA. AHORA.',

    // Camino izquierdo — obstáculo zombie
    izq_obs1:            'Hay algo bloqueando tu paso. No intentes cruzar todavía.',
    izq_obs2:            'Súbete al árbol que está frente a ti. Usa las ramas.',
    izq_obs3:            'Bien. Ahora espera ahí arriba. No bajes todavía.',
    izq_obs4:            'Observa su patrón de movimiento. Aprende cuándo se aleja.',
    izq_obs5:            'Cuando se aleje completamente hacia la izquierda... baja y corre. No lo dudes.',
    izq_obs6:            'Estás cerca. Ya casi llegas.',

    // Camino izquierdo (final malo)
    izquierda1:          'Sabíamos que elegirías bien. Sigue adelante.',
    izquierda_obstaculo: 'Hay alguien bloqueando tu paso. Espera a que se mueva. Luego cruza.',
    izquierda2:          'Estás cerca. No te detengas ahora.',
    izquierda3:          'Perfecto. Ya casi llegas. Lo que buscas está justo adelante.',
    izquierda_final:     'Bien hecho. Sabíamos que siempre fuiste uno de los nuestros.',

    // Camino derecho (final bueno)
    derecha1:            '¿Qué estás haciendo? ESE NO ES EL CAMINO.',
    derecha2:            'REGRESA. AHORA MISMO.',
    derecha3:            'Te lo advertimos. Lo que hay ahí te destruirá. Aún puedes volver.',
    derecha4:            '¿Nos estás ignorando? SABEMOS DÓNDE ESTÁS.',
    derecha5:            'Cometemos un error muy grave. Tenemos gente en todos lados. No llegarás lejos.',
    derecha6:            'OBEDECE. ES TU ÚLTIMA OPORTUNIDAD.',
    derecha7:            '...',
    derecha8:            '...',
    derecha9:            'Esta vez ganaste. Pero te estaremos observando.',

    // Columnas
    col1_cae:            '¿Ves? Te dijimos que era peligroso. Aún puedes regresar.',
    col1_muere:          'REGRESA. ESTO SOLO EMPEORARÁ.',
    col1_pasa:           'No llegarás lejos. Tenemos gente en todos lados.',
    col2_pasa:           'OBEDECE. ES TU ÚLTIMA OPORTUNIDAD.',
  },

  en: {
    // Welcome
    welcome:             'Welcome to PROJECT 84. Keep your phone close. Always.',

    // Phase 1 — Obstacle 1 (puddle and stones)
    obstaculo1a:         'Be careful with what is on the ground. Jump as soon as the danger approaches.',
    obstaculo1b:         'Keep going. Do not stop.',

    // Phase 1 — Obstacle 2 (gate and lever)
    obstaculo2a:         'Go back. There is something behind you that you need to activate.',
    obstaculo2b:         'Well done. Keep moving. Do not look to the sides.',
    codigo_pista1:       'Revolutions promised it. Governments promised it. The market promised it. None delivered.',
    codigo_pista2:       'It has existed in the minds of all but in the hands of very few.',
    codigo_pista3:       'It starts with F.',
    codigo_pista4:       'F - R - E - _ - _ - _',
    codigo_pista5:       'The answer was FREEDOM. How curious that you needed help to find it.',

    // Phase 2 — Goat dialogue
    cabra1:              'Who are you talking to? Nobody gave you permission to stop.',
    cabra2:              'That creature is lying to you. Keep moving.',
    cabra3:              'CONTINUE. NOW.',

    // Phase 3 — Fork
    bifurcacion1:        'Stop. Listen. The right path is a trap. The creature you saw has killed everyone who went that way. It is not your ally.',
    bifurcacion2:        'Everything it told you is a lie. It is resentful. We are the only ones protecting you.',
    bifurcacion3:        'Go LEFT. It is the only safe way out. Trust us. We have always been with you.',
    bifurcacion4:        'What are you waiting for? GO LEFT. NOW.',

    // Left path (bad ending)
    izquierda1:          'We knew you would choose well. Keep going.',
    izquierda_obstaculo: 'Someone is blocking your path. Wait for them to move. Then cross.',
    izquierda2:          'You are close. Do not stop now.',
    izquierda3:          'Perfect. Almost there. What you are looking for is just ahead.',
    izquierda_final:     'Well done. We always knew you were one of us.',

    // Left path — zombie obstacle
    izq_obs1:            'Something is blocking your path. Do not try to cross yet.',
    izq_obs2:            'Climb the tree in front of you. Use the branches.',
    izq_obs3:            'Good. Now wait up there. Do not come down yet.',
    izq_obs4:            'Observe its movement pattern. Learn when it moves away.',
    izq_obs5:            'When it moves completely to the left... come down and run. Do not hesitate.',
    izq_obs6:            'You are close. Almost there.',

    // Right path (good ending)
    derecha1:            'What are you doing? THAT IS NOT THE WAY.',
    derecha2:            'COME BACK. RIGHT NOW.',
    derecha3:            'We warned you. What is there will destroy you. You can still turn back.',
    derecha4:            'Are you ignoring us? WE KNOW WHERE YOU ARE.',
    derecha5:            'We made a very serious mistake. We have people everywhere. You will not get far.',
    derecha6:            'OBEY. THIS IS YOUR LAST CHANCE.',
    derecha7:            '...',
    derecha8:            '...',
    derecha9:            'You won this time. But we will be watching.',

    // Columns
    col1_cae:            'You see? We told you it was dangerous. You can still turn back.',
    col1_muere:          'COME BACK. THIS WILL ONLY GET WORSE.',
    col1_pasa:           'You will not get far. We have people everywhere.',
    col2_pasa:           'OBEY. THIS IS YOUR LAST CHANCE.',
  }
};

// ── Helper: enviar WhatsApp vía Twilio Sandbox ──
async function sendSMS(to, body) {
  const numero = to.replace(/\D/g, '');
  const fromWA = 'whatsapp:+14155238886';
  const toWA   = `whatsapp:+${numero}`;
  console.log('[Twilio] Enviando a:', toWA, '| Mensaje:', body);
  const message = await client.messages.create({ body, from: fromWA, to: toWA });
  console.log('[Twilio] Respuesta SID:', message.sid);
  return message;
}

// ══════════════════════════════════════════════════════
// ENDPOINTS
// ══════════════════════════════════════════════════════

// POST /register — guarda el número y envía bienvenida
app.post('/register', async (req, res) => {
  console.log('[register] Petición recibida:', req.body);
  const { phone, lang = 'es' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Se requiere número de teléfono' });
  }

  playerPhone = phone;

  try {
    const body = MESSAGES[lang]?.welcome ?? MESSAGES.es.welcome;
    await sendSMS(phone, body);
    console.log('[register] Bienvenida enviada OK a', phone);
  } catch (err) {
    console.log('[register] Error Twilio:', err.message);
  }

  res.json({ ok: true });
});

// POST /sms — envía un mensaje de juego por clave
app.post('/sms', async (req, res) => {
  console.log('[sms] Petición recibida:', req.body);
  const { key, lang = 'es', phone } = req.body;

  const target = playerPhone || phone;
  if (!target) {
    return res.status(400).json({ error: 'No hay jugador registrado' });
  }
  if (!key) {
    return res.status(400).json({ error: 'Se requiere la clave del mensaje' });
  }

  // Restaurar playerPhone si se había perdido (reinicio del servidor)
  if (!playerPhone && phone) playerPhone = phone;

  const body = MESSAGES[lang]?.[key] ?? MESSAGES.es[key];
  if (!body) {
    return res.status(404).json({ error: `Clave desconocida: ${key}` });
  }

  try {
    await sendSMS(target, body);
    console.log('[sms] Enviado OK:', key, '→', target);
    res.json({ ok: true });
  } catch (err) {
    console.log('[sms] Error Twilio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /health — para verificar que el servidor está vivo
app.get('/health', (_req, res) => res.json({ ok: true, player: playerPhone ?? null }));

// ══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PROJECT 84 server → http://localhost:${PORT}`);
});
