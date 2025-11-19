import { AuthService } from "../services/authService.js";
/* IMPORTAMOS EL RENDER DE ERROR */
import { LoginUI } from "../view/LoginUI.js"


document.addEventListener("DOMContentLoaded", () => {
    /*SELECCIONAMOS EL OBJETO DEL DOM */
    const form = document.getElementById("loginForm");


    form.addEventListener("submit", async (event) => {
        
        event.preventDefault();

        const username = document.getElementById("nombreUsuario").value;
        const password = document.getElementById("form-pasword").value;

        /* SE VERIFICA PRIMERO QUE NO SEAN CAMPOS VACÍOS PARA EVITAR HACER UNA LECTURA INNECESARIA DE LA API*/
        if (!username || !password){
            LoginUI.showMessage("El Usuario y la contraseña son obligatorios" , "error")
            /*SALE DEL IF */
            return
        }
        try {
            /*AL RECIBIR DATOS ENTRA POR AQUI */
            /*CONSULTA LA API POR MEDIO DEL MÉTODO CREADO EN EL SERVICIO DE AUTENTIFICACIÓN (VER SERVICES/AUTHSERVICE.JS) */
            const user = await AuthService.login(username, password);
            /* Y SE REDIRIGE A LA PAGINA DE INICIO DE LA APLICACIÓN SI NO HAY ERROR */
            window.location.href = "../../assets/inicio.html";

        } catch (error) {
            /*SI ENCUENTRA UN ERROR ENTRA POR AQUI */

            /*MUESTRA EL ERROR POR MEDIO DE UN MÉTODO EN view/LoginUI.js DONDE INSERTO UN TEXTO EN LA ETIQUETA P SELECCIONADA EN MI HTML*/

            /*AL MÉTODO SE LE PASA EL MENSAJE Y EL NOMBRE DE LA CLASE ("ERROR" QUE CREAMOS EN EL CSS (.error{color:red;})) */

            LoginUI.showMessage("El Usuario y la contraseña no son válidos" , "error")

        }
    });
});
