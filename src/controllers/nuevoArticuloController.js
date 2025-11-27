import { createArticulo, getCategorias } from "../services/economatoService.js";

export async function inicializarNuevoArticulo() {
    console.log("Inicializando formulario de Nuevo Artículo...");

    // 1. LLENAR SELECT DE CATEGORÍAS
    try {
        const categorias = await getCategorias();
        const selectNuevo = document.getElementById('categoria'); // ID coincide con tu HTML
        
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

    // 2. ESCUCHAR EL BOTÓN
    const btnGuardar = document.getElementById('btnRegistrarArticulo'); 
    
    if (btnGuardar) {
        const nuevoBtn = btnGuardar.cloneNode(true);
        btnGuardar.parentNode.replaceChild(nuevoBtn, btnGuardar);

        nuevoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await guardarArticulo();
        });
    }
}

async function guardarArticulo() {
    // 3. CAPTURAR DATOS (IDs exactos de tu HTML)
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    
    // Validación básica
    if (!nombre || !precio) {
        alert("El nombre y el precio son obligatorios");
        return;
    }

    // Recoger Alérgenos
    const alergenos = [];
    document.querySelectorAll('.alergeno-check:checked').forEach(chk => alergenos.push(chk.value));

    const datos = {
        id: document.getElementById('codigo').value || Date.now().toString(),
        nombre: nombre,
        distribuidor: document.getElementById('distribuidor').value,
        precio: parseFloat(precio),
        unidad: document.getElementById('unidad').value,
        descripcion: document.getElementById('descripcion').value,
        categoria: document.getElementById('categoria').value,
        caducidad: document.getElementById('caducidad').value,
        alergenos: alergenos,
        stock: 0, // Valor por defecto
        stockMinimo: 5, // Valor por defecto
        imagenUrl: "no-image.png"
    };

    try {
        await createArticulo(datos);
        alert("¡Artículo guardado correctamente!");
        document.querySelector('.form-nuevo-articulo').reset(); 
        
        // Volver a la pestaña de listado
        document.getElementById('defaultOpen').click();
        
    } catch (error) {
        alert("Error al guardar: " + error.message);
    }
}