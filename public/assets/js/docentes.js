const API_BASE_URL = 'http://localhost:3001/api'; // ¡Asegúrate de que este sea el puerto de tu backend!

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        // 1. Obtener datos del usuario autenticado
        const userResponse = await fetch(`${API_BASE_URL}/usuario`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            console.error('Error al obtener datos del usuario:', errorData.message);
            alert('Sesión expirada o no válida. Por favor, inicia sesión de nuevo.');
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        const userData = await userResponse.json();
        console.log('Datos del usuario autenticado:', userData);

        const nombreDocenteSpan = document.getElementById('nombre-docente');
        if (nombreDocenteSpan) {
            nombreDocenteSpan.textContent = userData.nombre || 'Docente';
        }

        // Cargar las clases del docente
        await cargarClasesDocente(token, userData.id_usuario);
        // Cargar alumnos para el selector (si aplica)
        await cargarAlumnosDeClases(token);

    } catch (error) {
        console.error('Error al cargar la página del docente (catch global):', error);
        alert('Ocurrió un error al cargar tu perfil. Por favor, intenta de nuevo.');
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    // --- Funciones para interactuar con la gestión de clases ---

    async function cargarClasesDocente(token, id_docente) {
        const loadingMessage = document.getElementById('loadingClassesMessage');
        const myClassesList = document.getElementById('myClassesList');

        if (loadingMessage) loadingMessage.style.display = 'block';
        if (myClassesList) myClassesList.innerHTML = '';

        try {
            // ¡CORRECCIÓN CLAVE AQUÍ! La URL debe ser a tu backend y la ruta correcta
            const response = await fetch(`${API_BASE_URL}/clases/docente/${id_docente}`, { // <--- ¡CAMBIO AQUÍ!
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error al cargar clases: ${response.statusText}`);
            }

            const clases = await response.json();
            console.log('Clases del docente:', clases);

            if (loadingMessage) loadingMessage.style.display = 'none';

            if (clases.length === 0) {
                myClassesList.innerHTML = '<li class="list-group-item text-center text-muted">No tienes clases asignadas aún.</li>';
                return;
            }

            clases.forEach(clase => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <div>
                        <h6 class="mb-1">${clase.nombre_clase} (${clase.anio_academico})</h6>
                        <small class="text-muted">${clase.nivel_educativo}</small>
                    </div>
                    <button class="btn btn-sm btn-info view-class-details" data-class-id="${clase.id_clase}" data-bs-toggle="modal" data-bs-target="#classDetailsModal">
                        Ver Detalles
                    </button>
                `;
                myClassesList.appendChild(li);
            });

            document.querySelectorAll('.view-class-details').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const classId = event.target.dataset.classId;
                    await showClassDetails(classId, token);
                });
            });

        } catch (error) {
            console.error('Error al cargar las clases del docente:', error);
            if (loadingMessage) loadingMessage.textContent = 'Error al cargar clases.';
            alert('No se pudieron cargar tus clases. Intenta de nuevo.');
        }
    }

    async function showClassDetails(classId, token) {
        try {
            const classResponse = await fetch(`${API_BASE_URL}/clases/${classId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!classResponse.ok) {
                throw new Error(`Error al obtener detalles de la clase: ${classResponse.statusText}`);
            }

            const classDetails = await classResponse.json();
            console.log('Detalles de la clase:', classDetails);

            document.getElementById('modalClassName').textContent = classDetails.nombre_clase;
            document.getElementById('modalClassDescription').textContent = classDetails.descripcion || 'Sin descripción';
            document.getElementById('modalClassAcademicYear').textContent = classDetails.anio_academico;
            document.getElementById('modalClassEducationLevel').textContent = classDetails.nivel_educativo;

            const studentsList = document.getElementById('modalStudentsList');
            studentsList.innerHTML = '';

            if (classDetails.alumnos && classDetails.alumnos.length > 0) {
                classDetails.alumnos.forEach(alumno => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `
                        ${alumno.nombre} ${alumno.apellido} (${alumno.email})
                        <button class="btn btn-sm btn-danger remove-student-btn" data-student-id="${alumno.id_alumno}" data-class-id="${classId}">Eliminar</button>
                    `;
                    studentsList.appendChild(li);
                });
                document.querySelectorAll('.remove-student-btn').forEach(button => {
                    button.addEventListener('click', async (event) => {
                        const studentId = event.target.dataset.studentId;
                        const classIdToRemoveFrom = event.target.dataset.classId;
                        if (confirm('¿Estás seguro de que quieres eliminar a este alumno de la clase?')) {
                            await removeStudentFromClassFrontend(classIdToRemoveFrom, studentId, token);
                        }
                    });
                });

            } else {
                studentsList.innerHTML = '<li class="list-group-item text-muted">No hay alumnos inscritos en esta clase.</li>';
            }

        } catch (error) {
            console.error('Error al cargar detalles de la clase:', error);
            alert('No se pudieron cargar los detalles de la clase.');
        }
    }

    async function removeStudentFromClassFrontend(classId, studentId, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/clases/${classId}/alumnos/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                await showClassDetails(classId, token);
                const userResponse = await fetch(`${API_BASE_URL}/usuario`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userResponse.json();
                await cargarClasesDocente(token, userData.id_usuario);
            } else {
                alert(data.message || 'Error al eliminar el alumno.');
            }
        } catch (error) {
            console.error('Error al eliminar alumno desde el frontend:', error);
            alert('Error de conexión al eliminar alumno.');
        }
    }

    async function cargarAlumnosDeClases(token) {
        const selectClassToAddStudents = document.getElementById('selectClassToAddStudents');
        selectClassToAddStudents.innerHTML = '<option value="">Cargando clases...</option>';

        try {
            const userResponse = await fetch(`${API_BASE_URL}/usuario`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userResponse.json();
            const id_docente = userData.id_usuario;

            const response = await fetch(`${API_BASE_URL}/clases/docente/${id_docente}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Error al cargar clases para añadir alumnos: ${response.statusText}`);
            }

            const clases = await response.json();
            console.log('Clases para añadir alumnos:', clases);

            selectClassToAddStudents.innerHTML = '<option value="">Selecciona una clase</option>';
            clases.forEach(clase => {
                const option = document.createElement('option');
                option.value = clase.id_clase;
                option.textContent = `${clase.nombre_clase} (${clase.anio_academico})`;
                selectClassToAddStudents.appendChild(option);
            });

        } catch (error) {
            console.error('Error al cargar las clases en el select de añadir alumnos:', error);
            selectClassToAddStudents.innerHTML = '<option value="">Error al cargar clases</option>';
            alert('No se pudieron cargar las clases en el formulario de añadir alumnos.');
        }
    }

    const createClassForm = document.getElementById('createClassForm');
    if (createClassForm) {
        createClassForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const className = document.getElementById('className').value;
            const classDescription = document.getElementById('classDescription').value;
            const classAcademicYear = document.getElementById('classAcademicYear').value;
            const classEducationLevel = document.getElementById('classEducationLevel').value;
            const createClassMessage = document.getElementById('createClassMessage');

            try {
                const userResponse = await fetch(`${API_BASE_URL}/usuario`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userResponse.json();
                const id_docente = userData.id_usuario;

                const response = await fetch(`${API_BASE_URL}/clases`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nombre_clase: className,
                        descripcion: classDescription,
                        anio_academico: parseInt(classAcademicYear),
                        nivel_educativo: classEducationLevel,
                        id_docente: id_docente
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    createClassMessage.className = 'mt-3 alert alert-success';
                    createClassMessage.textContent = data.message;
                    createClassForm.reset();
                    await cargarClasesDocente(token, id_docente);
                    await cargarAlumnosDeClases(token);
                } else {
                    createClassMessage.className = 'mt-3 alert alert-danger';
                    createClassMessage.textContent = data.message || 'Error al crear la clase.';
                }
            } catch (error) {
                console.error('Error al enviar formulario de crear clase:', error);
                createClassMessage.className = 'mt-3 alert alert-danger';
                createClassMessage.textContent = 'Error de conexión al servidor.';
            }
        });
    }

    const addStudentsToClassForm = document.getElementById('addStudentsToClassForm');
    if (addStudentsToClassForm) {
        addStudentsToClassForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const classId = document.getElementById('selectClassToAddStudents').value;
            const studentEmails = document.getElementById('studentEmails').value.split('\n').map(email => email.trim()).filter(email => email !== '');
            const addStudentsMessage = document.getElementById('addStudentsMessage');

            if (!classId || studentEmails.length === 0) {
                addStudentsMessage.className = 'mt-3 alert alert-warning';
                addStudentsMessage.textContent = 'Por favor, selecciona una clase e introduce al menos un email de alumno.';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/clases/${classId}/alumnos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ emails: studentEmails })
                });

                const data = await response.json();

                if (response.ok) {
                    addStudentsMessage.className = 'mt-3 alert alert-success';
                    addStudentsMessage.textContent = data.message;
                    addStudentsToClassForm.reset();
                    const userResponse = await fetch(`${API_BASE_URL}/usuario`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const userData = await userResponse.json();
                    await cargarClasesDocente(token, userData.id_usuario);
                } else {
                    addStudentsMessage.className = 'mt-3 alert alert-danger';
                    addStudentsMessage.textContent = data.message || 'Error al añadir alumnos.';
                }
            } catch (error) {
                console.error('Error al enviar formulario de añadir alumnos:', error);
                addStudentsMessage.className = 'mt-3 alert alert-danger';
                addStudentsMessage.textContent = 'Error de conexión al servidor.';
            }
        });
    }
});