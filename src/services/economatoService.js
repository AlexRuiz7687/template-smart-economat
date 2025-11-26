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
