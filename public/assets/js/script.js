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
                            if (data.categoria === 'docente') window.location.href = 'perfiles/docente_principal.html';
                            if (data.categoria === 'nino') window.location.href = 'perfiles/ninos_principal.html';
                            if (data.categoria === 'padre') window.location.href = 'perfiles/padres_principal.html';

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

});

document.addEventListener('DOMContentLoaded', function() {
    AOS.init(); // Inicializa AOS, si no lo tienes ya inicializado

    // --- Lógica para el modal de Notificaciones ---
    const notificationsModal = document.getElementById('notificationsModal');
    const notificationsList = document.getElementById('notificationsList');
    const notificationsCountSpan = document.getElementById('notificationsCount');
    const noNotificationsMessage = document.getElementById('noNotificationsMessage');
    const markAllAsReadBtn = document.getElementById('markAllAsReadBtn');

    // Función para simular la carga de notificaciones
    // En un entorno real, esto haría una llamada a tu backend.
    function loadNotifications() {
        // Simular datos de notificaciones (pueden venir de un servidor)
        const dummyNotifications = [
            { id: 1, type: 'new_activity', message: '¡Nueva actividad disponible! Explora el juego "Aventuras con las Sílabas".', read: false },
            { id: 2, type: 'course_progress', message: 'Tu hijo completó el 80% del módulo de Matemáticas.', read: false },
            { id: 3, type: 'admin_message', message: '¡Importante! Mantenimiento programado para el 15 de Julio de 2025 de 00:00 a 02:00 hs.', read: false },
            { id: 4, type: 'new_feature', message: '¡Nueva función! Ahora puedes personalizar el avatar de tu perfil.', read: true } // Esta ya está leída
        ];

        // Obtener notificaciones del Local Storage o simular si no existen
        let notifications = JSON.parse(localStorage.getItem('educarNotifications')) || dummyNotifications;

        renderNotifications(notifications);
        updateNotificationCount(notifications);
        localStorage.setItem('educarNotifications', JSON.stringify(notifications));
    }

    // Función para renderizar las notificaciones en el modal
    function renderNotifications(notifications) {
        notificationsList.innerHTML = ''; // Limpiar la lista existente

        const unreadNotifications = notifications.filter(n => !n.read);

        if (unreadNotifications.length === 0 && notifications.length === 0) {
            noNotificationsMessage.style.display = 'block';
            markAllAsReadBtn.style.display = 'none'; // Ocultar el botón si no hay notificaciones
        } else {
            noNotificationsMessage.style.display = 'none';
            // Mostrar el botón solo si hay notificaciones sin leer
            if (unreadNotifications.length > 0) {
                 markAllAsReadBtn.style.display = 'block';
            } else {
                markAllAsReadBtn.style.display = 'none';
            }


            notifications.forEach(notification => {
                const alertType = notification.read ? 'alert-secondary' : 'alert-info'; // Color diferente para leídas
                const readClass = notification.read ? 'notification-read' : ''; // Clase para estilizar notificaciones leídas
                const notificationItem = document.createElement('div');
                notificationItem.classList.add('alert', alertType, 'alert-dismissible', 'fade', 'show', 'mb-2', readClass);
                notificationItem.setAttribute('role', 'alert');
                notificationItem.dataset.notificationId = notification.id; // Para identificar la notificación

                notificationItem.innerHTML = `
                    <p class="mb-0">
                        <strong>${getNotificationTitle(notification.type)}</strong> ${notification.message}
                    </p>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
                `;

                notificationsList.appendChild(notificationItem);
            });
        }
    }

    // Función para obtener el título según el tipo de notificación
    function getNotificationTitle(type) {
        switch (type) {
            case 'new_activity': return '¡Nueva Actividad!';
            case 'course_progress': return 'Progreso del Curso:';
            case 'admin_message': return 'Mensaje del Equipo EducAR:';
            case 'new_feature': return '¡Nueva Función!';
            default: return 'Notificación:';
        }
    }

    // Función para actualizar el contador de notificaciones no leídas
    function updateNotificationCount(notifications) {
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationsCountSpan.textContent = unreadCount;
        notificationsCountSpan.style.display = unreadCount > 0 ? 'inline-block' : 'none'; // Mostrar/ocultar el badge
    }

    // Evento al mostrar el modal de notificaciones
    notificationsModal.addEventListener('show.bs.modal', function () {
        loadNotifications(); // Cargar y renderizar notificaciones cada vez que se abre el modal
    });

    // Evento al hacer clic en el botón "Marcar todas como leídas"
    markAllAsReadBtn.addEventListener('click', function() {
        let notifications = JSON.parse(localStorage.getItem('educarNotifications')) || [];
        notifications.forEach(n => n.read = true); // Marcar todas como leídas
        localStorage.setItem('educarNotifications', JSON.stringify(notifications));
        renderNotifications(notifications); // Volver a renderizar para que cambie el estilo
        updateNotificationCount(notifications); // Actualizar el contador
    });

    // Evento al cerrar una notificación individualmente (usando delegación de eventos)
    notificationsList.addEventListener('closed.bs.alert', function (event) {
        const notificationItem = event.target;
        const notificationId = parseInt(notificationItem.dataset.notificationId);

        let notifications = JSON.parse(localStorage.getItem('educarNotifications')) || [];
        const index = notifications.findIndex(n => n.id === notificationId);

        if (index !== -1) {
            notifications.splice(index, 1); // Eliminar la notificación de la lista
            localStorage.setItem('educarNotifications', JSON.stringify(notifications));
            updateNotificationCount(notifications); // Actualizar el contador
        }

        // Si no quedan notificaciones, mostrar el mensaje de "no notificaciones"
        if (notifications.length === 0) {
            noNotificationsMessage.style.display = 'block';
            markAllAsReadBtn.style.display = 'none';
        }
    });

    // Inicializar notificaciones al cargar la página por primera vez
    loadNotifications();

    // --- Lógica existente para formularios de Login y Registro ---
    // (Asegúrate de que este código ya esté en tu script.js y adaptarlo si es necesario)

    const loginForm = document.getElementById('loginForm');
    const loginFormMessage = document.getElementById('loginFormMessage');
    const loginModal = document.getElementById('loginModal');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            // Aquí iría la lógica de autenticación con el backend
            console.log('Intento de login...');
            loginFormMessage.innerHTML = '<div class="alert alert-warning">Iniciando sesión...</div>';

            setTimeout(() => {
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                if (email === 'test@educar.com' && password === 'password123') {
                    loginFormMessage.innerHTML = '<div class="alert alert-success">¡Inicio de sesión exitoso! Redirigiendo...</div>';
                    // Aquí podrías redirigir al usuario o cerrar el modal
                    const bsLoginModal = bootstrap.Modal.getInstance(loginModal);
                    bsLoginModal.hide();
                    // window.location.href = '/dashboard'; // Ejemplo de redirección
                } else {
                    loginFormMessage.innerHTML = '<div class="alert alert-danger">Credenciales incorrectas. Intenta de nuevo.</div>';
                }
            }, 1500); // Simular una carga
        });
    }

    const registerForm = document.getElementById('registerForm');
    const registerFormMessage = document.getElementById('registerFormMessage');
    const registerModal = document.getElementById('registerModal');

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            // Aquí iría la lógica de registro con el backend
            console.log('Intento de registro...');
            registerFormMessage.innerHTML = '<div class="alert alert-warning">Registrando usuario...</div>';

            setTimeout(() => {
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const role = document.getElementById('registerRole').value;

                // Validación simple de ejemplo
                if (password.length < 6) {
                    registerFormMessage.innerHTML = '<div class="alert alert-danger">La contraseña debe tener al menos 6 caracteres.</div>';
                    return;
                }

                // Simular registro exitoso
                registerFormMessage.innerHTML = '<div class="alert alert-success">¡Registro exitoso! Ya puedes iniciar sesión.</div>';
                // Limpiar formulario o redirigir
                registerForm.reset();
                // Opcional: Cerrar modal de registro y abrir modal de login
                const bsRegisterModal = bootstrap.Modal.getInstance(registerModal);
                bsRegisterModal.hide();
                setTimeout(() => {
                    const bsLoginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    bsLoginModal.show();
                }, 500);
            }, 2000); // Simular una carga
        });
    }

    // --- Lógica para la animación del monstruo en el modal de Login ---
    const monsterImg = document.getElementById('monster');
    if (monsterImg) {
        const animationFrames = 10; // Número de frames en la carpeta idle
        let currentFrame = 1;

        function animateMonster() {
            monsterImg.src = `../assets/images/monstruo_animation/idle/${currentFrame}.png`;
            currentFrame++;
            if (currentFrame > animationFrames) {
                currentFrame = 1;
            }
        }
        setInterval(animateMonster, 200); // Cambia el frame cada 200ms
    }
});

