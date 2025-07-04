document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const data = new FormData();
    data.append("nombre", document.getElementById("registerName").value);
    data.append("email", document.getElementById("registerEmail").value);
    data.append("contraseña", document.getElementById("registerPassword").value);
    data.append("rol", document.getElementById("registerRole").value);

    fetch("registro.php", {
        method: "POST",
        body: data
    })
    .then(res => res.text())
    .then(msg => {
        if (msg === "ok") {
            document.getElementById("registerFormMessage").innerHTML = "Registro exitoso. Ahora podés iniciar sesión.";
        } else {
            document.getElementById("registerFormMessage").innerHTML = "Error en el registro.";
        }
    });
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value
    };

    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        if (res.token && res.categoria) {
            // Guarda el token y el nombre en localStorage
            localStorage.setItem("token", res.token);
            localStorage.setItem("nombreUsuario", res.nombre);

            // Redirige según el rol/categoria
            if (res.categoria === "estudiante") {
                window.location.href = "/pages/perfiles/ninos_principal.html";
            } else if (res.categoria === "docente") {
                window.location.href = "/public/pages/perfiles/docente_principal.html";
            } else if (res.categoria === "padre") {
                window.location.href = "/public/pages/perfiles/padres_principal.html";
            } else {
                window.location.href = "/";
            }
        } else {
            document.getElementById("loginFormMessage").innerText = "Credenciales inválidas.";
        }
    })
    .catch(() => {
        document.getElementById("loginFormMessage").innerText = "Error en el servidor.";
    });
});
