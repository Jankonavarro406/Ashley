
const destino = new Date("2026-12-23T15:00:00-05:00").getTime();

const diasEl = document.getElementById("dias");
const horasEl = document.getElementById("horas");
const minutosEl = document.getElementById("minutos");
const segundosEl = document.getElementById("segundos");
const mensajeEl = document.getElementById("mensaje");

function actualizarCuenta() {
    let diferencia = destino - Date.now();

    if (diferencia <= 0) {
        diasEl.textContent = "000";
        horasEl.textContent = "00";
        minutosEl.textContent = "00";
        segundosEl.textContent = "00";
        mensajeEl.textContent = "EL MOMENTO HA LLEGADO";
        return;
    }

    const dias = Math.floor(
        diferencia / (1000 * 60 * 60 * 24)
    );

    diferencia %= 1000 * 60 * 60 * 24;

    const horas = Math.floor(
        diferencia / (1000 * 60 * 60)
    );

    diferencia %= 1000 * 60 * 60;

    const minutos = Math.floor(
        diferencia / (1000 * 60)
    );

    const segundos = Math.floor(
        (diferencia % (1000 * 60)) / 1000
    );

    diasEl.textContent = String(dias).padStart(3, "0");
    horasEl.textContent = String(horas).padStart(2, "0");
    minutosEl.textContent = String(minutos).padStart(2, "0");
    segundosEl.textContent = String(segundos).padStart(2, "0");
}

actualizarCuenta();
setInterval(actualizarCuenta, 1000);
