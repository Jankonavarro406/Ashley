
const canvas = document.getElementById("universo");
const ctx = canvas.getContext("2d", { alpha: false });

let W, H, cx, cy;
let ANGULO = -25 * Math.PI / 180;
let inclinacion = 0.28;
let zoom = 1;
let dispersion = 0;

let ultimoTiempo = 0;
let factorTiempo = 1;

let cosAngulo = Math.cos(ANGULO);
let sinAngulo = Math.sin(ANGULO);

// ==========================================
// CONFIGURACIÓN DE RENDIMIENTO
// ==========================================

// Menos partículas, pero conservando la distribución visual.
const CANTIDAD_NARANJAS = 13000;
const CANTIDAD_AZULES = 3500;

// Resolución máxima para evitar sobrecargar la GPU.
const MAX_DPR = 1.5;

function ajustar() {
    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        MAX_DPR
    );

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = W / 2;
    cy = H / 2;
}

window.addEventListener("resize", ajustar);
ajustar();

// ==========================================
// ROTACIÓN
// ==========================================

function actualizarRotacion() {
    cosAngulo = Math.cos(ANGULO);
    sinAngulo = Math.sin(ANGULO);
}

function rotar(x, y) {
    return {
        x: x * cosAngulo - y * sinAngulo,
        y: x * sinAngulo + y * cosAngulo
    };
}

// ==========================================
// DISPERSIÓN
// ==========================================

function actualizarDispersion() {
    const objetivo = Math.max(
        0,
        Math.min(1, (zoom - 1) / 1.8)
    );

    dispersion +=
        (objetivo - dispersion) *
        Math.min(1, 0.045 * factorTiempo);
}

// ==========================================
// PARTÍCULAS
// ==========================================

const particulas = [];
const azules = [];

for (let i = 0; i < CANTIDAD_NARANJAS; i++) {
    const distancia =
        115 + Math.pow(Math.random(), 0.65) * 540;

    particulas.push({
        angulo: Math.random() * Math.PI * 2,
        distancia,
        tamaño: Math.random() * 1.9 + 0.25,
        velocidad:
            (0.0006 + Math.random() * 0.0012) *
            (620 / distancia),
        brillo: Math.random(),
        dispersionFactor: 0.55 + Math.random() * 1.1,
        profundidad: 0.20 + Math.random() * 0.18,
        px: 0,
        py: 0,
        pr: 0
    });
}

for (let i = 0; i < CANTIDAD_AZULES; i++) {
    const distancia =
        180 + Math.pow(Math.random(), 0.7) * 560;

    azules.push({
        angulo: Math.random() * Math.PI * 2,
        distancia,
        tamaño: Math.random() * 1.3 + 0.1,
        velocidad: 0.00015 + Math.random() * 0.00055,
        brillo: Math.random(),
        dispersionFactor: 0.55 + Math.random() * 1.1,
        profundidad: 0.25 + Math.random() * 0.15,
        px: 0,
        py: 0,
        pr: 0
    });
}

// ==========================================
// CÁLCULO DE POSICIONES
// ==========================================

function calcularPosicion(p) {
    const a = p.angulo;
    const d = p.distancia;
    const factor = p.dispersionFactor;

    const separacion =
        dispersion * (12 + p.brillo * 42) * factor;

    const distanciaActual = d + separacion;

    let x = Math.cos(a) * distanciaActual;

    let y =
        Math.sin(a) *
        distanciaActual *
        p.profundidad *
        inclinacion;

    const limite = p.profundidad < 0.23 ? 220 : 285;
    const gravedad = Math.max(0, limite - d);

    x += Math.cos(a) * gravedad *
        (p.profundidad < 0.23 ? 1 : 1.15);

    y += Math.sin(a) * gravedad * 0.35;

    const desviacion =
        dispersion *
        Math.sin(a * 3 + d * 0.025) *
        18 * factor;

    x += Math.cos(a + Math.PI / 2) * desviacion;
    y += Math.sin(a + Math.PI / 2) * desviacion * 0.55;

    const rx = x * cosAngulo - y * sinAngulo;
    const ry = x * sinAngulo + y * cosAngulo;

    const desviacionVertical =
        dispersion *
        Math.sin(a * 5 + d * 0.035 + p.brillo * 4) *
        (35 + p.brillo * 75) * factor;

    const variacionVertical =
        dispersion *
        Math.cos(a * 2.3 + d * 0.018) *
        24 * factor;

    p.px = cx + rx * zoom;

    p.py = cy + (
        ry + desviacionVertical + variacionVertical
    ) * zoom;

    p.pr = Math.max(0.25, p.tamaño * zoom);
}

// ==========================================
// ACTUALIZAR PARTÍCULAS
// ==========================================

function actualizarParticulas() {
    for (const p of particulas) {
        p.angulo += p.velocidad * factorTiempo;
        calcularPosicion(p);
    }

    for (const p of azules) {
        p.angulo += p.velocidad * factorTiempo;
        calcularPosicion(p);
    }
}

// ==========================================
// DIBUJAR PARTÍCULAS POR GRUPOS
// ==========================================

// Agrupar partículas reduce las llamadas de dibujo.
const coloresNaranjas = [
    "rgb(255,250,225)",
    "rgb(255,190,95)",
    "rgb(255,105,25)",
    "rgb(180,50,14)",
    "rgb(80,25,10)"
];

const gruposNaranjas = [];
const gruposAzules = [];

for (let i = 0; i < 5 * 9; i++) {
    gruposNaranjas.push([]);
}

for (let i = 0; i < 2 * 6; i++) {
    gruposAzules.push([]);
}

function limpiarGrupos(grupos) {
    for (const grupo of grupos) {
        grupo.length = 0;
    }
}

function obtenerColor(d) {
    if (d < 145) return 0;
    if (d < 210) return 1;
    if (d < 350) return 2;
    if (d < 480) return 3;
    return 4;
}

function prepararGrupos(delante, tipo) {
    const esNaranja = tipo === "naranja";

    const lista = esNaranja ? particulas : azules;
    const grupos = esNaranja ? gruposNaranjas : gruposAzules;

    limpiarGrupos(grupos);

    for (const p of lista) {
        const estaDelante = Math.sin(p.angulo) > 0;

        if (estaDelante !== delante) continue;

        let intensidad;
        let color;
        let alpha;

        if (esNaranja) {
            intensidad = Math.max(
                0,
                1 - Math.abs(p.distancia - 190) / 390
            );

            intensidad *= 0.45 + p.brillo * 0.8;

            if (Math.cos(p.angulo) > 0) {
                intensidad *= 1.6;
            }

            alpha = Math.min(0.9, intensidad * 0.42);

            const colorIndex = obtenerColor(p.distancia);
            const alphaIndex = Math.min(
                8,
                Math.floor(alpha * 9)
            );

            color = colorIndex * 9 + alphaIndex;

            p.pr = Math.max(
                0.25,
                p.tamaño * (1 + intensidad) * zoom
            );
        } else {
            intensidad = 0.05 + p.brillo * 0.16;

            if (p.distancia < 280) intensidad *= 1.5;

            alpha = intensidad;

            const colorIndex = p.brillo > 0.65 ? 0 : 1;
            const alphaIndex = Math.min(
                5,
                Math.floor(alpha * 25)
            );

            color = colorIndex * 6 + alphaIndex;

            p.pr = Math.max(0.25, p.tamaño * zoom);
        }

        grupos[color].push(p.px, p.py, p.pr);
    }
}

function dibujarGruposNaranjas() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < gruposNaranjas.length; i++) {
        const grupo = gruposNaranjas[i];

        if (grupo.length === 0) continue;

        const colorIndex = Math.floor(i / 9);
        const alphaIndex = i % 9;

        ctx.fillStyle = coloresNaranjas[colorIndex];
        ctx.globalAlpha = alphaIndex / 9;

        ctx.beginPath();

        for (let j = 0; j < grupo.length; j += 3) {
            ctx.moveTo(grupo[j] + grupo[j + 2], grupo[j + 1]);
            ctx.arc(
                grupo[j],
                grupo[j + 1],
                grupo[j + 2],
                0,
                Math.PI * 2
            );
        }

        ctx.fill();
    }

    ctx.restore();
}

function dibujarGruposAzules() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < gruposAzules.length; i++) {
        const grupo = gruposAzules[i];

        if (grupo.length === 0) continue;

        const colorIndex = Math.floor(i / 6);
        const alphaIndex = i % 6;

        ctx.fillStyle =
            colorIndex === 0 ? "#62b7ff" : "#174d85";

        ctx.globalAlpha = alphaIndex / 25;

        ctx.beginPath();

        for (let j = 0; j < grupo.length; j += 3) {
            ctx.moveTo(grupo[j] + grupo[j + 2], grupo[j + 1]);
            ctx.arc(
                grupo[j],
                grupo[j + 1],
                grupo[j + 2],
                0,
                Math.PI * 2
            );
        }

        ctx.fill();
    }

    ctx.restore();
}

// ==========================================
// FONDO
// ==========================================

function dibujarFondo() {
    const gradiente = ctx.createRadialGradient(
        cx, cy, 20,
        cx, cy, Math.max(W, H)
    );

    gradiente.addColorStop(0, "#090b10");
    gradiente.addColorStop(0.35, "#030507");
    gradiente.addColorStop(0.75, "#010102");
    gradiente.addColorStop(1, "#000000");

    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, W, H);
}

// ==========================================
// FOTOGRAFÍAS ORBITANDO
// ==========================================

const rutasFotos = [
    "fotos/foto1.jpg",
    "fotos/foto2.jpg",
    "fotos/foto3.jpg",
    "fotos/foto4.jpg",
    "fotos/foto5.jpg",
    "fotos/foto6.jpg",
    "fotos/foto7.jpg",
    "fotos/foto8.jpg",
    "fotos/foto9.jpg",
    "fotos/foto10.jpg",
    "fotos/foto11.jpg",
    "fotos/foto12.jpg",
    "fotos/foto13.jpg",
    "fotos/foto14.jpg",
    "fotos/foto15.jpg",
    "fotos/foto16.jpg",
    "fotos/foto17.jpg",
    "fotos/foto18.jpg",
    "fotos/foto19.jpg",
    "fotos/foto20.jpg",
    "fotos/foto21.jpg",
    "fotos/foto22.jpg",
    "fotos/foto23.jpg"
];

const aleatorio = (min, max) =>
    min + Math.random() * (max - min);

const fotosOrbitando = rutasFotos.map(ruta => {
    const imagen = new Image();
    imagen.src = ruta;

    return {
        imagen,
        angulo: Math.random() * Math.PI * 2,
        distancia: aleatorio(220, 440),
        velocidad: aleatorio(0.00035, 0.0011),
        desplazamientoVertical: aleatorio(-150, 150),
        amplitudVertical: aleatorio(20, 100),
        velocidadVertical: aleatorio(0.008, 0.025),
        faseVertical: Math.random() * Math.PI * 2,
        amplitudRadial: aleatorio(10, 45),
        faseRadial: Math.random() * Math.PI * 2,
        velocidadRadial: aleatorio(0.006, 0.018),
        profundidad: aleatorio(0.65, 1.25),
        ancho: aleatorio(48, 76),
        alto: aleatorio(65, 100),
        giro: aleatorio(-0.18, 0.18),
        velocidadGiro: aleatorio(-0.0008, 0.0008)
    };
});

function actualizarFotosOrbitando() {
    for (const foto of fotosOrbitando) {
        foto.angulo += foto.velocidad * factorTiempo;
        foto.faseVertical += foto.velocidadVertical * factorTiempo;
        foto.faseRadial += foto.velocidadRadial * factorTiempo;
        foto.giro += foto.velocidadGiro * factorTiempo;
    }
}

function dibujarFotosOrbitando(delante = false) {
    for (const foto of fotosOrbitando) {
        const estaDelante = Math.sin(foto.angulo) > 0;

        if (estaDelante !== delante) continue;

        if (!foto.imagen.complete ||
            foto.imagen.naturalWidth === 0) continue;

        const variacionRadio =
            Math.sin(foto.faseRadial) * foto.amplitudRadial;

        const distanciaActual = foto.distancia + variacionRadio;

        const x = Math.cos(foto.angulo) * distanciaActual;

        const yOrbital =
            Math.sin(foto.angulo) *
            distanciaActual *
            inclinacion *
            foto.profundidad;

        const movimientoVertical =
            foto.desplazamientoVertical +
            Math.sin(foto.faseVertical) *
            foto.amplitudVertical;

        const puntoX = x * cosAngulo - yOrbital * sinAngulo;
        const puntoY = x * sinAngulo + yOrbital * cosAngulo;

        const pantallaX = cx + puntoX * zoom;
        const pantallaY =
            cy + (puntoY + movimientoVertical) * zoom;

        const escala = estaDelante ? 1 : 0.78;

        const ancho = foto.ancho * zoom * escala;
        const alto = foto.alto * zoom * escala;
        const radio = Math.max(2, 5 * zoom);

        ctx.save();

        ctx.globalAlpha = estaDelante ? 0.96 : 0.58;

        ctx.translate(pantallaX, pantallaY);
        ctx.rotate(foto.giro + ANGULO * 0.08);

        // Se elimina la sombra costosa y se conserva el marco.
        ctx.beginPath();

        ctx.roundRect(
            -ancho / 8,
            -alto / 8,
            ancho,
            alto,
            radio
        );

        ctx.clip();

        ctx.drawImage(
            foto.imagen,
            -ancho / 8,
            -alto / 8,
            ancho,
            alto
        );

        ctx.lineWidth = Math.max(0.7, 1.1 * zoom);
        ctx.strokeStyle = "rgba(255, 190, 125, 0.65)";
        ctx.stroke();

        ctx.restore();
    }
}

// ==========================================
// ANILLOS
// ==========================================

function dibujarAnillos(parte) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const inicio = parte === "atras" ? Math.PI : 0;
    const fin = parte === "atras" ? Math.PI * 2 : Math.PI;

    for (let i = 0; i < 25; i++) {
        const progreso = i / 24;
        const desaparicion = Math.pow(1 - progreso, 2.2);

        const radioX = (170 + i * 13) * zoom;
        const radioY = (52 + i * 3.5) * inclinacion * zoom;

        const alpha = 0.008 + desaparicion * 0.075;
        const verde = Math.round(120 + desaparicion * 90);
        const azul = Math.round(30 + desaparicion * 80);

        ctx.strokeStyle =
            `rgba(255, ${verde}, ${azul}, ${alpha})`;

        ctx.lineWidth = (1.2 + desaparicion * 2.2) * zoom;

        ctx.beginPath();
        ctx.ellipse(
            cx, cy,
            radioX, radioY,
            ANGULO,
            inicio, fin
        );
        ctx.stroke();
    }

    for (let i = 0; i < 22; i++) {
        const progreso = i / 21;
        const desaparicion = Math.pow(1 - progreso, 2.5);

        const radioX = (430 + i * 15) * zoom;
        const radioY = (120 + i * 4.5) * inclinacion * zoom;

        const alpha = 0.002 + desaparicion * 0.020;

        ctx.strokeStyle = `rgba(35, 100, 180, ${alpha})`;
        ctx.lineWidth = (1.2 + desaparicion) * zoom;

        ctx.beginPath();
        ctx.ellipse(
            cx, cy,
            radioX, radioY,
            ANGULO,
            inicio, fin
        );
        ctx.stroke();
    }

    ctx.restore();
}

// ==========================================
// HALO
// ==========================================

function dibujarHalo() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const gradiente = ctx.createRadialGradient(
        cx, cy, 45 * zoom,
        cx, cy, 430 * zoom
    );

    gradiente.addColorStop(0, "rgba(255,230,170,0.20)");
    gradiente.addColorStop(0.18, "rgba(255,150,60,0.11)");
    gradiente.addColorStop(0.45, "rgba(255,70,15,0.04)");
    gradiente.addColorStop(0.70, "rgba(30,90,160,0.025)");
    gradiente.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradiente;
    ctx.beginPath();
    ctx.arc(cx, cy, 430 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ==========================================
// AGUJERO NEGRO
// ==========================================

function dibujarAgujeroNegro() {
    ctx.save();

    const sombra = ctx.createRadialGradient(
        cx, cy, 20 * zoom,
        cx, cy, 125 * zoom
    );

    sombra.addColorStop(0, "#000000");
    sombra.addColorStop(0.70, "#000000");
    sombra.addColorStop(0.90, "rgba(0,0,0,0.9)");
    sombra.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = sombra;
    ctx.beginPath();
    ctx.arc(cx, cy, 125 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 55 * zoom, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.strokeStyle = "rgba(255,190,100,0.14)";
    ctx.lineWidth = 2 * zoom;
    ctx.stroke();

    ctx.restore();
}

// ==========================================
// NIEBLA
// ==========================================

function dibujarNiebla() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const niebla = ctx.createRadialGradient(
        cx, cy, 300 * zoom,
        cx, cy, 900 * zoom
    );

    niebla.addColorStop(0, "rgba(20,40,70,0.025)");
    niebla.addColorStop(0.45, "rgba(10,20,35,0.012)");
    niebla.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = niebla;
    ctx.beginPath();
    ctx.arc(cx, cy, 900 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ==========================================
// ANIMACIÓN PRINCIPAL
// ==========================================

function animar(tiempo) {
    if (!ultimoTiempo) ultimoTiempo = tiempo;

    const delta = Math.min(tiempo - ultimoTiempo, 40);

    ultimoTiempo = tiempo;
    factorTiempo = delta / 16.667;

    actualizarRotacion();
    actualizarDispersion();
    actualizarParticulas();
    actualizarFotosOrbitando();

    dibujarFondo();

    prepararGrupos(false, "azul");
    dibujarGruposAzules();

    dibujarHalo();

    prepararGrupos(false, "naranja");
    dibujarGruposNaranjas();

    dibujarFotosOrbitando(false);

    dibujarAnillos("atras");

    dibujarAgujeroNegro();

    prepararGrupos(true, "azul");
    dibujarGruposAzules();

    prepararGrupos(true, "naranja");
    dibujarGruposNaranjas();

    dibujarFotosOrbitando(true);

    dibujarAnillos("adelante");

    dibujarNiebla();

    requestAnimationFrame(animar);
}

// ==========================================
// MOVIMIENTO CON MOUSE O TÁCTIL
// ==========================================

let arrastrando = false;
let ultimoX = 0;
let ultimoY = 0;

canvas.addEventListener("pointerdown", function(e) {
    arrastrando = true;

    ultimoX = e.clientX;
    ultimoY = e.clientY;

    if (canvas.setPointerCapture) {
        canvas.setPointerCapture(e.pointerId);
    }
});

canvas.addEventListener("pointermove", function(e) {
    if (!arrastrando) return;

    const dx = e.clientX - ultimoX;
    const dy = e.clientY - ultimoY;

    ANGULO += dx * 0.008;

    inclinacion = Math.max(
        0.08,
        Math.min(0.85, inclinacion + dy * 0.003)
    );

    ultimoX = e.clientX;
    ultimoY = e.clientY;
});

function detenerMovimiento() {
    arrastrando = false;
}

canvas.addEventListener("pointerup", detenerMovimiento);
canvas.addEventListener("pointercancel", detenerMovimiento);
canvas.addEventListener("lostpointercapture", detenerMovimiento);

// ==========================================
// ZOOM
// ==========================================

canvas.addEventListener("wheel", function(e) {
    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;

    zoom = Math.max(
        0.35,
        Math.min(5, zoom * factor)
    );
}, { passive: false });

// ==========================================
// BOTÓN PARA ABRIR LA CARTA
// ==========================================

document.getElementById("botonInicio").addEventListener("click", () => {
    window.location.href = "carta.html";
});

// ==========================================
// INICIAR
// ==========================================

requestAnimationFrame(animar);
