export function filtrarPorCategoria(productos, categoria) {
  if (!categoria) return productos;
  return productos.filter(p => p.categoria?.nombre === categoria);
}

export function buscarProducto(productos, nombre) {
  if (!nombre) return productos;
  const nombreLower = nombre.toLowerCase();
  return productos.filter(p => p.nombre.toLowerCase().includes(nombreLower));
}

export function ordenarPorPrecio(productos, orden = 'asc') {
  if (!productos || productos.length === 0) return [];
  return [...productos].sort((a, b) => {
    return orden === 'asc' ? a.precio - b.precio : b.precio - a.precio;
  });
}

export function comprobarStockMinimo(productos) {
  return productos.filter(p => p.stock < p.stockMinimo);
}


