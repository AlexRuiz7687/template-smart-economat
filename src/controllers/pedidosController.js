/* src/controllers/pedidosController.js */

import { getPedidos, createPedido, deletePedido, getProductosCompleto, updatePedido, getPedidoById, getUnificaciones, createUnificacion } from "../services/economatoService.js";
import { authService } from "../services/authService.js";
import { PedidosView } from "../view/pedidosView.js";

// Variables de estado
let usuarioActual = null;
let listaPedidos = [];
let listaProductosGlobal = [];

let lineasPedido = [];
let unificacionActual = null; // Para guardar lo que se está viendo

export async function inicializarPedidos(tab = null) {
    console.log("Inicializando módulo Pedidos...");

    usuarioActual = authService.getCurrentUser();

    // Estado separado
    window.lineasNvoPedido = [];
    window.lineasEdicionPedido = [];

    if (!usuarioActual) {
        if (typeof Swal !== 'undefined') {
            await Swal.fire({ title: 'Acceso Denegado', text: 'Debes iniciar sesión.', icon: 'error', showConfirmButton: false, timer: 2000 });
        } else {
            alert("Acceso denegado. Inicia sesión.");
        }
        window.location.href = '../index.html';
        return;
    }

    try {
        setupTabs();
        aplicarPermisosVisuales();

        await cargarDatosMaestros();
        await cargarListadoPedidos();

        configurarEventos();

        if (tab) {
            console.log(`Auto-navegando a pestaña: ${tab}`);
            cambiarPestana(tab);
        } else {

            const defaultBtn = document.getElementById('defaultOpenPedidos');
            if (defaultBtn) defaultBtn.click();
        }

    } catch (error) {
        console.error("Error en controlador pedidos:", error);
    }
}

function aplicarPermisosVisuales() {
    const panelAdmin = document.getElementById('panel-admin-actions');
    const inputSolicitante = document.getElementById('pedido-solicitante');

    if (inputSolicitante) {
        inputSolicitante.value = usuarioActual.nombre || usuarioActual.username;
    }

    if (panelAdmin) {
        panelAdmin.style.display = usuarioActual.rol === 'admin' ? 'block' : 'none';
    }
}

async function cargarDatosMaestros() {
    listaProductosGlobal = await getProductosCompleto();
}

async function cargarListadoPedidos() {
    const todos = await getPedidos();

    if (usuarioActual.rol === 'admin') {
        listaPedidos = todos;
    } else {
        listaPedidos = todos.filter(p => p.usuarioId == usuarioActual.id);
    }

    // Ordenamos lógica antes de enviar a la vista
    listaPedidos.sort((a, b) => {
        if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
        if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
        return new Date(b.fecha) - new Date(a.fecha);
    });

    // Llamamos a la vista
    PedidosView.renderTabla(listaPedidos, usuarioActual);
}

function configurarEventos() {
    const btnAdd = document.getElementById('btnAgregarLinea');
    if (btnAdd) btnAdd.addEventListener('click', () => agregarLineaDOM('crear'));

    const btnGuardar = document.getElementById('btnGuardarPedido');
    if (btnGuardar) {
        const nuevoBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nuevoBtn, btnGuardar);
        nuevoBtn.addEventListener('click', async () => await manejarGuardarPedido());
    }

    const tbody = document.getElementById('tabla-pedidos-body');
    if (tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-editar-pedido');
            const btnDel = e.target.closest('.btn-borrar-pedido');


            if (btnEdit && !btnEdit.classList.contains('btn-disabled')) cargarPedidoEdicion(btnEdit.dataset.id);
            if (btnDel && !btnDel.classList.contains('btn-disabled')) manejarBorrarPedido(btnDel.dataset.id);
        });
    }

    const btnUnificar = document.getElementById('btnUnificar');
    if (btnUnificar) btnUnificar.addEventListener('click', procesarUnificacion);

    const btnGuardarHistorial = document.getElementById('btnGuardarHistorial');
    if (btnGuardarHistorial) btnGuardarHistorial.addEventListener('click', manejarGuardarHistorial);

    const btnVolverUni = document.getElementById('btnVolverDeUnificado');
    if (btnVolverUni) btnVolverUni.addEventListener('click', () => {
        document.getElementById('defaultOpenPedidos').click();
    });

    const inputBusqueda = document.getElementById('busquedaPedido');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', (e) => {
            const texto = e.target.value.toLowerCase();
            const filtrados = listaPedidos.filter(p =>
                p.id.toString().includes(texto) ||
                (p.nombreSolicitante && p.nombreSolicitante.toLowerCase().includes(texto))
            );
            PedidosView.renderTabla(filtrados, usuarioActual);
        });
    }

    // Evento Ver Detalle Historial
    const tbodyHist = document.getElementById('tabla-historial-unificaciones-body');
    if (tbodyHist) {
        tbodyHist.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-ver-historial');
            if (btn) cargarDetalleHistorial(btn.dataset.id);
        });
    }

    // Pestaña Historial Click
    const btnTabHist = document.getElementById('btnTabHistorialUnificaciones');
    if (btnTabHist) btnTabHist.addEventListener('click', () => cargarHistorialUnificaciones());

    // Eventos Nuevos para Edición
    const btnAddEdit = document.getElementById('btnAgregarLineaEdicion');
    if (btnAddEdit) btnAddEdit.addEventListener('click', () => agregarLineaDOM('editar'));

    const btnUpdate = document.getElementById('btnActualizarPedido');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', async (e) => {
            e.preventDefault();
            await manejarActualizarPedido();
        });
    }

    const btnCancel = document.getElementById('btnCancelarEdicion');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            cerrarModal();
        });
    }

    const btnCloseModal = document.getElementById('btnCerrarModal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            cerrarModal();
        });
    }

    // Cerrar modal al hacer clic fuera
    window.onclick = function (event) {
        const modal = document.getElementById('modalFichaPedido');
        if (event.target == modal) {
            cerrarModal();
        }
    }
}

// --- Lógica de Líneas (Genérico para ambos forms) ---

function agregarLineaDOM(contexto, prodId = '', cant = 1) {
    // contexto: 'crear' o 'editar'
    const isEdit = contexto === 'editar';
    const tbodyId = isEdit ? 'lineas-pedido-edicion-body' : 'lineas-pedido-body';
    const arrayLineas = isEdit ? window.lineasEdicionPedido : window.lineasNvoPedido;
    const spanTotalId = isEdit ? 'pedido-total-edicion' : 'pedido-total-global';

    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const index = arrayLineas.length;

    // Modelo de datos
    arrayLineas.push({ productoId: prodId, cantidad: cant, subtotal: 0, precioUnitario: 0 });

    // 1. Pedir a la vista el elemento HTML
    const row = PedidosView.crearFilaLineaPedido(index, listaProductosGlobal, prodId, cant);
    tbody.appendChild(row);

    // 2. Adjuntar eventos
    const select = row.querySelector('.linea-prod-select');
    const inputCant = row.querySelector('.linea-cant-input');
    const btnDel = row.querySelector('.linea-btn-del');

    const recalcular = () => {
        const selOption = select.options[select.selectedIndex];
        const precio = parseFloat(selOption.dataset.precio) || 0;
        const unidad = selOption.dataset.unidad || '';
        const cantidad = parseFloat(inputCant.value) || 0;
        const totalLinea = precio * cantidad;

        if (arrayLineas[index]) {
            arrayLineas[index].productoId = select.value;
            arrayLineas[index].cantidad = cantidad;
            arrayLineas[index].precioUnitario = precio;
            arrayLineas[index].subtotal = totalLinea;
        }

        // Actualizar visuales
        const spanSub = row.querySelector(`#subtotal-${index}`);
       
        if (row.querySelector('td:nth-child(3) span')) {
            row.querySelector('td:nth-child(3) span').textContent = totalLinea.toFixed(2);
        }

        const spanUnidad = row.querySelector('.linea-unidad-texto');
        if (spanUnidad) spanUnidad.textContent = unidad;

        actualizarTotalGlobal(contexto);
    };

    select.addEventListener('change', recalcular);
    inputCant.addEventListener('input', recalcular);

    if (prodId) recalcular();

    btnDel.addEventListener('click', () => {
        row.remove();
        arrayLineas[index] = null;
        actualizarTotalGlobal(contexto);
    });
}

function actualizarTotalGlobal(contexto) {
    const isEdit = contexto === 'editar';
    const arrayLineas = isEdit ? window.lineasEdicionPedido : window.lineasNvoPedido;
    const spanTotalId = isEdit ? 'pedido-total-edicion' : 'pedido-total-global';

    const total = arrayLineas.reduce((acc, linea) => linea ? acc + linea.subtotal : acc, 0);
    const el = document.getElementById(spanTotalId);
    if (el) el.textContent = total.toFixed(2);
}

// --- CRUD ---

async function manejarGuardarPedido() {
    const lineasValidas = lineasPedido.filter(l => l && l.productoId);

    if (lineasValidas.length === 0) {
        Swal.fire('SmartEconomat', 'Debes añadir al menos un producto.', 'warning');
        return;
    }

    const idEdicion = document.getElementById('pedido-id-edicion').value;
    const fecha = document.getElementById('pedido-fecha').value || new Date().toISOString().split('T')[0];
    const total = parseFloat(document.getElementById('pedido-total-global').textContent);

    const datos = {
        usuarioId: usuarioActual.id,
        nombreSolicitante: usuarioActual.nombre || usuarioActual.username,
        fecha: fecha,
        estado: 'Pendiente',
        detalles: lineasValidas,
        total: total
    };

    try {
        if (idEdicion) {
            await updatePedido(idEdicion, datos);
            Swal.fire({ title: 'Éxito', text: 'Pedido modificado', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            await createPedido(datos);
            Swal.fire({ title: 'Éxito', text: 'Pedido enviado', icon: 'success', timer: 1500, showConfirmButton: false });
        }
        limpiarFormulario();
        await cargarListadoPedidos();
        document.getElementById('defaultOpenPedidos').click();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

async function manejarActualizarPedido() {
    const lineas = window.lineasEdicionPedido.filter(l => l && l.productoId);
    if (lineas.length === 0) {
        Swal.fire('Atención', 'El pedido debe tener líneas.', 'warning');
        return;
    }

    const id = document.getElementById('pedido-id-edicion').value;
    const estado = document.getElementById('pedido-estado-edicion').value;
    // Ojo: Si permitimos editar líneas, necesitamos lógica backend compleja.
    // Por simplicidad, asumimos que solo estado. 
    // PERO el usuario pidió "ver ficha a parte", quizás editar líneas también?
    // Pedidos.php no soporta editar líneas en PATCH fácilmente sin borrar/resetear.
    // Por ahora, enviaremos estado.
    // Si queremos editar líneas, createPedido (borrar y crear) o updatePedido logic.
    // El usuario pidió "editar pedido debe mostrar ficha".

    const datos = {
        estado: estado,
        // líneas si el backend lo soporta (no lo soporta aún en PATCH, solo DELETE/INSERT manual)
    };

    try {
        await updatePedido(id, datos);
        Swal.fire('Éxito', 'Pedido actualizado', 'success');
        Swal.fire('Éxito', 'Pedido actualizado', 'success');
        cerrarModal();
        cargarListadoPedidos();
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
}

async function cargarPedidoEdicion(id) {
    try {
        const pedido = await getPedidoById(id);
        if (!pedido) return;

        document.getElementById('pedido-id-edicion').value = pedido.id;
        document.getElementById('pedido-solicitante-edicion').value = pedido.solicitante || pedido.nombreUsuario || '';
        document.getElementById('pedido-fecha-edicion').value = pedido.fecha ? pedido.fecha.split(' ')[0] : '';
        document.getElementById('pedido-estado-edicion').value = pedido.estado || 'Pendiente';

        // Limpiar tabla edición
        document.getElementById('lineas-pedido-edicion-body').innerHTML = '';
        window.lineasEdicionPedido = [];
        document.getElementById('pedido-total-edicion').textContent = '0.00';

        if (pedido.detalles) {
            pedido.detalles.forEach(d => agregarLineaDOM('editar', d.productoId, d.cantidad));
        }

        // Mostrar Modal
        const modal = document.getElementById('modalFichaPedido');
        if (modal) modal.style.display = 'block';

    } catch (error) {
        console.error("Error cargando pedido:", error);
        Swal.fire("Error", "No se pudo cargar el pedido: " + error.message, "error");
    }
}

async function manejarBorrarPedido(id) {
    const result = await Swal.fire({
        title: '¿Eliminar pedido?',
        text: "No se podrá recuperar.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
        await deletePedido(id);
        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1000, showConfirmButton: false });
        await cargarListadoPedidos();
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
}

// --- Unificación ---

async function procesarUnificacion() {
    const checks = document.querySelectorAll('.check-unificar:checked');
    if (checks.length === 0) {
        Swal.fire('Atención', 'Selecciona al menos un pedido.', 'info');
        return;
    }

    const ids = Array.from(checks).map(c => c.value);

    try {
        // Obtenemos detalle COMPLETO de cada pedido (bug fix: listaPedidos inicial no tiene lineas a veces o queremos asegurar data fresca)
        // Aunque listaPedidos podría tenerlo si el getAll lo trajera. 
        // El API getPedidos NO trae líneas por defecto en el loop principal para optimizar, 
        // o si las trae, asegurémonos. 
        // Viendo `economatoService.js`, getPedidos hace fetch a `pedidos.php` (lista resumen).
        // Así que NO tenemos los detalles. Hay que hacer fetch one-by-one.

        Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const promesas = ids.map(id => getPedidoById(id));
        const pedidosCompletos = await Promise.all(promesas);

        const consolidado = {};
        let totalItemsGlobal = 0;

        pedidosCompletos.forEach(pedido => {
            if (pedido && pedido.detalles) {
                pedido.detalles.forEach(linea => {
                    // Resolver info producto. 
                    // Nota: getPedidoById devuelve 'productoId', 'cantidad', etc.
                    // Si el nombre no viene en detalle, lo buscamos en Global.
                    // Nota: `pedidos.php` getById YA devuelve el nombre del producto en 'producto' y 'proveedor'.
                    // O nos fiamos de listaProductosGlobal.

                    const idProd = linea.productoId;
                    const prodGlobal = listaProductosGlobal.find(pr => pr.id == idProd);

                    // Priorizamos data del pedido, fallback a global
                    const nombreProd = linea.producto || (prodGlobal ? prodGlobal.nombre : 'Desconocido');
                    const codigoProd = prodGlobal ? (prodGlobal.codigo || idProd) : idProd;
                    const unidadProd = prodGlobal ? (prodGlobal.unidadMedida || 'ud') : 'ud';

                    if (!consolidado[idProd]) {
                        consolidado[idProd] = {
                            id: idProd,
                            codigo: codigoProd,
                            nombre: nombreProd,
                            unidad: unidadProd,
                            cantidad: 0
                        };
                    }
                    consolidado[idProd].cantidad += parseFloat(linea.cantidad);
                    totalItemsGlobal += parseFloat(linea.cantidad);
                });
            }
        });

        const listaConsolidada = Object.values(consolidado);
        unificacionActual = {
            ids_pedidos: ids,
            total_items: totalItemsGlobal,
            detalle_snapshot: listaConsolidada
        };

        // Render
        PedidosView.renderTablaUnificada(listaConsolidada);
        PedidosView.mostrarListaIdsUnificados(ids);

        // Ocultar botón 'Guardar' si venimos de cero? No, siempre mostrar.
        document.getElementById('btnGuardarHistorial').style.display = 'inline-block';

        Swal.close();
        cambiarPestana('vistaUnificacion');

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Detalles: ' + error.message, 'error');
    }
}

async function manejarGuardarHistorial() {
    if (!unificacionActual) return;

    try {
        await createUnificacion({
            ids_pedidos: unificacionActual.ids_pedidos,
            total_items: unificacionActual.total_items,
            detalle_snapshot: unificacionActual.detalle_snapshot,
            usuarioId: usuarioActual.id
        });

        Swal.fire('Guardado', 'Compra unificada guardada en historial.', 'success');
        document.getElementById('btnGuardarHistorial').style.display = 'none'; // Evitar duplicar
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
}

async function cargarHistorialUnificaciones() {
    try {
        console.log("Cargando historial...");
        const lista = await getUnificaciones();
        console.log("Historial recibido:", lista);
        if (!Array.isArray(lista)) {
            console.error("Respuesta no es array:", lista);
            Swal.fire('Error', 'Error de formato en historial.', 'error');
            return;
        }
        PedidosView.renderHistorialUnificaciones(lista);
    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'Error cargando historial: ' + e.message, 'error');
    }
}

async function cargarDetalleHistorial(id) {
    try {
        const unificacion = await getUnificaciones(id);
        if (!unificacion) return;

        // Renderizamos en la misma vista de unificación
        PedidosView.renderTablaUnificada(unificacion.detalle_snapshot);
        PedidosView.mostrarListaIdsUnificados(unificacion.ids_pedidos.split(',')); // es string en BD

        // Ocultar botón guardar porque ya es histórico
        const btn = document.getElementById('btnGuardarHistorial');
        if (btn) btn.style.display = 'none';

        cambiarPestana('vistaUnificacion');
    } catch (e) {
        Swal.fire('Error', 'No se pudo cargar el detalle.', 'error');
    }
}

// --- Utilidades ---

function limpiarFormulario(full = true) {
    if (full) {
        document.getElementById('pedido-id-edicion').value = '';
        document.getElementById('pedido-fecha').value = new Date().toISOString().split('T')[0];
    }
    document.getElementById('lineas-pedido-body').innerHTML = '';
    PedidosView.mostrarTotalGlobal(0);
    lineasPedido = [];

    // Restaurar título de la pestaña
    const tabBtn = document.getElementById('btnTabNuevoPedido');
    if (tabBtn) tabBtn.textContent = 'Nuevo Pedido';
}

function cambiarPestana(idDestino) {
    document.querySelectorAll('.tabcontent').forEach(c => c.style.display = 'none');
    document.getElementById(idDestino).style.display = 'block';
    document.querySelectorAll('.tablinks').forEach(b => b.classList.remove('active'));

    if (idDestino === 'verHistorialUnificaciones') document.getElementById('btnTabHistorialUnificaciones').classList.add('active');
    if (idDestino === 'nvoPedido') document.getElementById('btnTabNuevoPedido').classList.add('active');
    if (idDestino === 'verPedidos') document.getElementById('defaultOpenPedidos').classList.add('active');
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tablinks');
    tabs.forEach(btn => btn.addEventListener('click', () => cambiarPestana(btn.dataset.target)));
}

function cerrarModal() {
    const modal = document.getElementById('modalFichaPedido');
    if (modal) modal.style.display = 'none';
    window.lineasEdicionPedido = []; // Limpiar memoria
}