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
export async function inicializarAlmacen(tabDestino = null) {
  
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
  
  // AQUÍ LLAMAMOS A LA FUNCIÓN UNICA DE PESTAÑAS
  setupTabs(tabDestino);
}

/* =========================================
   FUNCIONES MANEJADORAS DE EVENTOS
   ========================================= */

function onBuscar() {
  if (!inputBusqueda) return;
  const termino = inputBusqueda.value.trim();
  productosMostrados = buscarProducto(todosLosProductos, termino);
  renderizarTabla(productosMostrados, resumen);
}

function onOrdenar() {
  if (!selectOrden) return;
  const orden = selectOrden.value;
  productosMostrados = ordenarPorPrecio(productosMostrados, orden);
  renderizarTabla(productosMostrados, resumen);
}

function onShowAll() {
  productosMostrados = [...todosLosProductos];
  if (inputBusqueda) inputBusqueda.value = '';
  if (selectCategoria) selectCategoria.value = '';
  if (selectOrden) selectOrden.value = 'asc';
  renderizarTabla(productosMostrados, resumen);
}

function onComprobarStock() {
  productosMostrados = comprobarStockMinimo(todosLosProductos);
  renderizarTabla(productosMostrados, resumen);
}

function onCategoriaChange() {
  if (!selectCategoria) return;
  const categoriaSeleccionada = selectCategoria.value;

  if (categoriaSeleccionada === '') {
    productosMostrados = [...todosLosProductos];
  } else {
    productosMostrados = todosLosProductos.filter(p => {
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

// ESTA ES LA VERSIÓN BUENA Y ÚNICA DE SETUPTABS
function setupTabs(tabDestino) {
    // Seleccionamos todos los botones de las pestañas
    const tabButtons = document.querySelectorAll('.tablinks');
    
    // Asignamos los clicks
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Ocultar todos los contenidos
            const tabContents = document.querySelectorAll(".tabcontent");
            tabContents.forEach(content => content.style.display = "none");

            // Quitar clase active de todos los botones
            tabButtons.forEach(b => b.classList.remove("active"));

            // Mostrar el contenido seleccionado
            const targetId = e.target.dataset.target; 
            const targetDiv = document.getElementById(targetId);
            
            if (targetDiv) {
                targetDiv.style.display = "block";
            }

            e.currentTarget.classList.add("active");
        });
    });

    // LÓGICA DE APERTURA AUTOMÁTICA
    if (tabDestino) {
        // Buscamos el botón que tiene data-target igual al destino (ej: "nvoArticulo")
        const botonEspecifico = document.querySelector(`.tablinks[data-target="${tabDestino}"]`);
        
        if (botonEspecifico) {
            botonEspecifico.click(); // ¡Clic automático!
            return; // Salimos para que no se ejecute el default
        }
    }

    // Si no pidieron nada especial, abrimos la por defecto
    const defaultBtn = document.getElementById("defaultOpen");
    if (defaultBtn) {
        defaultBtn.click();
    }
}