// URL base de la API del backend:
// Esta constante permite centralizar la URL del servidor backend tanto para realizar peticiones HTTP como para establecer la conexión WebSocket.

// Para desarrollo local, descomenta la siguiente línea y comenta la línea de producción.
// const URL_API = 'http://localhost:3000';

// Producción (Render): se utiliza cuando la aplicacion esta desplegada en la nube.
const URL_API = 'https://proyecto-web-prueba.onrender.com';

// Recibe eventos en tiempo real para sincronizar las tareas sin recargar la página.
const socket = io(URL_API);

// DOM Elements
// Obtienen referencias a todos los elementos necesarios del HTML para manipularlos desde JavaScript.
const tareaFormulario = document.getElementById('tareaFormulario');
const tituloInput = document.getElementById('titulo');
const descripcionInput = document.getElementById('descripcion');
const listaTareas = document.getElementById('listaTareas');
const btnCancelar = document.getElementById('btnCancelar');
const tituloFormulario = document.getElementById('tituloFormulario');
const mensajeError = document.getElementById('mensajeError');
const mensajeExito = document.getElementById('mensajeExito');

// Estado
// Variables auxiliares que indican si el usuario esta editando una tarea, y cual es su ID.
let editando = false;
let idActual = null;

// Mostrar mensaje de error en pantalla
// Muestra temporalmente un mensaje rojo si ocurre un error 
function mostrarMensajeError(texto) {
  mensajeError.textContent = texto;
  mensajeError.style.display = 'block';
  setTimeout(() => {
    mensajeError.style.display = 'none';
  }, 3000);
}

// Mostrar mensaje de éxito en pantalla
// Muestra temporalmente un mensaje verde cuando se realiza una accion exitosa
function mostrarMensajeExito(texto) {
  mensajeExito.textContent = texto;
  mensajeExito.style.display = 'block';
  setTimeout(() => {
    mensajeExito.style.display = 'none';
  }, 3000);
}

// Obtener tareas al cargar la pagina
// Cuando se carga la pagina, se hace una solicitud a la API para obtener todas las tareas guardadas.
document.addEventListener('DOMContentLoaded', cargarTareas);

// Escuchar envio de formulario
tareaFormulario.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = tituloInput.value.trim();
  const descripcion = descripcionInput.value.trim();

  // Validaciones
  if (titulo.length === 0) {
    mostrarMensajeError('El título no puede estar vacío');
    return;
  }

  if (titulo.length > 50) {
    mostrarMensajeError('El título no puede superar los 50 caracteres');
    return;
  }

  if (descripcion.length > 200) {
    mostrarMensajeError('La descripción no puede superar los 200 caracteres');
    return;
  }

  const tarea = { title: titulo, description: descripcion };

  if (editando) {
    await fetch(`${URL_API}/api/tareas/${idActual}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarea),
    });
    mostrarMensajeExito('Tarea actualizada correctamente.');
    tituloFormulario.textContent = 'Agregar Tarea';
    btnCancelar.style.display = 'none';
    editando = false;
    idActual = null;
  } else {
    await fetch(`${URL_API}/api/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tarea),
    });
    mostrarMensajeExito('Tarea creada correctamente.');
  }

  tareaFormulario.reset();
});

// Cancelar edición
btnCancelar.addEventListener('click', () => {
  editando = false;
  idActual = null;
  tituloFormulario.textContent = 'Agregar Tarea';
  btnCancelar.style.display = 'none';
  tareaFormulario.reset();
});

// Cargar tareas desde el backend
async function cargarTareas() {
  try {
    const res = await fetch(`${URL_API}/api/tareas`);
    const tareas = await res.json();
    listaTareas.innerHTML = '';
    tareas.forEach(agregarTareaDOM);
  } catch (error) {
    console.error('Error al cargar tareas:', error);
  }
}

// Agregar una tarea al DOM
// Crea visualmente una tarea dentro de la lista HTML y añade los botones de editar y eliminar
function agregarTareaDOM(tarea) {
  const li = document.createElement('li');
  li.className = 'tarea-item';
  li.setAttribute('data-id', tarea._id);
  li.innerHTML = `
    <div>
      <h3>${tarea.title}</h3>
      <p>${tarea.description}</p>
    </div>
    <div>
      <button class="btn-editar">Editar</button>
      <button class="btn-eliminar">Eliminar</button>
    </div>
  `;

  // Botón editar
  li.querySelector('.btn-editar').addEventListener('click', () => {
    editando = true;
    idActual = tarea._id;
    tituloFormulario.textContent = 'Editar Tarea';
    btnCancelar.style.display = 'inline-block';
    tituloInput.value = tarea.title;
    descripcionInput.value = tarea.description;
  });

  // Botón eliminar
  li.querySelector('.btn-eliminar').addEventListener('click', async () => {
    await fetch(`${URL_API}/api/tareas/${tarea._id}`, {
      method: 'DELETE',
    });
    mostrarMensajeExito('Tarea eliminada correctamente.');
  });

  listaTareas.appendChild(li);
}

// Actualizar una tarea en el DOM
function actualizarTareaEnDOM(tarea) {
  const item = document.querySelector(`li[data-id="${tarea._id}"]`);
  if (item) {
    item.querySelector('h3').textContent = tarea.title;
    item.querySelector('p').textContent = tarea.description;
  }
}

// Eliminar una tarea del DOM
function eliminarTareaDelDOM(tarea) {
  const item = document.querySelector(`li[data-id="${tarea._id}"]`);
  if (item) {
    item.remove();
  }
}

// WebSocket: escuchar eventos desde el backend
socket.on('task-created', (tarea) => {
  agregarTareaDOM(tarea);
});
socket.on('task-updated', (tarea) => {
  actualizarTareaEnDOM(tarea);
});
socket.on('task-deleted', (tarea) => {
  eliminarTareaDelDOM(tarea);
});
