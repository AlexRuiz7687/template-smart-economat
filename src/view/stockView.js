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

// ... (Tu código anterior de renderizarTabla y cargarCategorias se queda igual) ...


/* =========================================================
   NUEVAS FUNCIONES PARA SECCIÓN INVENTARIO
   ========================================================= */

// TAB 1: Solo ID, Nombre, Categoria, Cantidad, Total €
export function renderInventarioValorado(datos, resumenEl) {
    const tabla = document.getElementById('tabla-valorada-body');
    tabla.innerHTML = '';
  
    if (!datos || datos.length === 0) {
      tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay datos</td></tr>';
      resumenEl.textContent = '';
      return;
    }
  
    let sumaTotalAlmacen = 0;
  
    datos.forEach(p => {
      const fila = document.createElement('tr');
      // Alerta visual si está bajo mínimos
      if (p.stock < (p.stockMinimo || 5)) fila.classList.add('alerta');
  
      const categoria = typeof p.categoria === 'object' ? p.categoria.nombre : p.categoria;
      const totalProducto = (p.precio * p.stock);
      
      sumaTotalAlmacen += totalProducto;
  
      fila.innerHTML = `
        <td>${p.id}</td> 
        <td>${p.nombre}</td> 
        <td>${categoria || 'Sin Cat.'}</td> 
        <td style="font-weight:bold;">${p.stock}</td> 
        <td>${totalProducto.toFixed(2)} €</td> 
      `;
      tabla.appendChild(fila);
    });
  
    // Resumen al pie de tabla
    resumenEl.innerHTML = `Valor Total del Inventario: <span style="font-size:1.2em; color:var(--primary-color)">${sumaTotalAlmacen.toFixed(2)} €</span>`;
}

// TAB 2: ID, Producto, Input Cantidad, Botón Guardar
export function renderConsolidacion(datos) {
    const tabla = document.getElementById('tabla-consolidar-body');
    tabla.innerHTML = '';
  
    datos.forEach(p => {
      const fila = document.createElement('tr');
      
      fila.innerHTML = `
        <td>${p.id}</td> 
        <td>${p.nombre}</td> 
        <td>
            <input type="number" id="input-stock-${p.id}" value="${p.stock}" class="form-control rounded" style="width:100px">
        </td>
        <td>
            <button class="btn-guardar-stock" data-id="${p.id}">💾 Guardar</button>
        </td> 
      `;
      tabla.appendChild(fila);
    });
}