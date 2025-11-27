// src/controllers/mainController.js
import { inicializarAlmacen } from './almacenController.js';
import { inicializarDetalleProducto } from './detalleProductoController.js'; 
import { inicializarInventario } from './inventarioController.js';

document.addEventListener("DOMContentLoaded", () => {

    const contenido = document.getElementById("contenido");
    const menuPrincipal = document.getElementById("menu-principal");

    // CORRECCIÓN AQUÍ: Añadimos 'id = null' para recibir el dato del botón '+'
    const cargarPagina = async (page, id = null) => {
        try {
            console.log(`Cargando ruta: main-pages/${page}.html`);

            const response = await fetch(`main-pages/${page}.html`);

            if (!response.ok) throw new Error("No se pudo cargar la sección");

            const html = await response.text();
            contenido.innerHTML = html;

            // --- ROUTER ---
            if (page === "articulos") {
                console.log("Iniciando módulo de artículos...");
                inicializarAlmacen();
            }
            else if (page === "detalle-producto") {

                console.log("Cargando detalle para ID:", id);
                inicializarDetalleProducto(id);
            }
            else if (page === "inventario") {

                console.log("Cargando detalle para ID:", id);
                inicializarInventario();
            }

            if (menuPrincipal) menuPrincipal.classList.remove("open");

        } catch (error) {
            console.error(error);
            contenido.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    };

    // DELEGACIÓN DE EVENTOS
    document.addEventListener("click", (e) => {
        const elemento = e.target.closest("[data-page]");

        if (elemento) {
            e.preventDefault();

            const page = elemento.dataset.page;

            // Capturamos el ID del botón '+'
            const id = elemento.dataset.id || null; 

            // Gestión visual del menú
            if (elemento.closest(".menu")) {
                document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));
                const li = elemento.querySelector("li");
                if (li) li.classList.add("active");
            }

            // Pasamos ambos datos
            if (page) {
                cargarPagina(page, id);
            }
        }
    });

    cargarPagina("inicio");
});