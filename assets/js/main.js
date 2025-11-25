import { inicializarAlmacen } from '../../src/controllers/almacen.js';

document.addEventListener("DOMContentLoaded", () => {

    // 1. SELECCIÓN DE ELEMENTOS
    const links = document.querySelectorAll(".menu a");
    const contenido = document.getElementById("contenido");
    const menutoggle = document.getElementById("menu-toggle");
    const menuPrincipal = document.getElementById("menu-principal");
    const submenuArticulos = document.getElementById("verArticulos");

    // 2. FUNCIÓN ENCARGADA DE CARGAR EL HTML
    const cargarPagina = async (page) => {
        try {
            // Pide el archivo a la carpeta pages/
            const response = await fetch(`pages/${page}.html`);

            // Si el archivo no existe, lanza un error
            if (!response.ok) throw new Error("No se pudo cargar la sección");

            // Convierte la respuesta a texto HTML
            const html = await response.text();

            // Inserta el HTML dentro de <main id="contenido">
            contenido.innerHTML = html;

            //Cargar pagina de artículos
            if (page === "articulos") {
                console.log("Iniciando módulo de almacén...");
                inicializarAlmacen(); 
            }

            // Cierra el menú móvil si está abierto
            if (menuPrincipal) menuPrincipal.classList.remove("open");

        } catch (error) {
            console.error(error);
            contenido.innerHTML = `<div style="error">
                <h2>Error al cargar</h2>
                <p>${error.message}</p>
                <p>Nota: Recuerda usar Live Server para que funcione el fetch.</p>
            </div>`;
        }
    };

    // 3. ASIGNAR EL EVENTO CLICK A CADA ENLACE DEL MENÚ
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();

            // Leemos a qué página quiere ir (del atributo data-page)
            const page = link.dataset.page;

            //Removemos todos los active de las listas
            document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));

            //Solo lo activamos cuando este activo el link
            const li = link.querySelector("li");
            if (li) li.classList.add("active");

            if (page) {
                cargarPagina(page);
            }

            
        });
    });

    cargarPagina("inicio");

});