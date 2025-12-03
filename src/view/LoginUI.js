export class LoginUI {

    static showMessage(mensaje, tipo, idElemento = "form-message") {
        
        const messageContainer = document.getElementById(idElemento);

        if (messageContainer) {
            messageContainer.textContent = mensaje;
            

            messageContainer.className = tipo;
            

            setTimeout(() => {
                messageContainer.textContent = "";
            }, 12000);
        }
    }
}