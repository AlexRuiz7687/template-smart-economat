// src/controllers/pedidosController.js

import { getPedidos } from "../services/economatoService.js";
import { renderTablaPedidos } from "../view/pedidosView.js";

let listaPedidos = [];

export async function inicializarPedidos() {
    console.log("Iniciando módulo de Pedidos...");

    try {
        // 1. Cargar datos
        listaPedidos = await getPedidos();
        renderTablaPedidos(listaPedidos);

        // 2. Configurar Filtros
        const inputBusqueda = document.getElementById('busquedaPedido');
        const selectEstado = document.getElementById('filtroEstadoPedido');

        const aplicarFiltros = () => {
            const texto = inputBusqueda.value.toLowerCase();
            const estado = selectEstado.value;

            const filtrados = listaPedidos.filter(p => {
                const coincideTexto = p.id.toString().includes(texto) || p.nombreUsuario.toLowerCase().includes(texto);
                const coincideEstado = estado === "" || p.estado === estado;
                return coincideTexto && coincideEstado;
            });

            renderTablaPedidos(filtrados);
        };

        if(inputBusqueda) inputBusqueda.addEventListener('input', aplicarFiltros);
        if(selectEstado) selectEstado.addEventListener('change', aplicarFiltros);

        // 3. Configurar Pestañas (Historial vs Nuevo)
        const tabLista = document.getElementById('tabListaPedidos');
        const tabNuevo = document.getElementById('tabNuevoPedido');
        const divLista = document.getElementById('vistaListaPedidos');
        const divNuevo = document.getElementById('vistaNuevoPedido');

        if(tabLista && tabNuevo) {
            tabLista.addEventListener('click', () => {
                divLista.style.display = 'block';
                divNuevo.style.display = 'none';
                tabLista.classList.add('active');
                tabNuevo.classList.remove('active');
            });

            tabNuevo.addEventListener('click', () => {
                divLista.style.display = 'none';
                divNuevo.style.display = 'block';
                tabNuevo.classList.add('active');
                tabLista.classList.remove('active');
            });
        }

    } catch (error) {
        console.error("Error en pedidos:", error);
    }
}