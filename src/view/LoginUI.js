export const LoginUI = {
    showMessage(message, type){
        const msgElement = document.getElementById("form-message")
        msgElement.textContent = message
        msgElement.className = `${type}`
    }
}