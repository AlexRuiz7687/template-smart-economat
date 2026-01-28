export function renderizarTabla(datos, resumenEl) {
  const tabla = document.querySelector('#tablaProductos tbody');
  tabla.innerHTML = '';

  if (!datos || datos.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron productos</td></tr>';
    resumenEl.textContent = '';
    return;
  }

  datos.forEach((p, index) => {
    const fila = document.createElement('tr');
    // Accesibilidad: Anunciar número de fila y contenido clave al entrar
    const numeroFila = index + 1;
    fila.setAttribute("aria-label", `Fila ${numeroFila}: ${p.nombre}`);
    // Opcional: tabindex para navegar por filas si el usuario lo prefiere, aunque la tabla nativa ya navega por celdas
    // fila.setAttribute("tabindex", "0"); 

    if (p.stock < p.stockMinimo) fila.classList.add('alerta');

    const categoria = typeof p.categoria === 'object' ? p.categoria.nombre : p.categoria;
    const proveedorNombre = typeof p.proveedor === 'object' ? p.proveedor.nombre : p.proveedor;
    const proveedorIsla = p.proveedor?.isla || p.isla || '';

    fila.innerHTML = `
      <td><span class="sr-only">I D: </span>${p.id}</td> 
      <td><span class="sr-only">Nombre: </span>${p.nombre}</td> 
      <td><span class="sr-only">Categoría: </span>${categoria}</td> 
      <td><span class="sr-only">Precio: </span>${p.precio?.toFixed ? p.precio.toFixed(2) : p.precio} euros</td> 
      
      <td><span class="sr-only">Stock Mínimo: </span>${p.stockMinimo}</td> 
      <td><span class="sr-only">Proveedor: </span>${proveedorNombre}</td> 
      <td> 
        <button class="btn-ver-detalle" data-page="detalle-producto" data-id="${p.productoId}" aria-label="Ver detalles de ${p.nombre}"> 
           + 
        </button> 
    </td>
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









