import * as service from 'servicio.js';
import * as view from 'vista.js';

// Estado de la aplicación
let todosLosProductos = [];
let productosFiltrados = [];

// --- INICIO DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    inicializarPestanas();
    inicializarEventos();
    
    // Carga inicial de datos
    await cargarDatos();
});

async function cargarDatos() {
    view.mostrarCargando(true);
    try {
        const datos = await service.obtenerProductos();
        
        todosLosProductos = datos;
        productosFiltrados = [...todosLosProductos]; // Copia

        view.renderizarTabla(productosFiltrados);
        view.actualizarSelects(todosLosProductos);

    } catch (error) {
        alert("Error al cargar productos. Revisa la consola.");
        console.error(error);
        // Fallback visual si falla la carga (opcional)
        document.getElementById('tabla-body').innerHTML = '<tr><td colspan="8" style="color:red; text-align:center;">No se pudo conectar con la base de datos</td></tr>';
    } finally {
        view.mostrarCargando(false);
    }
}

// --- GESTIÓN DE EVENTOS ---
function inicializarEventos() {
    // Filtro Búsqueda
    document.getElementById('busqueda').addEventListener('input', (e) => {
        filtrarProductos(e.target.value, document.getElementById('categoriaSelect').value);
    });

    // Filtro Categoría
    document.getElementById('categoriaSelect').addEventListener('change', (e) => {
        filtrarProductos(document.getElementById('busqueda').value, e.target.value);
    });

    // Ordenamiento
    document.getElementById('ordenSelect').addEventListener('change', (e) => {
        ordenarProductos(e.target.value);
    });

    // Botón Recargar
    document.getElementById('btnAllProducts').addEventListener('click', cargarDatos);

    // Previsualización Imagen
    document.getElementById('imagenUrl').addEventListener('change', (e) => {
        view.actualizarImagenPreview(e.target.value);
    });
    
    // Formulario (Submit)
    document.getElementById('formCrear').addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Controlador: Aquí llamaríamos al servicio 'crearProducto' para enviar los datos al PHP.");
    });
}

// --- LÓGICA DE NEGOCIO ---
function filtrarProductos(texto, categoria) {
    texto = texto.toLowerCase();
    
    productosFiltrados = todosLosProductos.filter(p => {
        const coincideNombre = p.nombre.toLowerCase().includes(texto) || 
                              (p.codigoBarras && p.codigoBarras.includes(texto));
        
        const nombreCategoria = p.categoria ? p.categoria.nombre : '';
        const coincideCat = categoria === "" || nombreCategoria === categoria;
        
        return coincideNombre && coincideCat;
    });

    view.renderizarTabla(productosFiltrados);
}

function ordenarProductos(orden) {
    productosFiltrados.sort((a, b) => {
        return orden === 'asc' ? a.precio - b.precio : b.precio - a.precio;
    });
    view.renderizarTabla(productosFiltrados);
}

// --- UTILIDAD DE PESTAÑAS ---
function inicializarPestanas() {
    const botones = document.querySelectorAll('.tablinks');
    
    botones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 1. Ocultar todo
            document.querySelectorAll('.tabcontent').forEach(div => div.style.display = 'none');
            document.querySelectorAll('.tablinks').forEach(b => b.classList.remove('active'));

            // 2. Mostrar seleccionado
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
            e.target.classList.add('active');
        });
    });
}