const Api_URL = 'http://localhost:3000';

export async function getProductos() {
  try {
    const res = await fetch(`${Api_URL}/productos`);
    if (!res.ok) throw new Error(`Error al obtener productos`);
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getCategorias() {
  try {
    const res = await fetch(`${Api_URL}/categorias`);
    if (!res.ok) throw new Error(`Error al obtener categorías`);
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getArticuloById(id) {
    try {
        
        const response = await fetch(`${Api_URL}/productos/${id}`);
        
        if (!response.ok) {
            if(response.status === 404) throw new Error("Artículo no encontrado");
            throw new Error("Error de conexión");
        }
        
        const data = await response.json();
        return data;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Actualizar un artículo existente
export async function updateArticulo(id, datosActualizados) {
    try {
        const response = await fetch(`${Api_URL}/productos/${id}`, {
            method: 'PUT', // Método para actualizar
            headers: {
                'Content-Type': 'application/json' // Avisamos que enviamos JSON
            },
            body: JSON.stringify(datosActualizados) // Convertimos datos a texto
        });

        if (!response.ok) throw new Error("Error al actualizar el producto");

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createArticulo(nuevoArticulo) {
    try {
        const response = await fetch(`${Api_URL}/productos`, { // Recuerda: /productos según tu db.json
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoArticulo)
        });

        if (!response.ok) throw new Error("Error al registrar el artículo");

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// OBTENER PROVEEDORES
export async function getProveedores() {
  try {
    // Asumimos que en tu db.json se llama "proveedores"
    const res = await fetch(`${Api_URL}/proveedores`);
    if (!res.ok) throw new Error(`Error al obtener proveedores`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}
