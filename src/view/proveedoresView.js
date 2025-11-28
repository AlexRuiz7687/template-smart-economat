export function renderTablaProveedores(proveedores) {
    const tbody = document.getElementById('tabla-proveedores-body');
    
    if (!tbody) return;

    tbody.innerHTML = '';

    if (proveedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No hay proveedores registrados</td></tr>';
        return;
    }

    proveedores.forEach(p => {
        const fila = document.createElement('tr');
        
        // Ajusta estos campos según tu db.json
        fila.innerHTML = `
            <td>${p.id}</td>
            <td style="font-weight: bold;">${p.nombre}</td>
            <td>${p.cif || '-'}</td>
            <td>${p.contacto || '-'}</td>
            <td>${p.telefono || '-'}</td>
            <td><a href="mailto:${p.email}" style="color:blue;">${p.email || '-'}</a></td>
            <td class="acciones">
                <button class="btn-editar-prov" data-id="${p.id}" style="cursor:pointer;">Editar</button>
                <button class="btn-borrar-prov" data-id="${p.id}" style="cursor:pointer;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}