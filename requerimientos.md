# Sistema de E-Commerce Educativa
Este proyecto se centra en crear un E-commerce basico con fines educativos para una clase de programacion universitaria.

## Objetivo del proyecto
Desarrollar una tienda en línea básica para ilustrar los fundamentos de la programación web moderna, integrando SPA/MPA, microservicios, comunicación asíncrona con XHR y Fetch, y paradigmas funcional y orientado a objetos en JavaScript.

## Objetivos específicos

1. Mostrar la diferencia práctica entre una aplicación SPA (Single Page Application) y MPA (Multi Page Application).
2. Implementar comunicación asíncrona con XHR y Fetch API.
3. Explicar cómo se integran los microservicios en un ecosistema web.
4. Usar JavaScript moderno (ES6+) para aplicar:
5. Paradigma funcional (arrow functions, funciones anónimas, callbacks, map/filter/reduce).
6. Paradigma orientado a objetos (clases, instancias, herencia).
7. Implementar un FrontEnd con React o Next.js que consuma microservicios.

## arquitectura del proyecto
1. Frontend (SPA)
    Framework: React.js o Next.js (preferido para mostrar MPA y SSR opcional).

    ### Características:
    Página de productos.
    Carrito de compras.
    Checkout básico (simulado).

    Estilos: se solicita utilizar Material Ui como libreria de estilos

    ### Uso de Fetch API para obtener datos.

    ### Ejemplo con XMLHttpRequest (XHR) para mostrar cómo se hacía antes.

2. Backend (Microservicios en Node.js + Express)

    Para la gestion de base de datos de customers, cart y orders utilizare Supabase 
    Para los productos deseo utilizar alguna API free o fake de productos online

    Se solicitan los siguientes microservicios simples:

    Microservicio            Descripción	                                    Endpoint principal
    1. customers-service    Gestiona los clientes registrados                   /api/customers
    2. products-service	    Devuelve lista de productos (JSON)	                /api/products
    3. cart-service	        Gestiona el carrito (añadir/eliminar items)	        /api/cart
    4. orders-service	    Simula una orden al finalizar compra	            /api/orders
