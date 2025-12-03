//RUTA
// src/services/authService.js

/* const API_URL = 'http://localhost:3000'; */


// RUTA DE ACCESO
const DB_URL = 'http://localhost:3000/usuarios'; 

export const authService = {
    
    login: async (username, password) => {
        try {
            const response = await fetch(DB_URL);
            if (!response.ok) throw new Error("No se pudo conectar con la base de datos");
            
            // RESPUESTA TIPO JSON
            const users = await response.json(); 
            
            // BUSCAR EL USUARIO
            const user = users.find(u => u.username === username && u.password === password);
    
            if (user) {
                // GUARDAR LA SESIÓN
                localStorage.setItem('smart_user', JSON.stringify(user));
                return { success: true, user: user };
            } else {
                return { success: false, message: "Usuario o contraseña incorrectos" };
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