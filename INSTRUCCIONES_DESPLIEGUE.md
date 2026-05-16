# Despliegue de Luz Gomez en Google Apps Script

## 1. Crear el proyecto

1. Entra a Google Drive.
2. Crea un nuevo proyecto de Google Apps Script desde `Nuevo > Mas > Google Apps Script`.
3. Nombra el proyecto como `Luz Gomez Tienda`.

## 2. Pegar archivos

1. Abre `back/Code.gs` de este proyecto local y pega todo su contenido en el archivo `Code.gs` del editor de Apps Script.
2. En Apps Script, crea un archivo HTML llamado `index`.
3. Abre `index.html` de este proyecto local y pega todo su contenido dentro del archivo `index.html` de Apps Script.

## 3. Inicializar base de datos y Drive

1. En el selector de funciones de Apps Script, elige `initDatabase`.
2. Ejecuta la funcion.
3. Acepta los permisos solicitados.
4. La funcion crea o reutiliza:
   - Google Sheet `LuzGomez_DB`.
   - Carpeta Drive `LuzGomez_Tienda`.
   - Subcarpetas `categorias`, `productos`, `galeria`, `testimonios`, `promociones`, `temp` y `config`.
   - Vendedor por defecto.
   - Categorias iniciales.

## 4. Configurar limpieza de sesiones

1. En el selector de funciones, elige `setupTriggers`.
2. Ejecuta la funcion.
3. Se crea un trigger diario para limpiar sesiones expiradas.

## 5. Logo del proyecto

El proyecto usa únicamente `img/flores.png` como imagen fija del sitio. No necesitas subir logo, favicon ni hero a Drive para que la tienda cargue.

## 6. Configurar vendedor por defecto

El vendedor inicial se crea con:

- Correo: `luz@email.com`
- Contrasena: `admin123`
- PIN: `1234`

Puedes cambiar estos valores en la hoja `Vendedores`.

Para cambiar la contrasena correctamente:

1. En Apps Script, ejecuta manualmente `hashPassword('NuevaContrasena')` desde una funcion auxiliar temporal o desde el depurador.
2. Copia el hash resultante en `password_hash`.
3. Borra cualquier funcion auxiliar temporal si la creaste.

## 7. Desplegar como Web App

1. En Apps Script, haz clic en `Implementar > Nueva implementacion`.
2. Tipo: `Aplicacion web`.
3. Ejecutar como: `Yo`.
4. Quien tiene acceso: `Cualquier persona`.
5. Haz clic en `Implementar`.
6. Copia la URL de la Web App.

## 8. Probar flujo cliente

1. Abre la URL de la Web App.
2. En la pestana `Cliente`, ingresa nombre, correo y telefono.
3. Debe abrir la tienda.
4. Agrega productos al carrito.
5. Finaliza compra para guardar el pedido en Sheets y abrir WhatsApp.
6. El pedido tambien envia un correo automatico a `luznahomybeauty@gmail.com` desde Apps Script.

## 9. Probar flujo vendedor

1. Cierra sesion o abre en modo incognito.
2. Entra a la pestana `Vendedor`.
3. Usa correo `luz@email.com` y contrasena `admin123`, o PIN `1234`.
4. Debe abrir el dashboard.
5. Prueba crear categorias, productos, promociones, testimonios y galeria.

## 10. Notas importantes

- El WhatsApp configurado por defecto es `573213092850`.
- El Gmail configurado por defecto es `luznahomybeauty@gmail.com`.
- Las subidas de archivos funcionan desde el frontend desplegado hacia Apps Script usando base64.
- Las llamadas JSON usan la URL de la Web App con `fetch`.
- Si pruebas el HTML como archivo local, las cargas a backend y uploads no funcionaran hasta desplegar en Apps Script.
- Las imagenes usan URLs dinamicas de Drive, nunca URLs hardcodeadas.
- Los videos de Drive se muestran con reproductor HTML5 y URL directa. No se usan iframes para evitar errores CSP.
- Los correos automáticos requieren autorizar `MailApp` al ejecutar o redesplegar Apps Script.




