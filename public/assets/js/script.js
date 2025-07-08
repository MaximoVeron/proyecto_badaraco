// public/assets/js/script.js

document.addEventListener('DOMContentLoaded', () => {

    // Inicializar AOS (Animate On Scroll Library)
    AOS.init({
        duration: 900, // Duración de la animación en ms
        once: true,    // Si las animaciones deben ocurrir solo una vez
        mirror: false, // Si los elementos deben animarse al hacer scroll hacia arriba
    });

    // Función de validación de correo electrónico
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // 1. Validación y manejo del formulario de contacto (se mantiene)
    const contactForm = document.getElementById('contactForm');
    const contactFormMessage = document.getElementById('contactFormMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name && email && subject && message && validateEmail(email)) {
                // Simulación de envío
                contactFormMessage.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>¡Gracias, tu mensaje ha sido enviado! Te responderemos pronto.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                contactForm.reset();
            } else {
                contactFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Por favor, completa todos los campos correctamente.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            }
        });
    }

    // 2. Manejo y validación del formulario de Login (Modal) (se mantiene)
    const loginForm = document.getElementById('loginForm');
    const loginFormMessage = document.getElementById('loginFormMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (validateEmail(email) && password.length >= 6) {
                try {
                    const res = await fetch('http://localhost:3001/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        loginFormMessage.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>¡Inicio de sesión exitoso! Redirigiendo...<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                        setTimeout(() => {
                            // Asegurarse de que 'categoria' coincida con lo que devuelve tu backend (ej. 'Docente', 'Alumno', 'Padre')
                            if (data.categoria === 'Docente') window.location.href = 'perfiles/docente_principal.html';
                            else if (data.categoria === 'Alumno') window.location.href = 'perfiles/ninos_principal.html'; // Asegúrate de que tu backend devuelve 'nino' si es el rol para estudiantes
                            else if (data.categoria === 'Padre') window.location.href = 'perfiles/padres_principal.html'; // Asegúrate de que tu backend devuelve 'padre'
                            else {
                                // Manejar caso de rol desconocido o por defecto
                                console.warn('Rol de usuario desconocido:', data.categoria);
                                window.location.href = '/'; // Redirigir a una página por defecto o de error
                            }
                        }, 1200);
                    } else {
                        loginFormMessage.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>${data.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                    }
                } catch (err) {
                    console.error('Error en el login:', err);
                    loginFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error de conexión con el servidor.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                }
            } else {
                loginFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Por favor, introduce un correo válido y una contraseña de al menos 6 caracteres.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            }
        });
    }

    // 3. Manejo y validación del formulario de Registro (Modal)
    const registerForm = document.getElementById('registerForm');
    const registerFormMessage = document.getElementById('registerFormMessage');
    const registerNameInput = document.getElementById('registerName');
    const registerLastNameInput = document.getElementById('registerLastName');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerRoleSelect = document.getElementById('registerRole');
    const dniField = document.getElementById('dniField');
    const registerDniInput = document.getElementById('registerDni');

    // Mostrar/Ocultar campo DNI según el rol seleccionado
    if (registerRoleSelect) {
        registerRoleSelect.addEventListener('change', () => {
            const selectedRole = registerRoleSelect.value;
            if (selectedRole === 'Alumno' || selectedRole === 'Docente') {
                dniField.style.display = 'block';
                registerDniInput.setAttribute('required', 'true');
            } else {
                dniField.style.display = 'none';
                registerDniInput.removeAttribute('required');
                registerDniInput.value = '';
            }
        });
        registerRoleSelect.dispatchEvent(new Event('change')); // Disparar al cargar
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = registerNameInput.value.trim();
            const apellido = registerLastNameInput.value.trim();
            const email = registerEmailInput.value.trim();
            const password = registerPasswordInput.value.trim();
            const rol_nombre = registerRoleSelect.value;
            const dni = registerDniInput.value.trim();

            // Validación mejorada
            if (!nombre || !apellido || !validateEmail(email) || password.length < 6 || !rol_nombre) {
                registerFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Por favor, completa todos los campos obligatorios correctamente y una contraseña de al menos 6 caracteres.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                return;
            }

            if ((rol_nombre === 'Alumno' || rol_nombre === 'Docente') && !dni) {
                 registerFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>El DNI es requerido para Estudiantes y Docentes.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                 return;
            }

            try {
                const res = await fetch('http://localhost:3001/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre,
                        apellido: apellido,
                        email: email,
                        password: password,
                        rol_nombre: rol_nombre, // Asegúrate de que tu backend espera 'rol_nombre'
                        dni: dni
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    registerFormMessage.innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>${data.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                    registerForm.reset();
                    dniField.style.display = 'none';
                    registerDniInput.removeAttribute('required');

                    setTimeout(() => {
                        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                        if (registerModal) registerModal.hide();
                        alert('¡Gracias por registrarte en EducAR! Ahora puedes iniciar sesión.');
                    }, 2000);
                } else {
                    registerFormMessage.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>${data.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                }
            } catch (err) {
                console.error('Error en el registro:', err);
                registerFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error de conexión con el servidor.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            }
        });
    }

    // 4. Scroll suave para enlaces de la barra de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 5. Feedback visual al hacer clic en los botones de "Ver Actividades" del acordeón (simulado)
    document.querySelectorAll('#modulos .accordion-body .btn').forEach(button => {
        button.addEventListener('click', () => {
            alert('¡Esta función te llevará a las actividades de este módulo! (simulado)');
        });
    });

    // 6. Animación del monstruo en el login
    const monster = document.getElementById('monster');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const body = document.querySelector('body'); // No se usa directamente, pero se mantiene
    const anchoMitad = window.innerWidth / 2;
    const altoMitad = window.innerHeight / 2;
    let seguirPunteroMouse = true;

    if (monster && loginEmail && loginPassword) {
        document.body.addEventListener('mousemove',(m)=>{
            if (seguirPunteroMouse){
                if ((m.clientX<anchoMitad)&&(m.clientY < altoMitad)) {
                    monster.src = '../assets/images/monstruo_animation/idle/2.png';
                }
                if ((m.clientX>anchoMitad)&&(m.clientY<altoMitad)) {
                    monster.src = '../assets/images/monstruo_animation/idle/5.png';
                }
                if ((m.clientX<anchoMitad)&&(m.clientY>altoMitad)) {
                    monster.src = '../assets/images/monstruo_animation/idle/3.png';
                }
                if ((m.clientX>anchoMitad)&&(m.clientY>altoMitad)) {
                    monster.src = '../assets/images/monstruo_animation/idle/4.png';
                }
            }
        });
        loginEmail.addEventListener('focus',()=>{
            seguirPunteroMouse=false;
        });
        loginEmail.addEventListener('blur',()=>{
            seguirPunteroMouse=true;
        });
        loginEmail.addEventListener('keyup',()=>{
            let usuarioCaracteresLogin = loginEmail.value.length;
            if ((usuarioCaracteresLogin >=0)&&(usuarioCaracteresLogin<=10)){
                monster.src = '../assets/images/monstruo_animation/read/1.png';
            } else if ((usuarioCaracteresLogin >=11)&&(usuarioCaracteresLogin<=32)){
                monster.src = '../assets/images/monstruo_animation/read/2.png';
            } else if ((usuarioCaracteresLogin >=33)&&(usuarioCaracteresLogin<=52)){
                monster.src = '../assets/images/monstruo_animation/read/3.png';
            } else {
                monster.src = '../assets/images/monstruo_animation/read/4.png';
            }
        });
        loginPassword.addEventListener('focus',()=>{
            seguirPunteroMouse=false;
            let cont=1;
            const cubrirOjo = setInterval(()=>{
                monster.src = '../assets/images/monstruo_animation/cover/'+cont+'.png';
                if (cont<8) {
                    cont++;
                } else {
                    clearInterval(cubrirOjo);
                }
            },40);
        });
        loginPassword.addEventListener('blur',()=>{
            seguirPunteroMouse=true;
            let cont=7;
            const descubrirOjo = setInterval(()=>{
                monster.src = '../assets/images/monstruo_animation/cover/'+cont+'.png';
                if (cont>1) {
                    cont--;
                } else {
                    clearInterval(descubrirOjo);
                }
            },40);
        });
    }

});