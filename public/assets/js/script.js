document.addEventListener('DOMContentLoaded', () => {

    // Inicializar AOS (Animate On Scroll Library)
    AOS.init({
        duration: 900, // Duración de la animación en ms (se puso en 900 para que no genere trabas al cargar, en especial imagenes)
        once: true,     // Si las animaciones deben ocurrir solo una vez al hacer scroll hacia abajo
        mirror: false,  // Si los elementos deben animarse al hacer scroll hacia arriba
    });


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
                            if (data.categoria === 'docente') window.location.href = '/pages/perfiles/docente_principal.html';
                            if (data.categoria === 'nino') window.location.href = '/pages/perfiles/ninos_principal.html';
                            if (data.categoria === 'padre') window.location.href = '/pages/perfiles/padres_principal.html';
                        }, 1200);
                    } else {
                        loginFormMessage.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>${data.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                    }
                } catch (err) {
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

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const role = document.getElementById('registerRole').value;

            if (name && validateEmail(email) && password.length >= 6 && role) {
                try {
                    const res = await fetch('http://localhost:3001/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: name, email, password, categoria: role })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        registerFormMessage.innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>${data.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                        registerForm.reset();
                        setTimeout(() => {
                            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                            if (registerModal) registerModal.hide();
                            alert('¡Gracias por registrarte en EducAR! Ahora puedes iniciar sesión.');
                        }, 2000);
                    } else {
                        registerFormMessage.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>${data.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                    }
                } catch (err) {
                    registerFormMessage.innerHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error de conexión con el servidor.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
                }
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
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const body = document.querySelector('body');
    const anchoMitad = window.innerWidth / 2;
    const altoMitad = window.innerHeight / 2;
    let seguirPunteroMouse = true;

    document.body.addEventListener('mousemove',(m)=>{
        // mira para la izquierda arriba
        if (seguirPunteroMouse){
            if ((m.clientX<anchoMitad)&&(m.clientY < altoMitad)) {
                monster.src = '../assets/images/monstruo_animation/idle/2.png';
            }
            // mira para la derecha arriba
            if ((m.clientX>anchoMitad)&&(m.clientY<altoMitad)) {
                monster.src = '../assets/images/monstruo_animation/idle/5.png';
            }
            //mira para la izquierda abajo
            if ((m.clientX<anchoMitad)&&(m.clientY>altoMitad)) {
                monster.src = '../assets/images/monstruo_animation/idle/3.png';
            }
            //mira para la derecha abajo 
            if ((m.clientX>anchoMitad)&&(m.clientY>altoMitad)) {
                monster.src = '../assets/images/monstruo_animation/idle/4.png';
            }
        }
    })
    //seguimineto de escritura en el loginEmail
    loginEmail.addEventListener('focus',()=>{
        seguirPunteroMouse=false;
    })

    loginEmail.addEventListener('blur',()=>{
        seguirPunteroMouse=true;
    })
    //seguimiento de escritura en el login
    loginEmail.addEventListener('keyup',()=>{
        let usuarioCaracteresLogin = loginEmail.value.length;
        if ((usuarioCaracteresLogin >=0)&&(usuarioCaracteresLogin<=10)){
            monster.src = '../assets/images/monstruo_animation/read/1.png'
        } else if ((usuarioCaracteresLogin >=11)&&(usuarioCaracteresLogin<=32)){
            monster.src = '../assets/images/monstruo_animation/read/2.png'
        } else if ((usuarioCaracteresLogin >=33)&&(usuarioCaracteresLogin<=52)){
            monster.src = '../assets/images/monstruo_animation/read/3.png'
        } else {
            monster.src = '../assets/images/monstruo_animation/read/4.png'
        }
        
    })

    //seguimineto de escritura en el loginPassword
    loginPassword.addEventListener('focus',()=>{
        seguirPunteroMouse=false;
        let cont=1
        const cubrirOjo = setInterval(()=>{
            monster.src = '../assets/images/monstruo_animation/cover/'+cont+'.png';
            if (cont<8) {
                cont++;
            } else {
                clearInterval(cubrirOjo);
            }
        },40);
    })

    loginPassword.addEventListener('blur',()=>{
        seguirPunteroMouse=true;
        let cont=7
        const descubrirOjo = setInterval(()=>{
            monster.src = '../assets/images/monstruo_animation/cover/'+cont+'.png';
            if (cont>1) {
                cont--;
            } else {
                clearInterval(descubrirOjo);
            }
        },40);
    })

});

