import { renderizarTabla, cargarCategorias } from '../view/almacenView.js';
import { buscarProducto, ordenarPorPrecio, comprobarStockMinimo } from '../utils/funciones.js';
import { getProductos, getCategorias } from '../services/economatoService.js';

const tabla = document.querySelector('#tablaProductos tbody');
const resumen = document.querySelector('#resumen');
const inputBusqueda = document.querySelector('#busqueda');
const selectCategoria = document.querySelector('#categoriaSelect');
const selectOrden = document.querySelector('#ordenSelect');

let todosLosProductos = [];
let productosMostrados = [];

async function inicializar() {
  todosLosProductos = await getProductos();
  productosMostrados = [...todosLosProductos];
  const categorias = await getCategorias();

  renderizarTabla(productosMostrados, resumen);
  cargarCategorias(categorias);
  bindEvents(eventMap);
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

inicializar();



