/* src/controllers/pedidosController.js */

import { getPedidos, createPedido, deletePedido, getProductosCompleto, updatePedido } from "../services/economatoService.js";
import { authService } from "../services/authService.js"; 
import { PedidosView } from "../view/pedidosView.js"; // Importamos la nueva vista

// Variables de estado
let usuarioActual = null;
let listaPedidos = [];
let listaProductosGlobal = [];
let lineasPedido = [];

export async function inicializarPedidos() {
    console.log("Inicializando módulo Pedidos...");

    usuarioActual = authService.getCurrentUser();

    if (!usuarioActual) {
        if(typeof Swal !== 'undefined') {
            await Swal.fire({title: 'Acceso Denegado', text: 'Debes iniciar sesión.', icon: 'error', showConfirmButton: false, timer: 2000});
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
    } catch (error) {
        console.error("Error en controlador pedidos:", error);
    }
}

function aplicarPermisosVisuales() {
    const panelAdmin = document.getElementById('panel-admin-actions');
    const inputSolicitante = document.getElementById('pedido-solicitante');

    if(inputSolicitante) {
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
    if(btnAdd) btnAdd.addEventListener('click', () => agregarLineaDOM());

    const btnGuardar = document.getElementById('btnGuardarPedido');
    if(btnGuardar) {
        const nuevoBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nuevoBtn, btnGuardar);
        nuevoBtn.addEventListener('click', async () => await manejarGuardarPedido());
    }

    const tbody = document.getElementById('tabla-pedidos-body');
    if(tbody) {
        tbody.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-editar-pedido');
            const btnDel = e.target.closest('.btn-borrar-pedido');

            // Importante: verificar que no tenga clase disabled
            if(btnEdit && !btnEdit.classList.contains('btn-disabled')) cargarPedidoEdicion(btnEdit.dataset.id);
            if(btnDel && !btnDel.classList.contains('btn-disabled')) manejarBorrarPedido(btnDel.dataset.id);
        });
    }

    const btnUnificar = document.getElementById('btnUnificar');
    if(btnUnificar) btnUnificar.addEventListener('click', procesarUnificacion);

    const btnVolverUni = document.getElementById('btnVolverDeUnificado');
    if(btnVolverUni) btnVolverUni.addEventListener('click', () => {
        document.getElementById('defaultOpenPedidos').click();
    });

    const inputBusqueda = document.getElementById('busquedaPedido');
    if(inputBusqueda) {
        inputBusqueda.addEventListener('keyup', (e) => {
            const texto = e.target.value.toLowerCase();
            const filtrados = listaPedidos.filter(p => 
                p.id.toString().includes(texto) || 
                (p.nombreSolicitante && p.nombreSolicitante.toLowerCase().includes(texto))
            );
            PedidosView.renderTabla(filtrados, usuarioActual);
        });
    }
}

// --- Lógica de Líneas (Delegando HTML a la Vista) ---

function agregarLineaDOM(prodId = '', cant = 1) {
    const tbody = document.getElementById('lineas-pedido-body');
    const index = lineasPedido.length; 
    
    // Modelo de datos
    lineasPedido.push({ productoId: prodId, cantidad: cant, subtotal: 0, precioUnitario: 0 });

    // 1. Pedir a la vista el elemento HTML (TR)
    const row = PedidosView.crearFilaLineaPedido(index, listaProductosGlobal, prodId, cant);
    tbody.appendChild(row);

    // 2. Adjuntar eventos a los elementos creados por la vista
    const select = row.querySelector('.linea-prod-select');
    const inputCant = row.querySelector('.linea-cant-input');
    const btnDel = row.querySelector('.linea-btn-del');

    const recalcular = () => {
        const selOption = select.options[select.selectedIndex];
        const precio = parseFloat(selOption.dataset.precio) || 0;
        const cantidad = parseFloat(inputCant.value) || 0;
        const totalLinea = precio * cantidad;

        if(lineasPedido[index]) {
            lineasPedido[index].productoId = select.value;
            lineasPedido[index].cantidad = cantidad;
            lineasPedido[index].precioUnitario = precio;
            lineasPedido[index].subtotal = totalLinea;
        }
        
        // Actualizar subtotal visualmente en la fila
        const spanSub = document.getElementById(`subtotal-${index}`);
        if(spanSub) spanSub.textContent = totalLinea.toFixed(2);
        
        actualizarTotalGlobal();
    };

    select.addEventListener('change', recalcular);
    inputCant.addEventListener('input', recalcular);
    
    // Disparar cálculo inicial si hay producto preseleccionado
    if(prodId) recalcular();

    btnDel.addEventListener('click', () => {
        row.remove();
        lineasPedido[index] = null; 
        actualizarTotalGlobal();
    });
}

function actualizarTotalGlobal() {
    const total = lineasPedido.reduce((acc, linea) => linea ? acc + linea.subtotal : acc, 0);
    PedidosView.mostrarTotalGlobal(total);
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
            Swal.fire({title: 'Éxito', text: 'Pedido modificado', icon: 'success', timer: 1500, showConfirmButton: false});
        } else {
            await createPedido(datos);
            Swal.fire({title: 'Éxito', text: 'Pedido enviado', icon: 'success', timer: 1500, showConfirmButton: false});
        }
        limpiarFormulario();
        await cargarListadoPedidos();
        document.getElementById('defaultOpenPedidos').click();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
}

async function cargarPedidoEdicion(id) {
    const pedido = listaPedidos.find(p => p.id == id);
    if(!pedido) return;
    
    document.getElementById('pedido-id-edicion').value = pedido.id;
    document.getElementById('pedido-fecha').value = pedido.fecha;
    document.getElementById('pedido-solicitante').value = pedido.nombreSolicitante; 
    
    limpiarFormulario(false);
    
    if(pedido.detalles) {
        pedido.detalles.forEach(d => agregarLineaDOM(d.productoId, d.cantidad));
    }
    cambiarPestana('nvoPedido');
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
    
    if(!result.isConfirmed) return;
    
    try {
        await deletePedido(id);
        Swal.fire({title: 'Eliminado', icon: 'success', timer: 1000, showConfirmButton: false});
        await cargarListadoPedidos();
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
}

// --- Unificación ---

function procesarUnificacion() {
    const checks = document.querySelectorAll('.check-unificar:checked');
    if(checks.length === 0) {
        Swal.fire('Atención', 'Selecciona al menos un pedido.', 'info');
        return;
    }
    
    const ids = Array.from(checks).map(c => c.value);
    const consolidado = {};
    
    ids.forEach(idPedido => {
        const pedido = listaPedidos.find(p => p.id == idPedido);
        if(pedido && pedido.detalles) {
            pedido.detalles.forEach(linea => {
                const prod = listaProductosGlobal.find(pr => pr.id == linea.productoId);
                const nombreProd = prod ? prod.nombre : 'Desconocido';
                const codigoProd = prod ? (prod.codigo || prod.id) : '-';
                const unidadProd = prod ? (prod.unidad || 'ud') : '';
                
                if(!consolidado[linea.productoId]) {
                    consolidado[linea.productoId] = { codigo: codigoProd, nombre: nombreProd, unidad: unidadProd, cantidad: 0 };
                }
                consolidado[linea.productoId].cantidad += parseFloat(linea.cantidad);
            });
        }
    });
    
    // Delegamos renderizado a la vista
    PedidosView.renderTablaUnificada(Object.values(consolidado));
    PedidosView.mostrarListaIdsUnificados(ids);
    
    cambiarPestana('vistaUnificacion');
}

// --- Utilidades ---

function limpiarFormulario(full = true) {
    if(full) {
        document.getElementById('pedido-id-edicion').value = '';
        document.getElementById('pedido-fecha').value = new Date().toISOString().split('T')[0];
    }
    document.getElementById('lineas-pedido-body').innerHTML = '';
    PedidosView.mostrarTotalGlobal(0);
    lineasPedido = [];
}

function cambiarPestana(idDestino) {
    document.querySelectorAll('.tabcontent').forEach(c => c.style.display = 'none');
    document.getElementById(idDestino).style.display = 'block';
    document.querySelectorAll('.tablinks').forEach(b => b.classList.remove('active'));
    
    if(idDestino === 'nvoPedido') document.getElementById('btnTabNuevoPedido').classList.add('active');
    if(idDestino === 'verPedidos') document.getElementById('defaultOpenPedidos').classList.add('active');
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tablinks');
    tabs.forEach(btn => btn.addEventListener('click', () => cambiarPestana(btn.dataset.target)));
}