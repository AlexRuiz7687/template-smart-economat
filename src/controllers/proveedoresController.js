import { getProveedores } from "../services/economatoService.js";
import { renderTablaProveedores } from "../view/proveedoresView.js";

let listaProveedores = [];

export async function inicializarProveedores() {
    console.log("Inicializando Proveedores...");

    try {
        // 1. Obtener datos
        listaProveedores = await getProveedores();
        
        // 2. Renderizar tabla
        renderTablaProveedores(listaProveedores);

        // 3. Activar Buscador
        const inputBusqueda = document.getElementById('busquedaProveedor');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('keyup', (e) => {
                const texto = e.target.value.toLowerCase();
                const filtrados = listaProveedores.filter(p => 
                    p.nombre.toLowerCase().includes(texto) || 
                    (p.cif && p.cif.toLowerCase().includes(texto))
                );
                renderTablaProveedores(filtrados);
            });
        }

        // 4. Activar botón Nuevo (Por ahora solo un alert o log)
        const btnNuevo = document.getElementById('btnNuevoProveedor');
        if(btnNuevo) {
            btnNuevo.addEventListener('click', () => {
                alert("Funcionalidad de crear proveedor pendiente.");
                // Aquí podrías redirigir a un formulario o abrir un modal
            });
        }

    } catch (error) {
        console.error("Error en controlador proveedores:", error);
    }
}