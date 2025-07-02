document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  const res = await fetch('/api/padre/perfil', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = await res.json();

  document.getElementById('nombre').textContent = data.nombre;
  document.getElementById('email').textContent = data.email;

  const lista = document.getElementById('lista-hijos');
  lista.innerHTML = data.hijos.map(h =>
    `<li>${h.nombre_estudiante} - ${h.grado}</li>`
  ).join('');
});
document.getElementById('form-perfil').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const telefono = document.getElementById('telefono').value;
  const relacion = document.getElementById('relacion').value;

  const res = await fetch('/api/padre/perfil', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ telefono, relacion })
  });

  const data = await res.json();
  alert(data.message);
});

document.getElementById('form-vincular').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const codigo = document.getElementById('codigo').value;

  const res = await fetch('/api/padre/vincular', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ codigo })
  });

  const data = await res.json();
  alert(data.message);
  location.reload(); // recargar lista de hijos
});

