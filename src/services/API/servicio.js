// Configura aquí la ruta de tu PHP. 
// ".." significa subir un nivel desde 'js/services' (aunque el fetch es relativo al HTML)
// Como el HTML está en la raíz, la ruta es directa al archivo PHP.
const API_URL = 'tabla-listado-basico-3.php';

export async function obtenerProductos() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const datos = await response.json();
        return datos;

    } catch (error) {
        console.error("Error en el servicio obtenerProductos:", error);
        throw error; // Re-lanzamos el error para que el controlador sepa que falló
    }
}

// Aquí podrías agregar más funciones a futuro, por ejemplo:
// export async function crearProducto(producto) { ... }