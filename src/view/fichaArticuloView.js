// src/view/fichaArticuloView.js

export const FichaArticuloView = {

    // Método para rellenar el formulario
    render(articulo) {

        const txtId = document.getElementById('ficha-id');
        const txtNombre = document.getElementById('ficha-nombre');
        const txtCategoria = document.getElementById('ficha-categoria');
        const txtPrecio = document.getElementById('ficha-precio');
        const txtStockMin = document.getElementById('ficha-stock-min');
        const txtDescripcion = document.getElementById('ficha-descripcion');
        const imgProducto = document.getElementById('ficha-img');


        if (txtId) txtId.value = articulo.id;
        if (txtNombre) txtNombre.value = articulo.nombre;
        if (txtPrecio) txtPrecio.value = articulo.precio;
        if (txtStockMin) txtStockMin.value = articulo.stockMinimo || 0;
        if (txtDescripcion) txtDescripcion.value = articulo.descripcion || "Sin descripción detallada.";

        if (txtCategoria) {
            if (typeof articulo.categoria === 'object' && articulo.categoria !== null) {
                txtCategoria.value = articulo.categoria.nombre || articulo.categoria.descripcion || "Sin nombre";
            } else {
                txtCategoria.value = articulo.categoria || "Sin categoría";
            }
        }

        if (imgProducto && articulo.imagenUrl) {
            imgProducto.src = articulo.imagenUrl;
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

    // --- NUEVO: Recoger los datos para enviar al servicio ---
    getDatosFormulario() {
        return {
            nombre: document.getElementById('ficha-nombre').value,
            // OJO: La categoría aquí se guardará como TEXTO si la editan. 
            // Para mantenerla como objeto necesitarías un <select>, pero por ahora lo dejamos simple.
            categoria: document.getElementById('ficha-categoria').value,
            precio: parseFloat(document.getElementById('ficha-precio').value),
            stockMinimo: parseInt(document.getElementById('ficha-stock-min').value) || 0, descripcion: document.getElementById('ficha-descripcion').value,
            // Mantenemos la imagen si existe en el DOM, o vacía
            // Nota: Aquí no estamos gestionando subida de archivos real todavía
        };
    }
};