import { authService } from "../services/authService.js";
/* IMPORTAMOS EL RENDER DE ERROR */
import { LoginUI } from "../view/LoginUI.js"


document.addEventListener("DOMContentLoaded", () => {

    // REDIRECCIÓN A HOME SI ESTOY LOGUEDO
    if (authService.isAuthenticated()) {
        window.location.href = 'pages/home.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');


    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // DETIENE EL ENVÍO NATIVO DEL FORMULARIO

            const userInput = document.getElementById('nombreUsuario');
            const passInput = document.getElementById('form-pasword');
            const btnSubmit = document.getElementById('submit');

            // AVISO 
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.value = "Verificando...";
            }

            const user = userInput.value;
            const pass = passInput.value;

            // LLAMADA AL SERVICIO
            try {
                const result = await authService.login(user, pass);

                if (result.success) {
                    // REDIRECCIÓN AL HOME
                    window.location.href = 'pages/home.html';
                } else {
                    // MENSAJE DE ERROR
                    LoginUI.showMessage(result.message, "error", "form-message");

                    // RESTAURACIÓN DE BOTÓN
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.value = "Ingresar";
                    }
                }
            } catch (error) {
                console.error("Error en el login:", error);
                LoginUI.showMessage("Error de conexión con el servidor", "error", "form-message");

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.value = "Ingresar";
                }
            }
        });
    }

    // === VER CONTRASEÑA ===
    const configurarOjo = (idBoton, idInput) => {
        const btn = document.getElementById(idBoton);
        const input = document.getElementById(idInput);

        if (btn && input) {
            btn.addEventListener('click', () => {
                // Alternar tipo
                const tipoActual = input.getAttribute('type');
                const nuevoTipo = tipoActual === 'password' ? 'text' : 'password';
                input.setAttribute('type', nuevoTipo);

                // Alternar Icono
                if (nuevoTipo === 'text') {
                    // Ojo Tachado (Ocultar)
                    btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>`;
                } else {
                    // Ojo Normal (Ver)
                    btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>`;
                }
            });
        }
    };

    // === ACTIVAR LOS DOS OJITOS DEL REGISTRO ===
    configurarOjo('btnTogglePassword', 'form-pasword')
    configurarOjo('btnToggleNewPass', 'newPassword');
    configurarOjo('btnToggleConfirmPass', 'confirmPassword');

});