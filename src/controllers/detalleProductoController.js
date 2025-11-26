// src/controllers/detalleProductoController.js

import { getArticuloById } from "../services/economatoService.js"; 
import { FichaArticuloView } from "../view/fichaArticuloView.js";

export async function inicializarDetalleProducto(id) {
    
    console.log(`Controlador Detalle iniciado para ID: ${id}`);

    if (!id) {
        FichaArticuloView.renderError("No se ha especificado un ID de producto.");
        return;
    }

    try {
        // 1. Llamamos al servicio para buscar los datos
        const articulo = await getArticuloById(id);

        console.log("Datos recibidos:", articulo);

        // 2. Llamamos a la vista para pintar los datos
        FichaArticuloView.render(articulo);

    } catch (error) {
        console.error(error);
        FichaArticuloView.renderError("Error al cargar la información del producto.");
    }
}