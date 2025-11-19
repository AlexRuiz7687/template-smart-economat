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
