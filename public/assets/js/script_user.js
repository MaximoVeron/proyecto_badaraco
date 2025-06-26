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

    const data = new FormData();
    data.append("email", document.getElementById("loginEmail").value);
    data.append("contraseña", document.getElementById("loginPassword").value);

    fetch("login.php", {
        method: "POST",
        body: data
    })
    .then(res => res.text())
    .then(rol => {
        if (rol === "estudiante") {
            window.location.href = "panel_estudiante.php";
        } else if (rol === "docente") {
            window.location.href = "panel_docente.php";
        } else if (rol === "padre") {
            window.location.href = "panel_padre.php";
        } else if (rol === "institucion") {
            window.location.href = "panel_institucion.php";
        } else {
            document.getElementById("loginFormMessage").innerText = "Credenciales inválidas.";
        }
    });
});
