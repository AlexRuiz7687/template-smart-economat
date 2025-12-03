import { NewUserService } from "../services/NewUserService.js";
import { LoginUI } from "../view/LoginUI.js";

document.addEventListener("DOMContentLoaded", () => {
    
    /* SELECCIONAMOS EL FORMULARIO DE NUEVO USUARIO */
    const form = document.getElementById("newUserForm");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        /* CAPTURA DE DATOS */
        const nombre = document.getElementById("newNombre").value;
        const apellidos = document.getElementById("newApellidos").value;
        const password = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const email = document.getElementById("newEmail").value;
        const telefono = document.getElementById("newTelefono").value;
        const rol = document.getElementById("tipoUsuario").value;

        /* VALIDACIONES */
        if (!nombre || !apellidos || !password || !email) {
            LoginUI.showMessage("Todos los campos son obligatorios", "error", "register-message");
            return;
        }

        if (password !== confirmPassword) {
            LoginUI.showMessage("Las contraseñas no coinciden", "error", "register-message");
            return;
        }

        /* PREPARACIÓN DEL OBJETO PARA DB.JSON */
        /* Generación automática del username */
        const usernameGenerado = (nombre.charAt(0) + apellidos.split(" ")[0]).toLowerCase();

        const newUserObj = {
            username: usernameGenerado,
            password: password,
            role: rol, 
            nombre: nombre,
            apellidos: apellidos,
            email: email,
            telefono: telefono
        };

        try {
            /* LLAMADA AL SERVICIO NUEVO */
            await NewUserService.createUser(newUserObj);

            /* 5. ÉXITO */
            LoginUI.showMessage("¡Usuario registrado correctamente!", "success", "register-message");
            
            form.reset(); // Limpiamos el formulario

        } catch (error) {
            /* MANEJO DE ERRORES (Usuario duplicado o fallo de red) */
            /* error.message trae el texto que escribimos en el servicio ("El correo ya existe") */
            LoginUI.showMessage(error.message, "error", "register-message");
        }
    });
});