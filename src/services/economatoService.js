const Api_URL = 'http://localhost/plantillas-smart-economat/src/services/API';

// 1. OBTENER PRODUCTOS
export async function getProductos() {
    try {
        const response = await fetch(`${Api_URL}/productos.php`);

        if (!response.ok) throw new Error("Error al cargar datos");

        const productos = await response.json();

        // Mapeamos para mantener compatibilidad con la vista
        return productos.map(p => ({
            id: p.id,
            productoId: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            stock: p.stock,
            stockMinimo: p.stockMinimo,
            precio: p.precio,
            categoria: p.categoria || 'Sin Categoría',
            proveedor: p.proveedor || 'Desconocido',
            imagen: p.imagen || 'no-image.png',
            descripcion: p.descripcion,
            unidadMedida: p.unidad_medida
        }));

    } catch (error) {
        console.error(error);
        return [];
    }
}


export { getProductos as getProductosCompleto };

export async function getCategorias() {
    try {
        const res = await fetch(`${Api_URL}/categorias.php`);
        if (!res.ok) throw new Error(`Error al obtener categorías`);
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getArticuloById(id) {
    try {
        const response = await fetch(`${Api_URL}/productos.php?id=${id}`);
        if (!response.ok) throw new Error("Error conexión");
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateArticulo(id, datosActualizados) {
    try {
        const response = await fetch(`${Api_URL}/productos.php?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });
        if (!response.ok) throw new Error("Error al actualizar");
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createArticulo(nuevoArticulo) {
    try {
        const isFormData = nuevoArticulo instanceof FormData;

        const options = {
            method: 'POST',
            body: isFormData ? nuevoArticulo : JSON.stringify(nuevoArticulo)
        };

        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }

        const response = await fetch(`${Api_URL}/productos.php`, options);

        if (!response.ok) {
            // Intentar obtener mensaje de error del backend
            let errorMessage = "Error al crear producto";
            try {
                const errorData = await response.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (e) {
                // Si no es JSON, usar texto plano o el status
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}


// --- SECCIÓN PROVEEDORES ---

export async function getProveedores() {
    try {
        const res = await fetch(`${Api_URL}/proveedores.php`);
        if (!res.ok) throw new Error(`Error al obtener proveedores`);
        return await res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}



export async function createProveedor(nuevoProveedor) {
    try {
        const response = await fetch(`${Api_URL}/proveedores.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProveedor)
        });

        if (!response.ok) throw new Error("Error al crear el proveedor");


        return await response.json();
    } catch (error) {
        console.error("Error en createProveedor:", error);
        throw error;
    }
}

// --- SECCIÓN PEDIDOS ---

// OBTENER PEDIDOS
export async function getPedidos() {
    try {
        // Corrección: Asumimos pedidos.php y usuarios.php existen
        const [pedidosRes, usuariosRes] = await Promise.all([
            fetch(`${Api_URL}/pedidos.php`),
            fetch(`${Api_URL}/usuarios.php`)
        ]);

        if (!pedidosRes.ok) return [];

        const pedidos = await pedidosRes.json();
        const usuarios = await usuariosRes.json();

        return pedidos.map(p => {
            const usuario = usuarios.find(u => u.id == p.id_usuario);
            return {
                ...p,
                nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Desconocido'
            };
        });

    } catch (error) {
        console.error(error);
        return [];
    }
}

// ELIMINAR PEDIDO
export async function deletePedido(id) {
    try {
        const response = await fetch(`${Api_URL}/pedidos.php?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Error al eliminar pedido");
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// ACTUALIZAR PEDIDO
export async function updatePedido(id, datos) {
    try {
        const response = await fetch(`${Api_URL}/pedidos.php?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) throw new Error("Error al actualizar el pedido");
        return await response.json();
    } catch (error) {
        console.error("Error updatePedido:", error);
        throw error;
    }
}

export async function createPedido(nuevoPedido) {
    try {
        const response = await fetch(`${Api_URL}/pedidos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoPedido)
        });

        if (!response.ok) throw new Error("Error al guardar el pedido");
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}


export async function getPedidoById(id) {
    try {
        const response = await fetch(`${Api_URL}/pedidos.php?id=${id}`);
        if (!response.ok) throw new Error("Error al obtener el pedido");

        const pedido = await response.json();

        // Mapeo para compatibilidad con el controlador
        // El controlador espera 'detalles' con 'productoId'
        if (pedido.lineas) {
            pedido.detalles = pedido.lineas.map(l => ({
                id: l.id,
                productoId: l.productoId,
                cantidad: l.cantidad,
                precioUnitario: l.precio,
                subtotal: l.subtotal
            }));
        }

        return pedido;
    } catch (error) {
        console.error("Error getPedidoById:", error);
        throw error;
    }
}

// ---- SECCIÓN PROVEEDORES UPDATE ------------

export async function updateProveedor(id, datosActualizados) {
    try {
        const response = await fetch(`${Api_URL}/proveedores.php?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (!response.ok) throw new Error("Error al actualizar proveedor");
        return await response.json();
    } catch (error) {
        console.error("Error updateProveedor:", error);
        throw error;
    }
}

export async function deleteProveedor(id) {
    try {
        const response = await fetch(`${Api_URL}/proveedores.php?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error("Error al eliminar proveedor");
        return true;
    } catch (error) {
        console.error("Error deleteProveedor:", error);
        throw error;
    }
}


// --- SECCIÓN UNIFICACIONES (HISTORIAL) ---

export async function getUnificaciones(id = null) {
    try {
        const url = id ? `${Api_URL}/unificaciones.php?id=${id}` : `${Api_URL}/unificaciones.php`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error al obtener historial unificaciones");
        return await response.json();
    } catch (error) {
        console.error("Error getUnificaciones:", error);
        throw error;
    }
}


export async function createUnificacion(datos) {
    try {
        const response = await fetch(`${Api_URL}/unificaciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) throw new Error("Error al guardar unificación");
        return await response.json();
    } catch (error) {
        console.error("Error createUnificacion:", error);
        throw error;
    }
}


// --- SECCIÓN RECEPCIONES (NUEVO) ---

export async function checkBarcode(code) {
    try {
        const response = await fetch(`${Api_URL}/recepcion.php?action=check_barcode&code=${code}`);
        if (!response.ok) throw new Error("Error verificando código");
        return await response.json();
    } catch (error) {
        console.error("Error checkBarcode:", error);
        throw error;
    }
}

export async function createRecepcion(datos) {
    try {
        const response = await fetch(`${Api_URL}/recepcion.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Error al registrar recepción");
        }
        return await response.json();
    } catch (error) {
        console.error("Error createRecepcion:", error);
        throw error;
    }
}

