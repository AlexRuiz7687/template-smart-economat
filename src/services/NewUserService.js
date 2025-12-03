export class NewUserService {

    /* Método estático para registrar usuario */
    static async createUser(nuevoUsuario) {
        
        
        /* Hacemos un GET filtrando por email */
        const urlCheck = `http://localhost:3000/usuarios?email=${nuevoUsuario.email}`;
        const responseCheck = await fetch(urlCheck);
        const usuarioExistente = await responseCheck.json();

        /* Si el array no está vacío, significa que ya existe alguien con ese email */
        if (usuarioExistente.length > 0) {
            throw new Error("El correo electrónico ya está registrado");
        }

        /* PASO 2: Si no existe, hacemos el POST para guardarlo */
        const response = await fetch("http://localhost:3000/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(nuevoUsuario)
        });

        /* Si falla la respuesta del servidor */
        if (!response.ok) {
            throw new Error("Error de conexión al intentar registrar");
        }

        /* Devolvemos el usuario creado */
        return await response.json();
    }
}