/* src/controllers/inventarioController.js */

import { getProductos, getCategorias, updateArticulo } from '../services/economatoService.js';

// Variables de estado local
let datosInventario = [];
let datosFiltrados = [];

// Referencias a los elementos del DOM
const domInventario = {
    // Pestaña Ver Stock
    inputBusqueda: null,
    selectCategoria: null,
    selectOrden: null,
    btnLimpiar: null,
    tbodyValorado: null,

    // Pestaña Consolidar
    inputConsolidar: null,
    selectOrdenConsolidar: null,
    tbodyConsolidar: null,

    // Comunes
    tfootResumen: null
};

/* =========================================
   INICIALIZACIÓN
   ========================================= */
export async function inicializarInventario() {
    // Captura de elementos

    // -- Pestaña Ver Stock --
    domInventario.inputBusqueda = document.getElementById('busquedaInv');
    domInventario.selectCategoria = document.getElementById('categoriaInvSelect');
    domInventario.selectOrden = document.getElementById('ordenInvSelect');
    domInventario.btnLimpiar = document.getElementById('btnLimpiarInv');
    domInventario.tbodyValorado = document.getElementById('tabla-valorada-body');
    domInventario.tfootResumen = document.getElementById('resumen-inventario');

    // -- Pestaña Consolidar --
    domInventario.inputConsolidar = document.getElementById('busquedaConsolidar');
    domInventario.selectOrdenConsolidar = document.getElementById('ordenConsolidar');
    domInventario.tbodyConsolidar = document.getElementById('tabla-consolidar-body');

    // Validación de seguridad
    if (!domInventario.tbodyValorado) return;

    try {
        // Carga de datos
        datosInventario = await getProductos();
        datosFiltrados = [...datosInventario];

        const categorias = await getCategorias();
        cargarSelectCategorias(categorias);

        // Renderizado inicial
        renderizarTablaValorada(datosFiltrados);

        // Configuración de eventos
        configurarEventos();
        setupTabs();

    } catch (error) {
        console.error("Error al cargar el inventario:", error);
    }
}

function configurarEventos() {
    // --- Eventos Pestaña Ver Stock ---
    if (domInventario.inputBusqueda) domInventario.inputBusqueda.addEventListener('input', aplicarFiltros);
    if (domInventario.selectCategoria) domInventario.selectCategoria.addEventListener('change', aplicarFiltros);
    if (domInventario.selectOrden) domInventario.selectOrden.addEventListener('change', aplicarFiltros);

    if (domInventario.btnLimpiar) {
        domInventario.btnLimpiar.addEventListener('click', () => {
            domInventario.inputBusqueda.value = '';
            domInventario.selectCategoria.value = '';
            domInventario.selectOrden.value = 'asc'; // Reseteo por defecto
            aplicarFiltros();
        });
    }

    // --- Eventos Pestaña Consolidar ---
    if (domInventario.inputConsolidar) {
        domInventario.inputConsolidar.addEventListener('input', aplicarFiltrosConsolidacion);
    }
    if (domInventario.selectOrdenConsolidar) {
        domInventario.selectOrdenConsolidar.addEventListener('change', aplicarFiltrosConsolidacion);
    }
}

/* =========================================
   LÓGICA DE PESTAÑAS
   ========================================= */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tablinks');
    const tabContents = document.querySelectorAll('.tabcontent');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI: Cambio visual
            tabContents.forEach(content => content.style.display = 'none');
            tabButtons.forEach(b => b.classList.remove('active'));

            const targetId = btn.dataset.target;
            const targetDiv = document.getElementById(targetId);
            if (targetDiv) targetDiv.style.display = 'block';

            btn.classList.add('active');

            // LÓGICA: Al cambiar, aplicamos los filtros de esa pestaña para refrescar datos
            if (targetId === 'consolidarStock') {
                aplicarFiltrosConsolidacion();
            } else {
                aplicarFiltros();
            }
        });
    });
}

/* =========================================
   FILTRADO PARA CONSOLIDACIÓN
   ========================================= */
function aplicarFiltrosConsolidacion() {
    let resultado = [...datosInventario];

    // 1. Filtro Texto (Nombre o Código)
    if (domInventario.inputConsolidar && domInventario.inputConsolidar.value.trim() !== '') {
        const termino = domInventario.inputConsolidar.value.toLowerCase().trim();
        resultado = resultado.filter(p => {
            const nombre = p.nombre ? p.nombre.toLowerCase() : '';
            const codigo = p.codigo ? p.codigo.toString().toLowerCase() : '';
            return nombre.includes(termino) || codigo.includes(termino);
        });
    }

    // 2. Ordenar (Solo Stock Asc/Desc)
    if (domInventario.selectOrdenConsolidar) {
        const criterio = domInventario.selectOrdenConsolidar.value;
        resultado.sort((a, b) => {
            const stockA = parseInt(a.stock) || 0;
            const stockB = parseInt(b.stock) || 0;

            if (criterio === 'asc') return stockA - stockB;
            if (criterio === 'desc') return stockB - stockA;
            return 0;
        });
    }

    renderizarTablaConsolidacion(resultado);
}


/* =========================================
   RENDERIZADO DE TABLAS
   ========================================= */

// TABLA 1: VER STOCK VALORADO
function renderizarTablaValorada(productos) {
    if (!domInventario.tbodyValorado) return;

    domInventario.tbodyValorado.innerHTML = '';
    let totalValoradoGlobal = 0;

    if (productos.length === 0) {
        domInventario.tbodyValorado.innerHTML = '<tr><td colspan="5" style="text-align:center">No hay productos</td></tr>';
        return;
    }

    productos.forEach(producto => {
        const stock = parseInt(producto.stock) || 0;
        const precio = parseFloat(producto.precio) || 0;
        const totalFila = stock * precio;

        totalValoradoGlobal += totalFila;

        const nombreCat = (typeof producto.categoria === 'object' && producto.categoria !== null)
            ? producto.categoria.nombre
            : (producto.categoria || 'General');

        // Formatear código para lectura dígito a dígito (ej: "1, 2, 3" para forzar pausa)
        const rawCode = (producto.codigo || producto.id).toString();
        const codeAudible = rawCode.split('').join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="sr-only">Código: ${codeAudible}</span>
                <span aria-hidden="true">${rawCode}</span>
            </td>
            <td style="font-weight: bold;"><span class="sr-only">Producto: </span>${producto.nombre}</td>
            <td><span class="sr-only">Categoría: </span>${nombreCat}</td>
            <td style="${stock < producto.stockMinimo ? 'color:var(--primary-color); font-weight:bold;' : ''}">
                <span class="sr-only">Stock: </span>${stock}
            </td>
            <td><span class="sr-only">Valor Total: </span>${totalFila.toFixed(2)} €</td>
        `;
        domInventario.tbodyValorado.appendChild(tr);
    });

    if (domInventario.tfootResumen) {
        domInventario.tfootResumen.textContent = `Valor Total del Inventario: ${totalValoradoGlobal.toFixed(2)} €`;
    }
}

// TABLA 2: CONSOLIDAR STOCK
function renderizarTablaConsolidacion(productos) {
    if (!domInventario.tbodyConsolidar) return;

    domInventario.tbodyConsolidar.innerHTML = '';

    if (productos.length === 0) {
        domInventario.tbodyConsolidar.innerHTML = '<tr><td colspan="4" style="text-align:center">No se encontraron productos</td></tr>';
        return;
    }

    productos.forEach(producto => {
        const stockActual = parseInt(producto.stock) || 0;

        // Formatear código para lectura dígito a dígito
        const rawCode = (producto.codigo || producto.id).toString();
        const codeAudible = rawCode.split('').join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="sr-only">Código: ${codeAudible}</span>
                <span aria-hidden="true">${rawCode}</span>
            </td>
            <td><span class="sr-only">Producto: </span>${producto.nombre}</td>
            <td>
                <span class="sr-only">Stock Actual: </span>
                <input type="number" 
                       id="input-stock-${producto.id}" 
                       value="${stockActual}" 
                       class="form-control input-consolidar" 
                       data-id="${producto.id}"
                       style="width: 80px; text-align: center;"
                       aria-label="Stock actual para ${producto.nombre} es de ${stockActual}, ingresar Stock real">
            </td> 
            <td>
                <button type="button" class="btn-guardar-stock" data-id="${producto.id}">
                    Guardar
                </button>
            </td>
        `;
        domInventario.tbodyConsolidar.appendChild(tr);
    });

    // Eventos de botones e inputs
    document.querySelectorAll('.btn-guardar-stock').forEach(btn => {
        btn.addEventListener('click', handleGuardarStock);
    });

    document.querySelectorAll('.input-consolidar').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const id = e.target.dataset.id;
                const btn = document.querySelector(`.btn-guardar-stock[data-id="${id}"]`);
                if (btn) btn.click();
            }
        });
    });
}

/* =========================================
   LÓGICA DE ACTUALIZACIÓN (Guardar)
   ========================================= */
async function handleGuardarStock(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.target;
    const id = btn.dataset.id;
    const input = document.getElementById(`input-stock-${id}`);
    const nuevoStock = parseInt(input.value);

    if (isNaN(nuevoStock) || nuevoStock < 0) {
        alert("Stock inválido");
        return;
    }

    const textoOriginal = btn.textContent;
    btn.textContent = "...";
    btn.disabled = true;

    try {
        const productoOriginal = datosInventario.find(p => p.id == id);
        if (!productoOriginal) throw new Error("Producto no encontrado");

        const datosAEnviar = { stock: nuevoStock };

        await updateArticulo(productoOriginal.productoId || productoOriginal.id, datosAEnviar);

        productoOriginal.stock = nuevoStock;

        btn.textContent = "✔ OK";
        btn.style.backgroundColor = "#155724";

        setTimeout(() => {
            btn.textContent = "Guardar";
            btn.style.backgroundColor = ""; // Volver al CSS original
            btn.disabled = false;
        }, 1500);

    } catch (error) {
        console.error(error);
        btn.textContent = "Error";
        btn.style.backgroundColor = "red";
        setTimeout(() => {
            btn.textContent = "Guardar";
            btn.style.backgroundColor = "";
            btn.disabled = false;
        }, 2000);
    }
}

/* =========================================
   UTILIDADES (Filtros Tabla 1 - Ver Stock)
   ========================================= */
function cargarSelectCategorias(categorias) {
    if (!domInventario.selectCategoria) return;
    while (domInventario.selectCategoria.options.length > 1) {
        domInventario.selectCategoria.remove(1);
    }
    categorias.forEach(cat => {
        const option = document.createElement('option');
        const nombreCat = (typeof cat === 'object' && cat !== null) ? cat.nombre : cat;
        option.value = nombreCat;
        option.textContent = nombreCat;
        domInventario.selectCategoria.appendChild(option);
    });
}


function aplicarFiltros() {
    let resultado = [...datosInventario];

    // Búsqueda por Nombre O Código
    if (domInventario.inputBusqueda && domInventario.inputBusqueda.value.trim() !== '') {
        const termino = domInventario.inputBusqueda.value.toLowerCase().trim();
        resultado = resultado.filter(producto => {
            const nombre = producto.nombre ? producto.nombre.toLowerCase() : '';
            const codigo = producto.codigo ? producto.codigo.toString().toLowerCase() : '';

            // Retorna TRUE si coincide nombre O código
            return nombre.includes(termino) || codigo.includes(termino);
        });
    }

    // Filtro por Categoría
    if (domInventario.selectCategoria && domInventario.selectCategoria.value !== '') {
        const catSeleccionada = domInventario.selectCategoria.value;
        resultado = resultado.filter(producto => {
            const nombreCat = (typeof producto.categoria === 'object' && producto.categoria !== null)
                ? producto.categoria.nombre
                : producto.categoria;
            return nombreCat === catSeleccionada;
        });
    }

    // Lógica de Ordenamiento

    if (domInventario.selectOrden) {
        const criterio = domInventario.selectOrden.value;
        resultado.sort((a, b) => {
            const precioA = parseFloat(a.precio) || 0;
            const precioB = parseFloat(b.precio) || 0;
            const stockA = parseInt(a.stock) || 0;
            const stockB = parseInt(b.stock) || 0;

            switch (criterio) {
                case 'asc': return precioA - precioB;        // Precio Menor a Mayor
                case 'desc': return precioB - precioA;       // Precio Mayor a Menor
                case 'stock-asc': return stockA - stockB;    // Stock Menor a Mayor
                case 'stock-desc': return stockB - stockA;   // Stock Mayor a Menor
                default: return 0;
            }
        });
    }

    datosFiltrados = resultado;
    renderizarTablaValorada(datosFiltrados);
}