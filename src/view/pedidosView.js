/* src/view/pedidosView.js */

export const PedidosView = {

    /**
     * Renderiza la tabla principal de pedidos
     * @param {Array} pedidos - Lista de pedidos a mostrar
     * @param {Object} usuarioActual - Usuario logueado (para calcular permisos)
     */
    renderTabla: (pedidos, usuarioActual) => {
        const tbody = document.getElementById('tabla-pedidos-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Control de visibilidad de columna checkbox (Solo Admin)
        const thAdmin = document.querySelector('.col-check-admin');
        if (thAdmin) {
            thAdmin.style.display = usuarioActual.rol === 'admin' ? 'table-cell' : 'none';
        }

        if (pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="celda-centrada" style="padding: 20px;">No hay pedidos en el historial.</td></tr>';
            return;
        }

        pedidos.forEach(p => {
            const tr = document.createElement('tr');

            // 1. Checkbox Admin
            const checkHTML = usuarioActual.rol === 'admin'
                ? `<input type="checkbox" class="check-unificar" value="${p.id}">`
                : '';
            
            // 2. Estado y Clase CSS
            const claseEstado = obtenerClaseEstado(p.estado);

            // 3. Botones de Acción
            const accionesHTML = generarBotonesAccion(p, usuarioActual);

            tr.innerHTML = `
                <td style="${usuarioActual.rol === 'admin' ? '' : 'display:none'}">${checkHTML}</td>
                <td style="font-weight:bold;">${p.id}</td>
                <td>${p.fecha}</td>
                <td>${p.nombreSolicitante || p.nombreUsuario || 'Usuario'}</td>
                <td><span class="${claseEstado}">${p.estado}</span></td>
                <td>${parseFloat(p.total).toFixed(2)} €</td>
                <td>${accionesHTML}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    /**
     * Crea y devuelve un elemento TR para una nueva línea de producto en el formulario
     */
    crearFilaLineaPedido: (index, listaProductos, prodIdSeleccionado = '', cantidad = 1) => {
        const tr = document.createElement('tr');
        tr.id = `fila-pedido-${index}`;

        // Generar opciones del select
        const opcionesHTML = listaProductos.map(p => {
            const selected = p.id == prodIdSeleccionado ? 'selected' : '';
            return `<option value="${p.id}" data-precio="${p.precio}" ${selected}>${p.nombre}</option>`;
        }).join('');

        tr.innerHTML = `
            <td>
                <select class="form-control rounded linea-prod-select" data-index="${index}">
                    <option value="">-- Seleccionar --</option>
                    ${opcionesHTML}
                </select>
            </td>
            <td>
                <input type="number" class="form-control rounded linea-cant-input" data-index="${index}" value="${cantidad}" min="1">
            </td>
            <td class="celda-moneda">
                <span id="subtotal-${index}">0.00</span> €
            </td>
            <td class="celda-centrada">
                <button type="button" class="btn-accion btn-borrar linea-btn-del" data-index="${index}">X</button>
            </td>
        `;

        return tr;
    },

    /**
     * Renderiza la tabla de unificación (resumen de compra)
     */
    renderTablaUnificada: (itemsConsolidados) => {
        const tbody = document.getElementById('tabla-unificada-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        itemsConsolidados.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.codigo}</td>
                <td style="font-weight:bold;">${item.nombre}</td>
                <td class="celda-centrada" style="font-size:1.1rem;">${item.cantidad}</td>
                <td>${item.unidad}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    mostrarTotalGlobal: (total) => {
        const el = document.getElementById('pedido-total-global');
        if (el) el.textContent = total.toFixed(2);
    },

    mostrarListaIdsUnificados: (ids) => {
        const el = document.getElementById('lista-ids-unificados');
        if (el) el.textContent = ids.join(', ');
    }
};

// --- Helpers Privados de la Vista (No se exportan) ---

function obtenerClaseEstado(estado) {
    if (estado === 'Pendiente') return 'estado-pendiente';
    if (estado === 'Procesado') return 'estado-procesado';
    return 'estado-desconocido';
}

function generarBotonesAccion(pedido, usuario) {
    const esAdmin = usuario.rol === 'admin';
    // Convertimos a string para asegurar comparación
    const esPropioPendiente = (String(pedido.usuarioId) === String(usuario.id) && pedido.estado === 'Pendiente');

    const puedeEditar = esAdmin || esPropioPendiente;
    const claseDisabled = puedeEditar ? '' : 'btn-disabled';

    // Iconos SVG
    const svgEditar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    const svgBorrar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    return `
        <div class="acciones-container">
            <button class="btn-accion btn-editar btn-editar-pedido ${claseDisabled}" data-id="${pedido.id}" title="Editar">
                ${svgEditar}
            </button>
            <button class="btn-accion btn-borrar btn-borrar-pedido ${claseDisabled}" data-id="${pedido.id}" title="Eliminar">
                ${svgBorrar}
            </button>
        </div>
    `;
}