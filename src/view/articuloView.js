export function renderizarTabla(datos, resumenEl) {
  const tabla = document.querySelector('#tablaProductos tbody');
  tabla.innerHTML = '';

  if (!datos || datos.length === 0) {
    tabla.innerHTML = '<tr><td colspan="8" style="text-align:center;">No se encontraron productos</td></tr>';
    resumenEl.textContent = '';
    return;
  }

  datos.forEach(p => {
    const fila = document.createElement('tr');
    if (p.stock < p.stockMinimo) fila.classList.add('alerta');

    const categoria = typeof p.categoria === 'object' ? p.categoria.nombre : p.categoria;
    const proveedorNombre = typeof p.proveedor === 'object' ? p.proveedor.nombre : p.proveedor;
    const proveedorIsla = p.proveedor?.isla || p.isla || '';

    fila.innerHTML = `
      <td>${p.id}</td> 
      <td>${p.nombre}</td> 
      <td>${categoria}</td> 
      <td>${p.precio?.toFixed ? p.precio.toFixed(2) : p.precio}</td> 
      <td>${p.stock}</td> 
      <td>${p.stockMinimo}</td> 
      <td>${proveedorNombre}</td> 
      <td>${proveedorIsla}</td>
    `;
    tabla.appendChild(fila);
  });

  const totalProductos = datos.length;
  const valorTotal = datos.reduce((acc, p) => acc + (p.precio * p.stock), 0).toFixed(2);
  resumenEl.textContent = `Productos mostrados: ${totalProductos} | Valor total del stock: ${valorTotal} €`;
}

export function cargarCategorias(categorias) {
  const select = document.querySelector('#categoriaSelect');
  select.innerHTML = '<option value="">-- Categoría --</option>';

  categorias.forEach(c => {
    const option = document.createElement('option');
    option.value = c.nombre;
    option.textContent = c.nombre;
    select.appendChild(option);
  });
}







