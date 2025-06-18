document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Redirección para la Landing Page ---
    const accesoDocenteBtn = document.getElementById('accesoDocenteBtn');
    const accesoPadresBtn = document.getElementById('accesoPadresBtn');

    if (accesoDocenteBtn) {
        accesoDocenteBtn.addEventListener('click', () => {
            // En un sistema real, aquí iría la validación de credenciales del docente.
            window.location.href = 'docente.html';
        });
    }

    if (accesoPadresBtn) {
        accesoPadresBtn.addEventListener('click', () => {
            // En un sistema real, aquí iría la validación de credenciales del padre.
            window.location.href = 'padres.html';
        });
    }

    // --- Lógica de Pestañas (Navegación Interna) para Docente y Padres ---
    const navLinks = document.querySelectorAll('.user-header nav ul li a');
    const contentSections = document.querySelectorAll('.user-main-content > section');

    // Función para mostrar la sección activa y ocultar las demás
    function showSection(sectionId) {
        contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // Función para manejar el clic en los enlaces de navegación
    navLinks.forEach(link => {
        // Excluir el botón de "Cerrar Sesión" de la lógica de pestañas
        if (!link.classList.contains('logout-btn')) {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir la recarga de la página

                // Remover 'active' de todos los enlaces y añadirlo al clicado
                navLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');

                // Obtener el ID de la sección a mostrar (ej. 'dashboard', 'mis-clases')
                // Usamos un atributo data-section para esto
                const sectionId = link.getAttribute('data-section');
                if (sectionId) {
                    showSection(sectionId);
                }
            });
        }
    });

    // Mostrar la primera sección por defecto al cargar la página
    // Asegúrate de que tu HTML tenga un enlace con data-section="[id de la primera seccion]"
    const initialNavLink = document.querySelector('.user-header nav ul li a[data-section].active');
    if (initialNavLink) {
        showSection(initialNavLink.getAttribute('data-section'));
    } else if (contentSections.length > 0) {
        // Si no hay un activo inicial, activa el primero
        contentSections[0].classList.add('active');
        const firstNavLink = document.querySelector(`.user-header nav ul li a[data-section="${contentSections[0].id}"]`);
        if (firstNavLink) {
            firstNavLink.classList.add('active');
        }
    }


    // --- Contadores Dinámicos (Ejemplo para el Dashboard del Docente) ---
    // En un proyecto real, estos números vendrían de la base de datos
    const tareasPendientesCount = document.getElementById('tareasPendientesCount');
    const clasesActivasCount = document.getElementById('clasesActivasCount');
    const nuevosMensajesCount = document.getElementById('nuevosMensajesCount');

    if (tareasPendientesCount) {
        // Simulamos un conteo real
        const count = 5; // Este valor vendría del backend
        tareasPendientesCount.textContent = count;
        if (count > 0) {
            tareasPendientesCount.closest('.card').classList.add('warning-border');
        }
    }

    if (clasesActivasCount) {
        const count = 3;
        clasesActivasCount.textContent = count;
        if (count > 0) {
            clasesActivasCount.closest('.card').classList.add('success-border');
        }
    }

    if (nuevosMensajesCount) {
        const count = 2;
        nuevosMensajesCount.textContent = count;
        if (count > 0) {
            // Podríamos añadir una clase para indicar mensajes si quisiéramos
        }
    }

    // --- Interacción con Tareas de Padres (Ejemplo: Botón "Ver Detalle") ---
    const viewDetailButtons = document.querySelectorAll('.task-card .btn-info');
    viewDetailButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('En un sistema real, aquí se mostraría una ventana modal con los detalles completos de la tarea.');
            // Aquí podrías cargar una modal o redirigir a una página de detalle de tarea
        });
    });

    const uploadTaskButtons = document.querySelectorAll('.task-card .btn-upload');
    uploadTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('En un sistema real, aquí se abriría un formulario para subir el archivo de la tarea.');
            // Aquí podrías cargar un mini-formulario para subir archivos
        });
    });
});