const form = document.querySelector(".form");
const errorPassword = document.querySelector("#errorPassword");
const resultado = document.querySelector("#resultado2");
const boton = document.querySelector("#btnregistrar");
const botonVolver = document.querySelector("#btnVolver");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    errorPassword.textContent = "";
    resultado.textContent = "";
    errorPassword.style.color = "red";
    resultado.style.color = "red";

    const data = new FormData(form);
    const contacto = data.get("contacto").trim();
    const nuevaPassword = data.get("NewPassword");
    const confirmarPassword = data.get("ConfirmarPassword");

    if (!contacto || !nuevaPassword || !confirmarPassword) {
        resultado.textContent = "Debe completar todos los campos.";
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        errorPassword.textContent = "Las contraseñas no coinciden.";
        return;
    }

    if (data.get("termscondition") !== "on") {
        resultado.textContent = "Debe aceptar los T&C para poder cambiar la contraseña";
        return;
    }

    boton.disabled = true;
    boton.textContent = "Procesando...";

    try {
        const respuesta = await fetch("http://localhost:8080/api/resetCliente", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contacto: contacto,
                password: nuevaPassword
            })
        });
        const datos = await respuesta.json();

        if (respuesta.ok && datos.response === "OK") {
            resultado.style.color = "green";
            resultado.textContent = "La contraseña se actualizó correctamente.";
            boton.hidden = true;
            botonVolver.hidden = false;

        } else {
            resultado.textContent = datos.message || "No se pudo cambiar la contraseña.";
        }

    } catch (error) {
        resultado.textContent =
            "No se pudo conectar con el servidor. Verificá que esté iniciado.";

        console.error("Error al cambiar la contraseña:", error);

    } finally {
        if (!boton.hidden) {
            boton.disabled = false;
            boton.textContent = "Confirmar";
        }
    }
});

botonVolver.addEventListener("click", function () {
    window.location.href = "loginClient.html";
});
