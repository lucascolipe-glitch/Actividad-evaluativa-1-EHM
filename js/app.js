/* ==========================================
   NAVEGACIÓN, GUARDADO, AUDIO Y CIERRE
   ========================================== */
(() => {
  'use strict';

  const pantallas = [...document.querySelectorAll('.pantalla')];
  const obligatorios = ['nodo1', 'nodo2', 'nodo3'];
  const visitados = new Set(leerJSON('capsulaVisitados', []));

  function leerJSON(clave, valorPredeterminado) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return valor ?? valorPredeterminado;
    } catch {
      return valorPredeterminado;
    }
  }

  function pausarMedios() {
    if (reproductorMusical && typeof reproductorMusical.pauseVideo === 'function') {
      guardarEstadoMusical();
      reproductorMusical.pauseVideo();
    }

    document.querySelectorAll('audio, video').forEach(medio => {
      if (!medio.paused) medio.pause();
    });

    document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]')
      .forEach(iframe => {
        iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'pauseVideo',
          args: []
        }), '*');
      });
  }

  function mostrarPantalla(id) {
    const destino = document.getElementById(id);
    if (!destino) return;
    pausarMedios();
    pantallas.forEach(pantalla => pantalla.classList.toggle('activa', pantalla === destino));
    destino.setAttribute('tabindex', '-1');
    destino.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (destino.dataset.obligatorio === 'true' || id === 'nodo4') {
      visitados.add(id);
      localStorage.setItem('capsulaVisitados', JSON.stringify([...visitados]));
      actualizarProgreso();
    }

    if (id === 'cierre') actualizarPanelFinal();
    history.replaceState(null, '', `#${id}`);
  }

  function actualizarProgreso() {
    document.querySelectorAll('[data-estado]').forEach(elemento => {
      const visto = visitados.has(elemento.dataset.estado);
      elemento.textContent = visto ? 'Visitado' : (elemento.dataset.estado === 'nodo4' ? 'Optativo' : 'Pendiente');
      elemento.classList.toggle('visitado', visto);
    });
    const total = obligatorios.filter(id => visitados.has(id)).length;
    const contador = document.getElementById('contador-progreso');
    if (contador) contador.textContent = `${total} de 3`;
  }

  document.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-ir]');
    if (!boton) return;
    evento.preventDefault();
    mostrarPantalla(boton.dataset.ir);
  });

  /* GUARDADO AUTOMÁTICO DE RESPUESTAS */
  const CLAVE_RESPUESTAS = 'capsulaRespuestasEHM';
  const estadoAutoguardado = document.getElementById('estado-autoguardado');
  let datosRespuestas = leerJSON(CLAVE_RESPUESTAS, { campos: {}, ultimaActualizacion: null });
  if (!datosRespuestas.campos) datosRespuestas = { campos: {}, ultimaActualizacion: null };
  let temporizadorGuardado = null;

  const camposGuardables = [...document.querySelectorAll(
    'textarea[id], input[type="text"][id], input[type="checkbox"][id], [contenteditable="true"][id]'
  )];

  function valorCampo(campo) {
    if (campo.type === 'checkbox') return campo.checked;
    if (campo.isContentEditable) return campo.textContent.trim();
    return campo.value;
  }

  function asignarValorCampo(campo, valor) {
    if (campo.type === 'checkbox') campo.checked = Boolean(valor);
    else if (campo.isContentEditable) campo.textContent = valor || '';
    else campo.value = valor || '';
  }

  function mostrarEstadoGuardado(mensaje) {
    if (!estadoAutoguardado) return;
    estadoAutoguardado.textContent = mensaje;
    estadoAutoguardado.classList.add('guardado-reciente');
    window.setTimeout(() => estadoAutoguardado.classList.remove('guardado-reciente'), 1200);
  }

  function guardarTodasLasRespuestas(mensaje = true) {
    camposGuardables.forEach(campo => {
      datosRespuestas.campos[campo.id] = valorCampo(campo);
    });
    datosRespuestas.ultimaActualizacion = new Date().toISOString();
    localStorage.setItem(CLAVE_RESPUESTAS, JSON.stringify(datosRespuestas));
    localStorage.setItem('capsulaBitacora', document.getElementById('nota-bitacora')?.value || '');
    if (mensaje) mostrarEstadoGuardado(`Guardado automático · ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`);
    if (document.getElementById('cierre')?.classList.contains('activa')) actualizarPanelFinal();
  }

  function programarGuardado() {
    window.clearTimeout(temporizadorGuardado);
    if (estadoAutoguardado) estadoAutoguardado.textContent = 'Guardando…';
    temporizadorGuardado = window.setTimeout(() => guardarTodasLasRespuestas(true), 350);
  }

  camposGuardables.forEach(campo => {
    let guardado = datosRespuestas.campos[campo.id];
    if (guardado === undefined && campo.id === 'nota-bitacora') {
      guardado = localStorage.getItem('capsulaBitacora') || '';
    }
    if (guardado !== undefined) asignarValorCampo(campo, guardado);
    campo.addEventListener(campo.type === 'checkbox' ? 'change' : 'input', programarGuardado);
  });

  if (datosRespuestas.ultimaActualizacion) {
    const fecha = new Date(datosRespuestas.ultimaActualizacion);
    if (!Number.isNaN(fecha.getTime())) {
      mostrarEstadoGuardado(`Último guardado · ${fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`);
    }
  }

  /* ACTIVIDAD DE TRES CASOS */
  const casos = [
    {
      titulo: 'Caso 1 · Una definición de ciencia',
      texto: 'Un manual afirma: “La ciencia se caracteriza por aplicar un único método universal que garantiza resultados verdaderos”. ¿Qué intervención abre mejor el problema epistemológico?',
      opciones: [
        'Aceptar la definición porque simplifica el tema para estudiantes.',
        'Preguntar qué métodos usan distintas ciencias, cómo se justifican sus resultados y qué significa “verdadero” en cada caso.',
        'Reemplazar la palabra ciencia por matemática sin modificar la frase.'
      ],
      correcta: 1,
      devoluciones: [
        'La simplificación puede cerrar prematuramente un problema que los textos presentan como histórico y discutible.',
        'Esta opción abre las tensiones entre pluralidad metodológica, validación y verdad. No impone una respuesta única y permite comparar autores.',
        'El cambio de palabra no resuelve los supuestos sobre método, verdad y validación.'
      ]
    },
    {
      titulo: 'Caso 2 · El descubrimiento aislado',
      texto: 'Una clase presenta una teoría matemática como creación repentina de un genio. ¿Qué información sería más pertinente agregar desde Bernal?',
      opciones: [
        'Más detalles sobre la personalidad excepcional del protagonista.',
        'Una lista más larga de fechas y premios.',
        'Problemas previos, colaboradores, instituciones, instrumentos y condiciones sociales que hicieron posible el trabajo.'
      ],
      correcta: 2,
      devoluciones: [
        'Profundizar la excepcionalidad mantiene el mismo encuadre heroico.',
        'Agregar datos cronológicos no alcanza para reconstruir la dimensión colectiva y situada.',
        'La respuesta desplaza el foco sin negar a los individuos: los integra en una trama histórica, social e institucional.'
      ]
    },
    {
      titulo: 'Caso 3 · Una historia universal',
      texto: 'Un texto describe los conocimientos babilónicos como una versión incompleta del álgebra moderna. ¿Qué lectura crítica es más adecuada?',
      opciones: [
        'Evaluar únicamente si sus cálculos coinciden con los actuales.',
        'Reconstruir las técnicas en sus propios términos y preguntar qué se pierde al traducirlas automáticamente a categorías modernas.',
        'Excluirlos de la historia de la matemática porque no usan nuestra notación.'
      ],
      correcta: 1,
      devoluciones: [
        'El control de exactitud moderno es precisamente una de las reducciones cuestionadas en la lectura propuesta de Høyrup.',
        'Esta opción atiende al contexto, al lenguaje y a las categorías propias, y evita medir toda práctica con un único centro contemporáneo.',
        'La exclusión reproduce una definición restringida de matemática y un sesgo historiográfico.'
      ]
    }
  ];

  const CLAVE_CASOS = 'capsulaCasosEHM';
  let respuestasCasos = leerJSON(CLAVE_CASOS, {});
  let indiceCaso = Number(sessionStorage.getItem('indiceCaso') || 0);
  if (indiceCaso >= casos.length) indiceCaso = 0;
  const contenedor = document.getElementById('caso-contenedor');

  function mostrarDevolucionCaso(seleccion) {
    const caso = casos[indiceCaso];
    const devolucion = document.getElementById('devolucion-caso');
    if (!devolucion || !Number.isInteger(seleccion)) return;
    const acierto = seleccion === caso.correcta;
    devolucion.className = `devolucion${acierto ? '' : ' atencion'}`;
    devolucion.innerHTML = `<strong>${acierto ? 'Lectura bien orientada.' : 'Conviene revisar el encuadre.'}</strong><p>${caso.devoluciones[seleccion]}</p><button type="button" id="siguiente-caso" class="primario">${indiceCaso === casos.length - 1 ? 'Volver al primer caso' : 'Siguiente caso'}</button>`;
    [...contenedor.querySelectorAll('[data-opcion]')].forEach((boton, indice) => {
      boton.disabled = true;
      boton.classList.toggle('opcion-elegida', indice === seleccion);
    });
  }

  function renderCaso() {
    if (!contenedor) return;
    const caso = casos[indiceCaso];
    contenedor.innerHTML = `<p class="ceja">${indiceCaso + 1} de ${casos.length}</p><h3>${caso.titulo}</h3><p>${caso.texto}</p><div class="caso-opciones">${caso.opciones.map((opcion, indice) => `<button type="button" data-opcion="${indice}">${opcion}</button>`).join('')}</div><div id="devolucion-caso" aria-live="polite"></div>`;
    const guardada = respuestasCasos[indiceCaso];
    if (guardada && Number.isInteger(guardada.seleccion)) mostrarDevolucionCaso(guardada.seleccion);
  }

  contenedor?.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-opcion]');
    if (!boton) return;
    const seleccion = Number(boton.dataset.opcion);
    respuestasCasos[indiceCaso] = { seleccion, acierto: seleccion === casos[indiceCaso].correcta };
    localStorage.setItem(CLAVE_CASOS, JSON.stringify(respuestasCasos));
    mostrarDevolucionCaso(seleccion);
    mostrarEstadoGuardado('Respuesta interactiva guardada');
    actualizarPanelFinal();
  });

  contenedor?.addEventListener('click', evento => {
    if (evento.target.id !== 'siguiente-caso') return;
    indiceCaso = (indiceCaso + 1) % casos.length;
    sessionStorage.setItem('indiceCaso', String(indiceCaso));
    renderCaso();
  });

  document.getElementById('reiniciar-actividad')?.addEventListener('click', () => {
    indiceCaso = 0;
    respuestasCasos = {};
    sessionStorage.removeItem('indiceCaso');
    localStorage.removeItem(CLAVE_CASOS);
    renderCaso();
    actualizarPanelFinal();
  });

  /* BITÁCORA Y CONSTRUCTOR */
  const nota = document.getElementById('nota-bitacora');
  const estadoBitacora = document.getElementById('estado-guardado');

  document.getElementById('guardar-bitacora')?.addEventListener('click', () => {
    guardarTodasLasRespuestas(false);
    if (estadoBitacora) estadoBitacora.textContent = 'Bitácora guardada en este dispositivo.';
    mostrarEstadoGuardado('Bitácora guardada');
  });

  document.getElementById('borrar-bitacora')?.addEventListener('click', () => {
    if (nota) nota.value = '';
    datosRespuestas.campos['nota-bitacora'] = '';
    guardarTodasLasRespuestas(false);
    if (estadoBitacora) estadoBitacora.textContent = 'Bitácora borrada.';
    actualizarPanelFinal();
  });

  document.getElementById('armar-borrador')?.addEventListener('click', () => {
    const valores = ['arg-problema', 'arg-lectura', 'arg-ejemplo', 'arg-docencia']
      .map(id => document.getElementById(id)?.value.trim() || '');
    const salida = document.getElementById('borrador');
    if (!salida) return;
    if (valores.some(valor => !valor)) {
      salida.textContent = 'Completá los cuatro campos para construir el borrador.';
      return;
    }
    salida.textContent = construirBorrador(valores);
    guardarTodasLasRespuestas(false);
  });

  function construirBorrador(valores = null) {
    const partes = valores || ['arg-problema', 'arg-lectura', 'arg-ejemplo', 'arg-docencia']
      .map(id => document.getElementById(id)?.value.trim() || '');
    if (partes.some(valor => !valor)) return '';
    return `Problema: ${partes[0]}\n\nA partir de la lectura: ${partes[1]}\n\nPuede observarse en: ${partes[2]}\n\nEsto resulta relevante para la formación y la enseñanza porque: ${partes[3]}`;
  }

  /* PAUSA MUSICAL · YOUTUBE IFRAME API */
  const videosPausa = [
    'hHyLtkAdT0A', 'mY2BuhUbV_I', 'ErfaTN2TZ_U', 'IPjVQz64CjA', '4oVllgsSVjw',
    'cHr8DTNRZdg', 'Wew0Q_rxQCo', 'tq0-bdSINmY', 'Ja9BPjGOZtU'
  ];

  const CLAVE_MUSICA = 'capsulaEstadoMusica';
  const estadoGuardadoMusica = leerJSON(CLAVE_MUSICA, {});
  let indiceMusica = Number.isInteger(estadoGuardadoMusica.indice)
    ? Math.min(Math.max(estadoGuardadoMusica.indice, 0), videosPausa.length - 1)
    : 0;
  let volumenMusica = Number.isFinite(Number(estadoGuardadoMusica.volumen))
    ? Math.min(Math.max(Number(estadoGuardadoMusica.volumen), 0), 100)
    : 35;
  let musicaSilenciada = Boolean(estadoGuardadoMusica.silenciado);
  let reproductorMusical = null;
  let intervaloMusica = null;
  let cambiandoTema = false;

  const videoPausa = document.getElementById('video-pausa');
  const estadoMusica = document.getElementById('estado-musica');
  const tiempoMusica = document.getElementById('tiempo-musica');
  const botonReproducir = document.getElementById('musica-reproducir');
  const botonSilencio = document.getElementById('musica-silencio');
  const controlVolumen = document.getElementById('musica-volumen');
  const valorVolumen = document.getElementById('musica-volumen-valor');
  const botonesCambio = [
    document.getElementById('musica-anterior'),
    document.getElementById('musica-siguiente'),
    document.getElementById('musica-aleatoria')
  ].filter(Boolean);

  function formatoTiempo(segundos) {
    const valor = Math.max(0, Math.floor(Number(segundos) || 0));
    const minutos = Math.floor(valor / 60);
    const resto = String(valor % 60).padStart(2, '0');
    return `${minutos}:${resto}`;
  }

  function actualizarEstadoMusica() {
    const numeroTema = indiceMusica + 1;
    if (estadoMusica) estadoMusica.textContent = `Tema instrumental ${numeroTema} de ${videosPausa.length}`;
    if (videoPausa) videoPausa.title = `Pausa musical · Tema instrumental ${numeroTema} de ${videosPausa.length}`;
  }

  function actualizarControlesVolumen() {
    if (controlVolumen) controlVolumen.value = String(volumenMusica);
    if (valorVolumen) valorVolumen.textContent = `${Math.round(volumenMusica)}%`;
    if (botonSilencio) {
      botonSilencio.textContent = musicaSilenciada ? '🔇 Silenciado' : '🔊 Sonido';
      botonSilencio.setAttribute('aria-pressed', String(musicaSilenciada));
    }
  }

  function guardarEstadoMusical() {
    const posicion = reproductorMusical?.getCurrentTime?.() || Number(estadoGuardadoMusica.posicion) || 0;
    localStorage.setItem(CLAVE_MUSICA, JSON.stringify({
      indice: indiceMusica,
      posicion,
      volumen: volumenMusica,
      silenciado: musicaSilenciada
    }));
  }

  function actualizarTiempoMusica() {
    if (!reproductorMusical?.getCurrentTime) return;
    const actual = reproductorMusical.getCurrentTime() || 0;
    const duracion = reproductorMusical.getDuration() || 0;
    if (tiempoMusica) tiempoMusica.textContent = duracion
      ? `${formatoTiempo(actual)} / ${formatoTiempo(duracion)}`
      : formatoTiempo(actual);
  }

  function bloquearCambios(valor) {
    cambiandoTema = valor;
    botonesCambio.forEach(boton => { boton.disabled = valor; });
  }

  function ajustarVolumenGradual(desde, hasta, duracion = 350) {
    return new Promise(resolve => {
      if (!reproductorMusical?.setVolume || musicaSilenciada) {
        resolve();
        return;
      }
      const pasos = 7;
      let paso = 0;
      const temporizador = window.setInterval(() => {
        paso += 1;
        const volumen = desde + ((hasta - desde) * paso / pasos);
        reproductorMusical.setVolume(Math.round(Math.max(0, Math.min(100, volumen))));
        if (paso >= pasos) {
          window.clearInterval(temporizador);
          resolve();
        }
      }, duracion / pasos);
    });
  }

  async function cargarTema(nuevoIndice, reproducir = true, posicion = 0) {
    if (!reproductorMusical || cambiandoTema) return;
    bloquearCambios(true);
    const estabaReproduciendo = reproductorMusical.getPlayerState() === YT.PlayerState.PLAYING;
    if (estabaReproduciendo && !musicaSilenciada) await ajustarVolumenGradual(volumenMusica, 0, 280);

    indiceMusica = (nuevoIndice + videosPausa.length) % videosPausa.length;
    actualizarEstadoMusica();
    reproductorMusical.setVolume(0);
    reproductorMusical.loadVideoById({
      videoId: videosPausa[indiceMusica],
      startSeconds: Math.max(0, Number(posicion) || 0)
    });

    if (!reproducir) reproductorMusical.pauseVideo();
    window.setTimeout(async () => {
      if (musicaSilenciada) {
        reproductorMusical.setVolume(volumenMusica);
        reproductorMusical.mute();
      } else {
        reproductorMusical.unMute();
        if (reproducir) await ajustarVolumenGradual(0, volumenMusica, 420);
        else reproductorMusical.setVolume(volumenMusica);
      }
      guardarEstadoMusical();
      bloquearCambios(false);
    }, 450);
  }

  function indiceAleatorioDistinto() {
    if (videosPausa.length < 2) return indiceMusica;
    let nuevoIndice = indiceMusica;
    while (nuevoIndice === indiceMusica) nuevoIndice = Math.floor(Math.random() * videosPausa.length);
    return nuevoIndice;
  }

  function crearReproductorMusical() {
    if (!videoPausa || !window.YT?.Player) return;
    actualizarEstadoMusica();
    actualizarControlesVolumen();
    reproductorMusical = new YT.Player('video-pausa', {
      videoId: videosPausa[indiceMusica],
      playerVars: {
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        start: Math.floor(Number(estadoGuardadoMusica.posicion) || 0)
      },
      events: {
        onReady(evento) {
          evento.target.setVolume(volumenMusica);
          if (musicaSilenciada) evento.target.mute();
          const posicion = Math.max(0, Number(estadoGuardadoMusica.posicion) || 0);
          if (posicion) evento.target.seekTo(posicion, true);
          evento.target.pauseVideo();
          actualizarTiempoMusica();
          window.clearInterval(intervaloMusica);
          intervaloMusica = window.setInterval(() => {
            actualizarTiempoMusica();
            guardarEstadoMusical();
          }, 3000);
        },
        onStateChange(evento) {
          const reproduciendo = evento.data === YT.PlayerState.PLAYING;
          if (botonReproducir) botonReproducir.textContent = reproduciendo ? '⏸ Pausar' : '▶ Reproducir';
          if (evento.data === YT.PlayerState.ENDED) cargarTema(indiceAleatorioDistinto(), true, 0);
          guardarEstadoMusical();
        }
      }
    });
  }

  if (videoPausa) {
    videoPausa.src = `https://www.youtube-nocookie.com/embed/${videosPausa[indiceMusica]}?rel=0&enablejsapi=1&playsinline=1`;
    const apiYouTube = document.createElement('script');
    apiYouTube.src = 'https://www.youtube.com/iframe_api';
    apiYouTube.async = true;
    document.head.appendChild(apiYouTube);
    const callbackPrevio = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof callbackPrevio === 'function') callbackPrevio();
      crearReproductorMusical();
    };
  }

  document.getElementById('musica-anterior')?.addEventListener('click', () => cargarTema(indiceMusica - 1, true, 0));
  document.getElementById('musica-siguiente')?.addEventListener('click', () => cargarTema(indiceMusica + 1, true, 0));
  document.getElementById('musica-aleatoria')?.addEventListener('click', () => cargarTema(indiceAleatorioDistinto(), true, 0));

  botonReproducir?.addEventListener('click', () => {
    if (!reproductorMusical) return;
    const reproduciendo = reproductorMusical.getPlayerState() === YT.PlayerState.PLAYING;
    if (reproduciendo) reproductorMusical.pauseVideo();
    else reproductorMusical.playVideo();
  });

  botonSilencio?.addEventListener('click', () => {
    if (!reproductorMusical) return;
    musicaSilenciada = !musicaSilenciada;
    if (musicaSilenciada) reproductorMusical.mute();
    else reproductorMusical.unMute();
    actualizarControlesVolumen();
    guardarEstadoMusical();
  });

  controlVolumen?.addEventListener('input', () => {
    volumenMusica = Number(controlVolumen.value);
    if (volumenMusica > 0 && musicaSilenciada) {
      musicaSilenciada = false;
      reproductorMusical?.unMute?.();
    }
    reproductorMusical?.setVolume?.(volumenMusica);
    actualizarControlesVolumen();
    guardarEstadoMusical();
  });

  window.addEventListener('beforeunload', () => {
    guardarTodasLasRespuestas(false);
    guardarEstadoMusical();
  });

  /* PAUSA REFLEXIVA */
  const preguntas = [
    '¿Qué nombres aparecen primero cuando pensás en la historia de la matemática?',
    '¿Qué prácticas matemáticas conocés cuyo autor no podría reducirse a una sola persona?',
    '¿Qué cambia cuando una fuente se lee desde las categorías vistas?',
    '¿Qué sesgo te resultó más difícil reconocer en tu propia formación?',
    '¿Qué historia matemática querrías llevar a una futura clase?'
  ];
  let indicePregunta = 0;
  document.getElementById('otra-pregunta')?.addEventListener('click', () => {
    indicePregunta = (indicePregunta + 1) % preguntas.length;
    const pregunta = document.getElementById('pregunta-pausa');
    if (pregunta) pregunta.textContent = preguntas[indicePregunta];
  });

  /* PANEL FINAL, IMPRESIÓN Y PDF */
  const idsMatriz = [
    'matriz-ciencia-diaz', 'matriz-ciencia-bunge', 'matriz-ciencia-klimovsky',
    'matriz-validacion-diaz', 'matriz-validacion-bunge', 'matriz-validacion-klimovsky',
    'matriz-problema-diaz', 'matriz-problema-bunge', 'matriz-problema-klimovsky'
  ];
  const idsArgumento = ['arg-problema', 'arg-lectura', 'arg-ejemplo', 'arg-docencia'];
  const idsEscritura = [...idsMatriz, 'reescritura', ...idsArgumento, 'nota-bitacora'];
  const idsRevision = ['revision-citas', 'revision-multimedia', 'revision-sesgo', 'revision-consecuencia'];
  let primerPendiente = 'mapa';

  function contenidoCampo(id) {
    const campo = document.getElementById(id);
    if (!campo) return '';
    return String(valorCampo(campo) ?? '').trim();
  }

  function resumenEstado() {
    const nodos = obligatorios.filter(id => visitados.has(id)).length;
    const escritos = idsEscritura.filter(id => contenidoCampo(id)).length;
    const revisiones = idsRevision.filter(id => document.getElementById(id)?.checked).length;
    const casosResueltos = Object.keys(respuestasCasos).filter(indice => respuestasCasos[indice]?.seleccion !== undefined).length;
    const total = obligatorios.length + idsEscritura.length + idsRevision.length + casos.length;
    const completos = nodos + escritos + revisiones + casosResueltos;
    return {
      nodos,
      escritos,
      revisiones,
      casosResueltos,
      porcentaje: Math.round((completos / total) * 100)
    };
  }

  function actualizarPanelFinal() {
    const panel = document.getElementById('cierre');
    if (!panel) return;
    const resumen = resumenEstado();
    document.getElementById('final-porcentaje').textContent = `${resumen.porcentaje}%`;
    document.getElementById('final-nodos').textContent = `${resumen.nodos}/3`;
    document.getElementById('final-respuestas').textContent = `${resumen.escritos}/${idsEscritura.length}`;
    document.getElementById('final-casos').textContent = `${resumen.casosResueltos}/3`;
    document.getElementById('barra-avance-relleno').style.width = `${resumen.porcentaje}%`;

    const pendientes = [];
    primerPendiente = 'mapa';
    if (resumen.nodos < 3) pendientes.push(`Visitar ${3 - resumen.nodos} nodo(s) obligatorio(s).`);
    const matrizCompletos = idsMatriz.filter(id => contenidoCampo(id)).length;
    if (matrizCompletos < idsMatriz.length) {
      pendientes.push(`Completar ${idsMatriz.length - matrizCompletos} celda(s) de la matriz de contraste.`);
      primerPendiente = 'nodo1';
    }
    if (!contenidoCampo('reescritura')) {
      pendientes.push('Completar la reescritura del episodio matemático.');
      if (primerPendiente === 'mapa') primerPendiente = 'nodo2';
    }
    const argumentosCompletos = idsArgumento.filter(id => contenidoCampo(id)).length;
    if (argumentosCompletos < idsArgumento.length) {
      pendientes.push(`Completar ${idsArgumento.length - argumentosCompletos} parte(s) del constructor de argumento.`);
      if (primerPendiente === 'mapa') primerPendiente = 'nodo4';
    }
    if (resumen.revisiones < idsRevision.length) {
      pendientes.push(`Revisar ${idsRevision.length - resumen.revisiones} criterio(s) antes de entregar.`);
      if (primerPendiente === 'mapa') primerPendiente = 'nodo4';
    }
    if (resumen.casosResueltos < 3) {
      pendientes.push(`Resolver ${3 - resumen.casosResueltos} caso(s) interactivo(s).`);
      if (primerPendiente === 'mapa') primerPendiente = 'actividad';
    }
    if (!contenidoCampo('nota-bitacora')) {
      pendientes.push('Escribir una reflexión en la bitácora.');
      if (primerPendiente === 'mapa') primerPendiente = 'bitacora';
    }

    const lista = document.getElementById('lista-pendientes');
    if (lista) lista.innerHTML = pendientes.length
      ? pendientes.map(item => `<li>${escaparHTML(item)}</li>`).join('')
      : '<li class="completo">La cápsula está completa. Ya podés imprimir o guardar el trabajo.</li>';

    const vista = document.getElementById('vista-respuestas');
    if (vista) {
      const textos = [
        ['Reescritura situada', contenidoCampo('reescritura')],
        ['Borrador argumental', construirBorrador()],
        ['Bitácora', contenidoCampo('nota-bitacora')]
      ];
      vista.innerHTML = textos.map(([titulo, texto]) => `
        <article><strong>${titulo}</strong><p>${texto ? escaparHTML(recortarTexto(texto, 230)) : '<em>Sin completar</em>'}</p></article>
      `).join('');
    }
  }

  function recortarTexto(texto, maximo) {
    return texto.length > maximo ? `${texto.slice(0, maximo).trim()}…` : texto;
  }

  function escaparHTML(valor) {
    return String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function textoOIndicacion(valor) {
    return valor ? escaparHTML(valor).replaceAll('\n', '<br>') : '<em>Sin respuesta</em>';
  }

  function construirInforme() {
    guardarTodasLasRespuestas(false);
    const informe = document.getElementById('informe-impresion');
    if (!informe) return;
    const nombre = contenidoCampo('estudiante-nombre') || 'Sin completar';
    const curso = contenidoCampo('estudiante-curso') || 'Sin completar';
    const resumen = resumenEstado();
    const filasMatriz = [
      ['¿Qué se considera ciencia?', 'matriz-ciencia-diaz', 'matriz-ciencia-bunge', 'matriz-ciencia-klimovsky'],
      ['¿Cómo se valida?', 'matriz-validacion-diaz', 'matriz-validacion-bunge', 'matriz-validacion-klimovsky'],
      ['¿Qué problema deja abierto?', 'matriz-problema-diaz', 'matriz-problema-bunge', 'matriz-problema-klimovsky']
    ];
    const etiquetasRevision = [
      ['revision-citas', 'Distingo mis palabras de las citas textuales.'],
      ['revision-multimedia', 'No uso el recurso multimedia como sustituto de la lectura.'],
      ['revision-sesgo', 'Explico cómo opera el sesgo, no solo lo nombro.'],
      ['revision-consecuencia', 'Incluyo una consecuencia epistemológica o educativa.']
    ];

    const casosHTML = casos.map((caso, indice) => {
      const respuesta = respuestasCasos[indice];
      const seleccion = respuesta?.seleccion;
      const textoSeleccion = Number.isInteger(seleccion) ? caso.opciones[seleccion] : '';
      return `<article class="bloque-informe"><h3>${escaparHTML(caso.titulo)}</h3><p><strong>Situación:</strong> ${escaparHTML(caso.texto)}</p><p><strong>Respuesta elegida:</strong> ${textoOIndicacion(textoSeleccion)}</p><p><strong>Estado:</strong> ${respuesta ? (respuesta.acierto ? 'Lectura bien orientada' : 'Respuesta para revisar') : 'Sin responder'}</p></article>`;
    }).join('');

    informe.innerHTML = `
      <header class="cabecera-informe">
        <p>Universidad Nacional del Comahue · Profesorado en Matemática</p>
        <h1>¿Quién cuenta la matemática?</h1>
        <p>Informe de respuestas de la cápsula de Epistemología e Historia de la Matemática</p>
      </header>
      <section class="datos-informe">
        <p><strong>Estudiante:</strong> ${escaparHTML(nombre)}</p>
        <p><strong>Curso o comisión:</strong> ${escaparHTML(curso)}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR', { dateStyle: 'long' })}</p>
        <p><strong>Avance registrado:</strong> ${resumen.porcentaje}%</p>
      </section>
      <section>
        <h2>Nodo 1 · Matriz de contraste</h2>
        <table>
          <thead><tr><th>Pregunta</th><th>Díaz y Heler</th><th>Bunge</th><th>Klimovsky / Boido</th></tr></thead>
          <tbody>${filasMatriz.map(fila => `<tr><th>${escaparHTML(fila[0])}</th><td>${textoOIndicacion(contenidoCampo(fila[1]))}</td><td>${textoOIndicacion(contenidoCampo(fila[2]))}</td><td>${textoOIndicacion(contenidoCampo(fila[3]))}</td></tr>`).join('')}</tbody>
        </table>
      </section>
      <section>
        <h2>Nodo 2 · Reescritura situada</h2>
        <div class="respuesta-informe">${textoOIndicacion(contenidoCampo('reescritura'))}</div>
      </section>
      <section>
        <h2>Nodo 4 · Constructor de argumento</h2>
        <h3>Problema o sesgo</h3><div class="respuesta-informe">${textoOIndicacion(contenidoCampo('arg-problema'))}</div>
        <h3>Idea de una lectura</h3><div class="respuesta-informe">${textoOIndicacion(contenidoCampo('arg-lectura'))}</div>
        <h3>Evidencia o ejemplo</h3><div class="respuesta-informe">${textoOIndicacion(contenidoCampo('arg-ejemplo'))}</div>
        <h3>Implicancia docente</h3><div class="respuesta-informe">${textoOIndicacion(contenidoCampo('arg-docencia'))}</div>
        <h3>Primera trama argumental</h3><div class="respuesta-informe">${textoOIndicacion(construirBorrador())}</div>
      </section>
      <section>
        <h2>Revisión antes de entregar</h2>
        <ul class="lista-informe">${etiquetasRevision.map(([id, etiqueta]) => `<li>${document.getElementById(id)?.checked ? '☑' : '☐'} ${escaparHTML(etiqueta)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>Actividad interactiva</h2>
        ${casosHTML}
      </section>
      <section>
        <h2>Bitácora personal</h2>
        <div class="respuesta-informe">${textoOIndicacion(contenidoCampo('nota-bitacora'))}</div>
      </section>
      <footer class="pie-informe">Cápsula educativa · Epistemología e Historia de la Matemática · UNCo</footer>
    `;
    informe.setAttribute('aria-hidden', 'false');
  }

  function abrirImpresion(modo) {
    construirInforme();
    const panelEstado = document.getElementById('estado-panel-final');
    if (panelEstado) panelEstado.textContent = modo === 'pdf'
      ? 'En la ventana que se abre, elegí “Guardar como PDF” como destino.'
      : 'Se preparó una versión limpia y completa para imprimir.';
    const tituloOriginal = document.title;
    const nombre = contenidoCampo('estudiante-nombre').replace(/[^a-zA-ZÀ-ÿ0-9]+/g, '_') || 'Estudiante';
    document.title = `Actividad_EHM_${nombre}`;
    window.print();
    document.title = tituloOriginal;
  }

  document.getElementById('revisar-pendientes')?.addEventListener('click', () => mostrarPantalla(primerPendiente));
  document.getElementById('imprimir-actividad')?.addEventListener('click', () => abrirImpresion('impresion'));
  document.getElementById('exportar-pdf')?.addEventListener('click', () => abrirImpresion('pdf'));

  document.getElementById('borrar-respuestas')?.addEventListener('click', () => {
    const confirmar = window.confirm('¿Querés borrar todas las respuestas, los casos resueltos y el progreso guardado en este dispositivo?');
    if (!confirmar) return;
    localStorage.removeItem(CLAVE_RESPUESTAS);
    localStorage.removeItem(CLAVE_CASOS);
    localStorage.removeItem('capsulaBitacora');
    localStorage.removeItem('capsulaVisitados');
    sessionStorage.removeItem('indiceCaso');
    camposGuardables.forEach(campo => asignarValorCampo(campo, campo.type === 'checkbox' ? false : ''));
    datosRespuestas = { campos: {}, ultimaActualizacion: null };
    respuestasCasos = {};
    visitados.clear();
    indiceCaso = 0;
    renderCaso();
    actualizarProgreso();
    actualizarPanelFinal();
    mostrarEstadoGuardado('Respuestas borradas');
    const panelEstado = document.getElementById('estado-panel-final');
    if (panelEstado) panelEstado.textContent = 'Se borraron las respuestas guardadas en este dispositivo.';
  });

  window.addEventListener('afterprint', () => {
    document.getElementById('informe-impresion')?.setAttribute('aria-hidden', 'true');
  });

  actualizarProgreso();
  renderCaso();
  actualizarPanelFinal();
  actualizarControlesVolumen();
  const inicial = location.hash.slice(1);
  if (inicial && document.getElementById(inicial)) mostrarPantalla(inicial);
})();
