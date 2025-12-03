// src/controllers/almacenController.js

import { renderizarTabla, cargarCategorias } from '../view/almacenView.js';
import { buscarProducto, ordenarPorPrecio, comprobarStockMinimo } from '../utils/funciones.js';
import { getProductos, getCategorias } from '../services/economatoService.js';

// IMPORTACIÓN DEL CONTROLADOR DE NUEVO ARTÍCULO
import { inicializarNuevoArticulo } from './nuevoArticuloController.js';

let tabla, resumen, inputBusqueda, selectCategoria, selectOrden;

let todosLosProductos = [];
let productosMostrados = [];

// FUNCIÓN INICIALIZAR
export async function inicializarAlmacen() {
  
  // Búsqueda de elementos del DOM
  tabla = document.querySelector('#tablaProductos tbody');
  resumen = document.querySelector('#resumen');
  inputBusqueda = document.querySelector('#busqueda');
  selectCategoria = document.querySelector('#categoriaSelect');
  selectOrden = document.querySelector('#ordenSelect');

  if (!tabla) {
      console.error("No se encontró la tabla de productos en el HTML");
      return;
  }

  // Carga de datos
  try {
      todosLosProductos = await getProductos();
      productosMostrados = [...todosLosProductos];
      const categorias = await getCategorias();

      // Renderizar tabla inicial
      renderizarTabla(productosMostrados, resumen);

      // Cargar categorías en el filtro de búsqueda
      if(selectCategoria) {
          selectCategoria.innerHTML = '<option value="">-- Categoría --</option>';
          categorias.forEach(c => {
              const opt = document.createElement('option');
              
              const nombreCat = c.nombre || c; 
              opt.value = nombreCat;
              opt.textContent = nombreCat;
              selectCategoria.appendChild(opt);
          });
      }

      // INICIALIZAR EL FORMULARIO DE REGISTRO
      await inicializarNuevoArticulo();

  } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
  }

  // Configuración de Eventos
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

/* =========================================
   FUNCIONES MANEJADORAS DE EVENTOS
   ========================================= */

function onBuscar() {
  if (!inputBusqueda) return;
  const termino = inputBusqueda.value.trim();
  // Usamos la utilidad importada de funciones.js
  productosMostrados = buscarProducto(todosLosProductos, termino);
  renderizarTabla(productosMostrados, resumen);
}

function onOrdenar() {
  if (!selectOrden) return;
  const orden = selectOrden.value;
  // Usamos la utilidad importada de funciones.js
  productosMostrados = ordenarPorPrecio(productosMostrados, orden);
  renderizarTabla(productosMostrados, resumen);
}

function onShowAll() {
  // Reseteamos filtros
  productosMostrados = [...todosLosProductos];
  if (inputBusqueda) inputBusqueda.value = '';
  if (selectCategoria) selectCategoria.value = '';
  if (selectOrden) selectOrden.value = 'asc';
  renderizarTabla(productosMostrados, resumen);
}

function onComprobarStock() {
  // Usamos la utilidad importada de funciones.js
  productosMostrados = comprobarStockMinimo(todosLosProductos);
  renderizarTabla(productosMostrados, resumen);
}

function onCategoriaChange() {
  if (!selectCategoria) return;
  const categoriaSeleccionada = selectCategoria.value;

  if (categoriaSeleccionada === '') {
    // Si no hay selección, mostramos todo
    productosMostrados = [...todosLosProductos];
  } else {
    // Filtramos
    productosMostrados = todosLosProductos.filter(p => {
        // Verificación si categoria es objeto o string
        const catNombre = (typeof p.categoria === 'object' && p.categoria !== null) 
                          ? p.categoria.nombre 
                          : p.categoria;
        return catNombre === categoriaSeleccionada;
    });
  }
  renderizarTabla(productosMostrados, resumen);
}

/* =========================================
   UTILIDADES INTERNAS
   ========================================= */

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
            e.preventDefault();

            // Ocultar todos los contenidos
            const tabContents = document.querySelectorAll(".tabcontent");
            tabContents.forEach(content => content.style.display = "none");

            // Quitar clase active de todos los botones
            tabButtons.forEach(b => b.classList.remove("active"));

            // Mostrar el contenido seleccionado (usando el data-target del botón)
            const targetId = e.target.dataset.target; 
            const targetDiv = document.getElementById(targetId);
            
            if (targetDiv) {
                targetDiv.style.display = "block";
            }

            // 4. Activar el botón actual
            e.currentTarget.classList.add("active");
        });
    });

    // Apertura de tab por defecto
    const defaultBtn = document.getElementById("defaultOpen");
    if (defaultBtn) {
        defaultBtn.click();
    }
}