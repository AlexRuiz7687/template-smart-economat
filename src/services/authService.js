//RUTA
// src/services/authService.js


// RUTA DE ACCESO
const DB_URL = 'http://localhost/plantillas-smart-economat/src/services/API/usuarios.php';

export const authService = {

    login: async (username, password) => {
        try {
            const response = await fetch(DB_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) throw new Error("No se pudo conectar con la base de datos");

            const data = await response.json();

            if (data.success) {
                // GUARDAR LA SESIÓN
                localStorage.setItem('smart_user', JSON.stringify(data.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message || "Usuario o contraseña incorrectos" };
            }

        } catch (error) {
            console.error(error);
            return { success: false, message: "Error de conexión" };
        }
    },

    logout: () => {
        localStorage.removeItem('smart_user');
        //VOLVER A INDEX
        window.location.href = '../index.html';
    },

    isAuthenticated: () => {
        const user = localStorage.getItem('smart_user');
        return user !== null;
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('smart_user');
        return user ? JSON.parse(user) : null;
    }
};