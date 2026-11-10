
const canvas = document.getElementById("universo");
const ctx = canvas.getContext("2d");

let W, H, cx, cy;
let ANGULO = -25 * Math.PI / 180;
let inclinacion = 0.28;
let zoom = 1;
let dispersion = 0;

function actualizarDispersion() {
    const objetivo = Math.max(
        0,
        Math.min(1, (zoom - 1) / 1.8)
    );

    dispersion += (objetivo - dispersion) * 0.045;
}

let arrastrando = false;
let ultimoX = 0;
let ultimoY = 0;

/* AJUSTAR PANTALLA */

function ajustar() {
    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

/* ROTACIÓN DE LA VISTA */

function rotar(x, y) {
    const cos = Math.cos(ANGULO);
    const sin = Math.sin(ANGULO);

    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos
    };
}

/* PARTÍCULAS NARANJAS */

const particulas = [];

for (let i = 0; i < 26000; i++) {
    const distancia =
        115 + Math.pow(Math.random(), 0.65) * 540;

    particulas.push({
        angulo: Math.random() * Math.PI * 2,
        distancia,
        tamaño: Math.random() * 1.8 + 0.2,
        velocidad:
            (0.0006 + Math.random() * 0.0012) *
            (620 / distancia),
        brillo: Math.random(),
        dispersionFactor: 0.55 + Math.random() * 1.1,
        profundidad: 0.20 + Math.random() * 0.18
    });
}

/* PARTÍCULAS AZULES */

const azules = [];

for (let i = 0; i < 7000; i++) {
    const distancia =
        180 + Math.pow(Math.random(), 0.7) * 560;

    azules.push({
        angulo: Math.random() * Math.PI * 2,
        distancia,
        tamaño: Math.random() * 1.3 + 0.1,
        velocidad: 0.00015 + Math.random() * 0.00055,
        brillo: Math.random(),
        dispersionFactor: 0.55 + Math.random() * 1.1,
        profundidad: 0.25 + Math.random() * 0.15
    });
}

/* FONDO */

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

/* POSICIÓN DE LAS PARTÍCULAS */

function obtenerPosicion(p) {
    const a = p.angulo;
    const d = p.distancia;

    const factor = p.dispersionFactor || 1;
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

    const punto = rotar(x, y);

    const desviacionVertical =
        dispersion *
        Math.sin(a * 5 + d * 0.035 + p.brillo * 4) *
        (35 + p.brillo * 75) * factor;

    const variacionVertical =
        dispersion *
        Math.cos(a * 2.3 + d * 0.018) *
        24 * factor;

    return {
        x: cx + punto.x * zoom,
        y: cy + (
            punto.y +
            desviacionVertical +
            variacionVertical
        ) * zoom
    };
}

/* PARTÍCULAS AZULES */

function dibujarAzules(delante = false) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const p of azules) {
        if (delante) {
            if (Math.sin(p.angulo) <= 0) continue;
        } else {
            p.angulo += p.velocidad;
        }

        const pos = obtenerPosicion(p);

        let intensidad = 0.05 + p.brillo * 0.16;

        if (p.distancia < 280) intensidad *= 1.5;

        ctx.globalAlpha = intensidad;
        ctx.fillStyle =
            p.brillo > 0.65 ? "#62b7ff" : "#174d85";

        ctx.beginPath();
        ctx.arc(
            pos.x,
            pos.y,
            Math.max(0.1, p.tamaño * zoom),
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.restore();
}

/* COLOR DE LAS PARTÍCULAS NARANJAS */

function colorParticula(d) {
    if (d < 145) return [255, 250, 225];
    if (d < 210) return [255, 190, 95];
    if (d < 350) return [255, 105, 25];
    if (d < 480) return [180, 50, 14];

    return [80, 25, 10];
}

/* DISCO NARANJA */

function dibujarDisco(delante = false) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const p of particulas) {
        if (delante) {
            if (Math.sin(p.angulo) <= 0) continue;
        } else {
            p.angulo += p.velocidad;
        }

        const d = p.distancia;
        const pos = obtenerPosicion(p);

        let intensidad = Math.max(
            0,
            1 - Math.abs(d - 190) / 390
        );

        intensidad *= 0.45 + p.brillo * 0.8;

        if (Math.cos(p.angulo) > 0) {
            intensidad *= 1.6;
        }

        const [r, g, b] = colorParticula(d);

        ctx.globalAlpha = Math.min(0.9, intensidad * 0.42);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        ctx.beginPath();
        ctx.arc(
            pos.x,
            pos.y,
            Math.max(
                0.1,
                p.tamaño * (1 + intensidad) * zoom
            ),
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.restore();
}

/* PARTÍCULAS DELANTE DEL AGUJERO */

function dibujarParticulasDelante() {
    dibujarAzules(true);
    dibujarDisco(true);
}

/* ANILLOS */

function dibujarAnillos(parte) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const inicio = parte === "atras" ? Math.PI : 0;
    const fin = parte === "atras" ? Math.PI * 2 : Math.PI;

    // Anillos naranjas
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

    // Anillos azules exteriores
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

/* HALO */

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

/* AGUJERO NEGRO */

function dibujarAgujeroNegro() {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";

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

/* NIEBLA */

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

/* FOTOGRAFÍAS ORBITANDO
   MÁXIMO 14 FOTOGRAFÍAS
   Coloca tus imágenes dentro de la carpeta "fotos".
*/



/* FOTOGRAFÍAS ORBITANDO
   MÁXIMO 14 FOTOGRAFÍAS
   Posiciones y movimientos aleatorios.
*/

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
    "fotos/foto23.jpg",
];

const aleatorio = (min, max) =>
    min + Math.random() * (max - min);

const fotosOrbitando = rutasFotos.slice(0, 23).map((ruta) => {
    const imagen = new Image();
    imagen.src = ruta;

    return {
        imagen,

        // Cada foto comienza en un ángulo diferente.
        angulo: Math.random() * Math.PI * 2,

        // Distancias aleatorias respecto al agujero negro.
        distancia: aleatorio(220, 440),

        // Cada fotografía tiene su propia velocidad.
        velocidad: aleatorio(0.00035, 0.0011),

        // Variación vertical independiente.
        desplazamientoVertical: aleatorio(-150, 150),
        amplitudVertical: aleatorio(20, 100),
        velocidadVertical: aleatorio(0.008, 0.025),
        faseVertical: Math.random() * Math.PI * 2,

        // Movimiento lateral y radial.
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
        foto.angulo += foto.velocidad;

        foto.faseVertical += foto.velocidadVertical;
        foto.faseRadial += foto.velocidadRadial;

        foto.giro += foto.velocidadGiro;
    }
}

function dibujarFotosOrbitando(delante = false) {
    for (const foto of fotosOrbitando) {

        const estaDelante = Math.sin(foto.angulo) > 0;

        if (estaDelante !== delante) continue;

        if (!foto.imagen.complete ||
            foto.imagen.naturalWidth === 0) {
            continue;
        }

        // Movimiento horizontal alrededor del centro.
        const variacionRadio =
            Math.sin(foto.faseRadial) * foto.amplitudRadial;

        const distanciaActual =
            foto.distancia + variacionRadio;

        const x =
            Math.cos(foto.angulo) * distanciaActual;

        // Movimiento vertical irregular.
        const yOrbital =
            Math.sin(foto.angulo) *
            distanciaActual *
            inclinacion *
            foto.profundidad;

        const movimientoVertical =
            foto.desplazamientoVertical +
            Math.sin(foto.faseVertical) *
            foto.amplitudVertical;

        const punto = rotar(x, yOrbital);

        const pantallaX = cx + punto.x * zoom;
        const pantallaY =
            cy + (punto.y + movimientoVertical) * zoom;

        // Tamaños diferentes según profundidad.
        const escalaProfundidad = estaDelante ? 1 : 0.78;

        const ancho =
            foto.ancho * zoom * escalaProfundidad;

        const alto =
            foto.alto * zoom * escalaProfundidad;

        const radio = Math.max(2, 5 * zoom);

        ctx.save();

        ctx.globalAlpha = estaDelante ? 0.96 : 0.58;

        ctx.translate(pantallaX, pantallaY);

        ctx.rotate(foto.giro + ANGULO * 0.08);

        ctx.shadowColor = "rgba(255, 145, 65, 0.45)";
        ctx.shadowBlur = 13 * zoom;

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

        ctx.shadowBlur = 0;

        ctx.lineWidth = Math.max(0.7, 1.1 * zoom);
        ctx.strokeStyle = "rgba(255, 190, 125, 0.65)";

        ctx.stroke();

        ctx.restore();
    }
}


/* ANIMACIÓN PRINCIPAL */

function animar() {
    actualizarDispersion();

    actualizarFotosOrbitando();

    dibujarFondo();
    dibujarAzules();
    dibujarHalo();
    dibujarDisco();

    // Fotografías que pasan por detrás.
    dibujarFotosOrbitando(false);

    dibujarAnillos("atras");
    dibujarAgujeroNegro();
    dibujarParticulasDelante();

    // Fotografías que pasan por delante.
    dibujarFotosOrbitando(true);

    dibujarAnillos("adelante");
    dibujarNiebla();

    requestAnimationFrame(animar);
}

/* MOVIMIENTO CON MOUSE O PANTALLA TÁCTIL */

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

/* ZOOM CON LA RUEDA DEL MOUSE */

canvas.addEventListener("wheel", function(e) {
    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;

    zoom = Math.max(
        0.35,
        Math.min(5, zoom * factor)
    );
}, { passive: false });

/* BOTÓN PARA ABRIR LA CARTA */

document.getElementById("botonInicio").addEventListener("click", () => {
    window.location.href = "carta.html";
});

/* INICIAR ANIMACIÓN */

requestAnimationFrame(animar);
