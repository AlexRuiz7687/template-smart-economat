import { renderizarTabla, cargarCategorias } from '../view/almacenView.js';
import { buscarProducto, ordenarPorPrecio, comprobarStockMinimo } from '../utils/funciones.js';
import { getProductos, getCategorias } from '../services/economatoService.js';

let tabla, resumen, inputBusqueda, selectCategoria, selectOrden;

let todosLosProductos = [];
let productosMostrados = [];

// 2. Exportamos la función para poder llamarla desde main.js
export async function inicializarAlmacen() {
  
  // 3. AHORA que el HTML ya existe, buscamos los elementos
  tabla = document.querySelector('#tablaProductos tbody');
  resumen = document.querySelector('#resumen');
  inputBusqueda = document.querySelector('#busqueda');
  selectCategoria = document.querySelector('#categoriaSelect');
  selectOrden = document.querySelector('#ordenSelect');

  if (!tabla) {
      console.error("No se encontró la tabla de productos en el HTML");
      return;
  }

  todosLosProductos = await getProductos();
  productosMostrados = [...todosLosProductos];
  const categorias = await getCategorias();

  renderizarTabla(productosMostrados, resumen);
  cargarCategorias(categorias);

  const eventMap = [
    { selector: '#btnBuscar', event: 'click', handler: onBuscar },
    { selector: '#ordenSelect', event: 'change', handler: onOrdenar },
    { selector: '#btnAllProducts', event: 'click', handler: onShowAll },
    { selector: '#btnStock', event: 'click', handler: onComprobarStock },
    { selector: '#categoriaSelect', event: 'change', handler: onCategoriaChange }
  ];

  bindEvents(eventMap);
  setupTabs();
}

const eventMap = [
  { selector: '#btnBuscar', event: 'click', handler: onBuscar },
  { selector: '#ordenSelect', event: 'change', handler: onOrdenar },
  { selector: '#btnAllProducts', event: 'click', handler: onShowAll },
  { selector: '#btnStock', event: 'click', handler: onComprobarStock },
  { selector: '#categoriaSelect', event: 'change', handler: onCategoriaChange }
];

function onBuscar() {
  const termino = inputBusqueda.value.trim();
  productosMostrados = buscarProducto(todosLosProductos, termino);
  renderizarTabla(productosMostrados, resumen);
}

function onOrdenar() {
  const orden = selectOrden.value;
  productosMostrados = ordenarPorPrecio(productosMostrados, orden);
  renderizarTabla(productosMostrados, resumen);
}

function onShowAll() {
  productosMostrados = [...todosLosProductos];
  inputBusqueda.value = '';
  selectCategoria.value = '';
  renderizarTabla(productosMostrados, resumen);
}

function onComprobarStock() {
  productosMostrados = comprobarStockMinimo(todosLosProductos);
  renderizarTabla(productosMostrados, resumen);
}

function onCategoriaChange() {
  const categoriaSeleccionada = selectCategoria.value;
  if (categoriaSeleccionada === '') {
    renderizarTabla(todosLosProductos, resumen);
  } else {
    const filtrados = todosLosProductos.filter(p => p.categoria.nombre === categoriaSeleccionada);
    renderizarTabla(filtrados, resumen);
  }
}

function bindEvents(events) {
  for (const { selector, event, handler, option } of events) {
    const el = document.querySelector(selector);
    if (el) el.addEventListener(event, handler, option);
  }
}

function setupTabs() {
    // Seleccionamos todos los botones de las pestañas
    const tabButtons = document.querySelectorAll('.tablinks');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 1. Ocultar todos los contenidos
            const tabContents = document.querySelectorAll(".tabcontent");
            tabContents.forEach(content => content.style.display = "none");

            // 2. Quitar clase active de todos los botones
            tabButtons.forEach(b => b.classList.remove("active"));

            // 3. Mostrar el contenido seleccionado (usando el data-target del botón)
            const targetId = e.target.dataset.target; // ej: 'verArticulos'
            document.getElementById(targetId).style.display = "block";

            // 4. Activar el botón actual
            e.currentTarget.classList.add("active");
        });
    });

    // Simular un click en el botón por defecto para que se abra al cargar
    const defaultBtn = document.getElementById("defaultOpen");
    if (defaultBtn) {
        defaultBtn.click();
    }
}



