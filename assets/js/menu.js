document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const navbar = document.querySelector('.navbar'); // O el elemento que recibe la clase 'open'

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            // 1. Alternar la clase open (Abrir/Cerrar menú)
            navbar.classList.toggle('open');

            // 2. Cambiar el icono dependiendo de si tiene la clase 'open'
            if (navbar.classList.contains('open')) {
                menuToggle.textContent = '✕'; // Icono de cerrar (X)
            } else {
                menuToggle.textContent = '☰'; // Icono de hamburguesa
            }
        });
    }
});