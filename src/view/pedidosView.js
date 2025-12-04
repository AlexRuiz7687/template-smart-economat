// src/view/pedidosView.js

export function renderTablaPedidos(lista) {
    const tbody = document.getElementById('tabla-pedidos-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay pedidos registrados.</td></tr>';
        return;
    }

    lista.forEach(p => {
        const tr = document.createElement('tr');
        
        // Estilos para las etiquetas de estado
        let colorEstado = '#777'; // Gris por defecto
        if (p.estado === 'pendiente') colorEstado = '#f0ad4e'; // Naranja
        if (p.estado === 'aprobado') colorEstado = '#5bc0de'; // Azul
        if (p.estado === 'recibido') colorEstado = '#5cb85c'; // Verde
        if (p.estado === 'cancelado') colorEstado = '#d9534f'; // Rojo

        const badgeEstado = `
            <span style="background-color: ${colorEstado}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.85em; text-transform: capitalize;">
                ${p.estado}
            </span>
        `;

        tr.innerHTML = `
            <td style="font-weight:bold">#${p.id}</td>
            <td>${p.fecha}</td>
            <td>${p.nombreUsuario}</td>
            <td>${badgeEstado}</td>
            <td style="font-weight:bold">${parseFloat(p.total).toFixed(2)} €</td>
            <td>
                <button class="bt-acc-dir" style="padding: 5px 10px; min-width:auto;" title="Ver Detalle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}