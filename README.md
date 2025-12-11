# SmartEconomato - Primer Sprint de Integración

He desarrollado esta aplicación web para gestionar el inventario del economato del centro educativo. El objetivo principal ha sido crear una herramienta útil y ordenada para controlar el stock, realizar pedidos y registrar la entrada de productos.

## Descripción del trabajo

La aplicación permite a los usuarios acceder a un panel de control privado. He prestado mucha atención a la organización del código para cumplir con los requisitos de arquitectura modular.

## Qué hace la aplicación

**Inicio de Sesión**
El sistema tiene un control de seguridad. Si el usuario no se ha identificado no puede entrar. Además el menú cambia según si el usuario es administrador o normal.

**Navegación**
He programado un sistema de pestañas. Desde el menú principal se puede ir directo a crear un pedido o a ver el listado sin tener que recargar la página.

**Inventario y Artículos**
Se puede ver la lista de productos disponibles en la base de datos. También existe un formulario para dar de alta artículos nuevos.

**Gestión de Pedidos**
Permite crear pedidos nuevos seleccionando productos y cantidades. También se puede consultar el historial de lo que se ha pedido anteriormente.

**Recepción de Mercancía**
Es un apartado pensado para trabajar rápido cuando llegan cajas al almacén. Al guardar la recepción se actualiza el stock automáticamente.

## Tecnologías

He usado estándares web básicos para aprender bien los fundamentos:

* HTML5 para la estructura
* CSS3 para los estilos y el diseño adaptativo
* JavaScript para la lógica del cliente y los módulos
* Fetch para conectar con el servidor de datos
* SweetAlert2 para las alertas visuales

## Estructura de carpetas

Siguiendo lo aprendido en clase he separado el código en carpetas:

* src/controllers contiene la lógica y conecta todo
* src/services se encarga de pedir los datos al servidor
* src/view genera el código HTML que ve el usuario
* assets guarda los estilos e imágenes
* pages tiene los trozos de página que se cargan al navegar

## Instrucciones

Para que funcione hay que tener encendido el json-server en el puerto 3000.
Después hay que abrir el archivo index.html usando Live Server.

**Autor**
Alexis Ruiz Salazar
Ciclo Formativo Desarrollo de Aplicaciones Web