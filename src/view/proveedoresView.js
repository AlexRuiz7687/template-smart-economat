export function renderTablaProveedores(proveedores) {
    const tbody = document.getElementById('tabla-proveedores-body');
    
    // Validación de seguridad
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!proveedores || proveedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No hay proveedores registrados</td></tr>';
        return;
    }

    proveedores.forEach(p => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td style="font-weight: bold;">${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.cif || '-'}</td>
            <td>${p.contacto || '-'}</td>
            <td>${p.telefono || '-'}</td>
            <td>
                ${p.email ? `<a href="mailto:${p.email}" style="color: var(--primary-color); font-weight:bold;">${p.email}</a>` : '-'}
            </td>
            <td class="acciones">
                <div style="display:flex; gap:8px; justify-content:center;">
                    
                    <button class="bt-acc-dir btn-editar" data-id="${p.id}" 
                            style="padding: 6px 10px; min-width: auto; display:flex; align-items:center; justify-content:center; background-color:#2a9d8f;" 
                            title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>

                    <button class="bt-acc-dir btn-borrar" data-id="${p.id}" 
                            style="padding: 6px 10px; min-width: auto; background-color: #dc3545; display:flex; align-items:center; justify-content:center;" 
                            title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>

                </div>
            </td>
        `;
        tbody.appendChild(fila);
    });
}