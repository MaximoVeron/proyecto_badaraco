document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3001/api'; // Asegúrate de que esta URL sea correcta

    const createClassForm = document.getElementById('createClassForm');
    const createClassMessage = document.getElementById('createClassMessage');

    const addStudentsToClassForm = document.getElementById('addStudentsToClassForm');
    const selectClassToAddStudents = document.getElementById('selectClassToAddStudents');
    const studentEmailsTextarea = document.getElementById('studentEmails');
    const addStudentsMessage = document.getElementById('addStudentsMessage');

    const myClassesList = document.getElementById('myClassesList');
    const loadingClassesMessage = document.getElementById('loadingClassesMessage');
    
    // Elementos del modal de detalles de clase
    const classDetailsModal = new bootstrap.Modal(document.getElementById('classDetailsModal'));
    const modalClassName = document.getElementById('modalClassName');
    const modalClassDescription = document.getElementById('modalClassDescription');
    const modalClassAcademicYear = document.getElementById('modalClassAcademicYear');
    const modalClassEducationLevel = document.getElementById('modalClassEducationLevel');
    const modalStudentsList = document.getElementById('modalStudentsList');


    // Función auxiliar para obtener el token JWT del localStorage
    const getToken = () => {
        return localStorage.getItem('token');
    };

    // Función para mostrar mensajes
    const showMessage = (element, message, type = 'success') => {
        element.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    };

    // --- LÓGICA PARA CREAR NUEVA CLASE ---
    if (createClassForm) {
        createClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre_clase = document.getElementById('className').value;
            const descripcion = document.getElementById('classDescription').value;
            const anio_academico = document.getElementById('classAcademicYear').value; // Nuevo campo
            const nivel_educativo = document.getElementById('classEducationLevel').value; // Nuevo campo

            const token = getToken();
            if (!token) {
                showMessage(createClassMessage, 'No autenticado. Por favor, inicia sesión.', 'danger');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/clases`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ nombre_clase, descripcion, anio_academico: parseInt(anio_academico), nivel_educativo })
                });

                const data = await response.json();
                if (response.ok) {
                    showMessage(createClassMessage, data.message, 'success');
                    createClassForm.reset(); // Limpiar formulario
                    loadTeacherClasses(); // Recargar la lista de clases y el selector de clases
                } else {
                    showMessage(createClassMessage, `Error: ${data.message || 'No se pudo crear la clase.'}`, 'danger');
                }
            } catch (error) {
                console.error('Error al crear clase:', error);
                showMessage(createClassMessage, 'Error de conexión al servidor.', 'danger');
            }
        });
    }

    // --- LÓGICA PARA AÑADIR ALUMNOS A UNA CLASE ---

    // Función para cargar las clases del docente en el <select>
    const loadClassesForStudentAddition = async () => {
        const token = getToken();
        if (!token) {
            selectClassToAddStudents.innerHTML = '<option value="">No autenticado para cargar clases.</option>';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/clases`, { // Ruta para obtener las clases del docente
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const classes = await response.json();

            selectClassToAddStudents.innerHTML = '<option value="">Selecciona una clase</option>';
            if (response.ok && classes.length > 0) {
                classes.forEach(clase => {
                    const option = document.createElement('option');
                    option.value = clase.id_clase; // Asegúrate de que el ID de la clase se llama id_clase en el backend
                    option.textContent = clase.nombre_clase;
                    selectClassToAddStudents.appendChild(option);
                });
            } else {
                selectClassToAddStudents.innerHTML = '<option value="">No hay clases disponibles.</option>';
            }
        } catch (error) {
            console.error('Error al cargar clases para añadir alumnos:', error);
            selectClassToAddStudents.innerHTML = '<option value="">Error al cargar clases.</option>';
        }
    };

    if (addStudentsToClassForm) {
        addStudentsToClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const classId = selectClassToAddStudents.value;
            const studentEmailsRaw = studentEmailsTextarea.value;
            const studentEmails = studentEmailsRaw.split('\n').map(email => email.trim()).filter(email => email !== '');

            const token = getToken();
            if (!token) {
                showMessage(addStudentsMessage, 'No autenticado. Por favor, inicia sesión.', 'danger');
                return;
            }
            if (!classId) {
                showMessage(addStudentsMessage, 'Por favor, selecciona una clase.', 'danger');
                return;
            }
            if (studentEmails.length === 0) {
                showMessage(addStudentsMessage, 'Introduce al menos un email de alumno.', 'danger');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/clases/${classId}/alumnos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ studentEmails })
                });

                const data = await response.json();
                if (response.ok) {
                    let successMsg = `Se añadieron ${data.insertedCount} alumnos.`;
                    if (data.failedCount > 0) {
                        successMsg += ` ${data.failedCount} alumnos no pudieron ser añadidos (ya inscritos o no encontrados): ${data.failedStudents.map(s => s.email).join(', ')}.`;
                    }
                    showMessage(addStudentsMessage, successMsg, 'success');
                    studentEmailsTextarea.value = ''; // Limpiar textarea
                } else {
                    showMessage(addStudentsMessage, `Error: ${data.message || 'No se pudieron añadir los alumnos.'}`, 'danger');
                }
            } catch (error) {
                console.error('Error al añadir alumnos:', error);
                showMessage(addStudentsMessage, 'Error de conexión al servidor.', 'danger');
            }
        });
    }

    // --- LÓGICA PARA MOSTRAR MIS CLASES EXISTENTES ---

    const loadTeacherClasses = async () => {
        const token = getToken();
        if (!token) {
            myClassesList.innerHTML = '<li class="list-group-item text-danger">No autenticado. Inicia sesión para ver tus clases.</li>';
            loadingClassesMessage.style.display = 'none';
            return;
        }

        try {
            loadingClassesMessage.style.display = 'block';
            const response = await fetch(`${API_URL}/clases`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const classes = await response.json();

            myClassesList.innerHTML = ''; // Limpiar lista
            loadingClassesMessage.style.display = 'none';

            if (response.ok && classes.length > 0) {
                classes.forEach(clase => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                    listItem.innerHTML = `
                        <div>
                            <h5>${clase.nombre_clase}</h5>
                            <p class="mb-1">${clase.descripcion || 'Sin descripción.'}</p>
                            <small class="text-muted">Año: ${clase.anio_academico} | Nivel: ${clase.nivel_educativo}</small>
                        </div>
                        <button class="btn btn-info btn-sm view-details-btn" data-class-id="${clase.id_clase}">
                            <i class="bi bi-info-circle me-1"></i> Ver Detalles
                        </button>
                    `;
                    myClassesList.appendChild(listItem);
                });

                // Añadir event listeners a los botones de "Ver Detalles"
                document.querySelectorAll('.view-details-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const classId = e.target.dataset.classId;
                        showClassDetails(classId);
                    });
                });

            } else {
                myClassesList.innerHTML = '<li class="list-group-item text-center text-muted">No tienes clases creadas aún.</li>';
            }
        } catch (error) {
            console.error('Error al cargar mis clases:', error);
            myClassesList.innerHTML = '<li class="list-group-item text-danger">Error al cargar tus clases.</li>';
            loadingClassesMessage.style.display = 'none';
        }
    };

    // Función para mostrar los detalles de una clase y sus alumnos en un modal
    const showClassDetails = async (classId) => {
        const token = getToken();
        if (!token) {
            alert('No autenticado. Por favor, inicia sesión.');
            return;
        }

        try {
            // Obtener detalles de la clase
            const classResponse = await fetch(`${API_URL}/clases/${classId}`, { // Asumo que tienes una ruta GET /clases/:id_clase para detalles
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classData = await classResponse.json();

            if (!classResponse.ok || classData.length === 0) {
                 alert('Error al obtener detalles de la clase.');
                 console.error('Error fetching class details:', classData.message);
                 return;
            }
            const clase = classData[0] || classData; // Asegúrate de manejar si devuelve un array o un objeto directo


            // Obtener alumnos de la clase
            const studentsResponse = await fetch(`${API_URL}/clases/${classId}/alumnos`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const students = await studentsResponse.json();

            modalClassName.textContent = clase.nombre_clase;
            modalClassDescription.textContent = clase.descripcion || 'Sin descripción.';
            modalClassAcademicYear.textContent = clase.anio_academico;
            modalClassEducationLevel.textContent = clase.nivel_educativo;

            modalStudentsList.innerHTML = '';
            if (studentsResponse.ok && students.length > 0) {
                students.forEach(student => {
                    const studentItem = document.createElement('li');
                    studentItem.classList.add('list-group-item');
                    studentItem.innerHTML = `
                        ${student.nombre} ${student.apellido} (<small>${student.email}</small>)
                        <button class="btn btn-danger btn-sm float-end remove-student-btn" data-class-id="${clase.id_clase}" data-student-id="${student.id_alumno}">
                            <i class="bi bi-x-circle"></i> Eliminar
                        </button>
                    `;
                    modalStudentsList.appendChild(studentItem);
                });
                 // Añadir event listeners a los botones de "Eliminar Alumno"
                document.querySelectorAll('.remove-student-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const classIdToRemove = e.target.dataset.classId;
                        const studentIdToRemove = e.target.dataset.studentId;
                        if (confirm('¿Estás seguro de que quieres eliminar a este alumno de la clase?')) {
                            await removeStudent(classIdToRemove, studentIdToRemove);
                            // Después de eliminar, recargar los detalles del modal
                            showClassDetails(classIdToRemove);
                        }
                    });
                });
            } else {
                modalStudentsList.innerHTML = '<li class="list-group-item text-muted">No hay alumnos inscritos en esta clase.</li>';
            }

            classDetailsModal.show(); // Muestra el modal
        } catch (error) {
            console.error('Error al cargar detalles de la clase o alumnos:', error);
            alert('Hubo un error al cargar los detalles de la clase.');
        }
    };

    // Función para eliminar un alumno de una clase
    const removeStudent = async (classId, studentId) => {
        const token = getToken();
        if (!token) {
            alert('No autenticado. Por favor, inicia sesión.');
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/clases/${classId}/alumnos/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                showMessage(myClassesList.parentElement.querySelector('.card-title'), data.message, 'success'); // Mostrar mensaje en la sección de mis clases
                // No recargar toda la lista, solo el modal o la sección de la clase si fuera necesario
                return true;
            } else {
                showMessage(myClassesList.parentElement.querySelector('.card-title'), `Error: ${data.message || 'No se pudo eliminar al alumno.'}`, 'danger');
                return false;
            }
        } catch (error) {
            console.error('Error al eliminar alumno:', error);
            showMessage(myClassesList.parentElement.querySelector('.card-title'), 'Error de conexión al servidor.', 'danger');
            return false;
        }
    };


    // --- Inicialización y Eventos de Tabs ---

    // Cargar clases cuando se muestra la pestaña "Añadir Alumnos"
    const addStudentsTabBtn = document.getElementById('add-students-tab');
    if (addStudentsTabBtn) {
        addStudentsTabBtn.addEventListener('shown.bs.tab', loadClassesForStudentAddition);
    }

    // Cargar clases cuando se muestra la pestaña "Mis Clases Existentes"
    const myClassesTabBtn = document.getElementById('my-classes-tab');
    if (myClassesTabBtn) {
        myClassesTabBtn.addEventListener('shown.bs.tab', loadTeacherClasses);
    }

    // Cargar clases iniciales si la pestaña "Mis Clases" está activa por defecto
    // (o si el usuario ya está en esa pestaña al cargar la página)
    if (document.getElementById('my-classes').classList.contains('active')) {
        loadTeacherClasses();
    }
    // Cargar clases para añadir alumnos si la pestaña "Añadir Alumnos" está activa por defecto
    if (document.getElementById('add-students').classList.contains('active')) {
        loadClassesForStudentAddition();
    }
});