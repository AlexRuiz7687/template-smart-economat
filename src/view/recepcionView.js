/* src/view/recepcionView.js */

export const RecepcionView = {

    /**
     * Renderiza la tabla del historial de recepciones
     * @param {Array} recepciones - Lista de objetos recepción
     */
    renderTablaHistorial: (recepciones) => {
        const tbody = document.getElementById('tabla-recepcion-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (recepciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No hay recepciones registradas.</td></tr>';
            return;
        }

        recepciones.forEach(r => {
            const tr = document.createElement('tr');
            
            // Usamos las clases estándar 'btn-accion' para mantener estilo con Pedidos
            const acciones = `
                <div class="acciones-container" style="display: flex; gap: 5px; justify-content: center;">
                    <button class="btn-accion btn-editar btn-editar-recepcion" data-id="${r.id}" title="Ver/Editar" style="border: none; background: none; cursor: pointer; color: var(--cl-dark-gray);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button class="btn-accion btn-borrar btn-borrar-recepcion" data-id="${r.id}" title="Eliminar" style="border: none; background: none; cursor: pointer; color: #dc3545;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            `;

            // Mapeo seguro de datos (por si el backend devuelve nombres distintos)
            const nombreProv = r.nombreProveedor || r.proveedor || 'Sin Prov.';
            const fecha = r.fechaRecepcion || r.fecha || '-';
            const albaran = r.albaran || '-';

            tr.innerHTML = `
                <td style="font-weight:bold;">${r.id}</td>
                <td>${fecha}</td>
                <td>${nombreProv}</td>
                <td style="color:#2a9d8f; font-weight:bold;">${albaran}</td>
                <td style="text-align:right;">${parseFloat(r.total).toFixed(2)} €</td>
                <td style="text-align:center;">${r.concordancia || '-'}</td>
                <td>${acciones}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    /**
     * Genera una fila de producto para el formulario (Nueva o Edición)
     * Utiliza las clases 'form-control rounded' para igualar el estilo de Pedidos.
     */
    crearFilaLineaRecepcion: (index, listaProductos, datos = {}) => {
        const tr = document.createElement('tr');
        tr.id = `fila-recep-${index}`;

        const prodId = datos.productoId || '';
        const cant = datos.cantidad || 0;
        const coste = datos.coste || datos.precioUnitario || 0;
        const imp = datos.impuestos || 0;
        const total = datos.importe || datos.subtotal || 0;
        const obs = datos.observaciones || '';

        // Generar opciones del select
        const opciones = listaProductos.map(p => 
            `<option value="${p.id}" ${p.id == prodId ? 'selected' : ''}>${p.nombre}</option>`
        ).join('');

        // NOTA: Usamos 'form-control rounded' para mantener el estilo de "Pedidos".
        // Añadimos 'style="width: 100%"' para que se adapte a las columnas CSS.
        tr.innerHTML = `
            <td>
                <select class="form-control rounded linea-prod-select" data-index="${index}" style="width: 100%;">
                    <option value="">-- Seleccionar --</option>
                    ${opciones}
                </select>
            </td>
            <td>
                <input type="number" class="form-control rounded linea-cant" data-index="${index}" value="${cant}" step="0.01" style="width: 100%;">
            </td>
            <td>
                <input type="number" class="form-control rounded linea-coste" data-index="${index}" value="${coste}" step="0.01" style="width: 100%;">
            </td>
            <td>
                <input type="number" class="form-control rounded linea-imp" data-index="${index}" value="${imp}" step="1" style="width: 100%;">
            </td>
            <td>
                <input type="text" class="form-control rounded linea-total" value="${parseFloat(total).toFixed(2)}" disabled style="width: 100%; background-color: #e9ecef;">
            </td>
            <td>
                <input type="text" class="form-control rounded linea-obs" data-index="${index}" value="${obs}" style="width: 100%;">
            </td>
            <td style="text-align:center; vertical-align: middle;">
                <button type="button" class="btn-borrar linea-del" data-index="${index}" style="border: none; background: none; color: #dc3545; cursor: pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </td>
        `;
        return tr;
    },

    /**
     * Actualiza el total global en la vista
     */
    mostrarTotalGlobal: (total) => {
        const el = document.getElementById('recep-total-global');
        if (el) el.textContent = total.toFixed(2);
    }
};