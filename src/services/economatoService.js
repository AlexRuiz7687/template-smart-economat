const Api_URL = 'http://localhost:3000';

export async function getProductos() {
  try {
  // PEDIR TODAS LAS TABLAS
    const [productosRes, proveedoresRes, relacionesRes, inventarioRes, categoriasRes] = await Promise.all([
      fetch(`${Api_URL}/productos`),
      fetch(`${Api_URL}/proveedores`),
      fetch(`${Api_URL}/producto_proveedor`),
      fetch(`${Api_URL}/inventario`),
      fetch(`${Api_URL}/categorias`)
    ]);

    if (!productosRes.ok || !proveedoresRes.ok || !relacionesRes.ok || !inventarioRes.ok) {
      throw new Error("Error al cargar alguna de las tablas de la base de datos");
    }

    const productos = await productosRes.json();
    const proveedores = await proveedoresRes.json();
    const relaciones = await relacionesRes.json();
    const inventario = await inventarioRes.json();
    const categorias = await categoriasRes.json();

    // UNIFICAR DATOS
    // Recorremos la tabla intermedia producto_proveedor que es la que conecta todo
    const datosUnificados = relaciones.map(relacion => {
        
        
        const prodBase = productos.find(p => p.id == relacion.id_producto);
        const provBase = proveedores.find(p => p.id == relacion.id_proveedor);
        const invBase = inventario.find(i => i.id_producto_proveedor == relacion.id);

        let nombreCategoria = 'General';
        if (prodBase && prodBase.categoriaId) {
            const catObj = categorias.find(c => c.id == prodBase.categoriaId);
            if (catObj) nombreCategoria = catObj.nombre;
        }

        return {
            id: relacion.id,
            codigo: relacion.codigo,
            
            // Datos del Producto
            nombre: prodBase ? prodBase.nombre : 'Producto no encontrado',
            descripcion: prodBase ? prodBase.descripcion : '',
            categoria: nombreCategoria, 
            imagen: prodBase ? prodBase.imagen : 'no-image.png',

            // Datos del Proveedor
            proveedor: provBase ? provBase.nombre : 'Sin proveedor',
            proveedorId: provBase ? provBase.id : null,

            // Datos de la Relación
            precio: relacion.precio,
            
            // Datos de Inventario
            stock: invBase ? invBase.stock : 0,
            stockMinimo: invBase ? invBase.stockMinimo : 0,
            
            // Flag útil para pintar en rojo en la tabla
            alertaStock: invBase ? (invBase.stock < invBase.stockMinimo) : false
        };
    });

    return datosUnificados;

  } catch (error) {
    console.error(error);
    return [];
  }
}

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
        
        const response = await fetch(`${Api_URL}/productos/${id}`);
        
        if (!response.ok) {
            if(response.status === 404) throw new Error("Artículo no encontrado");
            throw new Error("Error de conexión");
        }
        
        const data = await response.json();
        return data;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Actualizar un artículo existente
export async function updateArticulo(id, datosActualizados) {
    try {
        const response = await fetch(`${Api_URL}/productos/${id}`, {
            method: 'PUT', // Método para actualizar
            headers: {
                'Content-Type': 'application/json' // Avisamos que enviamos JSON
            },
            body: JSON.stringify(datosActualizados) // Convertimos datos a texto
        });

        if (!response.ok) throw new Error("Error al actualizar el producto");

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createArticulo(nuevoArticulo) {
    try {
        const response = await fetch(`${Api_URL}/productos`, { // Recuerda: /productos según tu db.json
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoArticulo)
        });

        if (!response.ok) throw new Error("Error al registrar el artículo");

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// OBTENER PROVEEDORES
export async function getProveedores() {
  try {
    // Asumimos que en tu db.json se llama "proveedores"
    const res = await fetch(`${Api_URL}/proveedores`);
    if (!res.ok) throw new Error(`Error al obtener proveedores`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// PEDIDOS

export async function getPedidos() {
    try {
        // Hacemos dos peticiones para cruzar datos (Pedidos y Usuarios)
        const [pedidosRes, usuariosRes] = await Promise.all([
            fetch(`${Api_URL}/pedidos`),
            fetch(`${Api_URL}/usuarios`)
        ]);

        if (!pedidosRes.ok || !usuariosRes.ok) throw new Error("Error cargando pedidos");

        const pedidos = await pedidosRes.json();
        const usuarios = await usuariosRes.json();

        // Cruzamos los datos para que salga el nombre del usuario, no solo el ID
        return pedidos.map(p => {
            const usuario = usuarios.find(u => u.id == p.id_usuario);
            return {
                ...p, // Copia todo lo del pedido (id, fecha, total...)
                nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario Desconocido'
            };
        });

    } catch (error) {
        console.error(error);
        return [];
    }
}
