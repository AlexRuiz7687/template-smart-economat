// src/controllers/inventarioController.js

import { getProductos, updateArticulo } from "../services/economatoService.js";

export async function inicializarInventario() {
    console.log("Inicializando Inventario...");

    // 1. ACTIVAR PESTAÑAS (TABS)
    const tabs = document.querySelectorAll('.tablinks');
    const contents = document.querySelectorAll('.tabcontent');

    if(tabs.length === 0) console.error("No se encontraron pestañas en inventario.html");

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Ocultar todos
            contents.forEach(c => c.style.display = 'none');
            tabs.forEach(t => t.classList.remove('active'));

            // Mostrar actual
            const targetId = e.target.dataset.target;
            const targetDiv = document.getElementById(targetId);
            if (targetDiv) targetDiv.style.display = 'block';
            
            e.target.classList.add('active');
        });
    });

    // 2. CARGAR DATOS
    await cargarDatosInventario();
}

async function cargarDatosInventario() {
    try {
        const productos = await getProductos();
        
        const tbody1 = document.getElementById('tabla-valorada-body');
        const tbody2 = document.getElementById('tabla-consolidar-body');
        const resumen = document.getElementById('resumen-inventario');
        let totalEuros = 0;

        if(tbody1) tbody1.innerHTML = '';
        if(tbody2) tbody2.innerHTML = '';

        productos.forEach(p => {
            // TABLA 1: Vista Valorada
            const valor = p.precio * p.stock;
            totalEuros += valor;
            const cat = (typeof p.categoria === 'object' && p.categoria) ? p.categoria.nombre : p.categoria;
            
            if(tbody1) {
                tbody1.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.nombre}</td>
                        <td>${cat || ''}</td>
                        <td>${p.stock}</td>
                        <td>${valor.toFixed(2)} €</td>
                    </tr>
                `;
            }

            // TABLA 2: Vista Consolidación (Edición)
            // Aquí cambiamos el emoji por texto "Guardar"
            if(tbody2) {
                tbody2.innerHTML += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.nombre}</td>
                        <td><input type="number" id="stock-${p.id}" value="${p.stock}" style="width:80px"></td>
                        <td><button class="btn-guardar-inv" data-id="${p.id}">Guardar</button></td>
                    </tr>
                `;
            }
        });

        if(resumen) resumen.textContent = `Valor Total: ${totalEuros.toFixed(2)} €`;

        // Activar botones de guardar
        document.querySelectorAll('.btn-guardar-inv').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const inputVal = document.getElementById(`stock-${id}`);
                
                if(!inputVal) return;
                
                const nuevoStock = parseInt(inputVal.value);

                if (confirm(`¿Seguro que quieres actualizar el stock a ${nuevoStock}?`)) {
                    // Aquí iría la llamada real a updateArticulo
                    // await updateArticulo(id, { stock: nuevoStock }); 
                    // Recargar datos...
                    alert("Funcionalidad pendiente de conectar con updateArticulo");
                }
            });
        });

    } catch (error) {
        console.error("Error cargando inventario:", error);
    }
}