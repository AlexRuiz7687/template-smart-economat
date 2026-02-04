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
  inputBusqueda = document.querySelector('#busquedaArticulos');
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
    if (selectCategoria) {
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
    { selector: '#busquedaArticulos', event: 'input', handler: onBuscar },
    { selector: '#busquedaArticulos', event: 'keyup', handler: (e) => { if (e.key === 'Enter') onBuscar(); } },
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


function setupTabs(tabDestino) {
  const tabButtons = document.querySelectorAll('.tablinks');
  const tabList = document.querySelector('.tab[role="tablist"]');

  // Función interna para activar una pestaña
  const activarPestana = (boton) => {
    if (!boton) return;

    // 1. Desactivar todas las pestañas (botones)
    tabButtons.forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("tabindex", "-1");
    });

    // 2. Ocultar todos los paneles
    const tabContents = document.querySelectorAll(".tabcontent");
    tabContents.forEach(content => {
      content.style.display = "none";
      content.setAttribute("hidden", ""); // Importante para Screen Readers
    });

    // 3. Activar el botón seleccionado
    boton.classList.add("active");
    boton.setAttribute("aria-selected", "true");
    boton.setAttribute("tabindex", "0");

    // 4. Mostrar el panel correspondiente
    const targetId = boton.dataset.target;
    const targetDiv = document.getElementById(targetId);

    if (targetDiv) {
      targetDiv.style.display = "block";
      targetDiv.removeAttribute("hidden");
    }
  };

  // Event Listeners para Clics
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activarPestana(e.currentTarget);
    });

    // Soporte para teclado (Enter / Espacio) si no es nativo, 
    // pero <button> lo maneja nativamente como click.
  });

  // Roving Tabindex (Flechas Izquierda/Derecha)
  if (tabList) {
    tabList.addEventListener('keydown', (e) => {
      // Solo nos interesa si el foco está en uno de los botones
      if (!e.target.classList.contains('tablinks')) return;

      const key = e.key;
      const buttonsArray = Array.from(tabButtons);
      const index = buttonsArray.indexOf(e.target);
      let nextIndex = null;

      if (key === 'ArrowRight') {
        nextIndex = (index + 1) % buttonsArray.length;
      } else if (key === 'ArrowLeft') {
        nextIndex = (index - 1 + buttonsArray.length) % buttonsArray.length;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        // Movemos el foco al siguiente botón
        const nextButton = buttonsArray[nextIndex];
        nextButton.focus();

        // Opcional: Activar automáticamente al mover el foco (Automatic Activation)
        // O dejarlo manual (usuario debe pulsar Enter).
        // Para mejor UX en pestañas simples, activamos automáticamente (si no carga datos pesados)
        // Pero como es un formulario/tabla, mejor manual para no perder contexto accidentalmente?
        // Vamos a dejarlo MANUAL ACTIVATION (solo focus) + Update tabindex

        // Aunque para Roving Tabindex estricto, el que tiene foco debe tener tabindex=0
        buttonsArray.forEach(b => b.setAttribute("tabindex", "-1"));
        nextButton.setAttribute("tabindex", "0");
      }
    });
  }

  // LÓGICA DE APERTURA INICIAL
  let btnInicial = null;

  if (tabDestino) {
    btnInicial = document.querySelector(`.tablinks[data-target="${tabDestino}"]`);
  }

  if (!btnInicial) {
    btnInicial = document.getElementById("tab-verArticulos");
  }

  // Si encontramos botón inicial, lo activamos
  if (btnInicial) {
    // Simulamos click O llamamos directo a activarPestana
    activarPestana(btnInicial);
  }
}