/* src/controllers/recepcionController.js */

import { getProveedores, getProductosCompleto, updateArticulo, updatePedido, getPedidos, deletePedido, createPedido } from "../services/economatoService.js";
import { authService } from "../services/authService.js";
import { RecepcionView } from "../view/recepcionView.js";

// --- ESTADO LOCAL ---
let listaRecepciones = [];
let listaProductos = [];
let listaProveedores = [];
let lineasRecepcion = [];

export async function inicializarRecepcion(tab = null) {
    console.log("Inicializando Recepción...");
    
    const user = authService.getCurrentUser();
    if (!user) { window.location.href = '../index.html'; return; }

    try {
        setupTabsDirecto();
        configurarEventos(); 
        await cargarDatosMaestros();
        await cargarHistorial();

        if (tab === 'nvaRecepcion') {
            const btnNueva = document.getElementById('btnTabNuevaRecepcion');
            if (btnNueva) {
                console.log("Auto-navegando a Nueva Recepción");
                btnNueva.click();
            }
        } else {
            const btnHist = document.getElementById('defaultOpenRecepcion');
            if (btnHist) btnHist.click();
        }

    } catch (e) {
        console.error("Error init recepcion:", e);
    }
}

// --- PESTAÑAS ---
function setupTabsDirecto() {
    const btnHist = document.getElementById('defaultOpenRecepcion');
    const btnNueva = document.getElementById('btnTabNuevaRecepcion');
    
    // Validamos que existan
    if (!btnHist || !btnNueva) return;

    // 1. Reemplazo del Botón Historial (Clonado para limpiar eventos previos)
    const nuevoBtnHist = btnHist.cloneNode(true);
    btnHist.parentNode.replaceChild(nuevoBtnHist, btnHist);
    
    nuevoBtnHist.addEventListener('click', () => {
        cambiarPestaña('historialRecepciones', nuevoBtnHist);
        cargarHistorial(); // Acción específica de esta pestaña
    });

    // 2. Reemplazo del Botón Nueva (Clonado)
    const nuevoBtnNueva = btnNueva.cloneNode(true);
    btnNueva.parentNode.replaceChild(nuevoBtnNueva, btnNueva);

    nuevoBtnNueva.addEventListener('click', () => {
        cambiarPestaña('nvaRecepcion', nuevoBtnNueva);
        limpiarFormulario(); // Acción específica de esta pestaña
    });
}

/**
 * Función auxiliar para manejar la lógica visual de las pestañas.
 * Se encarga de limpiar TODOS los botones activos y activar solo el actual.
 */
function cambiarPestaña(targetId, botonClickado) {
    // Quitar clase 'active' de TODOS los botones de tabulación que existan en el DOM
    const todosBotones = document.querySelectorAll('.tablinks');
    todosBotones.forEach(btn => btn.classList.remove('active'));

    // Ocultar TODOS los contenidos
    const todosContenidos = document.querySelectorAll('.tabcontent');
    todosContenidos.forEach(div => {
        div.style.display = 'none';
        div.classList.remove('active-tab');
    });

    // Activar el botón pulsado
    botonClickado.classList.add('active');

    // Mostrar el contenido destino
    const divDestino = document.getElementById(targetId);
    if(divDestino) {
        divDestino.style.display = 'block';
        divDestino.classList.add('active-tab');
    }
}

// --- CARGA DE DATOS ---
async function cargarDatosMaestros() {
    const [prods, provs] = await Promise.all([getProductosCompleto(), getProveedores()]);
    listaProductos = prods;
    listaProveedores = provs;

    const selProv = document.getElementById('recep-proveedor');
    if(selProv) {
        selProv.innerHTML = '<option value="">-- Seleccionar --</option>';
        listaProveedores.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nombre;
            selProv.appendChild(opt);
        });
    }
}

async function cargarHistorial() {
    try {
        const pedidos = await getPedidos(); 
        // Filtramos solo los RECIBIDOS (Historial de Recepciones)
        const historial = pedidos.filter(p => p.estado && p.estado.toLowerCase() === 'recibido'); 

        listaRecepciones = historial.map(r => {
            const prov = listaProveedores.find(p => p.id == r.proveedorId);
            return { 
                ...r, 
                nombreProveedor: prov ? prov.nombre : 'Desconocido',
                albaran: r.albaran || '-' 
            };
        });
        
        RecepcionView.renderTablaHistorial(listaRecepciones);
    } catch (e) { console.error(e); }
}

// --- EVENTOS ---
function configurarEventos() {
    // Agregar Línea
    const btnAdd = document.getElementById('btnAgregarLineaRecep');
    if(btnAdd) {
        const nBtn = btnAdd.cloneNode(true);
        btnAdd.parentNode.replaceChild(nBtn, btnAdd);
        nBtn.addEventListener('click', (e) => { e.preventDefault(); agregarLineaDOM(); });
    }

    // Guardar
    const btnGuardar = document.getElementById('btnGuardarRecepcion');
    if(btnGuardar) {
        const nBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nBtn, btnGuardar);
        nBtn.addEventListener('click', (e) => { e.preventDefault(); manejarGuardarRecepcion(); });
    }

    // Delegación Tabla Historial (Editar / Borrar)
    const tabla = document.getElementById('tabla-recepcion-body');
    if(tabla) {
        // Clonamos la tabla también para limpiar eventos antiguos si se recarga el módulo
        const nuevaTabla = tabla.cloneNode(true);
        tabla.parentNode.replaceChild(nuevaTabla, tabla);
        
        nuevaTabla.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-editar-recepcion');
            const btnDel = e.target.closest('.btn-borrar-recepcion');

            if(btnEdit) cargarRecepcionParaEditar(btnEdit.dataset.id);
            if(btnDel) manejarBorrarRecepcion(btnDel.dataset.id);
        });
    }
}

// --- LÓGICA DE LÍNEAS ---
function agregarLineaDOM(datos = {}) {
    const tbody = document.getElementById('lineas-recepcion-body');
    const index = lineasRecepcion.length;

    lineasRecepcion.push({
        productoId: datos.productoId || '',
        cantidad: datos.cantidad || 0,
        coste: datos.coste || 0,
        impuestos: datos.impuestos || 0,
        importe: datos.importe || 0,
        observaciones: datos.observaciones || ''
    });

    const row = RecepcionView.crearFilaLineaRecepcion(index, listaProductos, datos);
    tbody.appendChild(row);

    // Eventos inputs fila
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => recalcularFila(index, row));
    });

    // Evento borrar fila
    const btnDel = row.querySelector('.linea-del');
    if(btnDel) {
        btnDel.addEventListener('click', () => {
            row.remove();
            lineasRecepcion[index] = null; 
            actualizarTotalGlobal();
        });
    }
}

function recalcularFila(index, row) {
    const cantEl = row.querySelector('.linea-cant');
    const costeEl = row.querySelector('.linea-coste');
    const impEl = row.querySelector('.linea-imp');
    const prodEl = row.querySelector('.linea-prod-select');
    const obsEl = row.querySelector('.linea-obs');

    if (!cantEl) return;

    const cant = parseFloat(cantEl.value) || 0;
    const coste = parseFloat(costeEl.value) || 0;
    const imp = parseFloat(impEl.value) || 0;
    
    // Cálculo: Base + Impuestos
    const base = cant * coste;
    const total = base + (base * (imp / 100));

    row.querySelector('.linea-total').value = total.toFixed(2);

    if(lineasRecepcion[index]) {
        lineasRecepcion[index].productoId = prodEl.value;
        lineasRecepcion[index].cantidad = cant;
        lineasRecepcion[index].coste = coste;
        lineasRecepcion[index].impuestos = imp;
        lineasRecepcion[index].importe = total;
        lineasRecepcion[index].observaciones = obsEl.value;
    }
    actualizarTotalGlobal();
}

function actualizarTotalGlobal() {
    const total = lineasRecepcion.reduce((acc, l) => l ? acc + l.importe : acc, 0);
    RecepcionView.mostrarTotalGlobal(total);
}

// --- CRUD ---

// C: CREAR / U: ACTUALIZAR
async function manejarGuardarRecepcion() {
    const idEdicion = document.getElementById('recepcion-id-edicion').value;
    const provId = document.getElementById('recep-proveedor').value;
    const albaran = document.getElementById('recep-albaran').value;
    const lineasValidas = lineasRecepcion.filter(l => l && l.productoId);

    if(!provId || !albaran) {
        Swal.fire('Faltan datos', 'Proveedor y Albarán obligatorios.', 'warning');
        return;
    }
    if(lineasValidas.length === 0) {
        Swal.fire('Error', 'Añade líneas.', 'warning');
        return;
    }

    const datosRecepcion = {
        proveedorId: provId,
        albaran: albaran,
        fecha: document.getElementById('recep-fecha').value,
        concordancia: document.getElementById('recep-concordancia').value,
        total: parseFloat(document.getElementById('recep-total-global').textContent),
        detalles: lineasValidas,
        estado: 'Recibido', // Marcar como finalizado
        fechaRecepcion: new Date().toISOString()
    };

    try {
        if (idEdicion) {
            // --- MODO EDICIÓN ---
            await updatePedido(idEdicion, datosRecepcion);
            Swal.fire('Actualizado', 'Datos de recepción modificados.', 'success');
        } else {
            // --- MODO NUEVA RECEPCIÓN ---
            await createPedido(datosRecepcion); 

            // 2. ACTUALIZAR STOCK 
            for (const linea of lineasValidas) {
                const prod = listaProductos.find(p => p.id == linea.productoId);
                if(prod) {
                    const nuevoStock = parseFloat(prod.stock || 0) + parseFloat(linea.cantidad);
                    await updateArticulo(prod.id, { 
                        stock: nuevoStock,
                        precio: linea.coste // Actualizamos coste
                    });
                }
            }
            Swal.fire('Registrado', 'Entrada y Stock actualizados.', 'success');
        }

        limpiarFormulario();
        await cargarHistorial();
        
        document.getElementById('defaultOpenRecepcion').click();

    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
}

// R: LEER (Cargar para editar)
async function cargarRecepcionParaEditar(id) {
    const recepcion = listaRecepciones.find(r => r.id == id);
    if(!recepcion) return;

    // Rellenar cabecera
    document.getElementById('recepcion-id-edicion').value = recepcion.id;
    document.getElementById('recep-proveedor').value = recepcion.proveedorId;
    document.getElementById('recep-albaran').value = recepcion.albaran;
    document.getElementById('recep-fecha').value = recepcion.fecha;
    document.getElementById('recep-concordancia').value = recepcion.concordancia || 'SI';

    // Rellenar líneas
    document.getElementById('lineas-recepcion-body').innerHTML = '';
    lineasRecepcion = [];
    
    if(recepcion.detalles) {
        recepcion.detalles.forEach(d => agregarLineaDOM(d));
    }
    actualizarTotalGlobal();

    // Cambiar a pestaña formulario
    const btnNueva = document.getElementById('btnTabNuevaRecepcion');
    btnNueva.click(); 
    btnNueva.textContent = "Editar Recepción"; 
}

// D: BORRAR
async function manejarBorrarRecepcion(id) {
    const result = await Swal.fire({
        title: '¿Eliminar Recepción?',
        text: "Esto borrará el registro del historial. (El stock NO se revertirá automáticamente).",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Eliminar'
    });

    if(!result.isConfirmed) return;

    try {
        await deletePedido(id);
        Swal.fire('Eliminado', 'Registro borrado.', 'success');
        await cargarHistorial();
    } catch (e) {
        Swal.fire('Error', 'No se pudo borrar', 'error');
    }
}

function limpiarFormulario() {
    document.getElementById('formNuevaRecepcion').reset();
    document.getElementById('recepcion-id-edicion').value = '';
    document.getElementById('lineas-recepcion-body').innerHTML = '';
    document.getElementById('recep-total-global').textContent = '0.00';
    const btnNueva = document.getElementById('btnTabNuevaRecepcion');
    if(btnNueva) btnNueva.textContent = "Nueva Recepción (Albarán)";
    lineasRecepcion = [];
}