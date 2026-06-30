/* ==========================================
   NAVEGACIÓN, PROGRESO Y ACTIVIDAD INTERACTIVA
   ========================================== */
(() => {
  'use strict';

  const pantallas = [...document.querySelectorAll('.pantalla')];
  const obligatorios = ['nodo1', 'nodo2', 'nodo3'];
  const visitados = new Set(JSON.parse(localStorage.getItem('capsulaVisitados') || '[]'));

  function mostrarPantalla(id) {
    const destino = document.getElementById(id);
    if (!destino) return;
    pantallas.forEach(p => p.classList.toggle('activa', p === destino));
    destino.setAttribute('tabindex', '-1');
    destino.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (destino.dataset.obligatorio === 'true' || id === 'nodo4') {
      visitados.add(id);
      localStorage.setItem('capsulaVisitados', JSON.stringify([...visitados]));
      actualizarProgreso();
    }
    history.replaceState(null, '', `#${id}`);
  }

  function actualizarProgreso() {
    document.querySelectorAll('[data-estado]').forEach(el => {
      const visto = visitados.has(el.dataset.estado);
      if (visto) {
        el.textContent = 'Visitado';
        el.classList.add('visitado');
      }
    });
    const total = obligatorios.filter(id => visitados.has(id)).length;
    const contador = document.getElementById('contador-progreso');
    if (contador) contador.textContent = `${total} de 3`;
  }

  document.addEventListener('click', e => {
    const boton = e.target.closest('[data-ir]');
    if (boton) {
      e.preventDefault();
      mostrarPantalla(boton.dataset.ir);
    }
  });

  /* ACTIVIDAD DE TRES CASOS */
  const casos = [
    {
      titulo: 'Caso 1 · Una definición de ciencia',
      texto: 'Un manual afirma: “La ciencia se caracteriza por aplicar un único método universal que garantiza resultados verdaderos”. ¿Qué intervención abre mejor el problema epistemológico?',
      opciones: [
        'Aceptar la definición porque simplifica el tema para estudiantes.',
        'Preguntar qué métodos usan distintas ciencias, cómo se justifican sus resultados y qué significa “verdadero” en cada caso.',
        'Reemplazar la palabra ciencia por matemática sin modificar la frase.'
      ], correcta: 1,
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
      ], correcta: 2,
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
      ], correcta: 1,
      devoluciones: [
        'El control de exactitud moderno es precisamente una de las reducciones cuestionadas en la lectura propuesta de Høyrup.',
        'Esta opción atiende al contexto, al lenguaje y a las categorías propias, y evita medir toda práctica con un único centro contemporáneo.',
        'La exclusión reproduce una definición restringida de matemática y un sesgo historiográfico.'
      ]
    }
  ];

  let indiceCaso = Number(sessionStorage.getItem('indiceCaso') || 0);
  if (indiceCaso >= casos.length) indiceCaso = 0;
  const contenedor = document.getElementById('caso-contenedor');

  function renderCaso() {
    if (!contenedor) return;
    const caso = casos[indiceCaso];
    contenedor.innerHTML = `<p class="ceja">${indiceCaso + 1} de ${casos.length}</p><h3>${caso.titulo}</h3><p>${caso.texto}</p><div class="caso-opciones">${caso.opciones.map((op, i) => `<button type="button" data-opcion="${i}">${op}</button>`).join('')}</div><div id="devolucion-caso" aria-live="polite"></div>`;
  }

  contenedor?.addEventListener('click', e => {
    const boton = e.target.closest('[data-opcion]');
    if (!boton) return;
    const seleccion = Number(boton.dataset.opcion);
    const caso = casos[indiceCaso];
    const devolucion = document.getElementById('devolucion-caso');
    const acierto = seleccion === caso.correcta;
    devolucion.className = `devolucion${acierto ? '' : ' atencion'}`;
    devolucion.innerHTML = `<strong>${acierto ? 'Lectura bien orientada.' : 'Conviene revisar el encuadre.'}</strong><p>${caso.devoluciones[seleccion]}</p><button type="button" id="siguiente-caso" class="primario">${indiceCaso === casos.length - 1 ? 'Volver al primer caso' : 'Siguiente caso'}</button>`;
    [...contenedor.querySelectorAll('[data-opcion]')].forEach(b => b.disabled = true);
  });

  contenedor?.addEventListener('click', e => {
    if (e.target.id !== 'siguiente-caso') return;
    indiceCaso = (indiceCaso + 1) % casos.length;
    sessionStorage.setItem('indiceCaso', String(indiceCaso));
    renderCaso();
  });

  document.getElementById('reiniciar-actividad')?.addEventListener('click', () => {
    indiceCaso = 0;
    sessionStorage.removeItem('indiceCaso');
    renderCaso();
  });

  /* BITÁCORA LOCAL */
  const nota = document.getElementById('nota-bitacora');
  const estado = document.getElementById('estado-guardado');
  if (nota) nota.value = localStorage.getItem('capsulaBitacora') || '';
  document.getElementById('guardar-bitacora')?.addEventListener('click', () => {
    localStorage.setItem('capsulaBitacora', nota.value);
    estado.textContent = 'Bitácora guardada en este dispositivo.';
  });
  document.getElementById('borrar-bitacora')?.addEventListener('click', () => {
    localStorage.removeItem('capsulaBitacora'); nota.value = ''; estado.textContent = 'Bitácora borrada.';
  });

  /* CONSTRUCTOR DE ARGUMENTO */
  document.getElementById('armar-borrador')?.addEventListener('click', () => {
    const valores = ['arg-problema','arg-lectura','arg-ejemplo','arg-docencia'].map(id => document.getElementById(id).value.trim());
    const salida = document.getElementById('borrador');
    if (valores.some(v => !v)) { salida.textContent = 'Completá los cuatro campos para construir el borrador.'; return; }
    salida.textContent = `Problema: ${valores[0]}\n\nA partir de la lectura: ${valores[1]}\n\nPuede observarse en: ${valores[2]}\n\nEsto resulta relevante para la formación y la enseñanza porque: ${valores[3]}`;
  });

  /* PAUSA REFLEXIVA */
  const preguntas = [
    '¿Qué nombres aparecen primero cuando pensás en la historia de la matemática?',
    '¿Qué prácticas matemáticas conocés cuyo autor no podría reducirse a una sola persona?',
    '¿Qué cambia cuando una fuente se lee desde sus propias categorías?',
    '¿Qué sesgo te resultó más difícil reconocer en tu propia formación?',
    '¿Qué historia matemática querrías llevar a una futura clase?'
  ];
  let indicePregunta = 0;
  document.getElementById('otra-pregunta')?.addEventListener('click', () => {
    indicePregunta = (indicePregunta + 1) % preguntas.length;
    document.getElementById('pregunta-pausa').textContent = preguntas[indicePregunta];
  });

  actualizarProgreso();
  renderCaso();
  const inicial = location.hash.slice(1);
  if (inicial && document.getElementById(inicial)) mostrarPantalla(inicial);
})();
