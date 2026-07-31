# Sistema de Gestión Hospitalaria

La aplicación está formada por un frontend React y una API ASP.NET Core que se
conecta a la base histórica SQL Server mediante autenticación integrada de
Windows.

## Desarrollo local

Requisitos:

- SQL Server Express con la instancia `DESKTOP-0LJ6AJT\SQLEXPRESS`.
- Base `bdHospital` en línea.
- .NET SDK 8.
- Node.js 20 o posterior.

Abrir dos terminales en la carpeta del proyecto.

API:

```powershell
npm run dev:api
```

Frontend:

```powershell
npm run dev
```

Vite redirige las llamadas `/api` a `http://127.0.0.1:5080`. La API usa la
identidad de Windows del proceso; no se guarda ninguna contraseña.

La conexión puede sobrescribirse sin modificar archivos:

```powershell
$env:ConnectionStrings__Hospital = 'Server=SERVIDOR\INSTANCIA;Database=bdHospital;Integrated Security=True;Encrypt=True;TrustServerCertificate=False'
npm run dev:api
```

Para comprobar la conexión con la API iniciada:

```powershell
Invoke-RestMethod http://127.0.0.1:5080/api/health
```

## Seguridad y despliegue

- `public` está deshabilitado en Vite para que el script SQL y las notas de
  migración no se copien al paquete web.
- La configuración local desactiva cifrado porque SQL Express no tiene un
  certificado configurado. Para acceso por red se debe instalar un certificado,
  activar cifrado y utilizar una cuenta de servicio con permisos mínimos.
- Las escrituras deben habilitarse después de crear y verificar un backup de la
  base histórica.
