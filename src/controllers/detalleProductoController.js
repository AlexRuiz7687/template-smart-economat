// src/controllers/detalleProductoController.js

// IMPORTS
import { getArticuloById, updateArticulo } from "../services/economatoService.js";
import { FichaArticuloView } from "../view/fichaArticuloView.js";

export async function inicializarDetalleProducto(id) {
    
    console.log(`Controlador Detalle para ID: ${id}`);
    
    if (!id) {
        FichaArticuloView.renderError("No ID"); 
        return;
    }

    // Variable para guardar el objeto original en memoria
    let articuloOriginal = null;

    try {
        // Cargar datos iniciales
        articuloOriginal = await getArticuloById(id);
        FichaArticuloView.render(articuloOriginal);

    } catch (error) {
        FichaArticuloView.renderError("Error cargando producto");
        return; // Salimos si falla la carga
    }

    // --- GESTIÓN DE BOTONES ---
    const btnEditar = document.getElementById('btn-editar');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');

    // Click en Editar
    if(btnEditar) {
        btnEditar.addEventListener('click', () => {
            FichaArticuloView.toggleEdicion(true); // Activa inputs
        });
    }

    // Click en Cancelar
    if(btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            // Restauramos los valores originales visualmente
            FichaArticuloView.render(articuloOriginal);
            // Bloqueamos inputs
            FichaArticuloView.toggleEdicion(false);
        });
    }

    // Click en Guardar
    if(btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            try {
                // Recoger datos nuevos
                const datosNuevos = FichaArticuloView.getDatosFormulario();
                
                // Combinar con el ID original y datos que no están en el form
                // Usamos Spread Operator (...) para mezclar: original + nuevos
                const productoAEnviar = { 
                    ...articuloOriginal, 
                    ...datosNuevos 
                };

                console.log("Enviando actualización:", productoAEnviar);

                // Llamar al servicio UPDATE
                await updateArticulo(id, productoAEnviar);

                // Éxito: Actualizamos el 'original' con lo nuevo y bloqueamos
                articuloOriginal = productoAEnviar; 
                alert("¡Producto actualizado correctamente!");
                
                FichaArticuloView.render(articuloOriginal); // Refresca visual
                FichaArticuloView.toggleEdicion(false); // Bloquea inputs

            } catch (error) {
                console.error(error);
                alert("Error al guardar los cambios.");
            }
        });
    }
}