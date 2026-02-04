// src/view/fichaArticuloView.js

export const FichaArticuloView = {

    // Método para rellenar el formulario
    render(articulo) {

        const txtId = document.getElementById('ficha-id');
        const txtNombre = document.getElementById('ficha-nombre');
        const txtCategoria = document.getElementById('ficha-categoria');
        const txtPrecio = document.getElementById('ficha-precio');
        const txtStockMin = document.getElementById('ficha-stock-min');
        const txtUnidad = document.getElementById('ficha-unidad');
        const txtDescripcion = document.getElementById('ficha-descripcion');
        const imgProducto = document.getElementById('ficha-img');


        if (txtId) txtId.value = articulo.id;
        if (txtNombre) txtNombre.value = articulo.nombre;
        if (txtPrecio) txtPrecio.value = articulo.precio;
        if (txtStockMin) txtStockMin.value = articulo.stockMinimo || articulo.stock_minimo || 0;
        if (txtUnidad) txtUnidad.value = articulo.unidad || articulo.unidadMedida || articulo.unidad_medida || '';
        if (txtDescripcion) txtDescripcion.value = articulo.descripcion || "Sin descripción detallada.";

        if (txtCategoria) {
            if (typeof articulo.categoria === 'object' && articulo.categoria !== null) {
                txtCategoria.value = articulo.categoria.nombre || articulo.categoria.descripcion || "Sin nombre";
            } else {
                txtCategoria.value = articulo.categoria || "Sin categoría";
            }
        }

        // DEBUG: Ver qué llega
        console.log("Datos Artículo en Ficha:", articulo);
        console.log("Imagen recibida:", articulo.imagen, articulo.imagenUrl);

        // Corregido: Construir la ruta completa
        let nombreImagen = articulo.imagen || articulo.imagenUrl;

        if (imgProducto && nombreImagen) {
            nombreImagen = nombreImagen.trim(); // Limpiar espacios

            // Detectar si es URL completa (http, https, //) o Base64
            if (nombreImagen.match(/^(http|https|\/\/|data:)/i)) {
                imgProducto.src = nombreImagen;
            } else {
                // Si es nombre de archivo local, añadir ruta de assets
                imgProducto.src = `../assets/img/productos/${nombreImagen}`;
            }
        } else if (imgProducto) {
            imgProducto.src = "../assets/img/no-image.svg";
        }
    },

    // 
    renderError(mensaje) {
        const contenedor = document.querySelector('.card-producto');
        if (contenedor) {
            contenedor.innerHTML = `<h3 style="color:red; text-align:center">${mensaje}</h3>`;
        }
    },
    toggleEdicion(activar) {
        // Seleccionamos todos los inputs y textarea EXCEPTO el ID (ese nunca se edita)
        const inputs = document.querySelectorAll('.datos-producto input:not(#ficha-id), .datos-producto textarea');

        inputs.forEach(input => {
            input.disabled = !activar; // Si activar es true, disabled es false
        });

        // Alternar visibilidad de botones
        const btnEditar = document.getElementById('btn-editar');
        const btnGuardar = document.getElementById('btn-guardar');
        const btnCancelar = document.getElementById('btn-cancelar');

        if (activar) {
            btnEditar.classList.add('oculto');
            btnGuardar.classList.remove('oculto');
            btnCancelar.classList.remove('oculto');
        } else {
            btnEditar.classList.remove('oculto');
            btnGuardar.classList.add('oculto');
            btnCancelar.classList.add('oculto');
        }
    },

    // --- Recoger los datos para enviar al servicio ---
    getDatosFormulario() {
        return {
            nombre: document.getElementById('ficha-nombre').value,

            categoria: document.getElementById('ficha-categoria').value,
            precio: parseFloat(document.getElementById('ficha-precio').value),
            unidad: document.getElementById('ficha-unidad').value,
            stockMinimo: parseInt(document.getElementById('ficha-stock-min').value) || 0, descripcion: document.getElementById('ficha-descripcion').value,

        };
    }
};