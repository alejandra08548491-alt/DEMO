/* =========================================================
   GENERADOR DE LIBROS — script.js
   Un solo archivo para index.html y libro.html.
   ========================================================= */

const CLAVE_SESION = "libro:config";

/* Guarda temporalmente el texto y las fotos ya escritas cuando el
   usuario elige "cambiar solo el formato" desde el editor, para
   que index.html pueda mandarlas de vuelta a libro.html junto con
   la nueva configuración, sin perder lo que ya había hecho. */
const CLAVE_PAGINAS = "libro:paginas";

/* Antes había acá un arreglo FONDOS fijo (12 imágenes, numeradas
   desde 1) con matemática de índices para traducir el id del fondo
   elegido a su URL. Eso se rompía cada vez que se agregaban o
   quitaban fondos en index.html (como pasó al pasar de 12 a 15
   fondos numerados desde 0): los números dejaban de coincidir y
   terminaba mostrando siempre el mismo fondo por error.
   Ahora la URL se toma directo del "src" de la imagen que ya está
   en el HTML (ver seleccionarFondoImagen), así que no importa
   cuántos fondos haya ni cómo estén numerados. */

/* Color de las líneas de cuaderno cuando se usa un fondo personalizado */
const LINEA_FONDO_COLOR = "rgba(74, 51, 36, 0.4)";


/* Genera las líneas de cuaderno como una imagen PNG en mosaico,
   dibujada con <canvas> y exportada como data URL.
   Antes se generaba con un <svg> embebido en la URL de datos, pero
   ese enfoque falla al descargar el PDF en varios navegadores
   móviles (sobre todo Safari/iOS y en modo de navegación privada):
   html2canvas no logra "pintar" ese fondo SVG de forma confiable y
   el PDF sale con un error o sin las líneas. Un PNG generado por
   canvas es mucho más compatible. */
function fondoLineasDataUrl(colorLinea) {

    const canvas =
        document.createElement("canvas");

    canvas.width = 200;

    canvas.height = 38;

    const ctx =
        canvas.getContext("2d");

    ctx.strokeStyle = colorLinea;

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(0, 37.5);

    ctx.lineTo(200, 37.5);

    ctx.stroke();


    return `url("${canvas.toDataURL("image/png")}")`;

}

/* =========================================================
   FRASES DE IDEAS — amor, amistad y familia
   ========================================================= */

const FRASES_IDEAS = [

    {
        texto: "El amor no consiste en mirarnos el uno al otro, sino en mirar juntos en la misma dirección.",
        autor: "Antoine de Saint-Exupéry"
    },
    {
        texto: "Donde hay amor hay vida.",
        autor: "Mahatma Gandhi"
    },
    {
        texto: "Me gusta cómo, sin darte cuenta, te has ido haciendo un espacio en mis pensamientos. No sé qué será de nosotros, pero sí sé que cada momento contigo tiene algo que quiero guardar.",
        autor: "Anónimo"
    },
    {
        texto: "Ser profundamente amado por alguien te da fuerza, mientras que amar a alguien profundamente te da valor.",
        autor: "Lao Tsé"
    },
    {
        texto: "El amor es la única fuerza capaz de transformar a un enemigo en amigo.",
        autor: "Martin Luther King Jr."
    },
    {
        texto: "Amar y ser amado es sentir el sol desde ambos lados.",
        autor: "David Viscott"
    },
    {
        texto: "Qué bonito es coincidir contigo en este momento de la vida. Entre tantas personas y tantos caminos, de alguna manera terminamos encontrándonos, y eso ya me parece una pequeña historia que vale la pena vivir.",
        autor: "Anónimo"
    },
    {
        texto: "La amistad es un alma que habita en dos cuerpos.",
        autor: "Aristóteles"
    },
    {
        texto: "Un amigo es alguien que lo sabe todo de ti y aun así te quiere.",
        autor: "Elbert Hubbard"
    },
    {
        texto: "La amistad duplica las alegrías y divide las angustias.",
        autor: "Francis Bacon"
    },
    {
        texto: "Si pudiera guardar un momento contigo para siempre, probablemente elegiría uno de esos instantes simples en los que no pasa nada extraordinario, excepto que estás ahí y, por alguna razón, todo se siente un poquito más bonito.",
        autor: "Anónimo"
    },
    {
        texto: "No hay desierto como la vida sin amigos.",
        autor: "Baltasar Gracián"
    },
    {
        texto: "Los amigos son la familia que uno elige.",
        autor: "Edna Buchanan"
    },
    {
        texto: "La familia no es algo importante, lo es todo.",
        autor: "Michael J. Fox"
    },
    {
        texto: "No sé si fue casualidad, destino o simplemente suerte, pero me alegra muchísimo haberte encontrado. Hay personas que llegan y pasan, y hay otras que, sin avisar, hacen que quieras quedarte un poquito más.",
        autor: "Anónimo"
    },
    {
        texto: "La familia es uno de los milagros de la naturaleza.",
        autor: "Gilbert K. Chesterton"
    },
    {
        texto: "La familia es el lugar donde comienza el amor.",
        autor: "Madre Teresa de Calcuta"
    },
    {
        texto: "A veces pienso que encontrarte fue la forma más bonita que tuvo la vida de sorprenderme. Desde que llegaste, hay canciones que suenan distinto, momentos que quiero compartir contigo y una sonrisa que aparece sin pedir permiso cuando pienso en ti.",
        autor: "Anónimo"
    }
];


/* El libro siempre se genera en tamaño Carta. */
const TAMANO_CARTA = {
    nombre: "Carta",
    ancho: "216mm",
    alto: "279mm",
    ratio: "216 / 279"
};


/* =========================================================
   UTILIDADES COMPARTIDAS
   ========================================================= */

function elementoAleatorio(lista) {

    return lista.length
        ? lista[
        Math.floor(
            Math.random() *
            lista.length
        )
        ]
        : null;

}


/* Detecta un gesto de deslizar (swipe) horizontal sobre un elemento
   y llama a onSwipeLeft / onSwipeRight. Pensado mobile-first:
   - Ignora el gesto si empieza sobre un textarea, input o botón,
     para no interferir con escribir o seleccionar texto ni con
     los botones normales.
   - Solo "roba" el gesto de scroll de la página (preventDefault)
     una vez que queda claro que el dedo se mueve más en horizontal
     que en vertical, para no romper el scroll vertical normal. */
function agregarSwipe(elemento, onSwipeLeft, onSwipeRight) {

    if (!elemento) return;


    let inicioX = 0;

    let inicioY = 0;

    let activo = false;

    let esHorizontal = false;


    const UMBRAL_MIN = 50;


    elemento.addEventListener(
        "touchstart",
        (evento) => {

            if (evento.touches.length !== 1) {

                activo = false;

                return;

            }


            const objetivo =
                evento.target;


            if (
                objetivo.closest(
                    "textarea, input, button, select, a"
                )
            ) {

                activo = false;

                return;

            }


            inicioX =
                evento.touches[0].clientX;


            inicioY =
                evento.touches[0].clientY;


            activo = true;

            esHorizontal = false;

        },
        { passive: true }
    );


    elemento.addEventListener(
        "touchmove",
        (evento) => {

            if (!activo) return;


            const dx =
                evento.touches[0].clientX - inicioX;


            const dy =
                evento.touches[0].clientY - inicioY;


            if (
                !esHorizontal &&
                Math.abs(dx) > 10 &&
                Math.abs(dx) > Math.abs(dy)
            ) {

                esHorizontal = true;

            }


            /* Solo bloqueamos el scroll de la página cuando ya
               sabemos que es un swipe horizontal de verdad. */
            if (esHorizontal && evento.cancelable) {

                evento.preventDefault();

            }

        },
        { passive: false }
    );


    function terminar(evento) {

        if (!activo) return;

        activo = false;


        if (!evento.changedTouches || !evento.changedTouches.length) return;


        const toque =
            evento.changedTouches[0];


        const dx =
            toque.clientX - inicioX;


        const dy =
            toque.clientY - inicioY;


        if (Math.abs(dx) < UMBRAL_MIN) return;

        if (Math.abs(dx) < Math.abs(dy)) return;


        if (dx < 0) {

            onSwipeLeft?.();

        } else {

            onSwipeRight?.();

        }

    }


    elemento.addEventListener(
        "touchend",
        terminar,
        { passive: true }
    );


    elemento.addEventListener(
        "touchcancel",
        () => {

            activo = false;

        },
        { passive: true }
    );

}


/* =========================================================
   INDEX — CONFIGURACIÓN
   ========================================================= */

(function paginaConfiguracion() {

    const btnGenerar =
        document.getElementById("btn-generar");

    if (!btnGenerar) return;


    const fondoCards =
        Array.from(document.querySelectorAll(".fondo-card"));

    const viewportFondos =
        document.getElementById("fondos-viewport");

    const btnFondoPrev =
        document.getElementById("fondo-prev");

    const btnFondoNext =
        document.getElementById("fondo-next");

    const btnPersonalizarFondo =
        document.getElementById("btn-personalizar-fondo");

    const fondoColorPanel =
        document.getElementById("fondo-color-panel");

    const fondoColorRadios =
        Array.from(
            document.querySelectorAll(
                'input[name="fondo-color"]'
            )
        );

    const selectTipografia =
        document.getElementById("select-tipografia");

    const previewTipografia =
        document.getElementById("preview-tipografia");

    const btnRandom =
        document.getElementById("btn-random");

    const randomLeyenda =
        document.getElementById("random-leyenda");

    const ctaHint =
        document.getElementById("cta-hint");

    const colorRadios =
        Array.from(
            document.querySelectorAll(
                'input[name="color-letra"]'
            )
        );


    /* fondoTipo: 'imagen' | 'color' */
    let fondoTipo = "imagen";

    let fondoElegido = "0";

    let fondoUrlElegida = "img/0.jpeg";

    let fondoColorElegido = fondoColorRadios[0]
        ? fondoColorRadios[0].value
        : "#f3ead9";


    /* Lee la URL real de la imagen de una tarjeta de fondo, en vez
       de calcularla a partir de su id. Así no importa cuántos
       fondos haya ni cómo estén numerados. */
    function urlDeTarjetaFondo(card) {

        const img =
            card?.querySelector(
                ".fondo-card__preview"
            );


        return (
            img?.getAttribute("src") ||
            `img/${card?.dataset.fondo}.jpeg`
        );

    }


    /* Si ninguna tarjeta de fondo quedó marcada en el HTML
       (por ejemplo, porque se quitó la que tenía aria-pressed="true"),
       se selecciona automáticamente la primera disponible. */
    (function asegurarFondoInicial() {

        const marcada =
            fondoCards.find(
                (c) =>
                    c.getAttribute("aria-pressed") === "true"
            );


        const tarjeta =
            marcada || fondoCards[0];


        if (!tarjeta) return;


        if (!marcada) {

            tarjeta.setAttribute(
                "aria-pressed",
                "true"
            );

        }


        fondoElegido =
            tarjeta.dataset.fondo;


        fondoUrlElegida =
            urlDeTarjetaFondo(
                tarjeta
            );

    })();


    /* =====================================================
       CARRUSEL DE FONDOS (imagen)
       ===================================================== */

    function seleccionarFondoImagen(card) {

        fondoCards.forEach((c) => {

            c.setAttribute(
                "aria-pressed",
                "false"
            );

        });


        card.setAttribute(
            "aria-pressed",
            "true"
        );


        fondoTipo = "imagen";

        fondoElegido =
            card.dataset.fondo;


        fondoUrlElegida =
            urlDeTarjetaFondo(
                card
            );


        fondoColorRadios.forEach((r) => {

            r.checked = false;

        });

    }


    fondoCards.forEach((card) => {

        card.addEventListener(
            "click",
            () => seleccionarFondoImagen(card)
        );

    });


    function moverCarrusel(direccion) {

        if (!viewportFondos) return;


        const tarjeta =
            fondoCards[0];


        const distancia =
            tarjeta
                ? tarjeta.getBoundingClientRect().width + 14
                : 180;


        viewportFondos.scrollBy({

            left: direccion * distancia,

            behavior: "smooth"

        });

    }


    btnFondoPrev?.addEventListener(
        "click",
        () => moverCarrusel(-1)
    );


    btnFondoNext?.addEventListener(
        "click",
        () => moverCarrusel(1)
    );


    /* =====================================================
       PERSONALIZAR FONDO (color liso)
       ===================================================== */

    function seleccionarFondoColor(radio) {

        radio.checked = true;


        fondoTipo = "color";

        fondoColorElegido =
            radio.value;


        fondoCards.forEach((c) => {

            c.setAttribute(
                "aria-pressed",
                "false"
            );

        });

    }


    btnPersonalizarFondo?.addEventListener(
        "click",
        () => {

            const abierto =
                !fondoColorPanel.hidden;


            fondoColorPanel.hidden =
                abierto;


            btnPersonalizarFondo.setAttribute(
                "aria-expanded",
                abierto ? "false" : "true"
            );

        }
    );


    fondoColorRadios.forEach((radio) => {

        radio.addEventListener(
            "change",
            () => seleccionarFondoColor(radio)
        );

    });


    /* =====================================================
       TIPOGRAFÍA
       ===================================================== */

    function actualizarPreviewTipografia() {

        if (!previewTipografia) return;


        previewTipografia.style.fontFamily =
            `"${selectTipografia.value}", cursive`;

    }


    selectTipografia.addEventListener(
        "change",
        actualizarPreviewTipografia
    );


    actualizarPreviewTipografia();


    /* =====================================================
       COLOR DE LETRA
       ===================================================== */

    function actualizarPreviewColor() {

        if (!previewTipografia) return;


        const radio =
            document.querySelector(
                'input[name="color-letra"]:checked'
            );


        if (radio) {

            previewTipografia.style.color =
                radio.value;

        }

    }


    colorRadios.forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarPreviewColor
        );

    });


    actualizarPreviewColor();


    /* =====================================================
       ALEATORIOS — cada elemento tiene un conjunto limitado
       de opciones para que el azar siempre luzca bien.
       ===================================================== */

    function elegirFondoAleatorio() {

        /* Alrededor de un tercio de las veces usa un color liso. */
        const usarColor =
            fondoColorRadios.length &&
            Math.random() < 0.35;


        if (usarColor) {

            const radio =
                elementoAleatorio(
                    fondoColorRadios
                );


            if (radio) {

                seleccionarFondoColor(radio);


                fondoColorPanel.hidden = false;


                btnPersonalizarFondo?.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        } else {

            const card =
                elementoAleatorio(
                    fondoCards
                );


            if (card) {

                seleccionarFondoImagen(card);


                card.scrollIntoView({

                    behavior: "smooth",

                    block: "nearest",

                    inline: "center"

                });

            }

        }

    }


    function elegirTipografiaAleatoria() {

        const opcion =
            elementoAleatorio(
                Array.from(
                    selectTipografia.options
                )
            );


        if (!opcion) return;


        selectTipografia.value =
            opcion.value;


        actualizarPreviewTipografia();

    }


    function elegirColorAleatorio() {

        const radio =
            elementoAleatorio(
                colorRadios
            );


        if (!radio) return;


        radio.checked = true;


        actualizarPreviewColor();

    }


    btnRandom?.addEventListener(
        "click",
        () => {

            elegirFondoAleatorio();

            elegirTipografiaAleatoria();

            elegirColorAleatorio();


            randomLeyenda.textContent =
                "Listo. El azar eligió una combinación para ti.";


            randomLeyenda.classList.remove(
                "destacar"
            );


            void randomLeyenda.offsetWidth;


            randomLeyenda.classList.add(
                "destacar"
            );


            ctaHint.textContent =
                "Puedes quedarte con esta combinación " +
                "o cambiar cualquier opción antes de empezar tu libro.";

        }
    );


    /* =====================================================
       AVISO SI VENIMOS DE "CAMBIAR SOLO EL FORMATO"
       ===================================================== */

    (function avisarSiHayLibroEnCurso() {

        const hayPaginasGuardadas =
            Boolean(
                sessionStorage.getItem(
                    CLAVE_PAGINAS
                )
            );


        if (!hayPaginasGuardadas) return;


        if (ctaHint) {

            ctaHint.textContent =
                "Vas a seguir con el texto y las fotos que ya tenías: " +
                "elige la nueva presentación y toca el botón para continuar.";

        }


        if (btnGenerar) {

            btnGenerar.textContent =
                "Continuar mi libro";

        }

    })();


    /* =====================================================
       EMPEZAR LIBRO
       ===================================================== */

    btnGenerar.addEventListener(
        "click",
        () => {

            /* Evita que un doble-tap en celular (o el "click" que
               algunos navegadores móviles disparan dos veces sobre
               el mismo toque) ejecute esto dos veces. */
            if (btnGenerar.disabled) return;


            btnGenerar.disabled = true;


            ctaHint.textContent =
                "Preparando tu libro…";


            /* Red de seguridad: si por lo que sea (Safari en modo
               privado, un error silencioso, una conexión lenta)
               la navegación a libro.html no llega a pasar, el botón
               no debe quedar bloqueado para siempre. Si en 3
               segundos seguimos en esta página, lo reactivamos. */
            const idSeguridad = setTimeout(() => {

                btnGenerar.disabled = false;

                ctaHint.textContent =
                    "Algo tardó más de la cuenta. Intenta de nuevo.";

            }, 3000);


            try {

                const colorSeleccionado =
                    document.querySelector(
                        'input[name="color-letra"]:checked'
                    );


                const config = {

                    fondoTipo,


                    fondoUrl:
                        fondoTipo === "imagen"
                            ? fondoUrlElegida
                            : null,


                    fondoColor:
                        fondoTipo === "color"
                            ? fondoColorElegido
                            : null,


                    tipografia:
                        selectTipografia.value,


                    colorTexto:
                        colorSeleccionado
                            ? colorSeleccionado.value
                            : "#4A3324"

                };


                sessionStorage.setItem(
                    CLAVE_SESION,
                    JSON.stringify(config)
                );


                window.location.href =
                    "libro.html";


            } catch (err) {

                console.error(err);


                clearTimeout(idSeguridad);


                ctaHint.textContent =
                    "No pudimos preparar tu libro. Intenta de nuevo.";


                btnGenerar.disabled = false;

            }

        }
    );

})();



/* =========================================================
   LIBRO — EDITOR + VISTA PREVIA + PDF
   ========================================================= */

(function paginaLibro() {

    const hoja =
        document.getElementById("hoja");


    if (!hoja) return;


    const bloqueEditor =
        document.getElementById("editor");


    const bloqueSinDatos =
        document.getElementById("sin-datos");


    const pagenum =
        document.getElementById("pagenum");


    const btnAnterior =
        document.getElementById("btn-anterior");


    const btnSiguiente =
        document.getElementById("btn-siguiente");


    const btnAgregarPagina =
        document.getElementById("btn-agregar-pagina");


    const btnEliminarPagina =
        document.getElementById("btn-eliminar-pagina");


    const btnAgregarImagen =
        document.getElementById("btn-agregar-imagen");


    const inputImagenPagina =
        document.getElementById("input-imagen-pagina");


    const btnQuitarImagen =
        document.getElementById("btn-quitar-imagen");


    const arrastrarHint =
        document.getElementById("arrastrar-hint");


    const avisoSinFoto =
        document.getElementById("aviso-sin-foto");


    const editorEstilo =
        document.getElementById("editor-estilo");


    const botonesForma =
        Array.from(
            document.querySelectorAll(
                "#grupo-forma-foto .segmentado__opcion"
            )
        );


    const botonesMarco =
        Array.from(
            document.querySelectorAll(
                "#grupo-marco-foto .segmentado__opcion"
            )
        );


    const botonesAlinear =
        Array.from(
            document.querySelectorAll(
                "#grupo-alinear-texto .segmentado__opcion"
            )
        );


    const btnNegrita =
        document.getElementById("btn-negrita");


    const btnCursiva =
        document.getElementById("btn-cursiva");


    const btnPreview =
        document.getElementById("btn-preview");


    const previewScreen =
        document.getElementById("preview-screen");


    const previewStage =
        document.getElementById("preview-stage");


    const previewPagenum =
        document.getElementById("preview-pagenum");


    const previewPrev =
        document.getElementById("preview-prev");


    const previewNext =
        document.getElementById("preview-next");


    const btnSeguirEditando =
        document.getElementById(
            "btn-volver-editor-bottom"
        );


    const btnDescargarPDF =
        document.getElementById("btn-descargar-pdf");


    const btnDescargarPDF2 =
        document.getElementById("btn-descargar-pdf-2");


    const btnFrases =
        document.getElementById("btn-frases");


    const frasesPopover =
        document.getElementById("frases-popover");


    const frasesLista =
        document.getElementById("frases-lista");


    const btnFrasesCerrar =
        document.getElementById("frases-cerrar");


    const toast =
        document.getElementById("toast");


    const btnCambiarConfig =
        document.getElementById("btn-cambiar-config");


    const modalConfig =
        document.getElementById("modal-config");


    const btnModalCambiarFormato =
        document.getElementById(
            "btn-modal-cambiar-formato"
        );


    const btnModalNuevoLibro =
        document.getElementById(
            "btn-modal-nuevo-libro"
        );


    const btnModalCerrar =
        document.getElementById("btn-modal-cerrar");


    const modalConfirmar =
        document.getElementById("modal-confirmar");


    const modalConfirmarTitulo =
        document.getElementById("modal-confirmar-titulo");


    const modalConfirmarTexto =
        document.getElementById("modal-confirmar-texto");


    const btnConfirmarSi =
        document.getElementById("btn-confirmar-si");


    const btnConfirmarNo =
        document.getElementById("btn-confirmar-no");


    const modalNombrePdf =
        document.getElementById("modal-nombre-pdf");


    const inputNombrePdf =
        document.getElementById("input-nombre-pdf");


    const btnNombrePdfAceptar =
        document.getElementById(
            "btn-nombre-pdf-aceptar"
        );


    const btnNombrePdfCancelar =
        document.getElementById(
            "btn-nombre-pdf-cancelar"
        );


    const LIMITE_CARACTERES = 500;


    const dataGuardada =
        sessionStorage.getItem(
            CLAVE_SESION
        );


    /* =====================================================
       COMPROBAR CONFIGURACIÓN
       ===================================================== */

    if (!dataGuardada) {

        bloqueSinDatos.hidden = false;

        return;

    }


    let config;


    try {

        config =
            JSON.parse(
                dataGuardada
            );

    } catch (error) {

        console.error(error);

        bloqueSinDatos.hidden = false;

        return;

    }


    /* =====================================================
       MODELO DEL LIBRO
       Empieza solo con la portada. Cada página de cuerpo
       se agrega con el botón "+ agregar página".
       La portada también guarda su propio estilo de texto
       (alineación / negrita / cursiva), igual que el resto
       de las páginas, para poder editarlo desde el mismo
       panel de estilo. ===================================================== */

    let paginas = [

        {
            tipo: "portada",
            titulo: "",
            subtitulo: "",
            textoAlineacion: "centro",
            textoNegrita: false,
            textoCursiva: false
        }

    ];


    let paginaActual = 0;


    /* Si el usuario venía de "cambiar solo el formato" en el paso
       anterior, acá recuperamos el texto y las fotos que ya tenía,
       en vez de arrancar de nuevo solo con la portada vacía. Es de
       un solo uso: se borra apenas se lee, para no reaparecer si
       se recarga la página o se elige "empezar un libro nuevo" más
       adelante. */
    (function recuperarPaginasGuardadas() {

        const guardado =
            sessionStorage.getItem(
                CLAVE_PAGINAS
            );


        if (!guardado) return;


        try {

            const datos =
                JSON.parse(
                    guardado
                );


            if (
                datos &&
                Array.isArray(datos.paginas) &&
                datos.paginas.length &&
                datos.paginas[0]?.tipo === "portada"
            ) {

                paginas =
                    datos.paginas;


                paginaActual =
                    Number.isInteger(datos.paginaActual)
                        ? Math.max(
                            0,
                            Math.min(
                                datos.paginaActual,
                                paginas.length - 1
                            )
                        )
                        : 0;

            }

        } catch (error) {

            console.error(
                error
            );

        } finally {

            sessionStorage.removeItem(
                CLAVE_PAGINAS
            );

        }

    })();


    /* =====================================================
       TAMAÑO DE PÁGINA — siempre Carta
       ===================================================== */

    document.documentElement.style.setProperty(
        "--sheet-width",
        TAMANO_CARTA.ancho
    );


    document.documentElement.style.setProperty(
        "--sheet-height",
        TAMANO_CARTA.alto
    );


    document.documentElement.style.setProperty(
        "--sheet-ratio",
        TAMANO_CARTA.ratio
    );


    /* =====================================================
       TIPOGRAFÍA Y COLOR
       ===================================================== */

    document.documentElement.style.setProperty(
        "--book-font",
        `"${config.tipografia}", cursive`
    );


    document.documentElement.style.setProperty(
        "--book-color",
        config.colorTexto ||
        "#4A3324"
    );


    /* =====================================================
       FONDO — imagen o color personalizado
       ===================================================== */

    function fondoUrl() {

        /* config.fondoUrl ya viene resuelto desde index.html (la
           URL real de la imagen elegida). Si por algo llegara
           vacío, usamos un fondo por defecto razonable. */
        return (
            config.fondoUrl ||
            "img/0.jpeg"
        );

    }


    /* Precarga la imagen de fondo antes de pintar cualquier página.
       Sin esto, el CSS "background-image" no espera a que la imagen
       termine de descargar: normalmente carga tan rápido que no se
       nota, pero a veces (celular, conexión lenta, primera visita)
       la página se dibuja antes de que la imagen esté lista y se ve
       el papel de respaldo por debajo — que es justo lo que pasaba
       en la vista previa pero no en el PDF (para el PDF, la imagen
       ya llevaba un rato cargada en el navegador). Precargándola
       una sola vez acá, tanto el editor como la vista previa y el
       PDF arrancan siempre con la imagen ya lista. */
    function precargarImagen(url) {

        return new Promise(
            (resolve) => {

                if (!url) {

                    resolve();

                    return;

                }


                const img =
                    new Image();


                img.onload = () =>
                    resolve();


                img.onerror = () =>
                    resolve();


                img.src = url;

            }
        );

    }


    function aplicarFondo(elemento) {

        if (
            config.fondoTipo === "color" &&
            config.fondoColor
        ) {

            elemento.style.backgroundColor =
                config.fondoColor;


            elemento.style.backgroundImage =
                fondoLineasDataUrl(
                    LINEA_FONDO_COLOR
                );


            elemento.style.backgroundRepeat =
                "repeat";


            elemento.style.backgroundSize =
                "200px 38px";


            elemento.style.backgroundPosition =
                "0 0";

        } else {

            elemento.style.backgroundColor =
                "";


            elemento.style.backgroundRepeat =
                "no-repeat";


            elemento.style.backgroundImage =
                `linear-gradient(
                    rgba(255,255,255,.08),
                    rgba(255,255,255,.08)
                ),
                url("${fondoUrl()}")`;


            elemento.style.backgroundSize =
                "cover";


            elemento.style.backgroundPosition =
                "center";

        }

    }


    function configurarHoja(elemento) {

        elemento.classList.add(
            "book-sheet"
        );


        aplicarFondo(
            elemento
        );

    }


    bloqueEditor.hidden = false;


    /* =====================================================
       TOAST
       ===================================================== */

    let toastTimeoutId = null;


    function mostrarToast(mensaje) {

        if (!toast) return;


        toast.textContent = mensaje;


        toast.classList.add(
            "toast--visible"
        );


        if (toastTimeoutId) {

            clearTimeout(
                toastTimeoutId
            );

        }


        toastTimeoutId = setTimeout(
            () => {

                toast.classList.remove(
                    "toast--visible"
                );

            },
            2000
        );

    }


    /* =====================================================
       VENTANA DE CONFIRMACIÓN GENÉRICA
       Reemplaza window.confirm() con una ventana propia del
       estilo del sitio. Devuelve una Promise<boolean>: true si
       la persona confirma, false si cancela o cierra la ventana.
       ===================================================== */

    function pedirConfirmacion(opciones) {

        const {
            titulo = "¿Estás segura/o?",
            mensaje = "Esta acción no se puede deshacer.",
            textoConfirmar = "Sí, continuar",
            textoCancelar = "Cancelar",
            peligro = true
        } = opciones || {};


        /* Si por algo faltan los elementos del modal en el HTML,
           no se rompe el sitio: se cae de vuelta al confirm nativo. */
        if (
            !modalConfirmar ||
            !btnConfirmarSi ||
            !btnConfirmarNo
        ) {

            return Promise.resolve(
                window.confirm(mensaje)
            );

        }


        return new Promise(
            (resolve) => {

                modalConfirmarTitulo.textContent =
                    titulo;


                modalConfirmarTexto.textContent =
                    mensaje;


                btnConfirmarSi.textContent =
                    textoConfirmar;


                btnConfirmarNo.textContent =
                    textoCancelar;


                btnConfirmarSi.classList.toggle(
                    "btn--modal-peligro",
                    peligro
                );


                btnConfirmarSi.classList.toggle(
                    "btn--modal-primario",
                    !peligro
                );


                modalConfirmar.hidden = false;


                function limpiar(resultado) {

                    modalConfirmar.hidden = true;


                    btnConfirmarSi.removeEventListener(
                        "click",
                        alConfirmar
                    );


                    btnConfirmarNo.removeEventListener(
                        "click",
                        alCancelar
                    );


                    modalConfirmar.removeEventListener(
                        "click",
                        alTocarFondo
                    );


                    document.removeEventListener(
                        "keydown",
                        alPresionarEscape
                    );


                    resolve(
                        resultado
                    );

                }


                function alConfirmar() {

                    limpiar(true);

                }


                function alCancelar() {

                    limpiar(false);

                }


                function alTocarFondo(evento) {

                    if (
                        evento.target ===
                        modalConfirmar
                    ) {

                        limpiar(false);

                    }

                }


                function alPresionarEscape(evento) {

                    if (
                        evento.key === "Escape"
                    ) {

                        limpiar(false);

                    }

                }


                btnConfirmarSi.addEventListener(
                    "click",
                    alConfirmar
                );


                btnConfirmarNo.addEventListener(
                    "click",
                    alCancelar
                );


                modalConfirmar.addEventListener(
                    "click",
                    alTocarFondo
                );


                document.addEventListener(
                    "keydown",
                    alPresionarEscape
                );

            }
        );

    }


    /* =====================================================
       VENTANA PARA ELEGIR EL NOMBRE DEL PDF
       Reemplaza window.prompt(). Devuelve una Promise<string|null>:
       el nombre elegido, o null si se cancela.
       ===================================================== */

    function pedirNombreArchivo(sugerido) {

        if (
            !modalNombrePdf ||
            !inputNombrePdf ||
            !btnNombrePdfAceptar ||
            !btnNombrePdfCancelar
        ) {

            return Promise.resolve(
                window.prompt(
                    "¿Cómo quieres llamar tu PDF?",
                    sugerido
                )
            );

        }


        return new Promise(
            (resolve) => {

                inputNombrePdf.value =
                    sugerido;


                modalNombrePdf.hidden = false;


                requestAnimationFrame(
                    () => {

                        inputNombrePdf.focus();


                        inputNombrePdf.select();

                    }
                );


                function limpiar(resultado) {

                    modalNombrePdf.hidden = true;


                    btnNombrePdfAceptar.removeEventListener(
                        "click",
                        alAceptar
                    );


                    btnNombrePdfCancelar.removeEventListener(
                        "click",
                        alCancelar
                    );


                    modalNombrePdf.removeEventListener(
                        "click",
                        alTocarFondo
                    );


                    inputNombrePdf.removeEventListener(
                        "keydown",
                        alPresionarTecla
                    );


                    resolve(
                        resultado
                    );

                }


                function alAceptar() {

                    limpiar(
                        inputNombrePdf.value
                    );

                }


                function alCancelar() {

                    limpiar(null);

                }


                function alTocarFondo(evento) {

                    if (
                        evento.target ===
                        modalNombrePdf
                    ) {

                        limpiar(null);

                    }

                }


                function alPresionarTecla(evento) {

                    if (evento.key === "Enter") {

                        evento.preventDefault();


                        alAceptar();

                    } else if (
                        evento.key === "Escape"
                    ) {

                        alCancelar();

                    }

                }


                btnNombrePdfAceptar.addEventListener(
                    "click",
                    alAceptar
                );


                btnNombrePdfCancelar.addEventListener(
                    "click",
                    alCancelar
                );


                modalNombrePdf.addEventListener(
                    "click",
                    alTocarFondo
                );


                inputNombrePdf.addEventListener(
                    "keydown",
                    alPresionarTecla
                );

            }
        );

    }


    /* =====================================================
       IDEAS DE FRASES — POPOVER
       ===================================================== */

    function renderFrases() {

        if (!frasesLista) return;


        frasesLista.innerHTML = "";


        FRASES_IDEAS.forEach(
            (frase) => {

                const item =
                    document.createElement(
                        "li"
                    );


                item.className =
                    "frase-item";


                const texto =
                    document.createElement(
                        "p"
                    );


                texto.className =
                    "frase-item__texto";


                texto.textContent =
                    `“${frase.texto}”`;


                const autor =
                    document.createElement(
                        "span"
                    );


                autor.className =
                    "frase-item__autor";


                autor.textContent =
                    `— ${frase.autor}`;


                texto.appendChild(
                    autor
                );


                const btnCopiar =
                    document.createElement(
                        "button"
                    );


                btnCopiar.type =
                    "button";


                btnCopiar.className =
                    "frase-item__copiar";


                btnCopiar.setAttribute(
                    "aria-label",
                    `Copiar frase de ${frase.autor}`
                );


                btnCopiar.innerHTML =
                    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="12" height="12" rx="2" />
                        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>`;


                btnCopiar.addEventListener(
                    "click",
                    async () => {

                        try {

                            if (
                                navigator.clipboard &&
                                navigator.clipboard.writeText
                            ) {

                                await navigator.clipboard.writeText(
                                    frase.texto
                                );

                            } else {

                                throw new Error(
                                    "Clipboard API no disponible"
                                );

                            }


                            mostrarToast(
                                "Frase copiada, lista para pegar"
                            );


                        } catch (error) {

                            console.error(
                                error
                            );


                            const areaTemporal =
                                document.createElement(
                                    "textarea"
                                );


                            areaTemporal.value =
                                frase.texto;


                            areaTemporal.style.position =
                                "fixed";


                            areaTemporal.style.opacity =
                                "0";


                            document.body.appendChild(
                                areaTemporal
                            );


                            areaTemporal.select();


                            try {

                                document.execCommand(
                                    "copy"
                                );


                                mostrarToast(
                                    "Frase copiada, lista para pegar"
                                );

                            } catch (errorCopia) {

                                console.error(
                                    errorCopia
                                );


                                mostrarToast(
                                    "No pudimos copiar la frase"
                                );

                            }


                            document.body.removeChild(
                                areaTemporal
                            );

                        }

                    }
                );


                item.append(
                    texto,
                    btnCopiar
                );


                frasesLista.appendChild(
                    item
                );

            }
        );

    }


    function abrirFrasesPopover() {

        if (!frasesPopover) return;


        frasesPopover.hidden = false;


        btnFrases?.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    function cerrarFrasesPopover() {

        if (!frasesPopover) return;


        frasesPopover.hidden = true;


        btnFrases?.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    renderFrases();


    btnFrases?.addEventListener(
        "click",
        (evento) => {

            evento.stopPropagation();


            const abierto =
                !frasesPopover.hidden;


            if (abierto) {

                cerrarFrasesPopover();

            } else {

                abrirFrasesPopover();

            }

        }
    );


    btnFrasesCerrar?.addEventListener(
        "click",
        cerrarFrasesPopover
    );


    document.addEventListener(
        "click",
        (evento) => {

            if (
                frasesPopover &&
                !frasesPopover.hidden &&
                !frasesPopover.contains(evento.target) &&
                evento.target !== btnFrases &&
                !btnFrases?.contains(evento.target)
            ) {

                cerrarFrasesPopover();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key === "Escape" &&
                frasesPopover &&
                !frasesPopover.hidden
            ) {

                cerrarFrasesPopover();

            }

        }
    );


    /* =====================================================
       LEER UNA IMAGEN COMO DATA URL
       ===================================================== */

    function leerComoDataURL(archivo) {

        return new Promise(
            (resolve, reject) => {

                const lector =
                    new FileReader();


                lector.onload = () =>
                    resolve(lector.result);


                lector.onerror = () =>
                    reject(
                        new Error(
                            "No se pudo leer la imagen."
                        )
                    );


                lector.readAsDataURL(archivo);

            }
        );

    }


    /* =====================================================
       ESTILO DE TEXTO POR PÁGINA — alineación, negrita, cursiva
       Un solo lugar para traducir los valores guardados en la
       página a estilos reales, usado igual en el editor y en la
       vista previa/PDF. Se usa tanto para el texto de páginas de
       cuerpo como para el título/subtítulo de la portada.
       ===================================================== */

    function alineacionCss(valor) {

        if (valor === "izquierda") return "left";

        if (valor === "derecha") return "right";

        return "center";

    }


    function aplicarEstiloTexto(
        elemento,
        pagina
    ) {

        elemento.style.textAlign =
            alineacionCss(
                pagina.textoAlineacion
            );


        elemento.style.fontWeight =
            pagina.textoNegrita
                ? "700"
                : "400";


        elemento.style.fontStyle =
            pagina.textoCursiva
                ? "italic"
                : "normal";

    }


    /* =====================================================
       MARCO DE FOTO — usado igual en el editor, la vista previa
       y el PDF, para que los tres se vean siempre idénticos.
       La foto siempre va arriba y centrada (eso no se puede
       mover); lo único que se puede ajustar es la forma, si
       tiene marco o no, y qué parte de la foto queda visible
       dentro del marco (arrastrando, solo en el editor).
       ===================================================== */

    function crearMarcoFoto(pagina, indice, opciones) {

        const editable =
            Boolean(opciones?.editable);


        const forma =
            pagina.marcoForma ||
            "ovalado";


        const tipoMarco =
            pagina.marcoTipo ||
            "conmarco";


        const posicion =
            pagina.imagenPosicion ||
            { x: 50, y: 50 };


        const marco =
            document.createElement(
                "div"
            );


        marco.className =
            `sheet-page__img-marco sheet-page__img-marco--${forma} sheet-page__img-marco--${tipoMarco}`;


        /* El anillo interior (el "gap" color papel) solo existe
           cuando la página tiene marco; sin marco, la cajita de
           la foto cuelga directo del contenedor exterior. */
        let contenedorCaja = marco;


        if (tipoMarco === "conmarco") {

            const anillo =
                document.createElement(
                    "div"
                );


            anillo.className =
                "sheet-page__img-anillo";


            marco.appendChild(
                anillo
            );


            contenedorCaja =
                anillo;

        }


        const caja =
            document.createElement(
                "div"
            );


        caja.className =
            "sheet-page__img";


        contenedorCaja.appendChild(
            caja
        );


        const foto =
            document.createElement(
                "div"
            );


        foto.className =
            editable
                ? "sheet-page__img-foto sheet-page__img-foto--editable"
                : "sheet-page__img-foto";


        foto.style.backgroundImage =
            `url("${pagina.imagen}")`;


        foto.style.backgroundPosition =
            `${posicion.x}% ${posicion.y}%`;


        foto.setAttribute(
            "role",
            "img"
        );


        foto.setAttribute(
            "aria-label",
            `Foto de la página ${indice + 1}`
        );


        if (editable) {

            foto.dataset.tooltip =
                "Arrastra para reencuadrar";


            habilitarArrastreFoto(
                foto,
                pagina
            );

        }


        caja.appendChild(
            foto
        );


        return marco;

    }


    /* Arrastrar la foto dentro de su marco para elegir qué parte
       se ve. Se guarda como porcentaje (pagina.imagenPosicion) y
       se usa como background-position; por eso mover el dedo a la
       izquierda "revela" más del lado derecho de la foto, como
       cuando se desliza una foto bajo una ventanita. */
    function habilitarArrastreFoto(
        fotoEl,
        pagina
    ) {

        let arrastrando = false;

        let inicioX = 0;

        let inicioY = 0;

        let posInicioX = 50;

        let posInicioY = 50;


        function posicionActual() {

            return (
                pagina.imagenPosicion ||
                { x: 50, y: 50 }
            );

        }


        fotoEl.addEventListener(
            "pointerdown",
            (evento) => {

                arrastrando = true;


                inicioX =
                    evento.clientX;


                inicioY =
                    evento.clientY;


                const actual =
                    posicionActual();


                posInicioX =
                    actual.x;


                posInicioY =
                    actual.y;


                fotoEl.setPointerCapture?.(
                    evento.pointerId
                );

            }
        );


        fotoEl.addEventListener(
            "pointermove",
            (evento) => {

                if (!arrastrando) return;


                const rect =
                    fotoEl.getBoundingClientRect();


                if (
                    !rect.width ||
                    !rect.height
                ) return;


                const dxPorcentaje =
                    (
                        (evento.clientX - inicioX) /
                        rect.width
                    ) * 100;


                const dyPorcentaje =
                    (
                        (evento.clientY - inicioY) /
                        rect.height
                    ) * 100;


                let nuevoX =
                    posInicioX - dxPorcentaje;


                let nuevoY =
                    posInicioY - dyPorcentaje;


                nuevoX =
                    Math.max(
                        0,
                        Math.min(100, nuevoX)
                    );


                nuevoY =
                    Math.max(
                        0,
                        Math.min(100, nuevoY)
                    );


                pagina.imagenPosicion =
                    { x: nuevoX, y: nuevoY };


                fotoEl.style.backgroundPosition =
                    `${nuevoX}% ${nuevoY}%`;

            }
        );


        function terminarArrastre(
            evento
        ) {

            if (!arrastrando) return;


            arrastrando = false;


            fotoEl.releasePointerCapture?.(
                evento.pointerId
            );

        }


        fotoEl.addEventListener(
            "pointerup",
            terminarArrastre
        );


        fotoEl.addEventListener(
            "pointercancel",
            terminarArrastre
        );

    }


    /* =====================================================
       RENDERIZAR PÁGINA ACTUAL (EDITOR)
       ===================================================== */

    function renderPagina() {

        hoja.innerHTML = "";


        const esPortada =
            paginas[paginaActual].tipo === "portada";


        pagenum.textContent =
            `Página ${paginaActual + 1} / ${paginas.length}`;


        btnAnterior.disabled =
            paginaActual === 0;


        btnSiguiente.disabled =
            paginaActual ===
            paginas.length - 1;


        /* El botón "eliminar página" se deja siempre visible.
           En la portada se muestra atenuado y, si se toca, explica
           por qué no se puede eliminar, en vez de solo ocultarse. */

        btnEliminarPagina.hidden = false;


        btnEliminarPagina.classList.toggle(
            "btn--pill-deshabilitado",
            esPortada
        );


        btnEliminarPagina.setAttribute(
            "aria-disabled",
            esPortada ? "true" : "false"
        );


        btnEliminarPagina.dataset.tooltip =
            esPortada
                ? "No puedes eliminar la portada"
                : "Eliminar esta página";


        /* Botón "agregar imagen": deshabilitado solo en la portada */

        btnAgregarImagen.disabled =
            esPortada;


        btnAgregarImagen.dataset.tooltip =
            esPortada
                ? "No puedes agregar fotos en la portada"
                : "Agregar una foto a esta página";


        if (!esPortada) {

            const tieneImagen =
                Boolean(
                    paginas[paginaActual].imagen
                );


            btnAgregarImagen.textContent =
                tieneImagen
                    ? "📷 Cambiar imagen"
                    : "📷 Agregar imagen";


            btnQuitarImagen.hidden =
                !tieneImagen;


            if (arrastrarHint) {

                arrastrarHint.hidden =
                    !tieneImagen;

            }

        } else {

            btnAgregarImagen.textContent =
                "📷 Agregar imagen";


            btnQuitarImagen.hidden = true;


            if (arrastrarHint) {

                arrastrarHint.hidden = true;

            }

        }


        /* El panel de estilo se muestra siempre: la alineación,
           negrita y cursiva también aplican a la portada. Dentro
           de actualizarControlesEstilo() se ocultan solo los
           controles de forma/marco de foto cuando es la portada,
           ya que esos nunca aplican ahí. */
        if (editorEstilo) {

            editorEstilo.hidden = false;

        }


        actualizarControlesEstilo();


        if (esPortada) {

            renderPortadaEditor();

        } else {

            renderPaginaEditor();

        }

    }


    /* =====================================================
       CONTROLES DE ESTILO POR PÁGINA
       Reflejan y actualizan el estilo de la página actual:
       forma/marco de foto, alineación de texto, negrita/cursiva.
       En la portada, los controles de forma/marco de foto se
       ocultan (no aplican, la portada no lleva foto); los de
       alineación/negrita/cursiva quedan siempre disponibles.
       ===================================================== */

    function actualizarControlesEstilo() {

        const pagina =
            paginas[paginaActual];


        const esPortada =
            pagina.tipo === "portada";


        const tieneImagen =
            !esPortada &&
            Boolean(
                pagina.imagen
            );


        /* Grupos completos de "Forma de la foto" y "Marco": se
           ocultan del todo en la portada, porque ahí no aplican. */
        const grupoForma =
            document.getElementById(
                "grupo-forma-foto"
            )?.closest(".editor__estilo-grupo");


        const grupoMarco =
            document.getElementById(
                "grupo-marco-foto"
            )?.closest(".editor__estilo-grupo");


        if (grupoForma) {

            grupoForma.hidden =
                esPortada;

        }


        if (grupoMarco) {

            grupoMarco.hidden =
                esPortada;

        }


        if (avisoSinFoto) {

            avisoSinFoto.hidden =
                esPortada || tieneImagen;

        }


        /* "Forma de la foto" y "Marco" solo tienen sentido si la
           página ya tiene una foto cargada; se deshabilitan hasta
           entonces (o directamente en la portada), con un aviso
           explicando por qué. */
        [...botonesForma, ...botonesMarco].forEach(
            (boton) => {

                boton.disabled =
                    esPortada || !tieneImagen;


                if (esPortada || !tieneImagen) {

                    boton.dataset.tooltip =
                        "Agrega una foto primero";

                } else {

                    delete boton.dataset.tooltip;

                }

            }
        );


        botonesForma.forEach(
            (boton) => {

                boton.setAttribute(
                    "aria-pressed",
                    boton.dataset.forma ===
                        (pagina.marcoForma || "ovalado")
                        ? "true"
                        : "false"
                );

            }
        );


        botonesMarco.forEach(
            (boton) => {

                boton.setAttribute(
                    "aria-pressed",
                    boton.dataset.marco ===
                        (pagina.marcoTipo || "conmarco")
                        ? "true"
                        : "false"
                );

            }
        );


        botonesAlinear.forEach(
            (boton) => {

                boton.setAttribute(
                    "aria-pressed",
                    boton.dataset.alinear ===
                        (pagina.textoAlineacion || "centro")
                        ? "true"
                        : "false"
                );

            }
        );


        btnNegrita?.setAttribute(
            "aria-pressed",
            pagina.textoNegrita ? "true" : "false"
        );


        btnCursiva?.setAttribute(
            "aria-pressed",
            pagina.textoCursiva ? "true" : "false"
        );

    }


    botonesForma.forEach(
        (boton) => {

            boton.addEventListener(
                "click",
                () => {

                    paginas[paginaActual].marcoForma =
                        boton.dataset.forma;


                    renderPagina();

                }
            );

        }
    );


    botonesMarco.forEach(
        (boton) => {

            boton.addEventListener(
                "click",
                () => {

                    paginas[paginaActual].marcoTipo =
                        boton.dataset.marco;


                    renderPagina();

                }
            );

        }
    );


    botonesAlinear.forEach(
        (boton) => {

            boton.addEventListener(
                "click",
                () => {

                    paginas[paginaActual].textoAlineacion =
                        boton.dataset.alinear;


                    renderPagina();

                }
            );

        }
    );


    btnNegrita?.addEventListener(
        "click",
        () => {

            paginas[paginaActual].textoNegrita =
                !paginas[paginaActual].textoNegrita;


            renderPagina();

        }
    );


    btnCursiva?.addEventListener(
        "click",
        () => {

            paginas[paginaActual].textoCursiva =
                !paginas[paginaActual].textoCursiva;


            renderPagina();

        }
    );


    /* =====================================================
       PORTADA
       ===================================================== */

    function renderPortadaEditor() {

        configurarHoja(
            hoja
        );


        const pagina =
            paginas[0];


        const wrap =
            document.createElement(
                "div"
            );


        wrap.className =
            "sheet-cover";


        const titulo =
            document.createElement(
                "input"
            );


        titulo.className =
            "sheet-cover__titulo";


        titulo.placeholder =
            "Título de tu libro";


        titulo.value =
            pagina.titulo ||
            "";


        titulo.addEventListener(
            "input",
            () => {

                pagina.titulo =
                    titulo.value;

            }
        );


        const subtitulo =
            document.createElement(
                "input"
            );


        subtitulo.className =
            "sheet-cover__subtitulo";


        subtitulo.placeholder =
            "Para: alguien especial";


        subtitulo.value =
            pagina.subtitulo ||
            "";


        subtitulo.addEventListener(
            "input",
            () => {

                pagina.subtitulo =
                    subtitulo.value;

            }
        );


        /* Mismo estilo (alineación/negrita/cursiva) que se elige
           en el panel de estilo, aplicado al título y subtítulo
           editables de la portada. */
        aplicarEstiloTexto(
            titulo,
            pagina
        );


        aplicarEstiloTexto(
            subtitulo,
            pagina
        );


        wrap.append(
            titulo,
            subtitulo
        );


        hoja.appendChild(
            wrap
        );

    }


    /* =====================================================
       PÁGINA INTERIOR — EDITOR
       ===================================================== */

    function renderPaginaEditor() {

        configurarHoja(
            hoja
        );


        const pagina =
            paginas[paginaActual];


        const wrap =
            document.createElement(
                "div"
            );


        wrap.className =
            "sheet-page";


        /* IMAGEN */

        if (pagina.imagen) {

            wrap.appendChild(
                crearMarcoFoto(
                    pagina,
                    paginaActual,
                    { editable: true }
                )
            );

        }


        /* TEXTO */

        const textWrap =
            document.createElement(
                "div"
            );


        textWrap.className =
            "sheet-page__textwrap";


        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.className =
            "sheet-page__textarea";


        textarea.placeholder =
            "Escribe aquí…";


        textarea.maxLength =
            LIMITE_CARACTERES;


        textarea.rows = 1;


        textarea.value =
            pagina.texto ||
            "";


        aplicarEstiloTexto(
            textarea,
            pagina
        );


        const contador =
            document.createElement(
                "p"
            );


        contador.className =
            "sheet-page__counter";


        function actualizarContador() {

            const cantidad =
                textarea.value.length;


            contador.textContent =
                `${cantidad} / ${LIMITE_CARACTERES} caracteres`;


            contador.classList.toggle(
                "sheet-page__counter--limite",
                cantidad >=
                LIMITE_CARACTERES
            );

        }


        /* El textarea crece con el contenido (en vez de quedarse en
           una caja fija más chica) para que la posición y el tamaño
           del texto se parezcan a como se ve en la vista previa y
           en el PDF, donde el texto ocupa todo el espacio disponible
           y queda centrado dentro de él. */
        function ajustarAlturaTextarea() {

            textarea.style.height =
                "auto";


            const disponible =
                textWrap.clientHeight;


            const necesaria =
                textarea.scrollHeight;


            const alto =
                disponible
                    ? Math.min(
                        necesaria,
                        disponible
                    )
                    : necesaria;


            textarea.style.height =
                `${alto}px`;

        }


        textarea.addEventListener(
            "input",
            () => {

                pagina.texto =
                    textarea.value;


                actualizarContador();


                ajustarAlturaTextarea();

            }
        );


        actualizarContador();


        textWrap.append(
            textarea,
            contador
        );


        wrap.appendChild(
            textWrap
        );


        /* PIE DE PÁGINA */

        const footer =
            document.createElement(
                "p"
            );


        footer.className =
            "sheet-page__footer";


        footer.textContent =
            `— página ${paginaActual + 1} —`;


        wrap.appendChild(
            footer
        );


        hoja.appendChild(
            wrap
        );


        /* Recién ahora el textarea está dentro del DOM visible,
           así que las medidas (clientHeight/scrollHeight) son
           reales y el primer ajuste de altura sale correcto. */
        ajustarAlturaTextarea();

    }


    /* =====================================================
       AGREGAR / ELIMINAR PÁGINAS
       ===================================================== */

    btnAgregarPagina.addEventListener(
        "click",
        () => {

            paginas.push({

                tipo: "cuerpo",

                texto: "",

                imagen: null,

                marcoForma: "ovalado",

                marcoTipo: "conmarco",

                imagenPosicion: { x: 50, y: 50 },

                textoAlineacion: "centro",

                textoNegrita: false,

                textoCursiva: false

            });


            paginaActual =
                paginas.length - 1;


            renderPagina();

        }
    );


    btnEliminarPagina.addEventListener(
        "click",
        async () => {

            if (
                paginas[paginaActual].tipo ===
                "portada"
            ) {

                mostrarToast(
                    "No puedes eliminar la portada"
                );

                return;

            }


            const confirmar =
                await pedirConfirmacion({

                    titulo: "¿Desea eliminar esta página?",

                    mensaje:
                        "El texto y la foto de esta página se perderán para siempre.",

                    textoConfirmar: "Sí, eliminar página",

                    textoCancelar: "Cancelar",

                    peligro: true

                });


            if (!confirmar) return;


            paginas.splice(
                paginaActual,
                1
            );


            paginaActual =
                Math.max(
                    0,
                    Math.min(
                        paginaActual,
                        paginas.length - 1
                    )
                );


            renderPagina();

        }
    );


    /* =====================================================
       AGREGAR / QUITAR IMAGEN DE LA PÁGINA ACTUAL
       ===================================================== */

    btnAgregarImagen.addEventListener(
        "click",
        () => {

            if (
                paginas[paginaActual].tipo ===
                "portada"
            ) return;


            inputImagenPagina.click();

        }
    );


    inputImagenPagina.addEventListener(
        "change",
        async () => {

            const archivo =
                inputImagenPagina.files?.[0];


            inputImagenPagina.value = "";


            if (!archivo) return;


            if (
                !archivo.type.startsWith(
                    "image/"
                )
            ) {

                mostrarToast(
                    "Ese archivo no es una imagen válida."
                );


                return;

            }


            try {

                const dataUrl =
                    await leerComoDataURL(
                        archivo
                    );


                paginas[
                    paginaActual
                ].imagen =
                    dataUrl;


                renderPagina();


                mostrarToast(
                    "Foto agregada"
                );


            } catch (error) {

                console.error(
                    error
                );


                mostrarToast(
                    "No pudimos cargar esa foto."
                );

            }

        }
    );


    btnQuitarImagen.addEventListener(
        "click",
        () => {

            paginas[
                paginaActual
            ].imagen =
                null;


            renderPagina();

        }
    );


    /* =====================================================
       CREAR PÁGINA PARA VISTA PREVIA / PDF
       ===================================================== */

    function crearPaginaPreview(
        indice
    ) {

        const pagina =
            paginas[indice];


        const sheet =
            document.createElement(
                "article"
            );


        sheet.className =
            "preview-sheet";


        configurarHoja(
            sheet
        );


        if (
            pagina.tipo === "portada"
        ) {

            const cover =
                document.createElement(
                    "div"
                );


            cover.className =
                "sheet-cover preview-cover";


            const titulo =
                document.createElement(
                    "h1"
                );


            titulo.className =
                "preview-cover__titulo";


            titulo.textContent =
                pagina.titulo ||
                "Mi pequeño libro";


            const subtitulo =
                document.createElement(
                    "p"
                );


            subtitulo.className =
                "preview-cover__subtitulo";


            subtitulo.textContent =
                pagina.subtitulo ||
                "";


            /* Mismo estilo (alineación/negrita/cursiva) que se ve
               en el editor, para que la vista previa y el PDF
               coincidan con lo que la persona configuró. */
            aplicarEstiloTexto(
                titulo,
                pagina
            );


            aplicarEstiloTexto(
                subtitulo,
                pagina
            );


            cover.append(
                titulo,
                subtitulo
            );


            sheet.appendChild(
                cover
            );


            return sheet;

        }


        const wrap =
            document.createElement(
                "div"
            );


        wrap.className =
            "sheet-page preview-page";


        if (pagina.imagen) {

            wrap.appendChild(
                crearMarcoFoto(
                    pagina,
                    indice,
                    { editable: false }
                )
            );

        }


        const text =
            document.createElement(
                "p"
            );


        text.className =
            "preview-page__text";


        text.textContent =
            pagina.texto ||
            "";


        aplicarEstiloTexto(
            text,
            pagina
        );


        wrap.appendChild(
            text
        );


        const footer =
            document.createElement(
                "p"
            );


        footer.className =
            "sheet-page__footer";


        footer.textContent =
            `— página ${indice + 1} —`;


        wrap.appendChild(
            footer
        );


        sheet.appendChild(
            wrap
        );


        return sheet;

    }


    /* =====================================================
       VISTA PREVIA — VISOR TIPO LIBRO CON ANIMACIÓN
       ===================================================== */

    let previewIndice = 0;


    /* Ancho (en px) al que se dibuja cada hoja de la vista previa
       antes de encogerla con transform: scale(). Tiene que ser el
       MISMO ancho que se usa al generar el PDF (ver descargarPDF,
       donde hojaPreview.style.width = "816px"), así el navegador
       calcula el tamaño del texto (unidades cqw) de forma
       idéntica en ambos casos. Sin esto, la vista previa calculaba
       el texto sobre el ancho angosto de la pantalla del celular
       y el PDF sobre 816px, dando tamaños de letra muy distintos
       aunque el CSS fuera "el mismo". */
    const REFERENCIA_ANCHO_PREVIEW = 816;


    /* Mide el ancho real disponible del visor (previewStage) y
       fija --preview-scale para encoger la hoja de 816px a ese
       tamaño, sin afectar cómo se calculó el texto por dentro. */
    function actualizarEscalaPreview() {

        if (!previewStage) return;


        const ancho =
            previewStage.clientWidth;


        if (!ancho) return;


        const escala =
            ancho /
            REFERENCIA_ANCHO_PREVIEW;


        previewStage.style.setProperty(
            "--preview-scale",
            escala
        );

    }


    window.addEventListener(
        "resize",
        actualizarEscalaPreview
    );


    window.addEventListener(
        "orientationchange",
        actualizarEscalaPreview
    );


    function mostrarPaginaPreview(
        nuevoIndice,
        direccion
    ) {

        previewIndice =
            Math.max(
                0,
                Math.min(
                    nuevoIndice,
                    paginas.length - 1
                )
            );


        const anterior =
            previewStage.querySelector(
                ".preview-sheet"
            );


        const nuevaHoja =
            crearPaginaPreview(
                previewIndice
            );


        nuevaHoja.classList.add(
            "book-page-anim"
        );


        if (anterior && direccion) {

            anterior.classList.add(
                direccion === "next"
                    ? "turning-out-next"
                    : "turning-out-prev"
            );


            nuevaHoja.classList.add(
                direccion === "next"
                    ? "turning-in-from-right"
                    : "turning-in-from-left"
            );


            previewStage.appendChild(
                nuevaHoja
            );


            requestAnimationFrame(() => {

                requestAnimationFrame(() => {

                    nuevaHoja.classList.remove(
                        "turning-in-from-right",
                        "turning-in-from-left"
                    );

                });

            });


            setTimeout(() => {

                anterior.remove();

            }, 400);

        } else {

            previewStage.innerHTML = "";

            previewStage.appendChild(
                nuevaHoja
            );

        }


        previewPagenum.textContent =
            `Vista previa — página ${previewIndice + 1} / ${paginas.length}`;


        previewPrev.disabled =
            previewIndice === 0;


        previewNext.disabled =
            previewIndice ===
            paginas.length - 1;

    }


    previewPrev?.addEventListener(
        "click",
        () => {

            if (previewIndice > 0) {

                mostrarPaginaPreview(
                    previewIndice - 1,
                    "prev"
                );

            }

        }
    );


    previewNext?.addEventListener(
        "click",
        () => {

            if (
                previewIndice <
                paginas.length - 1
            ) {

                mostrarPaginaPreview(
                    previewIndice + 1,
                    "next"
                );

            }

        }
    );


    /* Deslizar con el dedo en la vista previa: izquierda = siguiente,
       derecha = anterior (como pasar la hoja de un libro). */
    agregarSwipe(
        previewStage,
        () => {

            if (previewIndice < paginas.length - 1) {

                mostrarPaginaPreview(
                    previewIndice + 1,
                    "next"
                );

            }

        },
        () => {

            if (previewIndice > 0) {

                mostrarPaginaPreview(
                    previewIndice - 1,
                    "prev"
                );

            }

        }
    );


    /* =====================================================
       ABRIR / CERRAR VISTA PREVIA
       ===================================================== */

    async function abrirVistaPrevia() {

        previewIndice =
            paginaActual;


        /* Ya se precargó una vez al abrir el libro, pero lo
           confirmamos de nuevo acá: en una conexión lenta de
           celular, o si el navegador liberó la imagen de la
           memoria, no queremos que la vista previa se pinte antes
           de que la imagen de fondo esté realmente lista. */
        if (config.fondoTipo === "imagen") {

            await precargarImagen(
                fondoUrl()
            );

        }


        mostrarPaginaPreview(
            previewIndice,
            null
        );


        bloqueEditor.hidden = true;


        previewScreen.hidden = false;


        /* Recién ahora previewStage ya está visible en el DOM
           (dejó de tener "hidden"), así que su clientWidth es
           medible de verdad. El doble requestAnimationFrame
           asegura que el navegador ya terminó de aplicar el
           layout antes de medir, igual que se hace con la
           animación de pasar página. */
        requestAnimationFrame(() => {

            requestAnimationFrame(
                actualizarEscalaPreview
            );

        });


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }


    function cerrarVistaPrevia() {

        previewScreen.hidden = true;


        bloqueEditor.hidden = false;


        paginaActual =
            previewIndice;


        renderPagina();


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }


    btnPreview?.addEventListener(
        "click",
        abrirVistaPrevia
    );


    btnSeguirEditando?.addEventListener(
        "click",
        cerrarVistaPrevia
    );


    /* =====================================================
       NAVEGACIÓN DEL EDITOR — ANTERIOR / SIGUIENTE
       ===================================================== */

    function irPaginaAnterior() {

        if (paginaActual > 0) {

            paginaActual--;

            renderPagina();

        }

    }


    function irPaginaSiguiente() {

        if (paginaActual < paginas.length - 1) {

            paginaActual++;

            renderPagina();

        }

    }


    btnAnterior.addEventListener(
        "click",
        irPaginaAnterior
    );


    btnSiguiente.addEventListener(
        "click",
        irPaginaSiguiente
    );


    /* Deslizar con el dedo directamente sobre la hoja del editor
       también cambia de página (izquierda = siguiente, derecha =
       anterior). Los botones "anterior"/"siguiente" se conservan
       funcionando igual que antes. */
    agregarSwipe(
        hoja,
        irPaginaSiguiente,
        irPaginaAnterior
    );


    /* =====================================================
       VENTANA EMERGENTE: cambiar configuración
       ===================================================== */

    function abrirModalConfig() {

        if (!modalConfig) return;


        modalConfig.hidden = false;

    }


    function cerrarModalConfig() {

        if (!modalConfig) return;


        modalConfig.hidden = true;

    }


    btnCambiarConfig?.addEventListener(
        "click",
        abrirModalConfig
    );


    btnModalCerrar?.addEventListener(
        "click",
        cerrarModalConfig
    );


    /* Cerrar tocando el fondo oscuro, fuera de la tarjeta */
    modalConfig?.addEventListener(
        "click",
        (evento) => {

            if (evento.target === modalConfig) {

                cerrarModalConfig();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key === "Escape" &&
                modalConfig &&
                !modalConfig.hidden
            ) {

                cerrarModalConfig();

            }

        }
    );


    /* Opción 1: cambiar solo el formato — guardamos el texto y las
       fotos actuales para que index.html las devuelva junto con la
       nueva configuración. */
    btnModalCambiarFormato?.addEventListener(
        "click",
        () => {

            try {

                sessionStorage.setItem(
                    CLAVE_PAGINAS,
                    JSON.stringify({

                        paginas,

                        paginaActual

                    })
                );

            } catch (error) {

                console.error(
                    error
                );

            }


            window.location.href =
                "index.html";

        }
    );


    /* Opción 2: empezar un libro nuevo — nos aseguramos de que no
       quede ninguna copia de páginas guardada de antes. */
    btnModalNuevoLibro?.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                CLAVE_PAGINAS
            );


            window.location.href =
                "index.html";

        }
    );


    /* =====================================================
       DESCARGAR PDF
       ===================================================== */

    /* Quita caracteres no válidos para un nombre de archivo */
    function limpiarNombreArchivo(texto) {

        return texto
            .replace(/[\\/:*?"<>|]+/g, "")
            .trim();

    }


    /* Se asegura de que la tipografía elegida ya esté cargada por
       el navegador antes de "fotografiar" cada hoja con html2canvas.
       Sin esto, en algunos celulares la primera descarga puede usar
       una fuente de repuesto y verse distinta a lo que se ve en
       pantalla. */
    async function esperarFuentesListas() {

        if (
            !document.fonts ||
            !document.fonts.ready
        ) return;


        try {

            await document.fonts.load(
                `700 32px "${config.tipografia}"`
            );


            await document.fonts.load(
                `400 20px "${config.tipografia}"`
            );

        } catch (error) {

            /* Si no se puede precargar puntualmente, igual
               seguimos con document.fonts.ready más abajo. */

        }


        try {

            await document.fonts.ready;

        } catch (error) {

            /* Ignorar: no todos los navegadores exponen esto igual. */

        }

    }


    async function descargarPDF() {

        const nombreSugerido =
            "mi-libro";


        const respuesta =
            await pedirNombreArchivo(
                nombreSugerido
            );


        /* El usuario canceló el cuadro: no se descarga nada */
        if (respuesta === null) return;


        let nombreArchivo =
            limpiarNombreArchivo(
                respuesta
            ) ||
            nombreSugerido;


        if (
            !nombreArchivo.toLowerCase().endsWith(".pdf")
        ) {

            nombreArchivo += ".pdf";

        }


        if (
            typeof html2canvas === "undefined" ||
            typeof window.jspdf === "undefined"
        ) {

            mostrarToast(
                "No pudimos cargar el generador de PDF. Revisa tu conexión."
            );

            return;

        }


        const botones =
            [btnDescargarPDF, btnDescargarPDF2].filter(
                Boolean
            );


        botones.forEach((b) => {

            b.disabled = true;

            b.dataset.textoOriginal =
                b.dataset.textoOriginal ||
                b.textContent;


            b.textContent =
                "Generando PDF…";

        });


        const contenedor =
            document.createElement(
                "div"
            );


        contenedor.style.position =
            "fixed";


        contenedor.style.left =
            "-9999px";


        contenedor.style.top =
            "0";


        document.body.appendChild(
            contenedor
        );


        try {

            await esperarFuentesListas();


            const { jsPDF } =
                window.jspdf;


            const pdf =
                new jsPDF({

                    unit: "mm",

                    format: [216, 279],

                    orientation: "portrait"

                });


            for (
                let i = 0;
                i < paginas.length;
                i++
            ) {

                const hojaPreview =
                    crearPaginaPreview(i);


                hojaPreview.style.width =
                    "816px";


                hojaPreview.style.height =
                    "1054px";


                hojaPreview.style.margin =
                    "0";


                contenedor.innerHTML = "";

                contenedor.appendChild(
                    hojaPreview
                );


                const imagenes =
                    Array.from(
                        hojaPreview.querySelectorAll(
                            "img"
                        )
                    );


                await Promise.all(
                    imagenes.map(
                        (img) =>
                            img.complete
                                ? Promise.resolve()
                                : new Promise((res) => {

                                    img.onload = res;

                                    img.onerror = res;

                                })
                    )
                );


                /* html2canvas necesita saber qué color de fondo usar
                   para el lienzo. "null" (transparente) está bien
                   para un fondo de foto, pero para un color sólido
                   personalizado, "null" tapaba justo ese color —
                   solo sobrevivían las líneas (que son una imagen
                   aparte). Por eso se lo pasamos explícito acá. */
                const colorDeFondoParaCanvas =
                    config.fondoTipo === "color" &&
                        config.fondoColor
                        ? config.fondoColor
                        : null;


                const canvas =
                    await html2canvas(
                        hojaPreview,
                        {

                            scale: 2,

                            useCORS: true,

                            backgroundColor:
                                colorDeFondoParaCanvas

                        }
                    );


                const imgData =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.92
                    );


                if (i > 0) {

                    pdf.addPage(
                        [216, 279],
                        "portrait"
                    );

                }


                pdf.addImage(
                    imgData,
                    "JPEG",
                    0,
                    0,
                    216,
                    279
                );

            }


            pdf.save(
                nombreArchivo
            );


            mostrarToast(
                "Tu PDF se descargó con éxito"
            );


        } catch (error) {

            console.error(
                error
            );


            mostrarToast(
                "No pudimos generar el PDF. Intenta de nuevo."
            );


        } finally {

            document.body.removeChild(
                contenedor
            );


            botones.forEach((b) => {

                b.disabled = false;


                b.textContent =
                    b.dataset.textoOriginal ||
                    "⬇ Descargar PDF";

            });

        }

    }


    btnDescargarPDF?.addEventListener(
        "click",
        descargarPDF
    );


    btnDescargarPDF2?.addEventListener(
        "click",
        descargarPDF
    );


    /* =====================================================
       INICIAR LIBRO
       ===================================================== */

    (async function iniciarLibro() {

        if (config.fondoTipo === "imagen") {

            await precargarImagen(
                fondoUrl()
            );

        }


        renderPagina();

    })();

})();