// Referencias al DOM (elementos HTML)
const tbody = document.getElementById('tabla-body');
const resumenEl = document.getElementById('resumen');
const loadingEl = document.getElementById('loading');
const previewImg = document.getElementById('preview-img');
const selectCatFiltro = document.getElementById('categoriaSelect');
const selectCatForm = document.getElementById('categoria');
const selectProvForm = document.getElementById('proveedor');

export function mostrarCargando(estado) {
    if(loadingEl) loadingEl.style.display = estado ? 'block' : 'none';
}

export function renderizarTabla(listaProductos) {
    tbody.innerHTML = '';

    if (!listaProductos || listaProductos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No se encontraron productos</td></tr>';
        resumenEl.textContent = '0 productos';
        return;
    }

    listaProductos.forEach(p => {
        const tr = document.createElement('tr');
        
        // Alerta de stock bajo
        if (p.stock <= p.stockMinimo) {
            tr.classList.add('alerta');
        }

        const precio = parseFloat(p.precio).toFixed(2);
        const catNombre = p.categoria ? p.categoria.nombre : 'Sin Categoría';
        const provNombre = p.proveedor ? p.proveedor.nombre : 'Sin Proveedor';

        tr.innerHTML = `
            <td>${p.id}</td>
            <td style="font-weight:bold;">${p.nombre}</td>
            <td><span style="background:#eef; padding: 2px 6px; border-radius:4px; font-size:12px;">${catNombre}</span></td>
            <td>${precio} €</td>
            <td>${p.stock}</td>
            <td>${p.stockMinimo}</td>
            <td style="font-size: 13px; color: #666;">${provNombre}</td>
            <td>${p.activo ? '<i class="fas fa-check-circle" style="color:green;"></i>' : '<i class="fas fa-times-circle" style="color:red;"></i>'}</td>
        `;
        tbody.appendChild(tr);
    });

    actualizarResumen(listaProductos);
}

function actualizarResumen(lista) {
    const valorTotal = lista.reduce((acc, item) => acc + (parseFloat(item.precio) * parseInt(item.stock)), 0);
    resumenEl.innerHTML = `Mostrando <b>${lista.length}</b> productos | Valor Stock: <b>${valorTotal.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}</b>`;
}

export function actualizarSelects(productos) {
    // Usamos Maps para evitar duplicados
    const categoriasMap = new Map();
    const proveedoresMap = new Map();

    productos.forEach(p => {
        if(p.categoria) categoriasMap.set(p.categoria.id, p.categoria.nombre);
        if(p.proveedor) proveedoresMap.set(p.proveedor.id, p.proveedor.nombre);
    });

    // Limpiar selects (dejando la opción por defecto)
    limpiarSelect(selectCatFiltro);
    limpiarSelect(selectCatForm);
    limpiarSelect(selectProvForm);

    // Llenar Categorías
    categoriasMap.forEach((nombre, id) => {
        selectCatFiltro.add(new Option(nombre, nombre)); // Value = nombre (para filtro simple)
        selectCatForm.add(new Option(nombre, id));     // Value = ID (para guardar)
    });

    // Llenar Proveedores
    proveedoresMap.forEach((nombre, id) => {
        selectProvForm.add(new Option(nombre, id));
    });
}

function limpiarSelect(selectElement) {
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
}

export function actualizarImagenPreview(url) {
    if(url) {
        previewImg.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
        previewImg.innerHTML = '<i class="fas fa-image fa-2x"></i>';
    }
}