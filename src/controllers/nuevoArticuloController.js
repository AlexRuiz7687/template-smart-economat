import { createArticulo, getCategorias, getProveedores, createProveedor } from "../services/economatoService.js";

export async function inicializarNuevoArticulo() {
    console.log("Inicializando formulario de Nuevo Artículo...");

    // 1. CARGAR CATEGORÍAS
    try {
        const categorias = await getCategorias();
        const selectNuevo = document.getElementById('categoria');

        if (selectNuevo) {
            selectNuevo.innerHTML = '<option value="">-- Seleccionar Categoría --</option>';
            categorias.forEach(c => {
                const option = document.createElement('option');
                option.value = c.nombre || c;
                option.textContent = c.nombre || c;
                selectNuevo.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }

    // 2. CARGAR PROVEEDORES
    await cargarProveedores();

    // 3. EVENTO PARA DETECTAR "CREAR NUEVO PROVEEDOR"
    const selectProv = document.getElementById('proveedor');
    if (selectProv) {
        selectProv.addEventListener('change', async (e) => {
            if (e.target.value === 'ADD_NEW') {
                await crearNuevoProveedorDesdeSelect(selectProv);
            }
        });
    }

    // 4. ESCUCHAR EL BOTÓN GUARDAR
    const btnGuardar = document.getElementById('btnRegistrarArticulo');

    if (btnGuardar) {
        const nuevoBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nuevoBtn, btnGuardar);

        nuevoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await guardarArticulo();
        });
    }

    // 5. MANEJO DE IMAGEN (PREVIEW)
    const previewDiv = document.getElementById('preview-img');
    const inputImg = document.getElementById('inputImagen');

    if (previewDiv && inputImg) {
        // Al hacer clic en el div, abrir el input file
        previewDiv.addEventListener('click', () => {
            inputImg.click();
        });

        // Al seleccionar archivo, mostrar preview
        inputImg.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    previewDiv.innerHTML = `<img src="${evt.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                };
                reader.readAsDataURL(file);
            } else {
                previewDiv.innerHTML = 'Sin Imagen';
            }
        });
    }
}

async function cargarProveedores(seleccionado = null) {
    try {
        const proveedores = await getProveedores();
        const selectProv = document.getElementById('proveedor');

        if (selectProv) {
            selectProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>';

            // Opción para crear nuevo
            const optionNew = document.createElement('option');
            optionNew.value = "ADD_NEW";
            optionNew.textContent = "+ Crear Nuevo Proveedor...";
            optionNew.style.fontWeight = "bold";
            optionNew.style.color = "var(--cl-green-primary-light)";
            selectProv.appendChild(optionNew);

            // Separador
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = "-------------------";
            selectProv.appendChild(separator);

            // Listar proveedores
            proveedores.forEach(p => {
                const option = document.createElement('option');
                option.value = p.nombre; // Usamos el nombre como valor según estructura actual
                option.textContent = p.nombre;
                selectProv.appendChild(option);
            });

            if (seleccionado) {
                selectProv.value = seleccionado;
            }
        }
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
}

async function crearNuevoProveedorDesdeSelect(selectElement) {
    // Resetear selección temporalmente
    selectElement.value = "";

    const { value: formValues } = await Swal.fire({
        title: 'Nuevo Proveedor',
        width: '800px', // Hacemos el modal más ancho
        html: `
            <style>
                .swal2-html-container { text-align: left; }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-top: 10px;
                }
                .form-full { grid-column: span 3; }
                .form-2-3 { grid-column: span 2; }
                
                .form-group-swal {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .form-group-swal label {
                    font-size: 0.9em;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                .swal2-input, .swal2-textarea {
                    margin: 0 !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    font-size: 0.95em !important;
                    border: 1px solid var(--border-color) !important;
                    background: var(--bg-page) !important;
                    color: var(--text-primary) !important;
                }
                .swal2-textarea { height: 80px !important; resize: none; }
            </style>

            <div class="form-grid">
                <!-- Fila 1 -->
                <div class="form-group-swal">
                    <input id="swal-cif" class="swal2-input" placeholder="CIF / NIF *">
                </div>
                <div class="form-group-swal form-2-3">
                    <input id="swal-nombre" class="swal2-input" placeholder="Nombre de la Empresa *">
                </div>

                <!-- Fila 2 -->
                <div class="form-group-swal form-full">
                    <input id="swal-email" class="swal2-input" placeholder="Correo Electrónico">
                </div>

                <!-- Fila 3 -->
                <div class="form-group-swal">
                    <input id="swal-contacto" class="swal2-input" placeholder="Persona de Contacto">
                </div>
                <div class="form-group-swal">
                    <input id="swal-direccion" class="swal2-input" placeholder="Dirección / Isla">
                </div>
                 <div class="form-group-swal">
                    <input id="swal-telefono" class="swal2-input" placeholder="Teléfono">
                </div>

                <!-- Fila 4 -->
                <div class="form-group-swal form-full">
                    <textarea id="swal-notas" class="swal2-textarea" placeholder="Notas adicionales u observaciones..."></textarea>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Proveedor',
        confirmButtonColor: 'var(--cl-green-primary)',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const cif = document.getElementById('swal-cif').value;
            const nombre = document.getElementById('swal-nombre').value;
            const email = document.getElementById('swal-email').value;
            const contacto = document.getElementById('swal-contacto').value;
            const direccion = document.getElementById('swal-direccion').value;
            const telefono = document.getElementById('swal-telefono').value;
            const notas = document.getElementById('swal-notas').value;

            if (!nombre || !cif) {
                Swal.showValidationMessage('Por favor completa Nombre y CIF');
                return false;
            }

            return {
                cif: cif,
                nombre: nombre,
                email: email,
                contacto: contacto,
                direccion: direccion,
                telefono: telefono,
                observaciones: notas
            };
        }
    });

    if (formValues) {
        try {
            await createProveedor(formValues);

            Swal.fire({
                icon: 'success',
                title: '¡Proveedor creado!',
                text: `Se ha registrado a ${formValues.nombre}`,
                timer: 1500,
                showConfirmButton: false
            });

            // Recargar lista y seleccionar el nuevo
            await cargarProveedores(formValues.nombre);

        } catch (error) {
            Swal.fire('Error', 'No se pudo crear el proveedor: ' + error.message, 'error');
        }
    } else {
        // Si cancela, volver a poner el select en blanco (o en el valor anterior si pudieramos trackearlo)
        selectElement.value = "";
    }
}

async function guardarArticulo() {
    // CAPTURAR DATOS
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const proveedor = document.getElementById('proveedor').value;
    const inputImagen = document.getElementById('inputImagen');

    // Validación básica
    if (!nombre || !precio) {
        alert("El nombre Y el precio son obligatorios");
        return;
    }

    if (!proveedor || proveedor === "ADD_NEW") {
        alert("Debes seleccionar un proveedor válido");
        return;
    }

    // Recoger Alérgenos
    const alergenos = [];
    document.querySelectorAll('.alergeno-check:checked').forEach(chk => alergenos.push(chk.value));

    // Usamos FormData para enviar archivo + datos
    const formData = new FormData();
    formData.append('id', document.getElementById('codigo').value || Date.now().toString());
    formData.append('nombre', nombre);
    formData.append('proveedor', proveedor);
    formData.append('precio', precio);
    formData.append('unidad', document.getElementById('unidad').value);
    formData.append('descripcion', document.getElementById('descripcion').value);
    formData.append('categoria', document.getElementById('categoria').value);
    formData.append('caducidad', document.getElementById('caducidad').value);
    formData.append('stock', 0);
    formData.append('stockMinimo', document.getElementById('stockMinimo').value || 5);

    // Alergenos como JSON string (backend debe decodificar)
    formData.append('alergenos', JSON.stringify(alergenos));

    // Imagen (si existe)
    if (inputImagen && inputImagen.files.length > 0) {
        formData.append('file_imagen', inputImagen.files[0]);
    }

    try {
        await createArticulo(formData); // Enviamos FormData en lugar de objeto simple

        Swal.fire({
            title: '¡Guardado!',
            text: 'Artículo registrado correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });

        document.querySelector('.form-nuevo-articulo').reset();
        if (document.getElementById('preview-img')) {
            document.getElementById('preview-img').innerHTML = "Sin Imagen";
        }

        // Volver a la pestaña de listado tras un breve delay
        setTimeout(() => {
            const btnListado = document.getElementById('tab-verArticulos');
            if (btnListado) btnListado.click();
        }, 1500);

    } catch (error) {
        Swal.fire('Error', "Error al guardar: " + error.message, 'error');
    }
}