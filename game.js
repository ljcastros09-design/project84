// game.js — PROJECT 84 engine

const GAME = (() => {

  // ── Tuning ────────────────────────────────────
  const MOVE_SPEED    = 280;
  const HIGH_JUMP_VEL = 820;
  const GRAVITY       = 1500;
  const WALK_FPS      = 7;
  const HIGH_FPS      = 5;
  const ANCHOR_RATIO  = 0.28;
  const GROUND_BOTTOM = 0.07;
  const MIN_WORLD_X   = 80;
  const RABBIT_W      = 80;

  // ── Obstáculo 1: Espinas ──────────────────────
  // El conejo debe estar a más de SPINE_CLEAR px sobre el suelo al cruzarlas
  const SPINE_CLEAR = 150;   // altura mínima para esquivar (px sobre el suelo)

  const SPINES = [
    { wx: 1600, w: 100, checkpoint: 1500 },  // primera tanda — reinicia antes de ella
    { wx: 2500, w: 100, checkpoint: 200  },  // segunda tanda — reinicia desde el inicio del mapa
  ];

  const SPINE_SMS_X = 1430; // enviar SMS justo antes de la primera

  // ── Obstáculo 2: Reja y palanca ──────────────────
  const REJA_X        = 5800;
  const PALANCA_X     = 5200;
  const PALANCA_RANGE = 120;   // distancia de interacción (px)
  const REJA_SMS_X    = 5580;  // disparar obstaculo2a al acercarse

  // ── Fase 2: video cabra ───────────────────────────
  const GOAT_VIDEO_X  = 6800;

  // ── Escenario 4: diálogo cabra ────────────────────
  const CABRA_WORLD_X     = 900;
  const CABRA_RANGE       = 140;
  const PARALLAX_SPEEDS_2    = [0.12, 0.55];
  const BIFURCACION_X        = 2600;  // dispara video two_ways tras caminar ~6 s
  const PARALLAX_SPEEDS_LEFT  = [0.10, 0.48];
  const PARALLAX_SPEEDS_RIGHT  = [0.10, 0.38, 0.72];
  // ── Obstáculo: Raíces ─────────────────────────
  const RAICES_X            = 1200;  // posición world
  const RAICES_W            = 200;   // ancho zona letal
  const RAICES_APPROACH_D   = 300;   // distancia que dispara la subida
  const RAICES_CHECKPOINT_X = 750;   // respawn antes de las raíces

  // ── Obstáculo: Columnas ───────────────────────
  const COL1_X            = 2600;  // posición world columna 1
  const COL1_W            = 130;   // ancho zona letal
  const COL1_CHECKPOINT_X = 2300;  // respawn antes de col1
  const COL2_X            = 3500;  // posición world columna 2
  const COL2_W            = 130;
  const COL2_CHECKPOINT_X = 3100;  // respawn entre col1 y col2
  const COL_TRIGGER_D     = 300;   // distancia de disparo desde el borde

  // ── Jefe Final: El Guardián Gigante ──────────────
  const GIGANTE_INIT_X       = 5500;  // entra desde la derecha (fuera de pantalla)
  const GIGANTE_TRIGGER_X    = 4300;  // cx del conejo que dispara la aparición
  const GIGANTE_SPEED        = 55;    // px/s de patrulla
  const GIGANTE_W            = 260;   // ancho aprox. de colisión
  const GIGANTE_ANIM_FPS     = 2.5;   // frames/s animación caminata
  const GIGANTE_CHECKPOINT_X = 4000;  // respawn al inicio de la sala del jefe
  const PALANCA_GIG_X        = 4150;  // world X de la palanca del gigante (justo después de col2)
  const CARCEL_X             = 4800;  // world X donde cae la jaula (mitad del trayecto)
  const CARCEL_W             = 320;   // ancho de colisión de la jaula
  const CARCEL_FALL_SPEED    = 900;   // px/s de caída y ascenso
  const PALANCA_GIG_RANGE    = 120;   // distancia de interacción (px)
  const GIGANTE_PATROL_LEFT  = 3980;  // límite izquierdo (pasa un poco más allá de la palanca)
  const GIGANTE_PATROL_RIGHT = 5400;  // límite derecho de patrulla (world X)
  const GIGANTE_BARRIER_X    = 5500;  // pared invisible — conejo no pasa hasta que el gigante esté atrapado
  const STOMP_INTERVAL       = 6.0;   // segundos entre pisotones
  const STOMP_FRONT_T        = 0.4;   // segundos mostrando gigante-frente (pausa antes de levantar pie)
  const STOMP_WARN_T         = 1.1;   // segundos con pie arriba (ventana para escapar)
  const STOMP_HIT_T          = 0.3;   // segundos mostrando aplastando (más rápido = más natural)

  const LEFT_SPINE_X          = 900;   // posición world del obstáculo espinas
  const LEFT_SPINE_W          = 100;   // ancho de la zona letal

  // ── Zombie (camino izquierdo) ────────────────
  const ZOMBIE_MIN      = 1900;   // límite izquierdo de patrulla (cerca del árbol)
  const ZOMBIE_MAX      = 3600;   // límite derecho
  const ZOMBIE_SPEED    = 65;     // px/s — lento y mecánico
  const ZOMBIE_ANIM_FPS = 1.3;    // cuadros por segundo de animación

  // ── Árbol y ramas ─────────────────────────────
  const TREE_X            = 1700;           // world X del tronco
  const TREE_BRANCH_HW    = 170;            // half-width del área de colisión de ramas
  const TREE_SNAP_DIST    = 32;             // margen de captura al caer hacia una rama
  const TREE_BRANCH_Y     = [130, 280, 430, 580]; // alturas (px sobre el suelo)

  // ── Assets ────────────────────────────────────
  const FRAME_STAND = 'assets/personajes/rabbit/emotions/standing_rabbit.png';
  const FRAMES_WALK = [
    'assets/personajes/rabbit/normal_jump/rabbit_prepared_to_jump.png',
    'assets/personajes/rabbit/normal_jump/rabbit_in_the_air.png',
    'assets/personajes/rabbit/normal_jump/rabbit_landing.png',
  ];
  const FRAMES_HIGH = [
    'assets/personajes/rabbit/high_jump/rabbit_prepared_to_jump_high.png',
    'assets/personajes/rabbit/high_jump/rabbit_jumping_high.png',
    'assets/personajes/rabbit/high_jump/rabbit_landing2.png',
  ];

  const PARALLAX_SPEEDS = [0.15, 0.45, 0.82];

  // ── Estado ────────────────────────────────────
  let rabbitX     = 200;
  let jumpY       = 0;
  let jumpVel     = 0;
  let onGround    = true;
  let facingRight = true;
  let isHighJump  = false;
  let walkFrame   = 0;
  let highFrame   = 0;
  let animAccum   = 0;
  let dying       = false;
  let jumpsUsed   = 0;   // doble salto: 0 = en suelo, 1 = primer salto, 2 = segundo salto

  let spineSmsSent = false;
  let rejaOpen          = false;
  let rejaSmsSent       = false;
  let nearPalanca       = false;
  let goatVideoTriggered = false;
  let inPhase2               = false;
  let nearCabra              = false;
  let dialogActive           = false;
  let bifurcacionTriggered   = false;
  let inLeftPath             = false;
  let inRightPath            = false;

  // ── Final camino derecho ──
  let rightWorldStopped = false;
  let rightEndTriggered = false;

  // ── Estado palanca y jaula gigante ──
  let palancaGigEl       = null;
  let palancaGigActivada = false;
  let nearPalancaGig     = false;
  let carcelEl           = null;
  let carcelState        = 'idle';  // 'idle' | 'falling' | 'resetting' | 'trapped'
  let carcelBottomY      = 0;       // posición CSS bottom en px

  // ── Estado gigante ──
  let giganteEl          = null;
  let giganteX           = GIGANTE_INIT_X;
  let giganteDir         = -1;        // -1 izquierda, +1 derecha
  let giganteTriggered   = false;
  let giganteActive      = false;
  let giganteFrame       = 0;
  let giganteFrameT      = 0;
  let giganteWalkT       = 0;         // tiempo caminando desde el último pisotón
  let giganteStompT      = 0;         // timer dentro de la fase de pisotón
  let giganteState       = 'walking'; // 'walking' | 'warning' | 'stomping'
  let giganteDeaths      = 0;
  let audioGiganteGrune  = null;
  let audioPasoGigante   = null;
  let giganteGruneTimer  = 0;   // cuenta regresiva para gruñido ocasional

  // ── Estado columnas ──
  let col1El = null; let col2El = null;
  let col1State = 'up'; let col2State = 'up'; // 'up'|'falling'|'down'|'rising'
  let col1Triggered = false; let col2Triggered = false;
  let col1FirstFall = false;
  let col1Deaths = 0; let col2Deaths = 0;
  let col1Passed = false; let col2Passed = false;
  let col1TO = null; let col2TO = null;

  // ── Estado raíces ──
  let raicesEl         = null;
  let raicesState      = 'hidden'; // 'hidden' | 'up' | 'down'
  let raicesApproached = false;
  let raicesDeaths     = 0;
  let raicesPassed     = false;
  let raicesFrame      = 0;
  let raicesAnimInt    = null;
  let raicesCycleTO    = null;
  let raicesWindowTO   = null;
  let onBranch               = false;
  let onBranchY              = 0;
  let arbolEl                = null;
  let zombieEl               = null;
  let zombieX                = ZOMBIE_MIN;
  let zombieDir              = 1;
  let zombieAnimAcc          = 0;
  let zombieFrame            = 0;
  // SMS del obstáculo zombie
  let lSms1 = false, lSms2 = false, lSms3 = false;
  let lSms4 = false, lSms5 = false, lSms6 = false;
  // Final del camino izquierdo
  let leftWorldStopped  = false;
  let leftAutoWalk      = false;
  let leftEndTriggered  = false;
  let frozenCameraX     = -1;     // cameraX fija cuando el mundo se detiene (compartida entre fases)
  // Transición Fase 1 → video cabra
  let p1WorldStopped = false;
  let p1AutoWalk     = false;
  let p1EndTriggered = false;
  // Transición Fase 2 → bifurcación
  let p2WorldStopped = false;
  let p2AutoWalk     = false;
  let p2EndTriggered = false;

  let keys            = {};
  let running         = false;
  let lastTs          = 0;
  let currentLang     = 'es';
  let walkingOnGround = false;

  // ── DOM refs ──────────────────────────────────
  let layers         = [];
  let rabbitEl       = null;
  let announcementEl = null;
  let audioPhase1    = null;
  let audioFootstep  = null;
  let rejaEl         = null;
  let palancaEl      = null;
  let interactEl     = null;
  let cabraEl        = null;
  let cabraGlowEl    = null;
  let cabraGlowEl2   = null;
  let cabraExplaining = false;

  // ── Preload cache (keep refs alive so browser doesn't cancel downloads) ──
  const _imgCache = [];
  let framesReady = false;

  // ── Helpers ───────────────────────────────────
  // Reintenta en caso de error (cancelación por latencia, hiccup de red)
  // en vez de darla por cargada — si no, framesReady se activa con una
  // imagen que nunca llegó a estar en caché.
  function loadOne(src, retriesLeft = 2) {
    return new Promise(resolve => {
      const img = new Image();
      _imgCache.push(img);
      img.onload  = () => resolve(img);
      img.onerror = () => {
        if (retriesLeft > 0) resolve(loadOne(src, retriesLeft - 1));
        else { console.warn('[preload] no se pudo cargar:', src); resolve(img); }
      };
      img.src = src;
    });
  }

  function preload(paths) {
    return Promise.all(paths.map(src => loadOne(src)));
  }

  function fadeOut(audio, ms = 800) {
    const step = audio.volume / (ms / 50);
    const id = setInterval(() => {
      if (audio.volume > step) audio.volume -= step;
      else { audio.pause(); audio.volume = 0; clearInterval(id); }
    }, 50);
  }

  function fadeIn(audio, target = 0.65, ms = 1200) {
    audio.volume = 0;
    audio.play().catch(() => {});
    const step = target / (ms / 50);
    const id = setInterval(() => {
      if (audio.volume + step < target) audio.volume += step;
      else { audio.volume = target; clearInterval(id); }
    }, 50);
  }

  // ── Muerte y respawn ──────────────────────────
  function die(checkpointX) {
    if (dying) return;
    dying = true;

    const activeAudios = ['audio-phase1','audio-phase2','audio-phase3']
      .map(id => document.getElementById(id))
      .filter(a => a && !a.paused && !a.muted);
    activeAudios.forEach(a => { a.muted = true; });
    setTimeout(() => { activeAudios.forEach(a => { a.muted = false; }); }, 900);
    audioFootstep.pause();

    setTimeout(() => {
      rabbitX     = checkpointX;
      jumpY       = 0;
      jumpVel     = 0;
      onGround    = true;
      facingRight = true;
      isHighJump  = false;
      jumpsUsed   = 0;
      dying       = false;
    }, 450);
  }

  // ── Colisión espinas ──────────────────────────
  function checkSpines(cx) {
    if (dying) return;
    for (const s of SPINES) {
      if (cx >= s.wx && cx <= s.wx + s.w && jumpY < SPINE_CLEAR) {
        die(s.checkpoint);
        return;
      }
    }
  }

  // ── Posicionar espinas en pantalla ────────────
  function updateSpinesDOM(cameraX) {
    SPINES.forEach((s, i) => {
      const el = document.getElementById(`espinas${i + 1}`);
      if (!el) return;
      el.style.left = `${s.wx - cameraX}px`;
      // bottom: 0 fijo en CSS — salen del borde inferior
    });
  }

  // ── SMS ───────────────────────────────────────
  function checkSMS() {
    if (!spineSmsSent && rabbitX >= SPINE_SMS_X) {
      spineSmsSent = true;
      window.sendSMS('obstaculo1a');
    }
  }

  // ── Obstáculo 2: colisión reja ────────────────
  function checkReja() {
    if (rejaOpen || dying) return;
    if (rabbitX + RABBIT_W > REJA_X) {
      rabbitX = REJA_X - RABBIT_W;
      if (!rejaSmsSent) {
        rejaSmsSent = true;
        window.sendSMS('obstaculo2a');
      }
    }
  }

  // ── Obstáculo 2: DOM ──────────────────────────
  function updateObstacle2DOM(cameraX, groundPx) {
    if (rejaEl)    rejaEl.style.left    = `${REJA_X - cameraX}px`;
    if (palancaEl) {
      palancaEl.style.left = `${PALANCA_X - cameraX}px`;
    }
    if (interactEl) {
      interactEl.style.left    = `${PALANCA_X - cameraX + 12}px`;
      interactEl.style.bottom  = `${groundPx + 90}px`;
      interactEl.style.opacity = (nearPalanca && !rejaOpen) ? '1' : '0';
    }
  }

  // ── Announcement ─────────────────────────────
  function showAnnouncement() {
    const texts = window.noPhoneMode
      ? { es: 'Presta atención a los mensajes<br>que aparecen en la pantalla.',
          en: 'Pay attention to the messages<br>that appear on screen.' }
      : { es: 'Mantén tu teléfono cerca.<br>Presta atención a cada mensaje que recibas.',
          en: 'Keep your phone close.<br>Pay attention to every message you receive.' };
    announcementEl.innerHTML = texts[currentLang] || texts.es;
    announcementEl.style.opacity = '1';
    setTimeout(() => { announcementEl.style.opacity = '0'; }, 5000);
  }

  // ── Parallax ─────────────────────────────────
  function updateParallax(cameraX) {
    if (inLeftPath) {
      layers[0].style.backgroundPositionX = `${-(cameraX * PARALLAX_SPEEDS_LEFT[0])}px`;
      layers[1].style.backgroundPositionX = `${-(cameraX * PARALLAX_SPEEDS_LEFT[1])}px`;
    } else if (inRightPath) {
      layers.forEach((layer, i) => {
        layer.style.backgroundPositionX = `${-(cameraX * PARALLAX_SPEEDS_RIGHT[i])}px`;
      });
    } else if (inPhase2) {
      layers[0].style.backgroundPositionX = `${-(cameraX * PARALLAX_SPEEDS_2[0])}px`;
      layers[1].style.backgroundPositionX = `${-(cameraX * PARALLAX_SPEEDS_2[1])}px`;
    } else {
      layers.forEach((layer, i) => {
        layer.style.backgroundPositionX = `${-(cameraX * PARALLAX_SPEEDS[i])}px`;
      });
    }
  }

  // ── Input ─────────────────────────────────────
  function setupInput() {
    window.addEventListener('keydown', e => {
      keys[e.code] = true;

      if ((e.code === 'Space' || e.code === 'ArrowUp') && jumpsUsed < 2 && !dying && !dialogActive) {
        triggerHighJump();
        e.preventDefault();
      }
      if (e.code === 'KeyE') {
        if (!inPhase2 && !inLeftPath && !inRightPath && nearPalanca && !rejaOpen && !dying) window.openCodePanel?.();
        if (inPhase2  && nearCabra  && !dialogActive)                                       window.startGoatDialog?.();
        if (inRightPath && nearPalancaGig && !dying && carcelState === 'idle') {
          palancaGigActivada = !palancaGigActivada;
          if (palancaGigEl) palancaGigEl.src = palancaGigActivada
            ? 'assets/obstaculos/gigante/palanca-activada.png'
            : 'assets/obstaculos/gigante/palanca-desactivada.png';
          // Al activar → soltar la jaula
          if (palancaGigActivada && carcelEl) {
            carcelState   = 'falling';
            carcelBottomY = window.innerHeight;
            carcelEl.style.display = 'block';
          }
        }
      }
      if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
  }

  function triggerHighJump() {
    if (jumpsUsed >= 2) return;
    jumpVel    = HIGH_JUMP_VEL;
    onGround   = false;
    onBranch   = false;   // sale de la rama al saltar
    isHighJump = true;
    highFrame  = 0;
    animAccum  = 0;
    jumpsUsed++;
  }

  let _lastSrc = '';
  function setFrame(src) {
    if (_lastSrc !== src) { rabbitEl.src = src; _lastSrc = src; }
  }

  // ── Loop ──────────────────────────────────────
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    const W        = window.innerWidth;
    const H        = window.innerHeight;
    const groundPx = H * GROUND_BOTTOM;
    const anchorX  = W * ANCHOR_RATIO;

    // ── Horizontal ──
    const prevRabbitX = rabbitX;
    let moving = false;
    const _autoWalk = leftAutoWalk || p1AutoWalk || p2AutoWalk;
    if (!dying && !dialogActive) {
      if (keys['ArrowRight'] || keys['KeyD'] || _autoWalk) {
        rabbitX += MOVE_SPEED * dt;
        facingRight = true;
        moving = true;
      }
      if ((keys['ArrowLeft'] || keys['KeyA']) && !_autoWalk) {
        rabbitX = Math.max(MIN_WORLD_X, rabbitX - MOVE_SPEED * dt);
        facingRight = false;
        moving = true;
      }
    }

    // ── Vertical ──
    if (!onGround && !onBranch) {
      jumpVel -= GRAVITY * dt;
      jumpY   += jumpVel * dt;
      if (jumpY <= 0) {
        jumpY = 0; jumpVel = 0; onGround = true; isHighJump = false; highFrame = 0; jumpsUsed = 0;
      }
    }
    if (onBranch) { jumpY = onBranchY; jumpVel = 0; jumpsUsed = 0; }

    // ── Camera ──
    const _freeze = (inLeftPath  && leftWorldStopped)
      || (!inPhase2 && !inLeftPath && !inRightPath && p1WorldStopped)
      || (inPhase2  && p2WorldStopped)
      || (inRightPath && rightWorldStopped);
    if (_freeze && frozenCameraX < 0) frozenCameraX = Math.max(0, rabbitX - anchorX);
    const cameraX = _freeze ? frozenCameraX : Math.max(0, rabbitX - anchorX);
    const screenX = rabbitX - cameraX;
    updateParallax(cameraX);

    const cx = rabbitX + RABBIT_W / 2;

    if (!inPhase2 && !inLeftPath && !inRightPath) {
      // ── Fase 1 ──
      updateSpinesDOM(cameraX);
      checkSpines(cx);
      checkSMS();
      nearPalanca = !rejaOpen && Math.abs(cx - (PALANCA_X + 20)) < PALANCA_RANGE;
      checkReja();
      updateObstacle2DOM(cameraX, groundPx);
      if (!goatVideoTriggered && rejaOpen && rabbitX >= GOAT_VIDEO_X) {
        goatVideoTriggered = true;
        p1WorldStopped     = true;
        p1AutoWalk         = true;
      }
      if (p1AutoWalk && !p1EndTriggered && frozenCameraX >= 0) {
        if (rabbitX - frozenCameraX > W + 80) {
          p1EndTriggered = true;
          p1AutoWalk     = false;
          running        = false;
          if (audioFootstep) audioFootstep.pause();
          window.triggerGoatVideo?.();
        }
      }
    } else if (inLeftPath) {
      // ── Camino izquierdo: escenario granero ──

      // Espina
      const esp1 = document.getElementById('espinas1');
      if (esp1) esp1.style.left = `${LEFT_SPINE_X - cameraX}px`;
      if (!dying && cx >= LEFT_SPINE_X && cx <= LEFT_SPINE_X + LEFT_SPINE_W && jumpY < SPINE_CLEAR) {
        die(200);
      }

      // Árbol: posición en pantalla
      if (arbolEl) arbolEl.style.left = `${TREE_X - cameraX - 80}px`;

      // ── SMS triggers ──
      // Mensaje 1: conejo ve al zombie por primera vez
      if (!lSms1 && rabbitX >= ZOMBIE_MIN - 450) {
        lSms1 = true;
        window.sendSMS('izq_obs1');
        setTimeout(() => { if (!lSms2) { lSms2 = true; window.sendSMS('izq_obs2'); } }, 5000);
      }
      // Mensaje 3: sube al árbol por primera vez
      if (!lSms3 && onBranch) {
        lSms3 = true;
        window.sendSMS('izq_obs3');
        setTimeout(() => { if (!lSms4) { lSms4 = true; window.sendSMS('izq_obs4'); } }, 8000);
      }
      // Mensaje 6 + arranque del final: cruzó exitosamente
      if (!lSms6 && rabbitX > ZOMBIE_MAX + 100) {
        lSms6 = true;
        window.sendSMS('izq_obs6');
        leftWorldStopped = true;   // fondo se congela
        leftAutoWalk     = true;   // conejo camina solo
      }

      // Conejo sale por el borde derecho → dispara ending
      if (leftAutoWalk && !leftEndTriggered && frozenCameraX >= 0) {
        if (rabbitX - frozenCameraX > W + 80) {
          leftEndTriggered = true;
          leftAutoWalk     = false;
          running          = false;
          if (audioFootstep) audioFootstep.pause();
          setTimeout(() => window.triggerLeftEnding?.(), 1500);
        }
      }

      // ── Zombie: movimiento ──
      const prevDir = zombieDir;
      zombieX += ZOMBIE_SPEED * zombieDir * dt;
      if (zombieX >= ZOMBIE_MAX) { zombieX = ZOMBIE_MAX; zombieDir = -1; }
      if (zombieX <= ZOMBIE_MIN) { zombieX = ZOMBIE_MIN; zombieDir  =  1; }
      // Mensaje 5: primera vez que el zombie llega al límite izquierdo y se da vuelta
      if (!lSms5 && prevDir === -1 && zombieDir === 1) {
        lSms5 = true;
        window.sendSMS('izq_obs5');
      }

      // Animación: alterna standing ↔ walking
      zombieAnimAcc += dt;
      if (zombieAnimAcc >= 1 / ZOMBIE_ANIM_FPS) {
        zombieAnimAcc = 0;
        zombieFrame   = 1 - zombieFrame;
        if (zombieEl) {
          zombieEl.src = zombieFrame === 0
            ? 'assets/personajes/evil-rabbit/standing-rabbit.jpg'
            : 'assets/personajes/evil-rabbit/walking-rabbit.jpg';
        }
      }

      // Posición en pantalla + flip de dirección
      if (zombieEl) {
        zombieEl.style.left      = `${zombieX - cameraX}px`;
        zombieEl.style.transform = `scaleX(${zombieDir > 0 ? 1 : -1})`;
      }

      // Colisión: solo muere si está cerca del suelo (jumpY bajo)
      // Si viene saltando desde el árbol, pasa por encima sin morir
      if (!dying && jumpY < 480) {
        const zombieCx = zombieX + 70;
        if (Math.abs(cx - zombieCx) < 110) {
          die(TREE_X - 200);
        }
      }

      // Ramas: ¿está el conejo en el rango horizontal del árbol?
      const overTree = cx >= TREE_X - TREE_BRANCH_HW && cx <= TREE_X + TREE_BRANCH_HW;

      if (onBranch) {
        if (!overTree) { onBranch = false; onGround = false; } // se cae si sale del ancho
      }

      // Captura de rama al caer (solo bajando, solo sobre el árbol)
      if (!onGround && !onBranch && jumpVel <= 0 && overTree) {
        for (const bh of TREE_BRANCH_Y) {
          if (jumpY >= bh - TREE_SNAP_DIST && jumpY <= bh + TREE_SNAP_DIST * 1.5) {
            jumpY      = bh;
            jumpVel    = 0;
            onBranch   = true;
            onBranchY  = bh;
            jumpsUsed  = 0;    // puede saltar desde la rama
            isHighJump = false;
            break;
          }
        }
      }

    } else if (inRightPath) {
      // ── Camino derecho: bosque — Obstáculo raíces ──
      if (raicesEl) {
        raicesEl.style.left = `${RAICES_X - cameraX}px`;

        // Acercamiento → primer aviso + inicio ciclo (solo una vez)
        if (!raicesApproached && cx >= RAICES_X - RAICES_APPROACH_D) {
          raicesApproached = true;
          window.sendSMS('derecha1');
          raicesRise();
        }

        // Colisión: letal solo si aún no fue pasado
        if (!dying && !raicesPassed && raicesState === 'up' && cx >= RAICES_X && cx <= RAICES_X + RAICES_W) {
          raicesDeaths++;
          die(RAICES_CHECKPOINT_X);
          if      (raicesDeaths === 1) setTimeout(() => window.sendSMS('derecha2'), 600);
          else if (raicesDeaths === 2) setTimeout(() => window.sendSMS('derecha3'), 600);
        }

        // Pasó — marca y SMS, el ciclo sigue corriendo
        if (!raicesPassed && raicesApproached && cx > RAICES_X + RAICES_W + 40) {
          raicesPassed = true;
          window.sendSMS('derecha4');
        }
      }

      // ── Columna 1 ──
      if (col1El) {
        col1El.style.left = `${COL1_X - cameraX}px`;
        if (!col1Triggered && cx >= COL1_X - COL_TRIGGER_D) {
          col1Triggered = true;
          col1Fall();
        }
        // Colisión: letal solo si aún no fue pasada
        if (!dying && !col1Passed && col1State === 'down' && cx >= COL1_X && cx <= COL1_X + COL1_W) {
          col1Deaths++;
          die(COL1_CHECKPOINT_X);
          if (col1Deaths === 1) setTimeout(() => window.sendSMS('col1_muere'), 600);
        }
        // Pasó — marca y SMS, el ciclo sigue corriendo
        if (!col1Passed && col1Triggered && cx > COL1_X + COL1_W + 40) {
          col1Passed = true;
          window.sendSMS('col1_pasa');
        }
      }

      // ── Columna 2 ──
      if (col2El) {
        col2El.style.left = `${COL2_X - cameraX}px`;
        if (!col2Triggered && cx >= COL2_X - COL_TRIGGER_D) {
          col2Triggered = true;
          col2Fall();
        }
        // Colisión: letal solo si aún no fue pasada
        if (!dying && !col2Passed && col2State === 'down' && cx >= COL2_X && cx <= COL2_X + COL2_W) {
          col2Deaths++;
          die(COL2_CHECKPOINT_X);
        }
        // Pasó — marca y SMS, el ciclo sigue corriendo
        if (!col2Passed && col2Triggered && cx > COL2_X + COL2_W + 40) {
          col2Passed = true;
          window.sendSMS('col2_pasa');
        }
      }

      // ── Barrera derecha (bloqueada hasta atrapar al gigante) ──
      if (carcelState !== 'trapped') {
        rabbitX = Math.min(rabbitX, GIGANTE_BARRIER_X);
      }

      // ── Fondo se congela cuando el conejo llega al borde de la zona ──
      if (carcelState === 'trapped' && !rightWorldStopped && rabbitX >= GIGANTE_BARRIER_X) {
        rightWorldStopped = true;
      }

      // ── Salida: conejo se va por la derecha → fin bueno ──
      if (carcelState === 'trapped' && !rightEndTriggered && screenX > window.innerWidth + 20) {
        rightEndTriggered = true;
        running = false;
        if (rabbitEl) rabbitEl.style.display = 'none';
        if (audioFootstep) audioFootstep.pause();
        setTimeout(() => window.triggerGoodEnding?.(), 800);
      }

      // ── Palanca del gigante ──
      nearPalancaGig = Math.abs(cx - (PALANCA_GIG_X + 20)) < PALANCA_GIG_RANGE;
      if (palancaGigEl) palancaGigEl.style.left = `${PALANCA_GIG_X - cameraX}px`;
      if (interactEl) {
        interactEl.style.left    = `${PALANCA_GIG_X - cameraX + 12}px`;
        interactEl.style.bottom  = `${groundPx + 60}px`;
        interactEl.style.opacity = nearPalancaGig ? '1' : '0';
      }

      // ── Jaula del gigante ──
      if (carcelEl && (carcelState === 'falling' || carcelState === 'resetting' || carcelState === 'trapped')) {
        carcelEl.style.left = `${CARCEL_X - cameraX}px`;

        if (carcelState === 'falling') {
          carcelBottomY -= CARCEL_FALL_SPEED * dt;
          if (carcelBottomY <= groundPx) {
            carcelBottomY = groundPx;
            // Comprobar si el gigante está bajo la jaula (su centro dentro del ancho)
            const giantCx    = giganteX + GIGANTE_W / 2;
            const giantCaught = giganteActive && giantCx >= CARCEL_X && giantCx <= CARCEL_X + CARCEL_W;
            if (giantCaught) {
              carcelState  = 'trapped';
              giganteState = 'trapped';
              carcelEl.style.display = 'none';
              giganteEl.src = 'assets/personajes/gigante/gigante-encerrado.png';
              if (audioGiganteGrune) {
                audioGiganteGrune.currentTime = 0;
                audioGiganteGrune.play().catch(() => {});
                audioGiganteGrune.addEventListener('ended', () => {
                  if (audioGiganteGrune) { audioGiganteGrune.pause(); audioGiganteGrune.currentTime = 0; }
                  if (audioPasoGigante)  { audioPasoGigante.pause();  audioPasoGigante.currentTime  = 0; }
                }, { once: true });
              }
              window.sendSMS('derecha9');
            } else {
              carcelState = 'resetting';
            }
          }
          carcelEl.style.bottom = `${carcelBottomY}px`;

        } else if (carcelState === 'resetting') {
          carcelBottomY += CARCEL_FALL_SPEED * dt;
          if (carcelBottomY >= window.innerHeight) {
            carcelState = 'idle';
            carcelEl.style.display = 'none';
            palancaGigActivada = false;
            if (palancaGigEl) palancaGigEl.src = 'assets/obstaculos/gigante/palanca-desactivada.png';
          }
          carcelEl.style.bottom = `${carcelBottomY}px`;
        }
        // 'trapped': solo mantiene posición (left ya fijado arriba)
      }

      // ── Gigante ──
      if (!giganteTriggered && cx >= GIGANTE_TRIGGER_X) {
        giganteTriggered  = true;
        giganteActive     = true;
        giganteGruneTimer = 18 + Math.random() * 12; // próximo gruñido en 18-30 s
        if (giganteEl) giganteEl.style.display = 'block';

        // Baja la música de fondo gradualmente
        const bgMusic = document.getElementById('audio-phase3');
        if (bgMusic) {
          const target = 0.18;
          const fadeId = setInterval(() => {
            if (bgMusic.volume > target + 0.02) bgMusic.volume = Math.max(target, bgMusic.volume - 0.03);
            else { bgMusic.volume = target; clearInterval(fadeId); }
          }, 80);
        }

        // Gruñido de aparición
        if (audioGiganteGrune) { audioGiganteGrune.currentTime = 0; audioGiganteGrune.play().catch(() => {}); }

        window.sendSMS('derecha7');
      }

      if (giganteEl && giganteActive) {
        if (giganteState === 'trapped') {
          giganteEl.style.left = `${giganteX - cameraX}px`;

        } else if (giganteState === 'walking') {
          // Patrulla de lado a lado
          giganteX += GIGANTE_SPEED * giganteDir * dt;
          if (giganteX <= GIGANTE_PATROL_LEFT)  { giganteX = GIGANTE_PATROL_LEFT;  giganteDir = +1; }
          if (giganteX >= GIGANTE_PATROL_RIGHT) { giganteX = GIGANTE_PATROL_RIGHT; giganteDir = -1; }

          // Animación caminata
          giganteFrameT += dt;
          if (giganteFrameT >= 1 / GIGANTE_ANIM_FPS) {
            giganteFrameT -= 1 / GIGANTE_ANIM_FPS;
            giganteFrame = (giganteFrame + 1) % 4;
            const WALK_FRAMES = ['gigange-1.png', 'gigante-2.png', 'gigante-3.png', 'gigante-4.png'];
            giganteEl.src = `assets/personajes/gigante/gigante-caminando/${WALK_FRAMES[giganteFrame]}`;
          }

          // Tras STOMP_INTERVAL segundos → iniciar pisotón
          giganteWalkT += dt;
          if (giganteWalkT >= STOMP_INTERVAL) {
            giganteWalkT  = 0;
            giganteStompT = 0;
            giganteState           = 'frontal';
            giganteEl.src          = 'assets/personajes/gigante/gigante-frente.png';
            giganteEl.style.height = '100vh';
            giganteEl.style.bottom = '3vh';
            if (audioGiganteGrune) { audioGiganteGrune.currentTime = 0; audioGiganteGrune.play().catch(() => {}); }
          }

        } else if (giganteState === 'frontal') {
          // Pausa breve de frente antes de levantar el pie
          giganteStompT += dt;
          if (giganteStompT >= STOMP_FRONT_T) {
            giganteStompT = 0;
            giganteState  = 'warning';
            giganteEl.src = 'assets/personajes/gigante/gigante-pie-arriba.png';
          }

        } else if (giganteState === 'warning') {
          // Pie arriba — el jugador tiene STOMP_WARN_T segundos para alejarse
          giganteStompT += dt;
          if (giganteStompT >= STOMP_WARN_T) {
            giganteStompT = 0;
            giganteState  = 'stomping';
            giganteEl.src = 'assets/personajes/gigante/gigante-aplastando.png';
            if (audioPasoGigante) { audioPasoGigante.currentTime = 0; audioPasoGigante.play().catch(() => {}); }
          }

        } else if (giganteState === 'stomping') {
          // Ventana de muerte: si el conejo está debajo → muere
          if (!dying) {
            const underGigante = cx >= giganteX && cx <= giganteX + GIGANTE_W;
            if (underGigante) {
              giganteDeaths++;
              die(GIGANTE_CHECKPOINT_X);
              if (giganteDeaths === 1) setTimeout(() => window.sendSMS('derecha8'), 600);
            }
          }
          giganteStompT += dt;
          if (giganteStompT >= STOMP_HIT_T) {
            // Vuelve a caminar
            giganteStompT = 0;
            giganteState  = 'walking';
            giganteFrame  = 0;
            giganteFrameT = 0;
            giganteEl.src          = 'assets/personajes/gigante/gigante-caminando/gigange-1.png';
            giganteEl.style.height = '90vh';
            giganteEl.style.bottom = '7vh';
          }
        }

        // Reflejo horizontal (aplica en todos los estados)
        giganteEl.style.transform = `scaleX(${giganteDir})`;
        giganteEl.style.left      = `${giganteX - cameraX}px`;
      }

    } else {
      // ── Fase 2: escenario cabra ──
      nearCabra = !dialogActive
        && cabraEl && cabraEl.style.display !== 'none'
        && Math.abs(cx - (CABRA_WORLD_X + 40)) < CABRA_RANGE;
      if (cabraEl) {
        cabraEl.style.left   = `${CABRA_WORLD_X - cameraX}px`;
        cabraEl.style.bottom = `${groundPx}px`;
      }
      // Ojos de la cabra — offsets calibrados con coordenadas reales de pantalla
      // (1366×768, rabbitX≈900). Ajustar los 8 números si la pantalla es distinta.
      //   standing:   ojo1=(20,35) ojo2=(25,35)   [vh desde baseX / groundPx]
      //   explicando: ojo1=(30,38) ojo2=(34,37)
      if (cabraEl && cabraEl.style.display !== 'none') {
        const vh    = window.innerHeight / 100;
        const isExp = cabraExplaining;
        const baseX = CABRA_WORLD_X - cameraX;
        const e1x = baseX    + (isExp ? 28 : 21) * vh;
        const e1y = groundPx + (isExp ? 37 : 36) * vh;
        const e2x = baseX    + (isExp ? 34 : 26) * vh;
        const e2y = groundPx + (isExp ? 38 : 37) * vh;
        if (cabraGlowEl)  { cabraGlowEl.style.left  = `${e1x}px`; cabraGlowEl.style.bottom  = `${e1y}px`; }
        if (cabraGlowEl2) { cabraGlowEl2.style.left = `${e2x}px`; cabraGlowEl2.style.bottom = `${e2y}px`; }
      }
      if (interactEl) {
        interactEl.style.left    = `${CABRA_WORLD_X - cameraX + 20}px`;
        interactEl.style.bottom  = `${groundPx + 110}px`;
        interactEl.style.opacity = nearCabra ? '1' : '0';
      }

      // ── Trigger bifurcación ──
      if (!bifurcacionTriggered && rabbitX >= BIFURCACION_X) {
        bifurcacionTriggered = true;
        p2WorldStopped       = true;
        p2AutoWalk           = true;
      }
      if (p2AutoWalk && !p2EndTriggered && frozenCameraX >= 0) {
        if (rabbitX - frozenCameraX > W + 80) {
          p2EndTriggered = true;
          p2AutoWalk     = false;
          running        = false;
          if (audioFootstep) audioFootstep.pause();
          window.triggerBifurcacion?.();
        }
      }
    }

    // ── Posición conejo ──
    rabbitEl.style.left      = `${screenX}px`;
    rabbitEl.style.bottom    = `${groundPx + jumpY}px`;
    rabbitEl.style.transform = `scaleX(${facingRight ? 1 : -1})`;
    rabbitEl.style.opacity   = dying ? '0.4' : '1';

    // ── Footstep audio ──
    const isWalkingNow = moving && onGround && !dying;
    if (isWalkingNow && !walkingOnGround)      audioFootstep.play().catch(() => {});
    else if (!isWalkingNow && walkingOnGround) audioFootstep.pause();
    walkingOnGround = isWalkingNow;

    // ── Animación ──
    animAccum += dt;
    if (framesReady) {
      if (isHighJump) {
        if (animAccum >= 1 / HIGH_FPS) {
          animAccum = 0;
          highFrame = Math.min(highFrame + 1, FRAMES_HIGH.length - 1);
        }
        setFrame(FRAMES_HIGH[highFrame]);
      } else if (moving) {
        if (animAccum >= 1 / WALK_FPS) {
          animAccum = 0;
          walkFrame = (walkFrame + 1) % FRAMES_WALK.length;
        }
        setFrame(FRAMES_WALK[walkFrame]);
      } else {
        setFrame(FRAME_STAND);
        walkFrame = 0;
        animAccum = 0;
      }
    }
  }

  // ── API pública ───────────────────────────────
  function startPhase1(lang) {
    currentLang    = lang || 'es';
    layers         = ['layer1','layer2','layer3'].map(id => document.getElementById(id));
    rabbitEl       = document.getElementById('rabbit');
    announcementEl = document.getElementById('announcement');
    audioPhase1    = document.getElementById('audio-phase1');
    audioFootstep  = document.getElementById('audio-footstep');
    rejaEl         = document.getElementById('reja');
    palancaEl      = document.getElementById('palanca');
    interactEl     = document.getElementById('interact-hint');

    p1WorldStopped = false; p1AutoWalk = false; p1EndTriggered = false;
    goatVideoTriggered = false; frozenCameraX = -1;

    framesReady = false;
    preload([FRAME_STAND, ...FRAMES_WALK, ...FRAMES_HIGH]).then(() => { framesReady = true; });
    // Preload all phase backgrounds and animated sprites so they show instantly
    preload([
      'assets/fondos/escenario1-pantano/capa1-fondo.png',
      'assets/fondos/escenario1-pantano/capa2-medio.png',
      'assets/fondos/escenario1-pantano/capa3-frente.png',
      'assets/fondos/escenario4-cabra/capa1-fondo.jpg',
      'assets/fondos/escenario4-cabra/capa2-frente.jpg',
      'assets/fondos/escenario-granero/capa1-fondo.jpg',
      'assets/fondos/escenario-granero/capa2-frente.jpg',
      'assets/fondos/escenario2-bosque/capa1-fondo.png',
      'assets/fondos/escenario2-bosque/capa2-medio.png',
      'assets/fondos/escenario2-bosque/capa3-frente.png',
      // Left-path zombie frames (cached early so animation never cancels on Railway)
      'assets/personajes/evil-rabbit/standing-rabbit.jpg',
      'assets/personajes/evil-rabbit/walking-rabbit.jpg',
    ]);
    audioFootstep.volume = 0.55;
    fadeIn(audioPhase1, 0.65, 1500);
    setTimeout(showAnnouncement, 1200);

    setupInput();
    running = true;
    lastTs  = performance.now();

    requestAnimationFrame(() => requestAnimationFrame(() => {
      rabbitEl.style.opacity = '1';
    }));
    requestAnimationFrame(loop);
  }

  function stopGame() {
    running = false;
    if (audioPhase1) fadeOut(audioPhase1);
  }

  function resumePhase1() {
    if (running) return;
    running = true;
    lastTs  = performance.now();
    requestAnimationFrame(loop);
  }

  function startPhase2(lang) {
    currentLang  = lang || 'es';
    inPhase2     = true;
    p2WorldStopped = false; p2AutoWalk = false; p2EndTriggered = false;
    frozenCameraX  = -1;
    rabbitX      = 200;
    jumpY        = 0; jumpVel = 0; onGround = true;
    facingRight  = true; isHighJump = false; jumpsUsed = 0; dying = false;

    // Swap escenario
    layers[0].style.backgroundImage = "url('assets/fondos/escenario4-cabra/capa1-fondo.jpg')";
    layers[0].style.backgroundSize  = 'auto 100%';
    layers[0].style.mixBlendMode    = '';
    layers[1].style.backgroundImage = "url('assets/fondos/escenario4-cabra/capa2-frente.jpg')";
    layers[1].style.backgroundSize  = 'auto 100%';
    layers[1].style.mixBlendMode    = 'multiply';
    layers[1].style.opacity         = '0.80';
    layers[2].style.display         = 'none';

    // Resetear interact hint (solveReja lo pone display:none)
    if (interactEl) {
      interactEl.style.display = '';
      interactEl.style.opacity = '0';
    }

    // Cabra
    cabraEl = document.getElementById('cabra');
    if (cabraEl) {
      cabraEl.style.display    = 'block';
      cabraEl.style.opacity    = '1';
      cabraEl.style.transition = '';
    }
    cabraGlowEl  = document.getElementById('cabra-glow');
    cabraGlowEl2 = document.getElementById('cabra-glow-2');
    [cabraGlowEl, cabraGlowEl2].forEach(el => {
      if (el) { el.style.display = 'block'; el.style.opacity = '1'; }
    });
    cabraExplaining = false;
    preload([
      'assets/personajes/creature/standing-cabra.png',
      'assets/personajes/creature/cabra-explicando.png',
    ]);

    // Audio
    const audioPhase2 = document.getElementById('audio-phase2');
    if (audioPhase1) fadeOut(audioPhase1);
    if (audioPhase2) fadeIn(audioPhase2, 0.65, 1500);

    running = true;
    lastTs  = performance.now();
    requestAnimationFrame(loop);
  }

  function startLeftPath(lang) {
    currentLang = lang || 'es';
    inPhase2    = false;
    inLeftPath  = true;

    // Reset rabbit
    rabbitX = 200; jumpY = 0; jumpVel = 0; onGround = true;
    facingRight = true; isHighJump = false; jumpsUsed = 0; dying = false;

    // Fondos granero
    layers[0].style.backgroundImage = "url('assets/fondos/escenario-granero/capa1-fondo.jpg')";
    layers[0].style.backgroundSize  = 'auto 100%';
    layers[0].style.mixBlendMode    = '';
    layers[0].style.opacity         = '1';
    layers[1].style.backgroundImage = "url('assets/fondos/escenario-granero/capa2-frente.jpg')";
    layers[1].style.backgroundSize  = 'auto 100%';
    layers[1].style.mixBlendMode    = 'multiply';
    layers[1].style.opacity         = '1';
    layers[2].style.display         = 'none';

    // Reset árbol/ramas, SMS y estado de transición
    onBranch  = false;
    onBranchY = 0;
    lSms1 = false; lSms2 = false; lSms3 = false;
    lSms4 = false; lSms5 = false; lSms6 = false;
    leftWorldStopped = false; leftAutoWalk = false; leftEndTriggered = false;
    frozenCameraX    = -1;

    // Ocultar elementos de fases anteriores
    if (cabraEl)      cabraEl.style.display      = 'none';
    if (cabraGlowEl)  cabraGlowEl.style.display  = 'none';
    if (cabraGlowEl2) cabraGlowEl2.style.display = 'none';
    if (interactEl)   interactEl.style.display   = 'none';

    // Espinas: ocultar la segunda, reusar la primera para el granero
    const esp2 = document.getElementById('espinas2');
    if (esp2) esp2.style.display = 'none';
    const esp1 = document.getElementById('espinas1');
    if (esp1) esp1.style.display = 'block';

    // Árbol
    arbolEl = document.getElementById('arbol');
    if (arbolEl) arbolEl.style.display = 'block';

    // Zombie
    zombieX       = ZOMBIE_MIN;
    zombieDir     = 1;
    zombieAnimAcc = 0;
    zombieFrame   = 0;
    zombieEl = document.getElementById('zombie-rabbit');
    if (zombieEl) {
      zombieEl.src     = 'assets/personajes/evil-rabbit/standing-rabbit.jpg';
      zombieEl.style.display = 'block';
    }

    // Preload zombie frames so Railway latency doesn't cancel in-flight src switches
    preload([
      'assets/personajes/evil-rabbit/standing-rabbit.jpg',
      'assets/personajes/evil-rabbit/walking-rabbit.jpg',
    ]);

    window.sendSMS('izquierda1');

    running = true;
    lastTs  = performance.now();
    requestAnimationFrame(loop);
  }

  function setDialogActive(active) {
    dialogActive = active;
    if (!active && audioFootstep) {
      walkingOnGround = false;
    }
  }

  function setCabraExplaining(val) {
    cabraExplaining = val;
  }

  function solveReja() {
    rejaOpen = true;
    if (rejaEl)    { rejaEl.style.display    = 'none'; }
    if (palancaEl) { palancaEl.style.display = 'none'; }
    if (interactEl){ interactEl.style.display = 'none'; }
    window.sendSMS('obstaculo2b');
  }

  // ── Columnas ──────────────────────────────────
  function col1Fall() {
    if (!col1El || col1Passed) return;
    col1State = 'falling';
    col1El.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 1, 1)';
    col1El.style.transform  = 'translateY(0%)';
    if (!col1FirstFall) {
      col1FirstFall = true;
      setTimeout(() => window.sendSMS('col1_cae'), 200);
    }
    col1TO = setTimeout(() => {
      col1State = 'down';
      col1TO = setTimeout(col1Rise, 1500);
    }, 500);
  }

  function col1Rise() {
    if (!col1El || col1Passed) return;
    col1State = 'rising';
    col1El.style.transition = 'transform 0.5s ease-in';
    col1El.style.transform  = 'translateY(-100%)';
    col1TO = setTimeout(() => {
      col1State = 'up';
      col1TO = setTimeout(col1Fall, 1500);
    }, 500);
  }

  function col2Fall() {
    if (!col2El || col2Passed) return;
    col2State = 'falling';
    col2El.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 1, 1)';
    col2El.style.transform  = 'translateY(0%)';
    col2TO = setTimeout(() => {
      col2State = 'down';
      col2TO = setTimeout(col2Rise, 1000);
    }, 300);
  }

  function col2Rise() {
    if (!col2El || col2Passed) return;
    col2State = 'rising';
    col2El.style.transition = 'transform 0.3s ease-in';
    col2El.style.transform  = 'translateY(-100%)';
    col2TO = setTimeout(() => {
      col2State = 'up';
      col2TO = setTimeout(col2Fall, 1400);
    }, 300);
  }

  function clearColumnCycles() {
    if (col1TO) { clearTimeout(col1TO); col1TO = null; }
    if (col2TO) { clearTimeout(col2TO); col2TO = null; }
  }

  function raicesRise() {
    if (!raicesEl) return;
    raicesState = 'up';
    raicesFrame = 0;
    raicesEl.src = 'assets/obstaculos/raices/raices-estaticas.png';
    raicesEl.style.transition = 'transform 0.3s cubic-bezier(0.1, 0, 0.2, 1)';
    raicesEl.style.transform  = 'translateY(0%)';
    if (raicesAnimInt) clearInterval(raicesAnimInt);
    raicesAnimInt = setInterval(() => {
      if (!raicesEl) return;
      raicesFrame = 1 - raicesFrame;
      raicesEl.src = raicesFrame === 0
        ? 'assets/obstaculos/raices/raices-estaticas.png'
        : 'assets/obstaculos/raices/raices-moviendose.png';
    }, 300);
    raicesCycleTO = setTimeout(raicesLower, 2500);
  }

  function raicesLower() {
    if (!raicesEl) return;
    raicesState = 'down';
    if (raicesAnimInt) { clearInterval(raicesAnimInt); raicesAnimInt = null; }
    raicesEl.src = 'assets/obstaculos/raices/raices-estaticas.png';
    raicesEl.style.transition = 'transform 0.2s ease';
    raicesEl.style.transform  = 'translateY(100%)';
    raicesWindowTO = setTimeout(raicesRise, 2500);
  }

  function clearRaicesCycle() {
    if (raicesAnimInt) { clearInterval(raicesAnimInt); raicesAnimInt = null; }
    if (raicesCycleTO)  { clearTimeout(raicesCycleTO);  raicesCycleTO  = null; }
    if (raicesWindowTO) { clearTimeout(raicesWindowTO); raicesWindowTO = null; }
  }

  function startRightPath(lang) {
    currentLang = lang || 'es';
    inRightPath = true;
    inPhase2    = false;
    inLeftPath  = false;

    rabbitX = 200; jumpY = 0; jumpVel = 0; onGround = true;
    facingRight = true; isHighJump = false; jumpsUsed = 0; dying = false;
    p1WorldStopped = false; p1AutoWalk = false; p1EndTriggered = false;
    p2WorldStopped = false; p2AutoWalk = false; p2EndTriggered = false;
    frozenCameraX  = -1;

    // 3 capas del bosque
    layers[0].style.backgroundImage = "url('assets/fondos/escenario2-bosque/capa1-fondo.png')";
    layers[0].style.backgroundSize  = 'auto 100%';
    layers[0].style.mixBlendMode    = '';
    layers[0].style.opacity         = '1';

    layers[1].style.backgroundImage = "url('assets/fondos/escenario2-bosque/capa2-medio.png')";
    layers[1].style.backgroundSize  = 'auto 100%';
    layers[1].style.mixBlendMode    = 'multiply';
    layers[1].style.opacity         = '1';

    layers[2].style.backgroundImage = "url('assets/fondos/escenario2-bosque/capa3-frente.png')";
    layers[2].style.backgroundSize  = 'auto 100%';
    layers[2].style.mixBlendMode    = 'multiply';
    layers[2].style.opacity         = '1';
    layers[2].style.display         = 'block';
    layers[2].style.transform       = 'translateY(8%)';

    // Ocultar elementos de fases anteriores
    if (cabraEl)      cabraEl.style.display      = 'none';
    if (cabraGlowEl)  cabraGlowEl.style.display  = 'none';
    if (cabraGlowEl2) cabraGlowEl2.style.display = 'none';



    rightWorldStopped = false;
    rightEndTriggered = false;

    // Palanca y jaula gigante
    palancaGigEl       = document.getElementById('palanca-gigante');
    palancaGigActivada = false;
    nearPalancaGig     = false;
    if (palancaGigEl) { palancaGigEl.src = 'assets/obstaculos/gigante/palanca-desactivada.png'; palancaGigEl.style.display = 'block'; }
    carcelEl    = document.getElementById('carcel-gigante');
    carcelState = 'idle';
    carcelBottomY = 0;
    if (carcelEl) carcelEl.style.display = 'none';

    // Gigante
    giganteEl        = document.getElementById('gigante');
    giganteX         = GIGANTE_INIT_X;
    giganteDir       = -1;
    giganteTriggered = false;
    giganteActive    = false;
    giganteFrame     = 0;
    giganteFrameT    = 0;
    giganteWalkT     = 0;
    giganteStompT    = 0;
    giganteState     = 'walking';
    giganteDeaths    = 0;
    if (giganteEl) { giganteEl.style.display = 'none'; giganteEl.style.transform = 'scaleX(-1)'; }
    audioGiganteGrune = document.getElementById('audio-gigante-grune');
    audioPasoGigante  = document.getElementById('audio-paso-gigante');
    giganteGruneTimer = 18 + Math.random() * 12;
    if (audioGiganteGrune) { audioGiganteGrune.pause(); audioGiganteGrune.currentTime = 0; }
    if (audioPasoGigante)  { audioPasoGigante.pause();  audioPasoGigante.currentTime  = 0; }
    if (audioPasoGigante)  { audioPasoGigante.pause();  audioPasoGigante.currentTime  = 0; }

    // Columnas
    col1El = document.getElementById('col1');
    col2El = document.getElementById('col2');
    col1State = 'up'; col2State = 'up';
    col1Triggered = false; col2Triggered = false;
    col1FirstFall = false;
    col1Deaths = 0; col2Deaths = 0;
    col1Passed = false; col2Passed = false;
    clearColumnCycles();
    [col1El, col2El].forEach(el => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform  = 'translateY(-100%)';
      el.style.display    = 'block';
    });

    // Raíces
    raicesEl = document.getElementById('raices');
    raicesState = 'hidden'; raicesApproached = false;
    raicesDeaths = 0; raicesPassed = false; raicesFrame = 0;
    clearRaicesCycle();
    if (raicesEl) {
      raicesEl.style.transition = 'none';
      raicesEl.style.transform  = 'translateY(100%)';
      raicesEl.style.display    = 'block';
    }

    // Preload all right-path assets so quick-transition frames (stomp 0.3s) are cached
    preload([
      'assets/personajes/gigante/gigante-caminando/gigange-1.png',
      'assets/personajes/gigante/gigante-caminando/gigante-2.png',
      'assets/personajes/gigante/gigante-caminando/gigante-3.png',
      'assets/personajes/gigante/gigante-caminando/gigante-4.png',
      'assets/personajes/gigante/gigante-frente.png',
      'assets/personajes/gigante/gigante-pie-arriba.png',
      'assets/personajes/gigante/gigante-aplastando.png',
      'assets/personajes/gigante/gigante-encerrado.png',
      'assets/obstaculos/raices/raices-estaticas.png',
      'assets/obstaculos/raices/raices-moviendose.png',
      'assets/obstaculos/gigante/palanca-activada.png',
      'assets/obstaculos/gigante/palanca-desactivada.png',
      'assets/obstaculos/gigante/carcel-gigante.png',
      'assets/obstaculos/columnas/columna-gigante.png',
    ]);

    running = true;
    lastTs  = performance.now();
    requestAnimationFrame(loop);
  }

  return { startPhase1, stopGame, solveReja, resumePhase1, startPhase2, setDialogActive, setCabraExplaining, startLeftPath, startRightPath };
})();
