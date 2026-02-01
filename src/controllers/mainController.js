import { authService } from '../services/authService.js';
// CONTROLADORES
import { inicializarAlmacen } from './almacenController.js';
import { inicializarDetalleProducto } from './detalleProductoController.js';
import { inicializarInventario } from './inventarioController.js';
import { inicializarProveedores } from './proveedoresController.js';
import { inicializarPedidos } from './pedidosController.js';
import { inicializarRecepcion } from './recepcionController.js';

// PROTECCIÓN DE SEGURIDAD
if (!authService.isAuthenticated()) {
    window.location.href = '../index.html';
}
else {
    document.addEventListener("DOMContentLoaded", () => {

        // --- REFERENCIAS GLOBALES ---
        const contenido = document.getElementById("contenido");
        const menuPrincipal = document.getElementById("menu-principal");
        const btnLogout = document.getElementById("btnLogout");
        const userSpan = document.getElementById('header-username');

        // --- MOSTRAR USUARIO ---
        const currentUser = authService.getCurrentUser();
        if (userSpan && currentUser) {
            userSpan.textContent = currentUser.nombre || currentUser.username;
        }

        // --- ACTIVAR LOGOUT ---
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                authService.logout();
            });
        }

        // --- FUNCIÓN PARA CARGAR PÁGINAS ---
        // Aceptamos un tercer parámetro 'tab' (pestaña)
        const cargarPagina = async (page, id = null, tab = null) => {
            try {
                const response = await fetch(`main-pages/${page}.html`);

                if (!response.ok) throw new Error(`No se pudo cargar la sección ${page}`);

                const html = await response.text();
                contenido.innerHTML = html;

                // Inicializadores específicos por página
                switch (page) {
                    case "articulos":

                        inicializarAlmacen(tab);
                        break;
                    case "detalle-producto":
                        inicializarDetalleProducto(id);
                        break;
                    case "inventario":
                        inicializarInventario();
                        break;
                    case "proveedores":
                        inicializarProveedores(tab);
                        break;
                    case "pedidos":
                        inicializarPedidos(tab);
                        break;
                    case "recepcion":
                        inicializarRecepcion(tab);
                        break

                }

                if (menuPrincipal) menuPrincipal.classList.remove("open");

                // --- ACCESIBILIDAD: GESTIÓN DE FOCO ---
                // Mover el foco al título principal de la nueva vista para anunciar el cambio de contexto
                const mainHeader = contenido.querySelector('h1, h2');
                if (mainHeader) {
                    mainHeader.setAttribute('tabindex', '-1');
                    mainHeader.focus();
                }

            } catch (error) {
                console.error(error);
                contenido.innerHTML = `<div style="padding:20px; color:red">Error cargando ${page}: ${error.message}</div>`;
            }
        };

        // --- DELEGACIÓN DE EVENTOS PARA EL MENÚ Y ACCESOS DIRECTOS ---
        document.addEventListener("click", (e) => {
            const elemento = e.target.closest("[data-page]");

            if (elemento) {
                e.preventDefault();
                const page = elemento.dataset.page;
                const id = elemento.dataset.id || null;

                // Capturamos el atributo data-tab
                const tab = elemento.dataset.tab || null;

                // Gestión de la clase 'active' visual en el menú
                if (elemento.closest(".menu")) {
                    document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));
                    const li = elemento.closest("li");
                    if (li) li.classList.add("active");
                }

                // Pasamos el tab a la función de carga
                cargarPagina(page, id, tab);
            }
        });

        // Manejo del botón menú hamburguesa
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle && menuPrincipal) {
            menuToggle.addEventListener('click', () => {
                menuPrincipal.classList.toggle('open');
            });
        }

        // --- CARGA INICIAL ---
        cargarPagina("inicio");
    });
}