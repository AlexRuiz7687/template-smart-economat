// src/view/fichaArticuloView.js

export const FichaArticuloView = {
    
    // Método para rellenar el formulario
    render(articulo) {

        const txtId = document.getElementById('ficha-id');
        const txtNombre = document.getElementById('ficha-nombre');
        const txtCategoria = document.getElementById('ficha-categoria');
        const txtPrecio = document.getElementById('ficha-precio');
        const txtStock = document.getElementById('ficha-stock');
        const txtDescripcion = document.getElementById('ficha-descripcion');
        const imgProducto = document.getElementById('ficha-img');

        
        if(txtId) txtId.value = articulo.id;
        if(txtNombre) txtNombre.value = articulo.nombre;
        if(txtPrecio) txtPrecio.value = articulo.precio;
        if(txtStock) txtStock.value = articulo.stock;
        if(txtDescripcion) txtDescripcion.value = articulo.descripcion || "Sin descripción detallada.";
        
        if(txtCategoria) {
            if (typeof articulo.categoria === 'object' && articulo.categoria !== null) {
                txtCategoria.value = articulo.categoria.nombre || articulo.categoria.descripcion || "Sin nombre";
            } else {
                txtCategoria.value = articulo.categoria || "Sin categoría";
            }
        }
        
        if(imgProducto && articulo.imagenUrl) {
            imgProducto.src = articulo.imagenUrl;
        }
    },

    // 
    renderError(mensaje) {
        const contenedor = document.querySelector('.card-producto');
        if(contenedor) {
            contenedor.innerHTML = `<h3 style="color:red; text-align:center">${mensaje}</h3>`;
        }
    }
};