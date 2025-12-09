const Api_URL = 'http://localhost:3000';

// 1. OBTENER PRODUCTOS (JOIN COMPLETO)

export async function getProductos() {
  try {
    // Pedimos todo en paralelo
    const [productosRes, proveedoresRes, relacionesRes, inventarioRes, categoriasRes] = await Promise.all([
      fetch(`${Api_URL}/productos`),
      fetch(`${Api_URL}/proveedores`),
      fetch(`${Api_URL}/producto_proveedor`),
      fetch(`${Api_URL}/inventario`),
      fetch(`${Api_URL}/categorias`)
    ]);

    if (!productosRes.ok) throw new Error("Error al cargar datos");

    const productos = await productosRes.json();
    const proveedores = await proveedoresRes.json();
    const relaciones = await relacionesRes.json();
    // const inventario = await inventarioRes.json(); // YA NO LO USAMOS PARA EL STOCK
    const categorias = await categoriasRes.json();

    // Mapeamos basándonos en las relaciones (o podrías hacerlo directo de productos si quisieras simplificar más)
    const datosUnificados = relaciones.map(relacion => {
        
        // Buscamos el producto real
        const prodBase = productos.find(p => p.id == relacion.id_producto);
        const provBase = proveedores.find(p => p.id == relacion.id_proveedor);

        // Nombre de categoría
        let nombreCategoria = 'General';
        if (prodBase && prodBase.categoriaId) {
            // Buscamos por ID o nombre, según cómo lo guardes
            const catObj = categorias.find(c => c.id == prodBase.categoriaId || c.nombre == prodBase.categoriaId);
            if (catObj) nombreCategoria = catObj.nombre || catObj;
        }

        return {
            id: relacion.id,           // ID de la relación (Fila)
            
            // --- CORRECCIÓN CLAVE 1: ID REAL DEL PRODUCTO ---
            productoId: prodBase ? prodBase.id : null, 
            
            codigo: relacion.codigo || (prodBase ? prodBase.codigo : ''),
            nombre: prodBase ? prodBase.nombre : 'Producto no encontrado',
            
            // --- CORRECCIÓN CLAVE 2: EL STOCK VIENE DE PRODUCTOS (prodBase) ---
            // Antes leías de 'invBase', ahora leemos de 'prodBase' que es donde guardas.
            stock: prodBase ? parseInt(prodBase.stock || 0) : 0,
            stockMinimo: prodBase ? parseInt(prodBase.stockMinimo || 0) : 0,
            
            precio: relacion.precio, // O prodBase.precio si lo prefieres
            categoria: nombreCategoria, 
            proveedor: provBase ? provBase.nombre : 'Sin proveedor',
            imagen: prodBase ? prodBase.imagenUrl : 'no-image.png'
        };
    });

    return datosUnificados;

  } catch (error) {
    console.error(error);
    return [];
  }
}

// Alias para compatibilidad con controladores que buscan "getProductosCompleto"
export { getProductos as getProductosCompleto };

export async function getCategorias() {
  try {
    const res = await fetch(`${Api_URL}/categorias`);
    if (!res.ok) throw new Error(`Error al obtener categorías`);
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getArticuloById(id) {
    try {
        const response = await fetch(`${Api_URL}/productos/${id}`); // OJO: Para detalle completo deberías usar getProductos() y find
        if (!response.ok) throw new Error("Error conexión");
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateArticulo(id, datosActualizados) {
    try {
        const response = await fetch(`${Api_URL}/productos/${id}`, {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });
        if(!response.ok) throw new Error("Error al actualizar");
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createArticulo(nuevoArticulo) {
     try {
        // 1. Guardamos el producto base
        const response = await fetch(`${Api_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: nuevoArticulo.id,
                nombre: nuevoArticulo.nombre,
                descripcion: nuevoArticulo.descripcion,
                categoriaId: nuevoArticulo.categoria, 
                imagen: "no-image.png"
            })
        });

        if(!response.ok) throw new Error("Error al crear producto base");
        
    
        
        return await response.json();
     } catch (error) {
         console.error(error);
         throw error;
     }
}


// --- SECCIÓN PROVEEDORES ---

export async function getProveedores() {
  try {
    const res = await fetch(`${Api_URL}/proveedores`);
    if (!res.ok) throw new Error(`Error al obtener proveedores`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}



export async function createProveedor(nuevoProveedor) {
    try {
        const response = await fetch(`${Api_URL}/proveedores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProveedor)
        });

        if (!response.ok) throw new Error("Error al crear el proveedor");
        
        // Retornamos el proveedor creado (incluyendo el ID generado automáticamente)
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
        const [pedidosRes, usuariosRes] = await Promise.all([
            fetch(`${Api_URL}/pedidos`),
            fetch(`${Api_URL}/usuarios`)
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
        const response = await fetch(`${Api_URL}/pedidos/${id}`, {
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
        const response = await fetch(`${Api_URL}/pedidos/${id}`, {
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
        const response = await fetch(`${Api_URL}/pedidos`, {
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

// ---- SECCIÓN PROVEEDORES ------------

export async function updateProveedor(id, datosActualizados) {
    try {
        const response = await fetch(`${Api_URL}/proveedores/${id}`, {
            method: 'PATCH', // Usamos PATCH para actualizar solo lo que cambie
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
        const response = await fetch(`${Api_URL}/proveedores/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error("Error al eliminar proveedor");
        return true; 
    } catch (error) {
        console.error("Error deleteProveedor:", error);
        throw error;
    }
}
