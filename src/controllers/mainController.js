// src/controllers/mainController.js
import { authService } from '../services/authService.js';
import { inicializarAlmacen } from './almacenController.js';
import { inicializarDetalleProducto } from './detalleProductoController.js';
import { inicializarInventario } from './inventarioController.js';
import { inicializarProveedores } from './proveedoresController.js';
import { inicializarPedidos } from './pedidosController.js'; // <--- IMPORTAR

// PROTECCIÓN DE SEGURIDAD
if (!authService.isAuthenticated()) {
    // Si no hay usuario, devolver al login
    window.location.href = '../index.html';
}
else {

    document.addEventListener("DOMContentLoaded", () => {

        const contenido = document.getElementById("contenido");
        const menuPrincipal = document.getElementById("menu-principal");
        const btnLogout = document.getElementById("btnLogout");

        // LOGOUT
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                authService.logout();
            });
        }

        // CARGAS DE PÁGINAS
        const cargarPagina = async (page, id = null) => {
            try {

                const response = await fetch(`main-pages/${page}.html`);

                if (!response.ok) throw new Error("No se pudo cargar la sección");

                const html = await response.text();
                contenido.innerHTML = html;

                if (page === "articulos") {
                    inicializarAlmacen();
                }
                else if (page === "detalle-producto") {
                    inicializarDetalleProducto(id);
                }
                else if (page === "inventario") {
                    inicializarInventario();
                }
                else if (page === "proveedores") {
                    inicializarProveedores();
                }
                else if (page === "pedidos") {
        inicializarPedidos(); // <--- LLAMAR
    }

                if (menuPrincipal) menuPrincipal.classList.remove("open");

                // CARGAR NOMBRE DE USUARIO EN EL HEADER
                const userSpan = document.getElementById('header-username');
                const currentUser = authService.getCurrentUser();

                if (userSpan && currentUser) {
                    
                    userSpan.textContent = currentUser.nombre || currentUser.username;
                }

                // BOTÓN LOGOUT
                const btnLogout = document.getElementById('btnLogout');
                if (btnLogout) {
                    btnLogout.addEventListener('click', () => {
                        authService.logout();
                    });
                }

            } catch (error) {
                console.error(error);
                contenido.innerHTML = `<p style='color:red; padding:20px'>Error cargando la sección: ${page}</p>`;
            }
        };

        document.addEventListener("click", (e) => {
            const elemento = e.target.closest("[data-page]");

            if (elemento) {
                e.preventDefault();
                const page = elemento.dataset.page;
                const id = elemento.dataset.id || null;

                if (elemento.closest(".menu")) {
                    document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));
                    const li = elemento.querySelector("li");
                    if (li) li.classList.add("active");
                }

                if (page) cargarPagina(page, id);
            }
        });

        // CARGA INICIAL
        cargarPagina("inicio");
    });
}