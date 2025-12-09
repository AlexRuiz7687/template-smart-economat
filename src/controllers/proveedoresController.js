/* src/controllers/proveedoresController.js */

import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from "../services/economatoService.js";
import { renderTablaProveedores } from "../view/proveedoresView.js";

let listaProveedores = [];

export async function inicializarProveedores() {
    console.log("Inicializando Proveedores...");

    try {
        // 1. CONFIGURAR TABS
        setupTabs();

        // 2. CARGAR DATOS
        await cargarDatos();

        // 3. EVENTOS GLOBALES
        configurarEventos();

    } catch (error) {
        console.error("Error en controlador proveedores:", error);
    }
}

async function cargarDatos() {
    listaProveedores = await getProveedores();
    renderTablaProveedores(listaProveedores);
}

function configurarEventos() {
    // A) BUSCADOR
    const inputBusqueda = document.getElementById('busquedaProveedor');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', (e) => {
            const texto = e.target.value.toLowerCase();
            const filtrados = listaProveedores.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(texto)) ||
                (p.cif && p.cif.toLowerCase().includes(texto))
            );
            renderTablaProveedores(filtrados);
        });
    }

    // B) BOTÓN CREAR (Nuevo Proveedor)
    const btnGuardarNuevo = document.getElementById('btnGuardarProveedor');
    if (btnGuardarNuevo) {
        const nuevoBtn = btnGuardarNuevo.cloneNode(true);
        btnGuardarNuevo.parentNode.replaceChild(nuevoBtn, btnGuardarNuevo);
        nuevoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await manejarCrearProveedor();
        });
    }

    // C) EVENTOS EN LA TABLA (Delegación para Editar y Borrar)
    const tablaBody = document.getElementById('tabla-proveedores-body');
    if (tablaBody) {
        tablaBody.addEventListener('click', async (e) => {
            const btnEditar = e.target.closest('.btn-editar');
            const btnBorrar = e.target.closest('.btn-borrar');

            if (btnEditar) {
                const id = btnEditar.dataset.id;
                abrirFichaEdicion(id);
            }

            if (btnBorrar) {
                const id = btnBorrar.dataset.id;
                await manejarBorrarProveedor(id);
            }
        });
    }

    // D) EVENTOS FICHA EDICIÓN
    const btnVolver = document.getElementById('btnVolverProv');
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            document.getElementById('defaultOpenProv').click(); // Volver al listado
        });
    }

    const btnGuardarEdicion = document.getElementById('btnGuardarEdicionProv');
    if (btnGuardarEdicion) {
        btnGuardarEdicion.addEventListener('click', async () => {
            await manejarGuardarEdicion();
        });
    }
}

// --- LÓGICA DE CREACIÓN ---
async function manejarCrearProveedor() {
    const cif = document.getElementById('prov-cif').value.trim();
    const nombre = document.getElementById('prov-nombre').value.trim();

    // VALIDACIÓN (Reemplazo de alert)
    if (!nombre || !cif) {
        Swal.fire({
            title: 'SmartEconomat',
            text: "El Nombre y el CIF son obligatorios.",
            icon: 'warning',
            confirmButtonColor: '#2a9d8f'
        });
        return;
    }

    const nuevoProveedor = {
        cif,
        nombre,
        telefono: document.getElementById('prov-telefono').value.trim(),
        email: document.getElementById('prov-email').value.trim(),
        contacto: document.getElementById('prov-contacto').value.trim(),
        direccion: document.getElementById('prov-direccion').value.trim(),
        notas: document.getElementById('prov-notas').value.trim()
    };

    try {
        await createProveedor(nuevoProveedor);
        
        // ÉXITO (Reemplazo de alert)
        await Swal.fire({
            title: 'SmartEconomat',
            text: 'Proveedor creado correctamente',
            icon: 'success',
            confirmButtonColor: '#2a9d8f', 
            timer: 1500,
            showConfirmButton: false
        });

        document.getElementById('formNuevoProveedor').reset();
        await cargarDatos();
        document.getElementById('defaultOpenProv').click();

    } catch (error) {
        // ERROR (Reemplazo de alert)
        Swal.fire({
            title: 'SmartEconomat',
            text: "Error al crear: " + error.message,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    }
}

// --- LÓGICA DE EDICIÓN (ABRIR FICHA) ---
function abrirFichaEdicion(id) {
    const proveedor = listaProveedores.find(p => p.id == id);
    if (!proveedor) return;

    // 1. Llenar formulario
    document.getElementById('edit-prov-id').value = proveedor.id;
    document.getElementById('edit-prov-cif').value = proveedor.cif || '';
    document.getElementById('edit-prov-nombre').value = proveedor.nombre || '';
    document.getElementById('edit-prov-telefono').value = proveedor.telefono || '';
    document.getElementById('edit-prov-email').value = proveedor.email || '';
    document.getElementById('edit-prov-contacto').value = proveedor.contacto || '';
    document.getElementById('edit-prov-direccion').value = proveedor.direccion || '';
    document.getElementById('edit-prov-notas').value = proveedor.notas || '';

    document.getElementById('titulo-ficha-prov').textContent = `Editar: ${proveedor.nombre}`;

    // 2. Mostrar pestaña de Ficha
    ocultarTodasPestanas();
    document.getElementById('fichaProveedor').style.display = 'block';
}

// --- LÓGICA DE GUARDAR EDICIÓN ---
async function manejarGuardarEdicion() {
    const id = document.getElementById('edit-prov-id').value;
    const nombre = document.getElementById('edit-prov-nombre').value.trim();

    // VALIDACIÓN (Reemplazo de alert)
    if (!nombre) {
        Swal.fire({
            title: 'SmartEconomat',
            text: "El nombre no puede estar vacío",
            icon: 'warning',
            confirmButtonColor: '#2a9d8f'
        });
        return;
    }

    const datosEditados = {
        cif: document.getElementById('edit-prov-cif').value.trim(),
        nombre: nombre,
        telefono: document.getElementById('edit-prov-telefono').value.trim(),
        email: document.getElementById('edit-prov-email').value.trim(),
        contacto: document.getElementById('edit-prov-contacto').value.trim(),
        direccion: document.getElementById('edit-prov-direccion').value.trim(),
        notas: document.getElementById('edit-prov-notas').value.trim()
    };

    try {
        await updateProveedor(id, datosEditados);
        
        // ÉXITO (Reemplazo de alert)
        await Swal.fire({
            title: 'SmartEconomat',
            text: 'Proveedor actualizado correctamente',
            icon: 'success',
            confirmButtonColor: '#2a9d8f',
            timer: 1500,
            showConfirmButton: false
        });

        await cargarDatos();
        document.getElementById('defaultOpenProv').click(); // Volver al listado

    } catch (error) {
        // ERROR (Reemplazo de alert)
        Swal.fire({
            title: 'SmartEconomat',
            text: "Error al actualizar: " + error.message,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    }
}

// --- LÓGICA DE BORRADO ---
async function manejarBorrarProveedor(id) {

    // CONFIRMACIÓN (Ya estaba con Swal, mantenemos estilos)
    const result = await Swal.fire({
        title: 'SmartEconomat',
        text: "¿Estás seguro de eliminar este proveedor? No podrás deshacerlo.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545', // Rojo
        cancelButtonColor: '#6c757d',  // Gris
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'rounded-popup'
        }
    });

    if (!result.isConfirmed) return;

    try {
        await deleteProveedor(id);

        // ÉXITO
        await Swal.fire({
            title: 'SmartEconomat',
            text: 'El proveedor ha sido eliminado correctamente.',
            icon: 'success',
            confirmButtonColor: '#2a9d8f', // Verde
            timer: 2000,
            showConfirmButton: false
        });

        await cargarDatos();

    } catch (error) {
        // ERROR
        Swal.fire({
            title: 'SmartEconomat',
            text: "Error al eliminar: " + error.message,
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    }
}

// --- UTILIDADES TABS ---
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tablinks');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            ocultarTodasPestanas();

            const targetDiv = document.getElementById(targetId);
            if (targetDiv) targetDiv.style.display = 'block';

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function ocultarTodasPestanas() {
    const tabContents = document.querySelectorAll('.tabcontent');
    tabContents.forEach(content => content.style.display = 'none');
}