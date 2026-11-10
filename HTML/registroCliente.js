const formE1 = document.querySelector('.form');

/*---
    Intercepta el submit del formulario
*/
formE1.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(formE1);
    const data = Object.fromEntries(formData);

    /*---
        Valida que los campos estén completos
    */
    if (data.nombre == '' || data.contacto == '' ||
        data.password == '' || data.ConfirmarPassword == '') {

        document.getElementById('resultado2').style.color = 'RED';
        document.getElementById('resultado2').textContent =
            'Debe completar todos los campos';
        return;
    }

    /*---
        Verifica que las contraseñas coincidan
    */
    if (data.password != data.ConfirmarPassword) {
        document.getElementById('errorPassword').textContent =
            'Las contraseñas no coinciden';
        return;
    }

    document.getElementById('errorPassword').textContent = '';

    /*---
        Verifica los términos y condiciones
    */
    if (data.termscondition != 'on') {
        document.getElementById('resultado2').style.color = 'RED';
        document.getElementById('resultado2').textContent =
            'Debe aceptar los términos y condiciones';
        return;
    }

    document.getElementById('resultado2').textContent = '';

    /*---
        Define la dirección del servidor Node.js
    */
    const RESTAPI = {
        addCliente: 'http://localhost:8080/api/addCliente'
    };

    /*---
        Crea el objeto con los datos del nuevo cliente
    */
    const nuevoCliente = {
        nombre: data.nombre,
        contacto: data.contacto,
        password: data.password
    };

    /*---
        Configura la solicitud POST
    */
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoCliente)
    };

    /*---
        Envía los datos al servidor Node.js
    */
    fetch(RESTAPI.addCliente, options)
        .then((res) => {
            return res.json();
        })
        .then((cliente) => {
            if (cliente.response == 'OK') {
                alert('Usuario registrado correctamente');

                window.location.href = 'loginClient.html';
            } else {
                document.getElementById('resultado2').style.color = 'RED';
                document.getElementById('resultado2').textContent =
                    cliente.message || 'Error al registrar usuario';
            }
        })
        .catch((error) => {
            console.error('Error de conexión:', error);

            document.getElementById('resultado2').style.color = 'RED';
            document.getElementById('resultado2').textContent =
                'No se pudo conectar con el servidor';
        });
});