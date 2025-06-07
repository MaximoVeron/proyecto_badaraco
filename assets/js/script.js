document.addEventListener('DOMContentLoaded', () => {

    // Inicializar AOS (Animate On Scroll Library)
    AOS.init({
        duration: 1000, // Duración de la animación en ms
        once: true,     // Si las animaciones deben ocurrir solo una vez al hacer scroll hacia abajo
        mirror: false,  // Si los elementos deben animarse al hacer scroll hacia arriba
    });

    // Desactivamos la animación de "Fade-in" manual que teníamos, ya que AOS la reemplaza.
    // const sections = document.querySelectorAll('section');
    // const fadeInObserver = new IntersectionObserver((entries, observer) => {
    //     entries.forEach(entry => {
    //         if (entry.isIntersecting) {
    //             entry.target.classList.add('fade-in');
    //             observer.unobserve(entry.target);
    //         }
    //     });
    // }, {
    //     threshold: 0.2
    // });
    // sections.forEach(section => {
    //     fadeInObserver.observe(section);
    // });

    // 1. Validación y manejo del formulario de contacto
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

    // 2. Manejo y validación del formulario de Login (Modal)
    const loginForm = document.getElementById('loginForm');
    const loginFormMessage = document.getElementById('loginFormMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (validateEmail(email) && password.length >= 6) { // Validación de longitud de contraseña
                if (email === 'docente@educar.com' && password === 'EducAR2025') { // Ejemplo para Docente
                    loginFormMessage.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>¡Inicio de sesión exitoso! Redirigiendo a tu panel...<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                    // En un proyecto real, redirigirías a: window.location.href = 'teacher-dashboard.html';
                    setTimeout(() => {
                        alert('Bienvenido/a Docente al panel (simulado)!');
                        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                        if (loginModal) loginModal.hide();
                    }, 1500);
                } else if (email === 'alumno@educar.com' && password === 'EducAR2025') { // Ejemplo para Alumno
                    loginFormMessage.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>¡Inicio de sesión exitoso! ¡A aprender jugando!<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                    // En un proyecto real, redirigirías a: window.location.href = 'student-dashboard.html';
                    setTimeout(() => {
                        alert('Bienvenido/a Estudiante al panel (simulado)!');
                        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                        if (loginModal) loginModal.hide();
                    }, 1500);
                } else {
                    loginFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Correo o contraseña incorrectos.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                }
            } else {
                loginFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Por favor, introduce un correo válido y una contraseña de al menos 6 caracteres.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            }
        });
    }

    // 3. Manejo y validación del formulario de Registro (Modal)
    const registerForm = document.getElementById('registerForm');
    const registerFormMessage = document.getElementById('registerFormMessage');

    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const role = document.getElementById('registerRole').value;

            if (name && validateEmail(email) && password.length >= 6 && role) {
                // Simulación de envío al backend
                registerFormMessage.innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>¡Registro exitoso! ¡Bienvenido/a ${name} como ${role}!<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                registerForm.reset();
                setTimeout(() => {
                    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                    if (registerModal) registerModal.hide();
                    alert('¡Gracias por registrarte en EducAR! Ahora puedes iniciar sesión.');
                }, 2500); // Dar más tiempo para leer el mensaje
            } else {
                registerFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Por favor, completa todos los campos correctamente y una contraseña de al menos 6 caracteres.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
            }
        });
    }

    // Función de validación de correo electrónico
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // 4. Scroll suave para enlaces de la barra de navegación (se mantiene)
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
            // En un proyecto real, aquí cargarías contenido dinámico o redirigirías
            // window.location.href = `activities-${moduleName}.html`;
        });
    });
    // 6. Animación del monstruo en el login
const monster = document.getElementById('monster');
const inputUsuario = document.getElementById('input-usuario');
const inputClave = document.getElementById('input-clave');
const body = document.querySelector('body');

if (monster && inputUsuario && inputClave) {
    const anchoMitad = window.innerWidth / 2;
    const altoMitad = window.innerHeight / 2;
    let seguirPunteroMouse = true;

    body.addEventListener('mousemove', (m) => {
        if (seguirPunteroMouse) {
            if (m.clientX < anchoMitad && m.clientY < altoMitad) {
                monster.src = "../assets/images/monstruo_animation/idle/2.png";//img/idle/2.png
            } else if (m.clientX < anchoMitad && m.clientY > altoMitad) {
                monster.src = "../assets/images/monstruo_animation/idle/3";//img/idle/3.png
            } else if (m.clientX > anchoMitad && m.clientY < altoMitad) {
                monster.src = "../assets/images/monstruo_animation/idle/5.png";//img/idle/5.png
            } else {
                monster.src = "../assets/images/monstruo_animation/idle/4.png";//img/idle/4.png
            }
        }
    });

    inputUsuario.addEventListener('focus', () => {
        seguirPunteroMouse = false;
    });

    inputUsuario.addEventListener('blur', () => {
        seguirPunteroMouse = true;
    });

    inputUsuario.addEventListener('keyup', () => {
        let usuario = inputUsuario.value.length;
        if (usuario >= 0 && usuario <= 5) {
            monster.src = '../assets/images/monstruo_animation/read/1.png';//img/read/1.png
        } else if (usuario >= 6 && usuario <= 14) {
            monster.src = '../assets/images/monstruo_animation/read/2.png';
        } else if (usuario >= 15 && usuario <= 20) {
            monster.src = '../assets/images/monstruo_animation/read/3.png';
        } else {
            monster.src = '../assets/images/monstruo_animation/read/3.png';
        }
    });

    inputClave.addEventListener('focus', () => {
        seguirPunteroMouse = false;
        let cont = 1;
        const cubrirOjo = setInterval(() => {
            monster.src = '../monstruo_animation/cover/' + cont + '.png';
            if (cont < 8) {
                cont++;
            } else {
                clearInterval(cubrirOjo);
            }
        }, 60);
    });

    inputClave.addEventListener('blur', () => {
        seguirPunteroMouse = true;
        let cont = 7;
        const descubrirOjo = setInterval(() => {
            monster.src = '../monstruo_animation/cover/' + cont + '.png';
            if (cont > 1) {
                cont--;
            } else {
                clearInterval(descubrirOjo);
            }
        }, 60);
    });
}

});