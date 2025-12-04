import { getProductos, getCategorias } from '../services/economatoService.js';

// Variables de estado local
let datosInventario = [];
let datosFiltrados = [];

// Referencias a los elementos del DOM
const domInventario = {
    inputBusqueda: null,
    selectCategoria: null,
    selectOrden: null,
    btnLimpiar: null,
    tbody: null,
    tfootResumen: null
};

export async function inicializarInventario() {
    // Captura de elementos
    domInventario.inputBusqueda = document.getElementById('busquedaInv');
    domInventario.selectCategoria = document.getElementById('categoriaInvSelect');
    domInventario.selectOrden = document.getElementById('ordenInvSelect');
    domInventario.btnLimpiar = document.getElementById('btnLimpiarInv');
    domInventario.tbody = document.getElementById('tabla-valorada-body');
    domInventario.tfootResumen = document.getElementById('resumen-inventario');

    // Validación de seguridad
    if (!domInventario.tbody) return;

    try {
        // Carga de datos
        datosInventario = await getProductos();
        datosFiltrados = [...datosInventario];
        
        const categorias = await getCategorias();
        cargarSelectCategorias(categorias);

        // Renderizado inicial
        renderizarTabla(datosFiltrados);

        // Configuración de eventos
        configurarEventos();

    } catch (error) {
        console.error("Error al cargar el inventario:", error);
    }
}

function configurarEventos() {
    // Evento de entrada de texto
    if (domInventario.inputBusqueda) {
        domInventario.inputBusqueda.addEventListener('input', aplicarFiltros);
    }

    // Eventos de cambio en selectores
    if (domInventario.selectCategoria) {
        domInventario.selectCategoria.addEventListener('change', aplicarFiltros);
    }

    if (domInventario.selectOrden) {
        domInventario.selectOrden.addEventListener('change', aplicarFiltros);
    }

    // Botón de limpiar filtros
    if (domInventario.btnLimpiar) {
        domInventario.btnLimpiar.addEventListener('click', () => {
            domInventario.inputBusqueda.value = '';
            domInventario.selectCategoria.value = '';
            domInventario.selectOrden.value = 'asc';
            aplicarFiltros(); // Esto resetea la vista a los datos originales
        });
    }
}

function cargarSelectCategorias(categorias) {
    if (!domInventario.selectCategoria) return;

    // Mantiene la primera opción (-- Todas las Categorías --) y elimina el resto
    while (domInventario.selectCategoria.options.length > 1) {
        domInventario.selectCategoria.remove(1);
    }

    categorias.forEach(cat => {
        const option = document.createElement('option');
        // Manejo robusto: verifica si la categoría es un objeto o un string plano
        const nombreCat = (typeof cat === 'object' && cat !== null) ? cat.nombre : cat;
        
        option.value = nombreCat;
        option.textContent = nombreCat;
        domInventario.selectCategoria.appendChild(option);
    });
}

function aplicarFiltros() {
    // Reiniciamos con todos los datos
    let resultado = [...datosInventario];

    // Filtro de búsqueda (Nombre)
    if (domInventario.inputBusqueda && domInventario.inputBusqueda.value.trim() !== '') {
        const termino = domInventario.inputBusqueda.value.toLowerCase().trim();
        resultado = resultado.filter(producto => 
            producto.nombre.toLowerCase().includes(termino)
        );
    }

    // Filtro de Categoría
    if (domInventario.selectCategoria && domInventario.selectCategoria.value !== '') {
        const catSeleccionada = domInventario.selectCategoria.value;
        resultado = resultado.filter(producto => {
            const nombreCat = (typeof producto.categoria === 'object' && producto.categoria !== null) 
                              ? producto.categoria.nombre 
                              : producto.categoria;
            return nombreCat === catSeleccionada;
        });
    }

    // Ordenamiento (Precio y Stock)
    if (domInventario.selectOrden) {
        const criterio = domInventario.selectOrden.value;
        
        resultado.sort((a, b) => {
            const precioA = parseFloat(a.precio) || 0;
            const precioB = parseFloat(b.precio) || 0;
            const stockA = parseInt(a.stock) || 0;
            const stockB = parseInt(b.stock) || 0;

            switch (criterio) {
                case 'asc': return precioA - precioB;
                case 'desc': return precioB - precioA;
                case 'stock-asc': return stockA - stockB;
                case 'stock-desc': return stockB - stockA;
                default: return 0;
            }
        });
    }

    // Actualizacón del estado global filtrado y renderizamos
    datosFiltrados = resultado;
    renderizarTabla(datosFiltrados);
}

function renderizarTabla(productos) {
    if (!domInventario.tbody) return;

    domInventario.tbody.innerHTML = '';
    let totalValoradoGlobal = 0;

    productos.forEach(producto => {
        const stock = parseInt(producto.stock) || 0;
        const precio = parseFloat(producto.precio) || 0;
        const totalFila = stock * precio;
        
        // Sumar al total global
        totalValoradoGlobal += totalFila;

        // Obtener nombre de categoría
        const nombreCat = (typeof producto.categoria === 'object' && producto.categoria !== null) 
                          ? producto.categoria.nombre 
                          : (producto.categoria || 'Sin Categoría');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${producto.id}</td>
            <td style="font-weight: bold;">${producto.nombre}</td>
            <td>${nombreCat}</td>
            <td>${stock}</td>
            <td>${totalFila.toFixed(2)} €</td>
        `;
        domInventario.tbody.appendChild(tr);
    });

    // Actualizar el pie de tabla con el total
    if (domInventario.tfootResumen) {
        domInventario.tfootResumen.textContent = `Valor Total del Inventario: ${totalValoradoGlobal.toFixed(2)} €`;
    }
}