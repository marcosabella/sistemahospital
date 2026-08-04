using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Hospital")
    ?? throw new InvalidOperationException("Falta ConnectionStrings:Hospital.");

builder.Services.AddSingleton(new HospitalDatabase(connectionString));
builder.Services.AddResponseCompression(options => options.EnableForHttps = true);
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        if (!builder.Environment.IsDevelopment()) return;
        var error = context.HttpContext.Features
            .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        if (error is not null) context.ProblemDetails.Detail = error.Message;
    };
});

var app = builder.Build();
app.UseExceptionHandler();
app.UseResponseCompression();

var database = app.Services.GetRequiredService<HospitalDatabase>();
var migrationsPath = Path.Combine(app.Environment.ContentRootPath, "Migrations");
if (Directory.Exists(migrationsPath))
    foreach (var migration in Directory.GetFiles(migrationsPath, "*.sql").OrderBy(path => path))
        await database.ExecuteAsync(await File.ReadAllTextAsync(migration), new(), CancellationToken.None, commandTimeout: 600);

app.MapPost("/api/auth/login", async (LoginInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(input.Usuario) || input.Usuario.Contains('@') || string.IsNullOrWhiteSpace(input.Password)) return Results.Unauthorized();
    var rows=await db.QueryAsync("SELECT idUsuario,usuario,nombre,passwordHash,passwordSalt,iteraciones,activo,administrador,idProfesional FROM dbo.SistemaUsuario WHERE usuario=@usuario",ct,new(){["usuario"]=input.Usuario.Trim()});
    if(rows.Count==0 || rows[0]["activo"] is not true) return Results.Unauthorized();
    var user=rows[0];
    if(!AuthSecurity.Verify(input.Password,(byte[])user["passwordSalt"]!,(byte[])user["passwordHash"]!,Convert.ToInt32(user["iteraciones"]))) return Results.Unauthorized();
    var token=AuthSecurity.NewToken(); var tokenHash=AuthSecurity.TokenHash(token); var id=Convert.ToInt32(user["idUsuario"]);
    await db.ExecuteAsync("DELETE dbo.SistemaSesion WHERE expira<SYSDATETIME(); INSERT dbo.SistemaSesion(idUsuario,tokenHash,expira) VALUES(@id,@hash,DATEADD(HOUR,12,SYSDATETIME()))",new(){["id"]=id,["hash"]=tokenHash},ct);
    var permissions=await db.QueryAsync("""
        SELECT modulo,accion FROM dbo.SistemaPermisoUsuario WHERE idUsuario=@id AND permitido=1
        UNION
        SELECT rp.modulo,rp.accion FROM dbo.SistemaUsuarioRol ur
        INNER JOIN dbo.SistemaRol r ON r.idRol=ur.idRol AND r.activo=1
        INNER JOIN dbo.SistemaRolPermiso rp ON rp.idRol=r.idRol AND rp.permitido=1
        WHERE ur.idUsuario=@id
        """,ct,new(){["id"]=id});
    return Results.Ok(new{token,user=new{id,usuario=user["usuario"],nombre=user["nombre"],administrador=user["administrador"],profesionalId=user["idProfesional"],permissions}});
});

app.MapPost("/api/auth/logout", async (HttpContext context, HospitalDatabase db, CancellationToken ct) =>
{
    var token=context.Request.Headers.Authorization.ToString().Replace("Bearer ","");
    if(!string.IsNullOrWhiteSpace(token)) await db.ExecuteAsync("DELETE dbo.SistemaSesion WHERE tokenHash=@hash",new(){["hash"]=AuthSecurity.TokenHash(token)},ct);
    return Results.NoContent();
});

app.Use(async (context,next) =>
{
    if(!context.Request.Path.StartsWithSegments("/api") || context.Request.Path=="/api/auth/login" || context.Request.Path=="/api/health") { await next(); return; }
    var bearer=context.Request.Headers.Authorization.ToString();
    if(!bearer.StartsWith("Bearer ",StringComparison.OrdinalIgnoreCase)){context.Response.StatusCode=401;return;}
    var session=await database.QueryAsync("""
        SELECT u.idUsuario,u.usuario,u.nombre,u.administrador,u.idProfesional FROM dbo.SistemaSesion s INNER JOIN dbo.SistemaUsuario u ON u.idUsuario=s.idUsuario
        WHERE s.tokenHash=@hash AND s.expira>SYSDATETIME() AND u.activo=1
        """,context.RequestAborted,new(){["hash"]=AuthSecurity.TokenHash(bearer[7..].Trim())});
    if(session.Count==0){context.Response.StatusCode=401;return;}
    var user=session[0]; context.Items["user"]=user;
    if(user["administrador"] is not true)
    {
        var (module,action)=AuthSecurity.RequiredPermission(context.Request.Path,context.Request.Method);
        if(module is not null)
        {
            var fallbackModule=context.Request.Method=="GET" && context.Request.Path.StartsWithSegments("/api/cabos") && context.Request.Path.Value?.Split('/',StringSplitOptions.RemoveEmptyEntries).Length==3
                ? "clinical-history" : module;
            var allowed=await database.ScalarAsync<int>("""
                SELECT COUNT(*) FROM (
                    SELECT modulo,accion FROM dbo.SistemaPermisoUsuario WHERE idUsuario=@id AND permitido=1
                    UNION
                    SELECT rp.modulo,rp.accion FROM dbo.SistemaUsuarioRol ur
                    INNER JOIN dbo.SistemaRol r ON r.idRol=ur.idRol AND r.activo=1
                    INNER JOIN dbo.SistemaRolPermiso rp ON rp.idRol=r.idRol AND rp.permitido=1
                    WHERE ur.idUsuario=@id
                ) permisos WHERE modulo IN (@modulo,@fallback) AND accion=@accion
                """,new(){["id"]=user["idUsuario"],["modulo"]=module,["fallback"]=fallbackModule,["accion"]=action},context.RequestAborted);
            if(allowed==0){context.Response.StatusCode=403;return;}
        }
    }
    await next();
});

app.MapGet("/api/users", async (HospitalDatabase db,CancellationToken ct) =>
{
    var users=await db.QueryAsync("SELECT idUsuario AS id,usuario,nombre,activo,administrador,idProfesional AS profesionalId FROM dbo.SistemaUsuario ORDER BY usuario",ct);
    var permissions=await db.QueryAsync("SELECT idUsuario,modulo,accion FROM dbo.SistemaPermisoUsuario WHERE permitido=1",ct);
    var roles=await db.QueryAsync("SELECT idRol AS id,nombre,descripcion,activo FROM dbo.SistemaRol ORDER BY nombre",ct);
    var rolePermissions=await db.QueryAsync("SELECT idRol,modulo,accion FROM dbo.SistemaRolPermiso WHERE permitido=1",ct);
    var userRoles=await db.QueryAsync("SELECT idUsuario,idRol FROM dbo.SistemaUsuarioRol",ct);
    var professionals=await db.QueryAsync("SELECT idProfesional AS id,CONVERT(nvarchar(20),dni) AS dni,apellido,nombre,CONVERT(nvarchar(30),matricula_profesional) AS matricula FROM dbo.Profesionales ORDER BY apellido,nombre",ct);
    return Results.Ok(new{users,permissions,roles,rolePermissions,userRoles,professionals});
});
app.MapPost("/api/users", async (UserInput input,HospitalDatabase db,CancellationToken ct) =>
{
    if(string.IsNullOrWhiteSpace(input.Usuario)||input.Usuario.Contains('@')||string.IsNullOrWhiteSpace(input.Password)||input.Password.Length<8) return Results.ValidationProblem(new Dictionary<string,string[]>{{"usuario",["El usuario no puede ser un email y la contraseña debe tener al menos 8 caracteres."]}});
    var salt=AuthSecurity.NewSalt();var hash=AuthSecurity.HashPassword(input.Password,salt,210000);
    var id=await db.ScalarAsync<int>("INSERT dbo.SistemaUsuario(usuario,nombre,passwordHash,passwordSalt,iteraciones,activo,administrador,idProfesional) OUTPUT INSERTED.idUsuario VALUES(@usuario,@nombre,@hash,@salt,210000,@activo,@admin,@profesional)",new(){["usuario"]=input.Usuario.Trim(),["nombre"]=input.Nombre,["hash"]=hash,["salt"]=salt,["activo"]=input.Activo,["admin"]=input.Administrador,["profesional"]=input.ProfesionalId},ct);
    await SavePermissions(db,id,input.Permisos,ct); await SaveUserRoles(db,id,input.RolIds,ct); return Results.Ok(new{id,usuario=input.Usuario,nombre=input.Nombre,activo=input.Activo,administrador=input.Administrador,profesionalId=input.ProfesionalId,rolIds=input.RolIds,permisos=input.Permisos});
});
app.MapPut("/api/users/{id:int}", async (int id,UserInput input,HospitalDatabase db,CancellationToken ct) =>
{
    if(input.Usuario.Contains('@')) return Results.BadRequest();
    var p=new Dictionary<string,object?>{{"id",id},{"usuario",input.Usuario.Trim()},{"nombre",input.Nombre},{"activo",input.Activo},{"admin",input.Administrador},{"profesional",input.ProfesionalId}};
    if(string.IsNullOrWhiteSpace(input.Password)) await db.ExecuteAsync("UPDATE dbo.SistemaUsuario SET usuario=@usuario,nombre=@nombre,activo=@activo,administrador=@admin,idProfesional=@profesional WHERE idUsuario=@id",p,ct);
    else {var salt=AuthSecurity.NewSalt();p["salt"]=salt;p["hash"]=AuthSecurity.HashPassword(input.Password,salt,210000);await db.ExecuteAsync("UPDATE dbo.SistemaUsuario SET usuario=@usuario,nombre=@nombre,activo=@activo,administrador=@admin,idProfesional=@profesional,passwordSalt=@salt,passwordHash=@hash,iteraciones=210000 WHERE idUsuario=@id",p,ct);}
    await SavePermissions(db,id,input.Permisos,ct);await SaveUserRoles(db,id,input.RolIds,ct);return Results.Ok(new{id,usuario=input.Usuario,nombre=input.Nombre,activo=input.Activo,administrador=input.Administrador,profesionalId=input.ProfesionalId,rolIds=input.RolIds,permisos=input.Permisos});
});
app.MapDelete("/api/users/{id:int}", async (int id,HttpContext context,HospitalDatabase db,CancellationToken ct) =>
{
    var current=(Dictionary<string,object?>)context.Items["user"]!;
    if(Convert.ToInt32(current["idUsuario"])==id) return Results.BadRequest(new{message="No podés eliminar tu propio usuario."});
    return await db.ExecuteAsync("DELETE dbo.SistemaUsuario WHERE idUsuario=@id",new(){["id"]=id},ct)==0?Results.NotFound():Results.NoContent();
});

static async Task SavePermissions(HospitalDatabase db,int id,PermissionInput[]? permissions,CancellationToken ct)
{
    await db.ExecuteAsync("DELETE dbo.SistemaPermisoUsuario WHERE idUsuario=@id",new(){["id"]=id},ct);
    foreach(var permission in permissions??[]) await db.ExecuteAsync("INSERT dbo.SistemaPermisoUsuario(idUsuario,modulo,accion,permitido) VALUES(@id,@modulo,@accion,1)",new(){["id"]=id,["modulo"]=permission.Modulo,["accion"]=permission.Accion},ct);
}

static async Task SaveUserRoles(HospitalDatabase db,int id,int[]? roleIds,CancellationToken ct)
{
    await db.ExecuteAsync("DELETE dbo.SistemaUsuarioRol WHERE idUsuario=@id",new(){["id"]=id},ct);
    foreach(var roleId in roleIds??[]) await db.ExecuteAsync("INSERT dbo.SistemaUsuarioRol(idUsuario,idRol) VALUES(@id,@rol)",new(){["id"]=id,["rol"]=roleId},ct);
}

app.MapPost("/api/users/roles", async (RoleInput input,HospitalDatabase db,CancellationToken ct) =>
{
    if(string.IsNullOrWhiteSpace(input.Nombre)) return Results.BadRequest();
    var id=await db.ScalarAsync<int>("INSERT dbo.SistemaRol(nombre,descripcion,activo) OUTPUT INSERTED.idRol VALUES(@nombre,@descripcion,@activo)",new(){["nombre"]=input.Nombre.Trim(),["descripcion"]=input.Descripcion,["activo"]=input.Activo},ct);
    await SaveRolePermissions(db,id,input.Permisos,ct);
    return Results.Ok(new{id,nombre=input.Nombre,descripcion=input.Descripcion,activo=input.Activo,permisos=input.Permisos});
});

app.MapPut("/api/users/roles/{id:int}", async (int id,RoleInput input,HospitalDatabase db,CancellationToken ct) =>
{
    var affected=await db.ExecuteAsync("UPDATE dbo.SistemaRol SET nombre=@nombre,descripcion=@descripcion,activo=@activo WHERE idRol=@id",new(){["id"]=id,["nombre"]=input.Nombre.Trim(),["descripcion"]=input.Descripcion,["activo"]=input.Activo},ct);
    if(affected==0) return Results.NotFound();
    await SaveRolePermissions(db,id,input.Permisos,ct);
    return Results.Ok(new{id,nombre=input.Nombre,descripcion=input.Descripcion,activo=input.Activo,permisos=input.Permisos});
});

static async Task SaveRolePermissions(HospitalDatabase db,int id,PermissionInput[]? permissions,CancellationToken ct)
{
    await db.ExecuteAsync("DELETE dbo.SistemaRolPermiso WHERE idRol=@id",new(){["id"]=id},ct);
    foreach(var permission in permissions??[]) await db.ExecuteAsync("INSERT dbo.SistemaRolPermiso(idRol,modulo,accion,permitido) VALUES(@id,@modulo,@accion,1)",new(){["id"]=id,["modulo"]=permission.Modulo,["accion"]=permission.Accion},ct);
}

app.MapGet("/api/health", async (HospitalDatabase db, CancellationToken cancellationToken) =>
{
    var rows = await db.QueryAsync(
        "SELECT @@SERVERNAME AS servidor, DB_NAME() AS baseDatos, CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(30)) AS version",
        cancellationToken);
    return Results.Ok(new { status = "ok", database = rows.Single() });
});

app.MapGet("/api/catalogs/health-insurances", async (HospitalDatabase db, CancellationToken ct) =>
{
    var rows = await db.QueryAsync("""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo,
               descripcion, sigla
        FROM dbo.ObraSocial
        ORDER BY descripcion
        """, ct);
    return Results.Ok(rows);
});

app.MapGet("/api/bootstrap", async (HttpContext context, HospitalDatabase db, CancellationToken cancellationToken) =>
{
    var currentUser=(Dictionary<string,object?>)context.Items["user"]!;
    var isAdmin=currentUser["administrador"] is true;
    var granted=isAdmin?new HashSet<string>():new HashSet<string>((await db.QueryAsync("""
        SELECT modulo FROM dbo.SistemaPermisoUsuario WHERE idUsuario=@id AND accion='view' AND permitido=1
        UNION
        SELECT rp.modulo FROM dbo.SistemaUsuarioRol ur
        INNER JOIN dbo.SistemaRol r ON r.idRol=ur.idRol AND r.activo=1
        INNER JOIN dbo.SistemaRolPermiso rp ON rp.idRol=r.idRol AND rp.accion='view' AND rp.permitido=1
        WHERE ur.idUsuario=@id
        """,cancellationToken,new(){["id"]=currentUser["idUsuario"]})).Select(row=>Convert.ToString(row["modulo"])!));
    bool Has(params string[] modules)=>isAdmin||modules.Any(granted.Contains);
    IReadOnlyList<Dictionary<string,object?>> Empty()=>Array.Empty<Dictionary<string,object?>>();
    Task<IReadOnlyList<Dictionary<string,object?>>> QueryIf(bool required,string sql,CancellationToken _,Dictionary<string,object?>? parameters=null)
        =>required?db.QueryAsync(sql,cancellationToken,parameters):Task.FromResult(Empty());
    var patientsTask = QueryIf(Has("patients","appointments","cabos","clinical-history"),"""
        SELECT p.idPaciente AS codigo, CONVERT(nvarchar(20),p.dni) AS dni, p.nombre, p.apellido,
               CONVERT(varchar(10), p.fecha_nacimiento, 23) AS nacimiento,
               CASE p.sexo WHEN 1 THEN N'Masculino' WHEN 2 THEN N'Femenino' ELSE NULL END AS sexo,
               p.sexo AS sexoCodigo,
               CASE p.idEstadoCivil WHEN 1 THEN N'Soltero/a' WHEN 2 THEN N'Casado/a' WHEN 3 THEN N'Divorciado/a' WHEN 4 THEN N'Viudo/a' ELSE NULL END AS estadoCivil, p.ocupacion,
               p.telefonoFijo AS telefono, p.telefonoCelular AS celular,
               p.calle, p.numero, p.idLocalidad, l.nombre AS localidad, p.cp AS codigoPostal,
               d.nombre AS partido, pr.nombre AS provincia,
               os.descripcion AS obraSocial, p.numeroAfiliado,
               CASE p.idTipoBeneficiario
                   WHEN 1 THEN N'Titular'
                   WHEN 2 THEN N'Familiar'
                   WHEN 3 THEN N'Adherente'
                   WHEN 4 THEN N'Otro'
                   ELSE NULL
               END AS beneficiario,
               p.idTipoBeneficiario AS beneficiarioCodigo,
               CASE p.idParentesco
                   WHEN 1 THEN N'Cónyuge'
                   WHEN 2 THEN N'Hijo/a'
                   WHEN 3 THEN N'Otro'
                   ELSE NULL
               END AS parentesco,
               p.idParentesco AS parentescoCodigo
        FROM dbo.Paciente p
        LEFT JOIN dbo.Localidades l ON l.id = p.idLocalidad
        LEFT JOIN dbo.Departamentos d ON d.id = l.departamento_id
        LEFT JOIN dbo.Provincias pr ON pr.id = d.provincia_id
        LEFT JOIN dbo.ObraSocial os ON os.Id = p.idObraSocial
        ORDER BY p.apellido, p.nombre
        """, cancellationToken);

    var professionalsTask = QueryIf(Has("professionals","appointments","cabos","clinical-history","liquidacion-profesionales"),"""
        SELECT p.idProfesional AS codigo, CONVERT(nvarchar(20),p.dni) AS dni, p.nombre, p.apellido,
               p.telefonoFijo AS telefono, p.telefonoCelular AS celular,
               p.matricula_profesional AS matricula, CONVERT(nvarchar(30),p.porc_autogestion) AS autogestion,
               e.descripcion AS especialidad, p.calle, p.numero,
               l.nombre AS localidad, p.cp AS codigoPostal,
               d.nombre AS partido, pr.nombre AS provincia
        FROM dbo.Profesionales p
        LEFT JOIN dbo.Especialidad e ON e.idEspecilidad = p.idEspecialidad
        LEFT JOIN dbo.Localidades l ON l.id = p.idLocalidad
        LEFT JOIN dbo.Departamentos d ON d.id = l.departamento_id
        LEFT JOIN dbo.Provincias pr ON pr.id = d.provincia_id
        ORDER BY p.apellido, p.nombre
        """, cancellationToken);

    var personnelTask = QueryIf(Has("personnel","liquidacion-personal"),"""
        SELECT p.idPersonal AS codigo, CONVERT(nvarchar(20),p.dni) AS dni, p.nombre, p.apellido,
               p.telefonoFijo AS telefono, p.telefonoCelular AS celular,
               a.descripcion AS area, p.calle, p.numero,
               l.nombre AS localidad, p.cp AS codigoPostal,
               d.nombre AS partido, pr.nombre AS provincia
        FROM dbo.Personal p
        LEFT JOIN dbo.Area a ON a.idArea = p.idArea
        LEFT JOIN dbo.Localidades l ON l.id = p.idLocalidad
        LEFT JOIN dbo.Departamentos d ON d.id = l.departamento_id
        LEFT JOIN dbo.Provincias pr ON pr.id = d.provincia_id
        ORDER BY p.apellido, p.nombre
        """, cancellationToken);

    var medicationsTask = QueryIf(Has("medications","cabos"),"""
        SELECT idMedicamento AS id, producto, presentacion, precio
        FROM dbo.Medicamentos ORDER BY producto
        """, cancellationToken);

    var healthInsurancesTask = QueryIf(Has("health-insurances","cabos","cobros-os","liquidacion-obra-social"),"""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo, descripcion, sigla,
               calle, numero, localidad, cp AS codigoPostal
        FROM dbo.ObraSocial ORDER BY descripcion
        """, cancellationToken);

    var nomenclaturesTask = QueryIf(Has("nomenclature","cabos"),"""
        WITH Aranceles AS (
            SELECT Codigos, Arancel
            FROM dbo.Arancel_Nomenclador
            GROUP BY Codigos, Arancel
        )
        SELECT MIN(n.Id) AS id, n.Codigos AS codigo,
               STRING_AGG(CONVERT(nvarchar(max), LTRIM(RTRIM(n.Descripcion))), N' ')
                   WITHIN GROUP (ORDER BY n.Id) AS descripcion,
               a.Arancel AS arancel
        FROM dbo.Nomenclador n
        LEFT JOIN Aranceles a ON a.Codigos = n.Codigos
        GROUP BY n.Codigos, a.Arancel
        ORDER BY n.Codigos, a.Arancel
        """, cancellationToken);

    var cieCodesTask = QueryIf(Has("cabos"),"""
        SELECT Id AS id, Codigo AS codigo, Descripcion AS descripcion
        FROM dbo.CIE_10_COD3 ORDER BY Codigo
        """, cancellationToken);

    var laboratoryCodesTask = QueryIf(Has("nomenclature","cabos"),"""
        WITH Categorias AS (
            SELECT n.Descripcion AS categoria, MIN(n.Codigos) AS codigo,
                   MAX(a.Arancel) AS arancel
            FROM dbo.Nomenclador n
            LEFT JOIN dbo.Arancel_Nomenclador a ON a.Codigos = n.Codigos
            WHERE n.Codigos LIKE N'40.%'
            GROUP BY n.Descripcion
        )
        SELECT l.Id AS id, COALESCE(c.codigo, l.idNomenclador) AS codigo,
               l.Descripcion AS descripcion, c.arancel
        FROM dbo.Nomenclador_Laboratorio l
        LEFT JOIN Categorias c ON LTRIM(RTRIM(c.categoria)) = LTRIM(RTRIM(l.idNomenclador))
        ORDER BY codigo, l.Descripcion
        """, cancellationToken);

    var specialtiesTask = QueryIf(Has("professionals","appointments","cabos"),
        "SELECT idEspecilidad AS id, descripcion FROM dbo.Especialidad ORDER BY descripcion",
        cancellationToken);
    var areasTask = QueryIf(Has("personnel"),
        "SELECT idArea AS id, descripcion FROM dbo.Area ORDER BY descripcion",
        cancellationToken);
    var locationsTask = QueryIf(Has("patients","professionals","personnel"),"""
        SELECT l.id, l.nombre, d.id AS departamentoId, d.nombre AS departamento,
               pr.id AS provinciaId, pr.nombre AS provincia
        FROM dbo.Localidades l
        INNER JOIN dbo.Departamentos d ON d.id = l.departamento_id
        INNER JOIN dbo.Provincias pr ON pr.id = d.provincia_id
        ORDER BY pr.nombre, d.nombre, l.nombre
        """, cancellationToken);

    var cabosTask = QueryIf(Has("cabos","cobros-os"),"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT TOP (500) c.idCabo AS id, CONVERT(nvarchar(20), c.idCabo) AS numero,
               CONVERT(varchar(10), c.fechaCabo, 23) AS fecha,
               c.codigoCabo AS codigoRefes, c.idPaciente AS pacienteCodigo,
               CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS nombre,
               CASE WHEN p.fecha_nacimiento IS NULL THEN NULL ELSE
                   DATEDIFF(YEAR, p.fecha_nacimiento, CAST(GETDATE() AS date)) -
                   CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.fecha_nacimiento, CAST(GETDATE() AS date)), p.fecha_nacimiento) > CAST(GETDATE() AS date) THEN 1 ELSE 0 END
               END AS edad,
               CASE p.sexo WHEN 1 THEN N'Masculino' WHEN 2 THEN N'Femenino' ELSE N'' END AS sexo,
               CASE p.idTipoBeneficiario
                   WHEN 1 THEN N'Titular' WHEN 2 THEN N'Familiar'
                   WHEN 3 THEN N'Adherente' WHEN 4 THEN N'Otro' ELSE N''
               END AS beneficiario,
               CASE p.idParentesco
                   WHEN 1 THEN N'Cónyuge' WHEN 2 THEN N'Hijo/a'
                   WHEN 3 THEN N'Otro' ELSE N''
               END AS parentesco,
               os.descripcion AS obraSocial, CONVERT(nvarchar(50), os.codigo) AS rnos,
               CASE c.idTipoAtencion
                   WHEN 1 THEN N'Consulta' WHEN 2 THEN N'Práctica'
                   WHEN 3 THEN N'Imagen' WHEN 4 THEN N'Internación'
                   ELSE N'Consulta'
               END AS tipoAtencion,
               CONVERT(varchar(10), c.fechaAltaInternacion, 23) AS fechaAlta
        FROM dbo.Cabo c
        LEFT JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        LEFT JOIN dbo.ObraSocial os ON os.Id = c.idObraSocial
        ORDER BY c.idCabo DESC
        """, cancellationToken);

    var cobrosOSTask = QueryIf(Has("cobros-os","liquidacion-profesionales","liquidacion-personal"),"""
        SELECT r.idRegistro AS id, os.Id AS obraSocialId, CONVERT(nvarchar(50), os.codigo) AS obraSocialCodigo,
               os.descripcion AS obraSocial, r.numeroFactura, r.estado,
               CONVERT(varchar(10), r.fechaPrestacion, 23) AS fechaPrestacion,
               CONVERT(varchar(10), r.fechaPresentacion, 23) AS fechaPresentacion,
               CONVERT(varchar(10), r.fechaCobro, 23) AS fechaCobro,
               r.importeFacturado, r.importeCobrado
        FROM dbo.RegistroCobroOS r
        LEFT JOIN dbo.ObraSocial os ON os.Id = r.idObraSocial
        ORDER BY r.idRegistro DESC
        """, cancellationToken);

    var cobroDebitsTask = QueryIf(Has("cobros-os"),"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        WITH Aranceles AS (
            SELECT Codigos, MAX(Arancel) AS Arancel
            FROM dbo.Arancel_Nomenclador
            GROUP BY Codigos
        )
        SELECT c.idRegistroCobro AS cobroId, px.idProfesionalXpractica AS id,
               c.idCabo, CONVERT(nvarchar(20), c.idCabo) AS numeroCabo,
               CONVERT(nvarchar(50), n.Codigos) AS idPractica,
               n.Descripcion AS practica,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS profesional,
               COALESCE(nx.montoPractica, a.Arancel, 0) * COALESCE(nx.cantidad, 1) AS montoCabo,
               px.debito AS montoDebito
        FROM dbo.ProfesionalXpractica px
        INNER JOIN dbo.Cabo c ON c.idCabo = px.idCabo AND c.idRegistroCobro IS NOT NULL
        INNER JOIN dbo.NomencladorXcabo nx ON nx.idNomencladoXcabo = px.idNomencladorXcabo
        INNER JOIN dbo.Nomenclador n ON n.Id = nx.idNomenclador
        LEFT JOIN Aranceles a ON a.Codigos = n.Codigos
        LEFT JOIN dbo.Profesionales p ON p.idProfesional = px.idProfesional
        WHERE px.debito IS NOT NULL AND px.debito <> 0
        ORDER BY c.idRegistroCobro, c.idCabo, px.idProfesionalXpractica
        """, cancellationToken);

    var appointmentRestriction = !isAdmin && currentUser["idProfesional"] is not null ? 1 : 0;
    var linkedProfessionalId = currentUser["idProfesional"] is null ? 0 : Convert.ToInt32(currentUser["idProfesional"]);
    var appointmentsTask = QueryIf(Has("appointments"),"""
        SELECT idTurno AS id, CONVERT(varchar(10), fecha, 23) AS fecha,
               LEFT(CONVERT(varchar(8), hora, 108), 5) AS hora, duracion,
               idProfesional AS profesionalCodigo, idPaciente AS pacienteCodigo,
               motivo, estado, observaciones
        FROM dbo.Turno
        WHERE @restrict=0 OR (@profesional>0 AND idProfesional=@profesional)
        ORDER BY fecha, hora
        """, cancellationToken, new() { ["restrict"] = appointmentRestriction, ["profesional"] = linkedProfessionalId });
    var availabilityTask = QueryIf(Has("appointments"),"""
        SELECT idDisponibilidad AS id, idProfesional AS profesionalCodigo, diaSemana,
               LEFT(CONVERT(varchar(8), desde, 108), 5) AS desde,
               LEFT(CONVERT(varchar(8), hasta, 108), 5) AS hasta, duracion
        FROM dbo.DisponibilidadProfesional ORDER BY idProfesional, diaSemana, desde
        """, cancellationToken);

    await Task.WhenAll(
        patientsTask, professionalsTask, personnelTask, medicationsTask,
        healthInsurancesTask, nomenclaturesTask, cieCodesTask, laboratoryCodesTask,
        specialtiesTask, areasTask, locationsTask, cabosTask, cobrosOSTask,
        cobroDebitsTask, appointmentsTask, availabilityTask);

    return Results.Ok(new
    {
        patients = Has("patients","appointments","cabos","clinical-history") ? patientsTask.Result : Empty(),
        professionals = Has("professionals","appointments","cabos","clinical-history","liquidacion-profesionales") ? professionalsTask.Result : Empty(),
        personnel = Has("personnel","liquidacion-personal") ? personnelTask.Result : Empty(),
        medications = Has("medications","cabos") ? medicationsTask.Result : Empty(),
        healthInsurances = Has("health-insurances","cabos","cobros-os","liquidacion-obra-social") ? healthInsurancesTask.Result : Empty(),
        nomenclatures = Has("nomenclature","cabos") ? nomenclaturesTask.Result : Empty(),
        cieCodes = Has("cabos") ? cieCodesTask.Result : Empty(),
        laboratoryCodes = Has("nomenclature","cabos") ? laboratoryCodesTask.Result : Empty(),
        specialties = Has("professionals","appointments","cabos") ? specialtiesTask.Result : Empty(),
        areas = Has("personnel") ? areasTask.Result : Empty(),
        locations = Has("patients","professionals","personnel") ? locationsTask.Result : Empty(),
        cabos = Has("cabos","cobros-os") ? cabosTask.Result : Empty(),
        cobrosOS = Has("cobros-os","liquidacion-profesionales","liquidacion-personal") ? cobrosOSTask.Result : Empty(),
        cobroDebits = Has("cobros-os") ? cobroDebitsTask.Result : Empty(),
        appointments = Has("appointments") ? appointmentsTask.Result : Empty(),
        availability = Has("appointments") ? availabilityTask.Result : Empty()
    });
});

app.MapGet("/api/statistics", async (DateOnly from, DateOnly to, int? healthInsuranceId, int? attentionType, string? service, HospitalDatabase db, CancellationToken ct) =>
{
    if (from > to || to.DayNumber - from.DayNumber > 1826)
        return Results.ValidationProblem(new Dictionary<string,string[]> { ["periodo"] = ["El período debe ser válido y no superar cinco años."] });

    var parameters = new Dictionary<string,object?> {
        ["from"] = from.ToDateTime(TimeOnly.MinValue), ["to"] = to.ToDateTime(TimeOnly.MaxValue),
        ["insurance"] = healthInsuranceId, ["type"] = attentionType,
        ["service"] = service?.Trim() ?? ""
    };
    const string filter = """
        c.fechaCabo BETWEEN @from AND @to
        AND (@insurance IS NULL OR c.idObraSocial=@insurance)
        AND (@type IS NULL OR c.idTipoAtencion=@type)
        AND (@service=N'' OR EXISTS (
            SELECT 1 FROM dbo.NomencladorXcabo fnx INNER JOIN dbo.Nomenclador fn ON fn.Id=fnx.idNomenclador
            WHERE fnx.idCabo=c.idCabo AND (CONVERT(nvarchar(50),fn.Codigos) LIKE N'%'+@service+N'%' OR fn.Descripcion LIKE N'%'+@service+N'%')
        ))
        """;

    var summary = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT COUNT_BIG(*) AS atenciones, COUNT(DISTINCT c.idPaciente) AS pacientes,
               SUM(CASE WHEN c.idTipoAtencion=3 THEN 1 ELSE 0 END) AS internaciones,
               SUM(COALESCE(costos.importe,0)) AS importePrestaciones,
               SUM(COALESCE(medicamentos.importe,0)) AS importeMedicamentos,
               CAST(AVG(CASE WHEN c.idTipoAtencion=3 AND c.fechaAltaInternacion IS NOT NULL
                   THEN CONVERT(decimal(10,2),DATEDIFF(DAY,c.fechaCabo,c.fechaAltaInternacion)) END) AS decimal(10,2)) AS estanciaPromedio
        FROM dbo.Cabo c
        OUTER APPLY (SELECT SUM(COALESCE(nx.montoPractica,0)*COALESCE(nx.cantidad,1)) importe FROM dbo.NomencladorXcabo nx WHERE nx.idCabo=c.idCabo) costos
        OUTER APPLY (SELECT SUM(COALESCE(m.precio,0)*COALESCE(mx.cantidad,1)) importe FROM dbo.MedicamentoXcabo mx INNER JOIN dbo.Medicamentos m ON m.idMedicamento=mx.idMedicamento WHERE mx.idCabo=c.idCabo) medicamentos
        WHERE {filter}
        """,ct,parameters);

    var trend = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT CONVERT(char(7),c.fechaCabo,120) AS periodo, COUNT_BIG(*) AS atenciones,
               COUNT(DISTINCT c.idPaciente) AS pacientes,
               SUM(CASE WHEN c.idTipoAtencion=3 THEN 1 ELSE 0 END) AS internaciones
        FROM dbo.Cabo c WHERE {filter}
        GROUP BY CONVERT(char(7),c.fechaCabo,120) ORDER BY periodo
        """,ct,parameters);

    var byType = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idTipoAtencion AS id,
               CASE c.idTipoAtencion WHEN 1 THEN N'Consulta' WHEN 2 THEN N'Práctica / Imagen' WHEN 3 THEN N'Internación' ELSE N'Otra atención' END AS nombre,
               COUNT_BIG(*) AS cantidad, COUNT(DISTINCT c.idPaciente) AS pacientes
        FROM dbo.Cabo c WHERE {filter}
        GROUP BY c.idTipoAtencion ORDER BY cantidad DESC
        """,ct,parameters);

    var byInsurance = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT TOP (12) c.idObraSocial AS id, COALESCE(os.descripcion,N'Sin cobertura') AS nombre,
               COUNT_BIG(*) AS cantidad, COUNT(DISTINCT c.idPaciente) AS pacientes
        FROM dbo.Cabo c LEFT JOIN dbo.ObraSocial os ON os.Id=c.idObraSocial WHERE {filter}
        GROUP BY c.idObraSocial,os.descripcion ORDER BY cantidad DESC
        """,ct,parameters);

    var practices = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT TOP (15) CONVERT(nvarchar(50),n.Codigos) AS codigo, LTRIM(RTRIM(n.Descripcion)) AS nombre,
               SUM(COALESCE(nx.cantidad,1)) AS cantidad, COUNT(DISTINCT c.idCabo) AS atenciones,
               SUM(COALESCE(nx.montoPractica,0)*COALESCE(nx.cantidad,1)) AS importe
        FROM dbo.Cabo c INNER JOIN dbo.NomencladorXcabo nx ON nx.idCabo=c.idCabo
        INNER JOIN dbo.Nomenclador n ON n.Id=nx.idNomenclador WHERE {filter}
        GROUP BY n.Codigos,n.Descripcion ORDER BY cantidad DESC,nombre
        """,ct,parameters);

    var medications = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT TOP (15) m.idMedicamento AS id,m.producto AS nombre,m.presentacion,
               SUM(COALESCE(mx.cantidad,1)) AS cantidad,COUNT(DISTINCT c.idCabo) AS atenciones,
               SUM(COALESCE(m.precio,0)*COALESCE(mx.cantidad,1)) AS importe
        FROM dbo.Cabo c INNER JOIN dbo.MedicamentoXcabo mx ON mx.idCabo=c.idCabo
        INNER JOIN dbo.Medicamentos m ON m.idMedicamento=mx.idMedicamento WHERE {filter}
        GROUP BY m.idMedicamento,m.producto,m.presentacion ORDER BY cantidad DESC,m.producto
        """,ct,parameters);

    var professionals = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT TOP (15) p.idProfesional AS id,LTRIM(RTRIM(CONCAT(p.apellido,N', ',p.nombre))) AS nombre,
               COUNT(DISTINCT c.idCabo) AS atenciones,COUNT(DISTINCT c.idPaciente) AS pacientes,
               SUM(COALESCE(nx.montoPractica,0)*COALESCE(nx.cantidad,1)) AS importe
        FROM dbo.Cabo c INNER JOIN dbo.ProfesionalXpractica px ON px.idCabo=c.idCabo
        INNER JOIN dbo.Profesionales p ON p.idProfesional=px.idProfesional
        LEFT JOIN dbo.NomencladorXcabo nx ON nx.idNomencladoXcabo=px.idNomencladorXcabo WHERE {filter}
        GROUP BY p.idProfesional,p.apellido,p.nombre ORDER BY atenciones DESC,nombre
        """,ct,parameters);

    var internments = await db.QueryAsync($"""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT COUNT_BIG(*) AS total,
               SUM(CASE WHEN c.fechaAltaInternacion IS NULL THEN 1 ELSE 0 END) AS sinAlta,
               SUM(CASE WHEN c.fechaAltaInternacion IS NOT NULL AND DATEDIFF(DAY,c.fechaCabo,c.fechaAltaInternacion)>=7 THEN 1 ELSE 0 END) AS prolongadas,
               MAX(CASE WHEN c.fechaAltaInternacion IS NOT NULL THEN DATEDIFF(DAY,c.fechaCabo,c.fechaAltaInternacion) END) AS estanciaMaxima
        FROM dbo.Cabo c WHERE c.idTipoAtencion=3 AND {filter}
        """,ct,parameters);

    var insurances = await db.QueryAsync("SELECT Id AS id,descripcion AS nombre FROM dbo.ObraSocial ORDER BY descripcion",ct);
    return Results.Ok(new { summary=summary[0],trend,byType,byInsurance,practices,medications,professionals,internments=internments[0],insurances });
});

app.MapGet("/api/liquidations/health-insurance", async (
    int healthInsuranceId, DateOnly from, DateOnly to,
    HospitalDatabase db, CancellationToken ct) =>
{
    if (healthInsuranceId <= 0 || from > to)
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["filters"] = ["La obra social y un período válido son obligatorios."]
        });

    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        WITH CabosFiltrados AS (
            SELECT c.idCabo, c.idPaciente, c.idTipoAtencion,
                   CASE WHEN c.idTipoAtencion = 3
                       THEN c.fechaAltaInternacion ELSE c.fechaCabo END AS fecha
            FROM dbo.Cabo c
            WHERE c.idObraSocial = @healthInsuranceId
              AND CASE WHEN c.idTipoAtencion = 3
                  THEN c.fechaAltaInternacion ELSE c.fechaCabo END BETWEEN @from AND @to
        ), Practicas AS (
            SELECT nx.idCabo, SUM(COALESCE(nx.montoPractica, 0)) AS honorarios
            FROM dbo.NomencladorXcabo nx
            INNER JOIN CabosFiltrados cf ON cf.idCabo = nx.idCabo
            GROUP BY nx.idCabo
        ), Medicamentos AS (
            SELECT mx.idCabo, SUM(COALESCE(mx.monto, 0)) AS gastos
            FROM dbo.MontoMedicamentoXcabo mx
            INNER JOIN CabosFiltrados cf ON cf.idCabo = mx.idCabo
            GROUP BY mx.idCabo
        )
        SELECT c.idCabo AS numeroOrden, CONVERT(varchar(10), c.fecha, 23) AS fecha,
               CONVERT(nvarchar(30), p.numeroAfiliado) AS numeroBeneficiario,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS beneficiario,
               CAST(0 AS decimal(18,2)) AS honorarios,
               CAST(0 AS decimal(18,2)) AS gastos,
               CAST(COALESCE(pr.honorarios, 0) + COALESCE(m.gastos, 0) AS decimal(18,2)) AS importeTotal,
               CASE WHEN c.idTipoAtencion = 3 THEN N'Internación' ELSE N'Ambulatoria' END AS tipoAtencion
        FROM CabosFiltrados c
        INNER JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        LEFT JOIN Practicas pr ON pr.idCabo = c.idCabo
        LEFT JOIN Medicamentos m ON m.idCabo = c.idCabo
        WHERE COALESCE(pr.honorarios, 0) <> 0 OR COALESCE(m.gastos, 0) <> 0
        ORDER BY fecha, c.idCabo
        """, ct, new()
        {
            ["healthInsuranceId"] = healthInsuranceId,
            ["from"] = from.ToDateTime(TimeOnly.MinValue),
            ["to"] = to.ToDateTime(TimeOnly.MinValue)
        });

    return Results.Ok(rows);
});

app.MapGet("/api/liquidations/health-insurance/ambulatory-report", async (
    int healthInsuranceId, DateOnly from, DateOnly to,
    HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = new Dictionary<string, object?>
    {
        ["healthInsuranceId"] = healthInsuranceId,
        ["from"] = from.ToDateTime(TimeOnly.MinValue),
        ["to"] = to.ToDateTime(TimeOnly.MinValue)
    };
    var insurance = await db.QueryAsync("""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo, descripcion, sigla,
               calle, numero, localidad, cp
        FROM dbo.ObraSocial WHERE Id=@healthInsuranceId
        """, ct, parameters);
    if (insurance.Count == 0) return Results.NotFound();
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idCabo AS numeroCabo, CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.nombre, N' ', p.apellido))) AS paciente,
               CONVERT(nvarchar(50), n.Codigos) AS codigo,
               COALESCE(nx.cantidad, 1) AS cantidad,
               CAST(0 AS decimal(18,2)) AS honorarios,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS gastos,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS importeTotal
        FROM dbo.Cabo c
        INNER JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        INNER JOIN dbo.NomencladorXcabo nx ON nx.idCabo = c.idCabo
        INNER JOIN dbo.Nomenclador n ON n.Id = nx.idNomenclador
        WHERE c.idObraSocial=@healthInsuranceId
          AND c.idTipoAtencion<>3
          AND CONVERT(nvarchar(50), n.Codigos) NOT LIKE N'34.%'
          AND c.fechaCabo BETWEEN @from AND @to
        ORDER BY c.idCabo, nx.idNomencladoXcabo
        """, ct, parameters);
    return Results.Ok(new { insurance = insurance[0], rows });
});

app.MapGet("/api/liquidations/health-insurance/internment-report", async (
    int healthInsuranceId, DateOnly from, DateOnly to,
    HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = new Dictionary<string, object?>
    {
        ["healthInsuranceId"] = healthInsuranceId,
        ["from"] = from.ToDateTime(TimeOnly.MinValue),
        ["to"] = to.ToDateTime(TimeOnly.MinValue)
    };
    var insurance = await db.QueryAsync("""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo, descripcion, sigla,
               calle, numero, localidad, cp
        FROM dbo.ObraSocial WHERE Id=@healthInsuranceId
        """, ct, parameters);
    if (insurance.Count == 0) return Results.NotFound();
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idCabo AS numeroCabo, CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.nombre, N' ', p.apellido))) AS paciente,
               COALESCE(nx.cantidad, 1) AS cantidad,
               CAST(0 AS decimal(18,2)) AS honorarios,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS gastos,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS importeTotal
        FROM dbo.Cabo c
        INNER JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        INNER JOIN dbo.NomencladorXcabo nx ON nx.idCabo = c.idCabo
        WHERE c.idObraSocial=@healthInsuranceId
          AND c.idTipoAtencion=3
          AND c.fechaAltaInternacion BETWEEN @from AND @to
        ORDER BY c.idCabo, nx.idNomencladoXcabo
        """, ct, parameters);
    return Results.Ok(new { insurance = insurance[0], rows });
});

app.MapGet("/api/liquidations/health-insurance/hospitalization-report", async (
    int healthInsuranceId, DateOnly from, DateOnly to,
    HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = new Dictionary<string, object?>
    {
        ["healthInsuranceId"] = healthInsuranceId,
        ["from"] = from.ToDateTime(TimeOnly.MinValue),
        ["to"] = to.ToDateTime(TimeOnly.MinValue)
    };
    var insurance = await db.QueryAsync("""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo, descripcion, sigla,
               calle, numero, localidad, cp
        FROM dbo.ObraSocial WHERE Id=@healthInsuranceId
        """, ct, parameters);
    if (insurance.Count == 0) return Results.NotFound();
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idCabo AS numeroCabo,
               CONVERT(varchar(10), c.fechaCabo, 23) AS fechaIngreso,
               CONVERT(varchar(10), c.fechaAltaInternacion, 23) AS fechaAlta,
               CONVERT(nvarchar(20), p.numeroAfiliado) AS numeroBeneficiario,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS paciente,
               CONVERT(nvarchar(20), p.dni) AS dni,
               CONVERT(varchar(10), p.fecha_nacimiento, 23) AS fechaNacimiento,
               LTRIM(RTRIM(p.ocupacion)) AS ocupacion,
               CASE p.sexo WHEN 1 THEN N'Masculino' WHEN 2 THEN N'Femenino' ELSE N'' END AS sexo,
               CASE p.idEstadoCivil WHEN 1 THEN N'Soltero/a' WHEN 2 THEN N'Casado/a'
                    WHEN 3 THEN N'Divorciado/a' WHEN 4 THEN N'Viudo/a' ELSE N'Sin especificar' END AS estadoCivil,
               COALESCE(NULLIF(LTRIM(RTRIM(p.telefonoCelular)), N''), LTRIM(RTRIM(p.telefonoFijo))) AS telefono,
               LTRIM(RTRIM(p.calle)) AS calle, LTRIM(RTRIM(p.numero)) AS numero,
               l.nombre AS localidad, LTRIM(RTRIM(p.cp)) AS cp,
               cie.Codigo AS diagnosticoCodigo, cie.Descripcion AS diagnosticoDescripcion,
               cx.observaciones AS diagnosticoObservaciones
        FROM dbo.Cabo c
        INNER JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        LEFT JOIN dbo.Localidades l ON l.id = p.idLocalidad
        LEFT JOIN dbo.CIExCabo cx ON cx.idCabo = c.idCabo
        LEFT JOIN dbo.CIE_10_COD3 cie ON cie.Id = cx.idCIE
        WHERE c.idObraSocial=@healthInsuranceId
          AND c.idTipoAtencion=3
          AND c.fechaAltaInternacion BETWEEN @from AND @to
          AND EXISTS (SELECT 1 FROM dbo.NomencladorXcabo nx WHERE nx.idCabo=c.idCabo)
        ORDER BY c.fechaAltaInternacion, c.idCabo, cx.idCIExCabo
        """, ct, parameters);
    return Results.Ok(new { insurance = insurance[0], rows });
});

app.MapGet("/api/liquidations/health-insurance/image-report", async (
    int healthInsuranceId, DateOnly from, DateOnly to,
    HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = new Dictionary<string, object?>
    {
        ["healthInsuranceId"] = healthInsuranceId,
        ["from"] = from.ToDateTime(TimeOnly.MinValue),
        ["to"] = to.ToDateTime(TimeOnly.MinValue)
    };
    var insurance = await db.QueryAsync("""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo, descripcion, sigla,
               calle, numero, localidad, cp
        FROM dbo.ObraSocial WHERE Id=@healthInsuranceId
        """, ct, parameters);
    if (insurance.Count == 0) return Results.NotFound();
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idCabo AS numeroCabo, CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.nombre, N' ', p.apellido))) AS paciente,
               CONVERT(nvarchar(50), n.Codigos) AS codigo,
               COALESCE(nx.cantidad, 1) AS cantidad,
               CAST(0 AS decimal(18,2)) AS honorarios,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS gastos,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS importeTotal
        FROM dbo.Cabo c
        INNER JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        INNER JOIN dbo.NomencladorXcabo nx ON nx.idCabo = c.idCabo
        INNER JOIN dbo.Nomenclador n ON n.Id = nx.idNomenclador
        WHERE c.idObraSocial=@healthInsuranceId
          AND c.idTipoAtencion<>3
          AND CONVERT(nvarchar(50), n.Codigos) LIKE N'34.%'
          AND c.fechaCabo BETWEEN @from AND @to
        ORDER BY c.idCabo, nx.idNomencladoXcabo
        """, ct, parameters);
    return Results.Ok(new { insurance = insurance[0], rows });
});

app.MapGet("/api/liquidations/health-insurance/laboratory-report", async (
    int healthInsuranceId, DateOnly from, DateOnly to,
    HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = new Dictionary<string, object?>
    {
        ["healthInsuranceId"] = healthInsuranceId,
        ["from"] = from.ToDateTime(TimeOnly.MinValue),
        ["to"] = to.ToDateTime(TimeOnly.MinValue)
    };
    var insurance = await db.QueryAsync("""
        SELECT Id AS id, CONVERT(nvarchar(50), codigo) AS codigo, descripcion, sigla,
               calle, numero, localidad, cp
        FROM dbo.ObraSocial WHERE Id=@healthInsuranceId
        """, ct, parameters);
    if (insurance.Count == 0) return Results.NotFound();
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idCabo AS numeroCabo, CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.nombre, N' ', p.apellido))) AS paciente,
               COALESCE(cat.codigo, CONVERT(nvarchar(50), l.idNomenclador)) AS codigo,
               l.Descripcion AS laboratorio, COALESCE(lx.cantidad, 1) AS cantidad,
               CAST(COALESCE(lx.monto, 0) AS decimal(18,2)) AS importeTotal
        FROM dbo.Cabo c
        INNER JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        INNER JOIN dbo.LaboratorioXcabo lx ON lx.idCabo = c.idCabo
        INNER JOIN dbo.Nomenclador_Laboratorio l ON l.Id = lx.idLaboratorio
        OUTER APPLY (
            SELECT MIN(n.Codigos) AS codigo FROM dbo.Nomenclador n
            WHERE n.Codigos LIKE N'40.%'
              AND LTRIM(RTRIM(n.Descripcion)) = LTRIM(RTRIM(l.idNomenclador))
        ) cat
        WHERE c.idObraSocial=@healthInsuranceId
          AND CASE WHEN c.idTipoAtencion=3 THEN c.fechaAltaInternacion ELSE c.fechaCabo END BETWEEN @from AND @to
        ORDER BY c.idCabo, lx.id
        """, ct, parameters);
    return Results.Ok(new { insurance = insurance[0], rows });
});

app.MapGet("/api/liquidations/professionals", async (
    DateOnly from, DateOnly to, HospitalDatabase db, CancellationToken ct) =>
{
    if (from > to)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["period"] = ["El período no es válido."] });
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        WITH Movimientos AS (
            SELECT pp.idProfesional, c.idCabo, COALESCE(nx.montoPractica, 0) AS monto
            FROM dbo.ProfesionalXpractica pp
            INNER JOIN dbo.NomencladorXcabo nx ON nx.idNomencladoXcabo = pp.idNomencladorXcabo
            INNER JOIN dbo.Cabo c ON c.idCabo = pp.idCabo
            INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro = c.idRegistroCobro
            WHERE c.fechaCobroCabo BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(rc.estado))) = N'COBRADA'
            UNION ALL
            SELECT 1054, c.idCabo, COALESCE(mm.monto, 0)
            FROM dbo.MontoMedicamentoXcabo mm
            INNER JOIN dbo.Cabo c ON c.idCabo = mm.idCabo
            INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro = c.idRegistroCobro
            WHERE c.fechaCobroCabo BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(rc.estado))) = N'COBRADA'
            UNION ALL
            SELECT 1057, c.idCabo, COALESCE(l.monto, 0) * COALESCE(l.cantidad, 1)
            FROM dbo.LaboratorioXcabo l
            INNER JOIN dbo.Cabo c ON c.idCabo = l.idCabo
            INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro = c.idRegistroCobro
            WHERE c.fechaCobroCabo BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(rc.estado))) = N'COBRADA'
        )
        SELECT p.idProfesional AS id, CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS profesional,
               CAST(SUM(m.monto) AS decimal(18,2)) AS producido,
               CAST(SUM(m.monto) * 0.18 AS decimal(18,2)) AS descuento18,
               CAST(SUM(m.monto) * 0.82 AS decimal(18,2)) AS neto82,
               CAST(COALESCE(p.porc_autogestion, 0) AS decimal(8,2)) AS porcentajeCobro,
               CAST(SUM(m.monto) * 0.82 *
                    (COALESCE(p.porc_autogestion, 0) / 100.0) AS decimal(18,2)) AS totalCobrar
        FROM Movimientos m
        INNER JOIN dbo.Profesionales p ON p.idProfesional = m.idProfesional
        GROUP BY p.idProfesional, p.dni, p.apellido, p.nombre, p.porc_autogestion
        ORDER BY p.apellido, p.nombre
        """, ct, new()
        {
            ["from"] = from.ToDateTime(TimeOnly.MinValue),
            ["to"] = to.ToDateTime(TimeOnly.MinValue)
        });
    return Results.Ok(rows);
});

app.MapGet("/api/liquidations/professionals/by-insurance-report", async (
    DateOnly from, DateOnly to, HospitalDatabase db, CancellationToken ct) =>
{
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        WITH Movimientos AS (
            SELECT rc.idRegistro, rc.numeroFactura, rc.importeFacturado, rc.importeCobrado,
                   os.descripcion AS obraSocial, pp.idProfesional,
                   COALESCE(nx.montoPractica, 0) - COALESCE(pp.debito, 0) AS producido
            FROM dbo.ProfesionalXpractica pp
            INNER JOIN dbo.NomencladorXcabo nx ON nx.idNomencladoXcabo=pp.idNomencladorXcabo
            INNER JOIN dbo.Cabo c ON c.idCabo=pp.idCabo
            INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro=c.idRegistroCobro
            LEFT JOIN dbo.ObraSocial os ON os.Id=c.idObraSocial
            WHERE c.fechaCobroCabo BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(rc.estado)))=N'COBRADA'
            UNION ALL
            SELECT rc.idRegistro, rc.numeroFactura, rc.importeFacturado, rc.importeCobrado,
                   os.descripcion, 1054, COALESCE(mm.monto, 0)
            FROM dbo.MontoMedicamentoXcabo mm
            INNER JOIN dbo.Cabo c ON c.idCabo=mm.idCabo
            INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro=c.idRegistroCobro
            LEFT JOIN dbo.ObraSocial os ON os.Id=c.idObraSocial
            WHERE c.fechaCobroCabo BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(rc.estado)))=N'COBRADA'
            UNION ALL
            SELECT rc.idRegistro, rc.numeroFactura, rc.importeFacturado, rc.importeCobrado,
                   os.descripcion, 1057, COALESCE(l.monto, 0)*COALESCE(l.cantidad, 1)
            FROM dbo.LaboratorioXcabo l
            INNER JOIN dbo.Cabo c ON c.idCabo=l.idCabo
            INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro=c.idRegistroCobro
            LEFT JOIN dbo.ObraSocial os ON os.Id=c.idObraSocial
            WHERE c.fechaCobroCabo BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(rc.estado)))=N'COBRADA'
        )
        SELECT m.idRegistro, m.numeroFactura, m.obraSocial,
               CAST(MAX(COALESCE(m.importeFacturado,0)) AS decimal(18,2)) AS importeFacturado,
               CAST(MAX(COALESCE(m.importeCobrado,0)) AS decimal(18,2)) AS importeCobrado,
               p.idProfesional AS profesionalId,
               LTRIM(RTRIM(CONCAT(p.apellido,N', ',p.nombre))) AS profesional,
               CAST(SUM(m.producido) AS decimal(18,2)) AS producido,
               CAST(SUM(m.producido)*0.18 AS decimal(18,2)) AS descuento18,
               CAST(SUM(m.producido)*0.82 AS decimal(18,2)) AS neto82,
               CAST(COALESCE(p.porc_autogestion,0) AS decimal(8,2)) AS porcentajeCobro,
               CAST(SUM(m.producido)*0.82*(COALESCE(p.porc_autogestion,0)/100.0) AS decimal(18,2)) AS totalCobrar
        FROM Movimientos m
        INNER JOIN dbo.Profesionales p ON p.idProfesional=m.idProfesional
        GROUP BY m.idRegistro,m.numeroFactura,m.obraSocial,p.idProfesional,p.apellido,p.nombre,p.porc_autogestion
        ORDER BY m.obraSocial,m.idRegistro,p.apellido,p.nombre
        """, ct, new()
        {
            ["from"] = from.ToDateTime(TimeOnly.MinValue),
            ["to"] = to.ToDateTime(TimeOnly.MinValue)
        });
    return Results.Ok(rows);
});

app.MapGet("/api/liquidations/professionals/{professionalId:int}/detail", async (
    int professionalId, DateOnly from, DateOnly to, HospitalDatabase db, CancellationToken ct) =>
{
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT c.idCabo AS numeroCabo, CONVERT(varchar(10), c.fechaCobroCabo, 23) AS fechaCobro,
               os.descripcion AS obraSocial, rc.numeroFactura,
               CONVERT(nvarchar(50), n.Codigos) AS codigo,
               LTRIM(RTRIM(n.Descripcion)) AS practica, nx.cantidad,
               CAST(COALESCE(nx.montoPractica, 0) AS decimal(18,2)) AS importe,
               CAST(COALESCE(pp.debito, 0) AS decimal(18,2)) AS debito
        FROM dbo.ProfesionalXpractica pp
        INNER JOIN dbo.NomencladorXcabo nx ON nx.idNomencladoXcabo = pp.idNomencladorXcabo
        INNER JOIN dbo.Nomenclador n ON n.Id = nx.idNomenclador
        INNER JOIN dbo.Cabo c ON c.idCabo = pp.idCabo
        INNER JOIN dbo.RegistroCobroOS rc ON rc.idRegistro = c.idRegistroCobro
        LEFT JOIN dbo.ObraSocial os ON os.Id = c.idObraSocial
        WHERE pp.idProfesional = @professionalId
          AND c.fechaCobroCabo BETWEEN @from AND @to
          AND UPPER(LTRIM(RTRIM(rc.estado))) = N'COBRADA'
        ORDER BY c.fechaCobroCabo, c.idCabo, nx.idNomencladoXcabo
        """, ct, new()
        {
            ["professionalId"] = professionalId,
            ["from"] = from.ToDateTime(TimeOnly.MinValue),
            ["to"] = to.ToDateTime(TimeOnly.MinValue)
        });
    return Results.Ok(rows);
});

app.MapGet("/api/liquidations/personnel", async (
    DateOnly from, DateOnly to, HospitalDatabase db, CancellationToken ct) =>
{
    if (from > to)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["period"] = ["El período no es válido."] });
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        WITH Cobros AS (
            SELECT CAST(COALESCE(SUM(COALESCE(importeCobrado, 0)), 0) AS decimal(18,2)) AS brutoCobrado
            FROM dbo.RegistroCobroOS
            WHERE fechaCobro BETWEEN @from AND @to
              AND UPPER(LTRIM(RTRIM(estado))) = N'COBRADA'
        ), Cantidad AS (
            SELECT COUNT(*) AS totalPersonal FROM dbo.Personal
        )
        SELECT p.idPersonal AS id, CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS personal,
               c.brutoCobrado,
               CAST(c.brutoCobrado * 0.18 AS decimal(18,2)) AS fondo18,
               CAST(c.brutoCobrado * 0.82 AS decimal(18,2)) AS neto82,
               CAST(c.brutoCobrado * 0.82 * 0.10 AS decimal(18,2)) AS fondoPersonal10,
               q.totalPersonal,
               CAST(CASE WHEN q.totalPersonal = 0 THEN 0
                    ELSE (c.brutoCobrado * 0.82 * 0.10) / q.totalPersonal END AS decimal(18,2)) AS totalCobrar
        FROM dbo.Personal p CROSS JOIN Cobros c CROSS JOIN Cantidad q
        ORDER BY p.apellido, p.nombre
        """, ct, new()
        {
            ["from"] = from.ToDateTime(TimeOnly.MinValue),
            ["to"] = to.ToDateTime(TimeOnly.MinValue)
        });
    return Results.Ok(rows);
});

app.MapGet("/api/liquidations/personnel/detail", async (
    DateOnly from, DateOnly to, HospitalDatabase db, CancellationToken ct) =>
{
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT r.idRegistro AS id, CONVERT(varchar(10), r.fechaCobro, 23) AS fechaCobro,
               os.descripcion AS obraSocial, r.numeroFactura,
               CAST(COALESCE(r.importeFacturado, 0) AS decimal(18,2)) AS importeFacturado,
               CAST(COALESCE(r.importeCobrado, 0) AS decimal(18,2)) AS importeCobrado
        FROM dbo.RegistroCobroOS r
        LEFT JOIN dbo.ObraSocial os ON os.Id = r.idObraSocial
        WHERE r.fechaCobro BETWEEN @from AND @to
          AND UPPER(LTRIM(RTRIM(r.estado))) = N'COBRADA'
        ORDER BY r.fechaCobro, os.descripcion, r.idRegistro
        """, ct, new()
        {
            ["from"] = from.ToDateTime(TimeOnly.MinValue),
            ["to"] = to.ToDateTime(TimeOnly.MinValue)
        });
    return Results.Ok(rows);
});

app.MapPost("/api/appointments", async (AppointmentInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (!DateOnly.TryParse(input.Fecha, out _) || !TimeSpan.TryParse(input.Hora, out _) || input.Duracion <= 0)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["turno"] = ["Fecha, hora y duración váidas son obligatorias."] });
    var parameters = input.Parameters(); parameters["id"] = 0;
    if (await db.ScalarAsync<int>(AppointmentInput.CollisionSql, parameters, ct) > 0)
        return Results.Conflict(new { detail = "Ese horario ya está ocupado para el profesional." });
    var id = await db.ScalarAsync<int>("""
        INSERT dbo.Turno(fecha,hora,duracion,idProfesional,idPaciente,motivo,estado,observaciones)
        OUTPUT INSERTED.idTurno VALUES(@fecha,@hora,@duracion,@profesional,@paciente,@motivo,@estado,@observaciones)
        """, parameters, ct);
    return Results.Created($"/api/appointments/{id}", input.ToResponse(id));
});

app.MapPut("/api/appointments/{id:int}", async (int id, AppointmentInput input, HttpContext context, HospitalDatabase db, CancellationToken ct) =>
{
    var allowedStates = new[] { "Programado", "Confirmado", "En espera", "En atención", "Atendido", "Ausente", "Cancelado" };
    if (!allowedStates.Contains(input.Estado)) return Results.ValidationProblem(new Dictionary<string,string[]> { ["estado"] = ["El estado indicado no es válido."] });
    var current=(Dictionary<string,object?>)context.Items["user"]!;
    if(current["administrador"] is not true && current["idProfesional"] is not null)
    {
        var ownsToday=await db.ScalarAsync<int>("SELECT COUNT(*) FROM dbo.Turno WHERE idTurno=@id AND idProfesional=@profesional AND fecha=CAST(GETDATE() AS date)",new(){["id"]=id,["profesional"]=current["idProfesional"]},ct);
        if(ownsToday==0) return Results.Problem("Sólo podés modificar tus turnos del día.",statusCode:403);
        var affectedStatus=await db.ExecuteAsync("UPDATE dbo.Turno SET estado=@estado,observaciones=@observaciones WHERE idTurno=@id",new(){["id"]=id,["estado"]=input.Estado,["observaciones"]=input.Observaciones},ct);
        return affectedStatus==0?Results.NotFound():Results.Ok(input.ToResponse(id));
    }
    var parameters = input.Parameters(); parameters["id"] = id;
    if (await db.ScalarAsync<int>(AppointmentInput.CollisionSql, parameters, ct) > 0)
        return Results.Conflict(new { detail = "Ese horario ya está ocupado para el profesional." });
    var affected = await db.ExecuteAsync("""
        UPDATE dbo.Turno SET fecha=@fecha,hora=@hora,duracion=@duracion,idProfesional=@profesional,
        idPaciente=@paciente,motivo=@motivo,estado=@estado,observaciones=@observaciones WHERE idTurno=@id
        """, parameters, ct);
    return affected == 0 ? Results.NotFound() : Results.Ok(input.ToResponse(id));
});

app.MapPost("/api/availability", async (AvailabilityInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var id = await db.ScalarAsync<int>("""
        INSERT dbo.DisponibilidadProfesional(idProfesional,diaSemana,desde,hasta,duracion)
        OUTPUT INSERTED.idDisponibilidad VALUES(@profesional,@dia,@desde,@hasta,@duracion)
        """, input.Parameters(), ct);
    return Results.Created($"/api/availability/{id}", input.ToResponse(id));
});

app.MapDelete("/api/availability/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.DisponibilidadProfesional WHERE idDisponibilidad=@id", new() { ["id"] = id }, ct) == 0
        ? Results.NotFound() : Results.NoContent());

app.MapGet("/api/cabos", async (int? beforeId, int? limit, string? patient, DateOnly? dateFrom, DateOnly? dateTo, string? healthInsurance, HospitalDatabase db, CancellationToken ct) =>
{
    var pageSize = Math.Clamp(limit ?? 500, 1, 500);
    var patientFilter = patient?.Trim() ?? "";
    var insuranceFilter = healthInsurance?.Trim() ?? "";
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT TOP (@take) c.idCabo AS id, CONVERT(nvarchar(20), c.idCabo) AS numero,
               CONVERT(varchar(10), c.fechaCabo, 23) AS fecha,
               c.codigoCabo AS codigoRefes, c.idPaciente AS pacienteCodigo,
               CONVERT(nvarchar(20), p.dni) AS dni,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS nombre,
               CASE WHEN p.fecha_nacimiento IS NULL THEN NULL ELSE
                   DATEDIFF(YEAR, p.fecha_nacimiento, CAST(GETDATE() AS date)) -
                   CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.fecha_nacimiento, CAST(GETDATE() AS date)), p.fecha_nacimiento) > CAST(GETDATE() AS date) THEN 1 ELSE 0 END
               END AS edad,
               CASE p.sexo WHEN 1 THEN N'Masculino' WHEN 2 THEN N'Femenino' ELSE N'' END AS sexo,
               CASE p.idTipoBeneficiario WHEN 1 THEN N'Titular' WHEN 2 THEN N'Familiar' WHEN 3 THEN N'Adherente' WHEN 4 THEN N'Otro' ELSE N'' END AS beneficiario,
               CASE p.idParentesco WHEN 1 THEN N'Cónyuge' WHEN 2 THEN N'Hijo/a' WHEN 3 THEN N'Otro' ELSE N'' END AS parentesco,
               os.descripcion AS obraSocial, CONVERT(nvarchar(50), os.codigo) AS rnos,
               CASE c.idTipoAtencion WHEN 1 THEN N'Consulta' WHEN 2 THEN N'Práctica' WHEN 3 THEN N'Imagen' WHEN 4 THEN N'Internación' ELSE N'Consulta' END AS tipoAtencion,
               CONVERT(varchar(10), c.fechaAltaInternacion, 23) AS fechaAlta
        FROM dbo.Cabo c
        LEFT JOIN dbo.Paciente p ON p.idPaciente = c.idPaciente
        LEFT JOIN dbo.ObraSocial os ON os.Id = c.idObraSocial
        WHERE (@beforeId IS NULL OR c.idCabo < @beforeId)
          AND (@patient = N'' OR CONVERT(nvarchar(20), p.dni) LIKE N'%' + @patient + N'%'
               OR CONCAT(p.nombre, N' ', p.apellido, N' ', p.apellido, N', ', p.nombre) LIKE N'%' + @patient + N'%')
          AND (@dateFrom IS NULL OR c.fechaCabo >= @dateFrom)
          AND (@dateTo IS NULL OR c.fechaCabo <= @dateTo)
          AND (@healthInsurance = N'' OR os.descripcion = @healthInsurance)
        ORDER BY c.idCabo DESC
        """, ct, new() {
            ["take"] = pageSize + 1, ["beforeId"] = beforeId,
            ["patient"] = patientFilter, ["dateFrom"] = dateFrom,
            ["dateTo"] = dateTo, ["healthInsurance"] = insuranceFilter
        });
    var hasMore = rows.Count > pageSize;
    return Results.Ok(new { items = rows.Take(pageSize), hasMore });
});

app.MapGet("/api/cabos/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
{
    var exists = await db.ScalarAsync<int>("SELECT COUNT(*) FROM dbo.Cabo WHERE idCabo=@id", new() { ["id"] = id }, ct);
    if (exists == 0) return Results.NotFound();

    var parameters = new Dictionary<string, object?> { ["id"] = id };
    var prestaciones = await db.QueryAsync("""
        SELECT CONVERT(nvarchar(50), n.Codigos) AS codigo, n.Descripcion AS descripcion,
               nx.cantidad, COALESCE(nx.montoPractica, a.Arancel, 0) AS arancel,
               MAX(CASE WHEN px.orden = 1 THEN px.idProfesional END) AS profesional1Id,
               MAX(CASE WHEN px.orden = 1 THEN CONCAT(px.apellido, N', ', px.nombre) END) AS profesional1,
               MAX(CASE WHEN px.orden = 2 THEN px.idProfesional END) AS profesional2Id,
               MAX(CASE WHEN px.orden = 2 THEN CONCAT(px.apellido, N', ', px.nombre) END) AS profesional2
        FROM dbo.NomencladorXcabo nx
        INNER JOIN dbo.Nomenclador n ON n.Id = nx.idNomenclador
        LEFT JOIN dbo.Arancel_Nomenclador a ON a.Codigos = n.Codigos
        LEFT JOIN (
            SELECT pp.idNomencladorXcabo, pp.idProfesional, p.apellido, p.nombre,
                   ROW_NUMBER() OVER (PARTITION BY pp.idNomencladorXcabo ORDER BY pp.idProfesionalXpractica) AS orden
            FROM dbo.ProfesionalXpractica pp
            LEFT JOIN dbo.Profesionales p ON p.idProfesional = pp.idProfesional
            WHERE pp.idCabo=@id
        ) px ON px.idNomencladorXcabo = nx.idNomencladoXcabo AND px.orden <= 2
        WHERE nx.idCabo=@id
        GROUP BY nx.idNomencladoXcabo, n.Codigos, n.Descripcion, nx.cantidad, nx.montoPractica, a.Arancel
        ORDER BY nx.idNomencladoXcabo
        """, ct, parameters);
    var diagnosticos = await db.QueryAsync("""
        SELECT CONVERT(nvarchar(50), c.Codigo) AS codigo, c.Descripcion AS descripcion, cx.observaciones
        FROM dbo.CIExCabo cx INNER JOIN dbo.CIE_10_COD3 c ON c.Id = cx.idCIE
        WHERE cx.idCabo=@id ORDER BY cx.idCIExCabo
        """, ct, parameters);
    var medicamentos = await db.QueryAsync("""
        SELECT m.idMedicamento AS medicamentoId, m.producto, m.presentacion, mx.cantidad
        FROM dbo.MedicamentoXcabo mx INNER JOIN dbo.Medicamentos m ON m.idMedicamento = mx.idMedicamento
        WHERE mx.idCabo=@id ORDER BY mx.idMedicamentoXcabo
        """, ct, parameters);
    var laboratorio = await db.QueryAsync("""
        SELECT l.Id AS laboratorioId, COALESCE(cat.codigo, CONVERT(nvarchar(50), l.idNomenclador)) AS codigo, l.Descripcion AS descripcion,
               lx.cantidad, lx.monto
        FROM dbo.LaboratorioXcabo lx INNER JOIN dbo.Nomenclador_Laboratorio l ON l.Id = lx.idLaboratorio
        OUTER APPLY (
            SELECT MIN(n.Codigos) AS codigo FROM dbo.Nomenclador n
            WHERE n.Codigos LIKE N'40.%'
              AND LTRIM(RTRIM(n.Descripcion)) = LTRIM(RTRIM(l.idNomenclador))
        ) cat
        WHERE lx.idCabo=@id ORDER BY lx.id
        """, ct, parameters);

    return Results.Ok(new { prestaciones, diagnosticos, medicamentos, laboratorio });
});

app.MapGet("/api/cobros/{id:int}/cabos-debito", async (int id, int? caboId, DateOnly? fechaPrestacion, int? obraSocialId, HospitalDatabase db, CancellationToken ct) =>
{
    var rows = await db.QueryAsync("""
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT DISTINCT px.idProfesionalXpractica AS id,
               CONCAT(N'DEBIT-', px.idProfesionalXpractica) AS [key],
               c.idCabo, CONVERT(nvarchar(20), c.idCabo) AS numeroCabo,
               CONVERT(varchar(10), COALESCE(c.fechaAltaInternacion, c.fechaCabo), 23) AS fechaPrestacion,
               CONVERT(nvarchar(255), n.Codigos) AS idPractica, n.Descripcion AS practica,
               LTRIM(RTRIM(CONCAT(p.apellido, N' ', p.nombre))) AS profesional,
               COALESCE(nx.cantidad, 1) * COALESCE(nx.montoPractica, 0) AS montoCabo,
               COALESCE(px.debito, 0) AS montoDebito
        FROM dbo.RegistroCobroOS r
        INNER JOIN dbo.Cabo c ON c.idObraSocial = r.idObraSocial
        INNER JOIN dbo.NomencladorXcabo nx ON nx.idCabo = c.idCabo
        INNER JOIN dbo.Nomenclador n ON n.Id = nx.idNomenclador
        INNER JOIN dbo.ProfesionalXpractica px ON px.idCabo = c.idCabo AND px.idNomencladorXcabo = nx.idNomencladoXcabo
        LEFT JOIN dbo.Profesionales p ON p.idProfesional = px.idProfesional
        WHERE r.idRegistro = @id
          AND (@caboId = 0 OR c.idCabo = @caboId)
          AND (@fechaPrestacion IS NULL OR
               (MONTH(COALESCE(c.fechaAltaInternacion, c.fechaCabo)) = MONTH(@fechaPrestacion) AND
                YEAR(COALESCE(c.fechaAltaInternacion, c.fechaCabo)) = YEAR(@fechaPrestacion)))
          AND (@obraSocialId IS NULL OR c.idObraSocial = @obraSocialId)
        ORDER BY c.idCabo, px.idProfesionalXpractica;
        """, ct, new() {
            ["id"] = id, ["caboId"] = caboId ?? 0,
            ["fechaPrestacion"] = fechaPrestacion?.ToDateTime(TimeOnly.MinValue), ["obraSocialId"] = obraSocialId
        });
    return Results.Ok(rows);
});

app.MapGet("/api/clinical-records/patients/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
{
    var patientTask = db.QueryAsync("""
        SELECT idPaciente AS id, CONVERT(nvarchar(20), dni) AS dni, nombre, apellido,
               CONVERT(varchar(10), fecha_nacimiento, 23) AS nacimiento
        FROM dbo.Paciente WHERE idPaciente=@id
        """, ct, new() { ["id"] = id });
    var appointmentsTask = db.QueryAsync("""
        SELECT t.idTurno AS id, CONVERT(varchar(10), t.fecha, 23) AS fecha,
               LEFT(CONVERT(varchar(8), t.hora, 108), 5) AS hora, t.estado, t.motivo, t.observaciones,
               t.idProfesional AS profesionalId, LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS profesional
        FROM dbo.Turno t
        LEFT JOIN dbo.Profesionales p ON p.idProfesional=t.idProfesional
        WHERE t.idPaciente=@id ORDER BY t.fecha DESC, t.hora DESC
        """, ct, new() { ["id"] = id });
    var cabosTask = db.QueryAsync("""
        SELECT c.idCabo AS id, CONVERT(nvarchar(20), c.idCabo) AS numero,
               CONVERT(varchar(10), c.fechaCabo, 23) AS fecha,
               CASE c.idTipoAtencion WHEN 1 THEN N'Consulta' WHEN 2 THEN N'Práctica' WHEN 3 THEN N'Internación' ELSE N'Atención' END AS tipoAtencion,
               os.descripcion AS obraSocial, profesionales.nombres AS profesionales,
               prestaciones.detalle AS prestaciones, diagnosticos.detalle AS diagnosticos,
               laboratorio.detalle AS laboratorio
        FROM dbo.Cabo c
        LEFT JOIN dbo.ObraSocial os ON os.Id=c.idObraSocial
        OUTER APPLY (SELECT STRING_AGG(x.nombre, N', ') AS nombres FROM (
            SELECT DISTINCT LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS nombre
            FROM dbo.ProfesionalXpractica px LEFT JOIN dbo.Profesionales p ON p.idProfesional=px.idProfesional
            WHERE px.idCabo=c.idCabo AND p.idProfesional IS NOT NULL
        ) x) profesionales
        OUTER APPLY (SELECT STRING_AGG(x.descripcion, N'; ') AS detalle FROM (
            SELECT DISTINCT LTRIM(RTRIM(n.Descripcion)) AS descripcion
            FROM dbo.NomencladorXcabo nx INNER JOIN dbo.Nomenclador n ON n.Id=nx.idNomenclador
            WHERE nx.idCabo=c.idCabo
        ) x) prestaciones
        OUTER APPLY (SELECT STRING_AGG(x.descripcion, N'; ') AS detalle FROM (
            SELECT DISTINCT CONCAT(cie.Codigo, N' - ', cie.Descripcion) AS descripcion
            FROM dbo.CIExCabo cx INNER JOIN dbo.CIE_10_COD3 cie ON cie.Id=cx.idCIE
            WHERE cx.idCabo=c.idCabo
        ) x) diagnosticos
        OUTER APPLY (SELECT STRING_AGG(x.descripcion, N'; ') AS detalle FROM (
            SELECT DISTINCT LTRIM(RTRIM(l.Descripcion)) AS descripcion
            FROM dbo.LaboratorioXcabo lx INNER JOIN dbo.Nomenclador_Laboratorio l ON l.Id=lx.idLaboratorio
            WHERE lx.idCabo=c.idCabo
        ) x) laboratorio
        WHERE c.idPaciente=@id ORDER BY c.fechaCabo DESC, c.idCabo DESC
        """, ct, new() { ["id"] = id });
    var recordsTask = db.QueryAsync("""
        SELECT h.idRegistro AS id, CONVERT(varchar(16), h.fechaAtencion, 120) AS fechaAtencion,
               h.descripcion, h.pedidosMedicos, h.laboratorio, h.idProfesional AS profesionalId,
               h.idTurno AS turnoId, h.idCabo AS caboId,
               LTRIM(RTRIM(CONCAT(p.apellido, N', ', p.nombre))) AS profesional,
               u.nombre AS registradoPor, CONVERT(varchar(16), h.fechaCreacion, 120) AS fechaCreacion
        FROM dbo.HistoriaClinicaRegistro h
        LEFT JOIN dbo.Profesionales p ON p.idProfesional=h.idProfesional
        LEFT JOIN dbo.SistemaUsuario u ON u.idUsuario=h.idUsuarioCreacion
        WHERE h.idPaciente=@id ORDER BY h.fechaAtencion DESC, h.idRegistro DESC
        """, ct, new() { ["id"] = id });
    await Task.WhenAll(patientTask, appointmentsTask, cabosTask, recordsTask);
    if (patientTask.Result.Count == 0) return Results.NotFound();
    return Results.Ok(new { patient = patientTask.Result[0], appointments = appointmentsTask.Result, cabos = cabosTask.Result, records = recordsTask.Result });
});

app.MapPost("/api/clinical-records", async (ClinicalRecordInput input, HttpContext context, HospitalDatabase db, CancellationToken ct) =>
{
    if (input.PacienteId <= 0 || string.IsNullOrWhiteSpace(input.Descripcion))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["descripcion"] = ["Ingresá una descripción de la atención."] });
    var current = (Dictionary<string, object?>)context.Items["user"]!;
    var parameters = input.Parameters();
    parameters["usuario"] = current["idUsuario"];
    var id = await db.ScalarAsync<int>("""
        INSERT dbo.HistoriaClinicaRegistro(idPaciente,idProfesional,idTurno,idCabo,fechaAtencion,descripcion,pedidosMedicos,laboratorio,idUsuarioCreacion)
        OUTPUT INSERTED.idRegistro
        VALUES(@paciente,@profesional,@turno,@cabo,@fecha,@descripcion,@pedidos,@laboratorio,@usuario)
        """, parameters, ct);
    return Results.Created($"/api/clinical-records/{id}", new { id });
});

app.MapPost("/api/patients", async (PatientInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = input.Parameters();
    var id = await db.ScalarAsync<int>("""
        INSERT dbo.Paciente(fecha_nacimiento,sexo,idEstadoCivil,telefonoFijo,telefonoCelular,ocupacion,idLocalidad,calle,numero,cp,idObraSocial,numeroAfiliado,idTipoBeneficiario,idParentesco,dni,nombre,apellido)
        OUTPUT INSERTED.idPaciente VALUES(@nacimiento,@sexo,@estadoCivil,@telefono,@celular,@ocupacion,@idLocalidad,@calle,@numero,@cp,(SELECT TOP 1 Id FROM dbo.ObraSocial WHERE descripcion=@obraSocial),@numeroAfiliado,@beneficiario,@parentesco,@dni,@nombre,@apellido)
        """, parameters, ct);
    return Results.Created($"/api/patients/{id}", input.ToResponse(id));
});
app.MapPut("/api/patients/{id:int}", async (int id, PatientInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var parameters = input.Parameters(); parameters["id"] = id;
    var affected = await db.ExecuteAsync("""
        UPDATE dbo.Paciente SET fecha_nacimiento=@nacimiento,sexo=@sexo,idEstadoCivil=@estadoCivil,telefonoFijo=@telefono,telefonoCelular=@celular,ocupacion=@ocupacion,idLocalidad=@idLocalidad,calle=@calle,numero=@numero,cp=@cp,idObraSocial=(SELECT TOP 1 Id FROM dbo.ObraSocial WHERE descripcion=@obraSocial),numeroAfiliado=@numeroAfiliado,idTipoBeneficiario=@beneficiario,idParentesco=@parentesco,dni=@dni,nombre=@nombre,apellido=@apellido WHERE idPaciente=@id
        """, parameters, ct);
    return affected == 0 ? Results.NotFound() : Results.Ok(input.ToResponse(id));
});
app.MapDelete("/api/patients/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.Paciente WHERE idPaciente=@id", new() { ["id"] = id }, ct) == 0 ? Results.NotFound() : Results.NoContent());

app.MapPost("/api/professionals", async (ProfessionalInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var id = await db.ScalarAsync<int>("""
        IF NOT EXISTS(SELECT 1 FROM dbo.Especialidad WHERE descripcion=@especialidad) INSERT dbo.Especialidad(descripcion) VALUES(@especialidad);
        INSERT dbo.Profesionales(nombre,apellido,dni,matricula_profesional,numero,idLocalidad,cp,calle,telefonoFijo,telefonoCelular,porc_autogestion,idEspecialidad)
        OUTPUT INSERTED.idProfesional VALUES(@nombre,@apellido,@dni,@matricula,@numero,(SELECT TOP 1 id FROM dbo.Localidades WHERE nombre=@localidad),@cp,@calle,@telefono,@celular,@autogestion,(SELECT TOP 1 idEspecilidad FROM dbo.Especialidad WHERE descripcion=@especialidad))
        """, input.Parameters(), ct);
    return Results.Created($"/api/professionals/{id}", input.ToResponse(id));
});
app.MapPut("/api/professionals/{id:int}", async (int id, ProfessionalInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var p=input.Parameters(); p["id"]=id;
    var affected=await db.ExecuteAsync("""
        IF NOT EXISTS(SELECT 1 FROM dbo.Especialidad WHERE descripcion=@especialidad) INSERT dbo.Especialidad(descripcion) VALUES(@especialidad);
        UPDATE dbo.Profesionales SET nombre=@nombre,apellido=@apellido,dni=@dni,matricula_profesional=@matricula,numero=@numero,idLocalidad=(SELECT TOP 1 id FROM dbo.Localidades WHERE nombre=@localidad),cp=@cp,calle=@calle,telefonoFijo=@telefono,telefonoCelular=@celular,porc_autogestion=@autogestion,idEspecialidad=(SELECT TOP 1 idEspecilidad FROM dbo.Especialidad WHERE descripcion=@especialidad) WHERE idProfesional=@id
        """,p,ct);
    return affected==0?Results.NotFound():Results.Ok(input.ToResponse(id));
});
app.MapDelete("/api/professionals/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.Profesionales WHERE idProfesional=@id",new(){["id"]=id},ct)==0?Results.NotFound():Results.NoContent());

app.MapPost("/api/personnel", async (PersonnelInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var id=await db.ScalarAsync<int>("""
        IF NOT EXISTS(SELECT 1 FROM dbo.Area WHERE descripcion=@area) INSERT dbo.Area(descripcion) VALUES(@area);
        INSERT dbo.Personal(nombre,apellido,dni,legajo,numero,idLocalidad,cp,calle,telefonoFijo,telefonoCelular,idArea)
        OUTPUT INSERTED.idPersonal VALUES(@nombre,@apellido,@dni,@legajo,@numero,(SELECT TOP 1 id FROM dbo.Localidades WHERE nombre=@localidad),@cp,@calle,@telefono,@celular,(SELECT TOP 1 idArea FROM dbo.Area WHERE descripcion=@area))
        """,input.Parameters(),ct);
    return Results.Created($"/api/personnel/{id}",input.ToResponse(id));
});
app.MapPut("/api/personnel/{id:int}", async (int id, PersonnelInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var p=input.Parameters();p["id"]=id;
    var affected=await db.ExecuteAsync("""
        IF NOT EXISTS(SELECT 1 FROM dbo.Area WHERE descripcion=@area) INSERT dbo.Area(descripcion) VALUES(@area);
        UPDATE dbo.Personal SET nombre=@nombre,apellido=@apellido,dni=@dni,legajo=@legajo,numero=@numero,idLocalidad=(SELECT TOP 1 id FROM dbo.Localidades WHERE nombre=@localidad),cp=@cp,calle=@calle,telefonoFijo=@telefono,telefonoCelular=@celular,idArea=(SELECT TOP 1 idArea FROM dbo.Area WHERE descripcion=@area) WHERE idPersonal=@id
        """,p,ct);
    return affected==0?Results.NotFound():Results.Ok(input.ToResponse(id));
});
app.MapDelete("/api/personnel/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.Personal WHERE idPersonal=@id",new(){["id"]=id},ct)==0?Results.NotFound():Results.NoContent());

app.MapPost("/api/health-insurance-payments", async (PaymentInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var id=await db.ScalarAsync<int>("""
        INSERT dbo.RegistroCobroOS(numeroFactura,fechaPrestacion,fechaPresentacion,fechaCobro,importeFacturado,importeCobrado,estado,idObraSocial)
        OUTPUT INSERTED.idRegistro VALUES(@factura,@prestacion,@presentacion,@cobro,@facturado,@cobrado,@estado,(SELECT TOP 1 Id FROM dbo.ObraSocial WHERE Id=@obraSocialId OR CONVERT(nvarchar(50),codigo)=@obraSocialCodigo OR descripcion=@obraSocial))
        """,input.Parameters(),ct);
    return Results.Created($"/api/health-insurance-payments/{id}",input.ToResponse(id));
});
app.MapPut("/api/health-insurance-payments/{id:int}", async (int id, PaymentInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var p=input.Parameters();p["id"]=id;
    var affected=await db.ExecuteAsync("""
        UPDATE dbo.RegistroCobroOS SET numeroFactura=@factura,fechaPrestacion=@prestacion,fechaPresentacion=@presentacion,fechaCobro=@cobro,importeFacturado=@facturado,importeCobrado=@cobrado,estado=@estado,idObraSocial=(SELECT TOP 1 Id FROM dbo.ObraSocial WHERE Id=@obraSocialId OR CONVERT(nvarchar(50),codigo)=@obraSocialCodigo OR descripcion=@obraSocial) WHERE idRegistro=@id
        """,p,ct);
    return affected==0?Results.NotFound():Results.Ok(input.ToResponse(id));
});
app.MapDelete("/api/health-insurance-payments/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.RegistroCobroOS WHERE idRegistro=@id",new(){["id"]=id},ct)==0?Results.NotFound():Results.NoContent());

app.MapPost("/api/cabos", async (CaboInput input, HospitalDatabase db, CancellationToken ct) =>
{
    var id=await db.SaveCaboAsync(input,null,ct);
    return Results.Created($"/api/cabos/{id}",input.ToResponse(id));
});
app.MapPut("/api/cabos/{id:int}", async (int id, CaboInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if(await db.ScalarAsync<int>("SELECT COUNT(*) FROM dbo.Cabo WHERE idCabo=@id",new(){["id"]=id},ct)==0) return Results.NotFound();
    await db.SaveCaboAsync(input,id,ct);
    return Results.Ok(input.ToResponse(id));
});
app.MapDelete("/api/cabos/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
{
    var affected=await db.ExecuteAsync("""
        SET XACT_ABORT ON; BEGIN TRAN;
        DELETE dbo.ProfesionalXpractica WHERE idCabo=@id;
        DELETE dbo.CIExCabo WHERE idCabo=@id;
        DELETE dbo.MedicamentoXcabo WHERE idCabo=@id;
        DELETE dbo.MontoMedicamentoXcabo WHERE idCabo=@id;
        DELETE dbo.LaboratorioXcabo WHERE idCabo=@id;
        DELETE dbo.NomencladorXcabo WHERE idCabo=@id;
        DELETE dbo.Cabo WHERE idCabo=@id;
        DECLARE @rows int=@@ROWCOUNT; COMMIT; SELECT @rows;
        """,new(){["id"]=id},ct);
    return affected==0?Results.NotFound():Results.NoContent();
});

app.MapPost("/api/medications", async (MedicationInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(input.Producto))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["producto"] = ["El producto es obligatorio."] });
    var id = await db.ScalarAsync<int>("""
        INSERT dbo.Medicamentos (producto, presentacion, precio)
        OUTPUT INSERTED.idMedicamento
        VALUES (@producto, @presentacion, @precio)
        """, new() { ["producto"] = input.Producto, ["presentacion"] = input.Presentacion, ["precio"] = input.Precio }, ct);
    return Results.Created($"/api/medications/{id}", new { id, input.Producto, input.Presentacion, input.Precio });
});

app.MapPut("/api/medications/{id:int}", async (int id, MedicationInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(input.Producto))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["producto"] = ["El producto es obligatorio."] });
    var affected = await db.ExecuteAsync("""
        UPDATE dbo.Medicamentos SET producto=@producto, presentacion=@presentacion, precio=@precio
        WHERE idMedicamento=@id
        """, new() { ["id"] = id, ["producto"] = input.Producto, ["presentacion"] = input.Presentacion, ["precio"] = input.Precio }, ct);
    return affected == 0 ? Results.NotFound() : Results.Ok(new { id, input.Producto, input.Presentacion, input.Precio });
});

app.MapDelete("/api/medications/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.Medicamentos WHERE idMedicamento=@id", new() { ["id"] = id }, ct) == 0
        ? Results.NotFound() : Results.NoContent());

app.MapPost("/api/health-insurances", async (HealthInsuranceInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(input.Descripcion) || !double.TryParse(input.Codigo, out _))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["obraSocial"] = ["Descripción y código numérico son obligatorios."] });
    var id = await db.ScalarAsync<int>("""
        INSERT dbo.ObraSocial (codigo, descripcion, sigla, localidad, numero, calle, cp)
        OUTPUT INSERTED.Id VALUES (@codigo, @descripcion, @sigla, @localidad, @numero, @calle, @cp)
        """, input.Parameters(), ct);
    return Results.Created($"/api/health-insurances/{id}", input.ToResponse(id));
});

app.MapPut("/api/health-insurances/{id:int}", async (int id, HealthInsuranceInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(input.Descripcion) || !double.TryParse(input.Codigo, out _))
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["obraSocial"] = ["Descripción y código numérico son obligatorios."] });
    var parameters = input.Parameters(); parameters["id"] = id;
    var affected = await db.ExecuteAsync("""
        UPDATE dbo.ObraSocial SET codigo=@codigo, descripcion=@descripcion, sigla=@sigla,
        localidad=@localidad, numero=@numero, calle=@calle, cp=@cp WHERE Id=@id
        """, parameters, ct);
    return affected == 0 ? Results.NotFound() : Results.Ok(input.ToResponse(id));
});

app.MapDelete("/api/health-insurances/{id:int}", async (int id, HospitalDatabase db, CancellationToken ct) =>
    await db.ExecuteAsync("DELETE dbo.ObraSocial WHERE Id=@id", new() { ["id"] = id }, ct) == 0
        ? Results.NotFound() : Results.NoContent());

app.MapPost("/api/nomenclatures", async (NomenclatureInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(input.Codigo) || string.IsNullOrWhiteSpace(input.Descripcion) || input.Arancel < 0)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["nomenclador"] = ["Código, descripción y arancel válido son obligatorios."] });
    await db.ExecuteAsync("""
        SET XACT_ABORT ON; BEGIN TRAN;
        DECLARE @id int = ISNULL((SELECT MAX(Id) FROM dbo.Nomenclador), 0) + 1;
        INSERT dbo.Nomenclador (Id, Codigos, Descripcion) VALUES (@id, @codigo, @descripcion);
        INSERT dbo.Arancel_Nomenclador (Id, Codigos, Arancel) VALUES (@id, @codigo, @arancel);
        COMMIT;
        """, new() { ["codigo"] = input.Codigo, ["descripcion"] = input.Descripcion, ["arancel"] = input.Arancel }, ct);
    return Results.Created("/api/nomenclatures", new { codigo = input.Codigo, descripcion = input.Descripcion, arancel = input.Arancel });
});

app.MapPut("/api/nomenclatures/{codigo}/fee", async (string codigo, FeeInput input, HospitalDatabase db, CancellationToken ct) =>
{
    if (input.Arancel < 0)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["arancel"] = ["El arancel debe ser mayor o igual a cero."] });
    var affected = await db.ExecuteAsync("""
        UPDATE dbo.Arancel_Nomenclador SET Arancel=@arancel
        WHERE Codigos=@codigo
          AND ((@anterior IS NULL AND Arancel IS NULL) OR Arancel=@anterior)
        """, new() { ["codigo"] = codigo, ["anterior"] = input.ArancelAnterior, ["arancel"] = input.Arancel }, ct);
    return affected == 0 ? Results.NotFound() : Results.Ok(new { codigo, arancel = input.Arancel });
});

app.Run();

sealed class HospitalDatabase(string connectionString)
{
    private readonly SemaphoreSlim queryGate = new(8, 8);

    public async Task<IReadOnlyList<Dictionary<string, object?>>> QueryAsync(
        string sql,
        CancellationToken cancellationToken,
        Dictionary<string, object?>? parameters = null)
    {
        await queryGate.WaitAsync(cancellationToken);
        try
        {
            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new SqlCommand(sql, connection) { CommandTimeout = 120 };
            AddParameters(command, parameters);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var rows = new List<Dictionary<string, object?>>();

            while (await reader.ReadAsync(cancellationToken))
            {
                var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                for (var index = 0; index < reader.FieldCount; index++)
                {
                    var value = await reader.IsDBNullAsync(index, cancellationToken)
                        ? null
                        : reader.GetValue(index);
                    row[reader.GetName(index)] = value is string text ? text.Trim() : value;
                }
                rows.Add(row);
            }

            return rows;
        }
        finally
        {
            queryGate.Release();
        }
    }

    public async Task<int> ExecuteAsync(string sql, Dictionary<string, object?> parameters, CancellationToken ct, int commandTimeout = 30)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(sql, connection) { CommandTimeout = commandTimeout };
        AddParameters(command, parameters);
        return await command.ExecuteNonQueryAsync(ct);
    }

    public Task<int> SaveCaboAsync(CaboInput input, int? existingId, CancellationToken ct)
    {
        var parameters=input.Parameters();
        parameters["id"]=existingId ?? 0;
        parameters["prestaciones"]=new System.Xml.Linq.XElement("items",(input.Prestaciones??[]).Select(x=>new System.Xml.Linq.XElement("item",new System.Xml.Linq.XElement("Codigo",x.Codigo),new System.Xml.Linq.XElement("Cantidad",x.Cantidad??1),new System.Xml.Linq.XElement("Arancel",x.Arancel??0),new System.Xml.Linq.XElement("Profesional1Id",x.Profesional1Id),new System.Xml.Linq.XElement("Profesional2Id",x.Profesional2Id)))).ToString(System.Xml.Linq.SaveOptions.DisableFormatting);
        parameters["diagnosticos"]=new System.Xml.Linq.XElement("items",(input.Diagnosticos??[]).Select(x=>new System.Xml.Linq.XElement("item",new System.Xml.Linq.XElement("Codigo",x.Codigo),new System.Xml.Linq.XElement("Observaciones",x.Observaciones)))).ToString(System.Xml.Linq.SaveOptions.DisableFormatting);
        parameters["medicamentos"]=new System.Xml.Linq.XElement("items",(input.Medicamentos??[]).Select(x=>new System.Xml.Linq.XElement("item",new System.Xml.Linq.XElement("MedicamentoId",x.MedicamentoId),new System.Xml.Linq.XElement("Cantidad",x.Cantidad??1)))).ToString(System.Xml.Linq.SaveOptions.DisableFormatting);
        parameters["laboratorio"]=new System.Xml.Linq.XElement("items",(input.Laboratorio??[]).Select(x=>new System.Xml.Linq.XElement("item",new System.Xml.Linq.XElement("LaboratorioId",x.LaboratorioId),new System.Xml.Linq.XElement("Arancel",x.Arancel),new System.Xml.Linq.XElement("Monto",x.Monto),new System.Xml.Linq.XElement("Cantidad",x.Cantidad??1)))).ToString(System.Xml.Linq.SaveOptions.DisableFormatting);
        return ScalarAsync<int>("""
            SET XACT_ABORT ON; BEGIN TRAN;
            IF @id=0 BEGIN
                INSERT dbo.Cabo(fechaCabo,codigoCabo,idPaciente,idObraSocial,idTipoAtencion,fechaAltaInternacion)
                VALUES(@fecha,@codigoRefes,@paciente,(SELECT TOP 1 Id FROM dbo.ObraSocial WHERE CONVERT(nvarchar(50),codigo)=@rnos OR descripcion=@obraSocial),@tipo,@fechaAlta);
                SET @id=CONVERT(int,SCOPE_IDENTITY());
            END ELSE BEGIN
                UPDATE dbo.Cabo SET fechaCabo=@fecha,codigoCabo=@codigoRefes,idPaciente=@paciente,
                    idObraSocial=(SELECT TOP 1 Id FROM dbo.ObraSocial WHERE CONVERT(nvarchar(50),codigo)=@rnos OR descripcion=@obraSocial),
                    idTipoAtencion=@tipo,fechaAltaInternacion=@fechaAlta WHERE idCabo=@id;
                DELETE dbo.ProfesionalXpractica WHERE idCabo=@id;
                DELETE dbo.CIExCabo WHERE idCabo=@id;
                DELETE dbo.MedicamentoXcabo WHERE idCabo=@id;
                DELETE dbo.MontoMedicamentoXcabo WHERE idCabo=@id;
                DELETE dbo.LaboratorioXcabo WHERE idCabo=@id;
                DELETE dbo.NomencladorXcabo WHERE idCabo=@id;
            END;

            DECLARE @prestacionesXml xml=CONVERT(xml,@prestaciones),@diagnosticosXml xml=CONVERT(xml,@diagnosticos),@medicamentosXml xml=CONVERT(xml,@medicamentos),@laboratorioXml xml=CONVERT(xml,@laboratorio);
            DECLARE @codigo nvarchar(255),@cantidad int,@arancel decimal(18,2),@profesional1 int,@profesional2 int,@idNomenclador int,@idNx int;
            DECLARE practicas CURSOR LOCAL FAST_FORWARD FOR
                SELECT n.value('(Codigo/text())[1]','nvarchar(255)'),ISNULL(n.value('(Cantidad/text())[1]','int'),1),ISNULL(n.value('(Arancel/text())[1]','decimal(18,2)'),0),n.value('(Profesional1Id/text())[1]','int'),n.value('(Profesional2Id/text())[1]','int')
                FROM @prestacionesXml.nodes('/items/item') t(n);
            OPEN practicas; FETCH NEXT FROM practicas INTO @codigo,@cantidad,@arancel,@profesional1,@profesional2;
            WHILE @@FETCH_STATUS=0 BEGIN
                SELECT TOP 1 @idNomenclador=Id FROM dbo.Nomenclador WHERE Codigos=@codigo ORDER BY Id;
                INSERT dbo.NomencladorXcabo(idCabo,idNomenclador,cantidad,debito,montoPractica) VALUES(@id,@idNomenclador,@cantidad,0,@arancel);
                SET @idNx=CONVERT(int,SCOPE_IDENTITY());
                IF @profesional1 IS NOT NULL INSERT dbo.ProfesionalXpractica(idNomencladorXcabo,idProfesional,idCabo,debito) VALUES(@idNx,@profesional1,@id,0);
                IF @profesional2 IS NOT NULL AND @profesional2<>@profesional1 INSERT dbo.ProfesionalXpractica(idNomencladorXcabo,idProfesional,idCabo,debito) VALUES(@idNx,@profesional2,@id,0);
                FETCH NEXT FROM practicas INTO @codigo,@cantidad,@arancel,@profesional1,@profesional2;
            END; CLOSE practicas; DEALLOCATE practicas;

            INSERT dbo.CIExCabo(idCIE,idCabo,observaciones)
            SELECT c.Id,@id,n.value('(Observaciones/text())[1]','nvarchar(100)') FROM @diagnosticosXml.nodes('/items/item') t(n)
            INNER JOIN dbo.CIE_10_COD3 c ON c.Codigo=n.value('(Codigo/text())[1]','nvarchar(255)');
            INSERT dbo.MedicamentoXcabo(idMedicamento,idCabo,cantidad)
            SELECT n.value('(MedicamentoId/text())[1]','int'),@id,ISNULL(n.value('(Cantidad/text())[1]','int'),1) FROM @medicamentosXml.nodes('/items/item') t(n);
            INSERT dbo.MontoMedicamentoXcabo(idCabo,monto)
            SELECT @id,SUM(COALESCE(m.precio,0)*ISNULL(n.value('(Cantidad/text())[1]','int'),1)) FROM @medicamentosXml.nodes('/items/item') t(n) INNER JOIN dbo.Medicamentos m ON m.idMedicamento=n.value('(MedicamentoId/text())[1]','int') HAVING COUNT(*)>0;
            INSERT dbo.LaboratorioXcabo(idCabo,idLaboratorio,monto,cantidad)
            SELECT @id,n.value('(LaboratorioId/text())[1]','int'),COALESCE(n.value('(Arancel/text())[1]','decimal(18,2)'),n.value('(Monto/text())[1]','decimal(18,2)'),0),ISNULL(n.value('(Cantidad/text())[1]','decimal(8,2)'),1) FROM @laboratorioXml.nodes('/items/item') t(n) WHERE n.exist('LaboratorioId/text()')=1;
            COMMIT; SELECT @id;
            """,parameters,ct);
    }

    public async Task<T> ScalarAsync<T>(string sql, Dictionary<string, object?> parameters, CancellationToken ct)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(sql, connection) { CommandTimeout = 30 };
        AddParameters(command, parameters);
        var value = await command.ExecuteScalarAsync(ct);
        return (T)Convert.ChangeType(value!, typeof(T));
    }

    private static void AddParameters(SqlCommand command, Dictionary<string, object?>? parameters)
    {
        if (parameters is null) return;
        foreach (var (name, value) in parameters)
            command.Parameters.AddWithValue("@" + name, value ?? DBNull.Value);
    }
}

sealed record MedicationInput(string Producto, string? Presentacion, decimal? Precio);
sealed record NomenclatureInput(string Codigo, string Descripcion, decimal Arancel);
sealed record FeeInput(decimal? ArancelAnterior, decimal Arancel);
sealed record LoginInput(string Usuario,string Password);
sealed record PermissionInput(string Modulo,string Accion);
sealed record UserInput(string Usuario,string Nombre,string? Password,bool Activo,bool Administrador,int? ProfesionalId,int[]? RolIds,PermissionInput[]? Permisos);
sealed record RoleInput(string Nombre,string? Descripcion,bool Activo,PermissionInput[]? Permisos);
static class AuthSecurity
{
    public static byte[] NewSalt(){var bytes=new byte[32];System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);return bytes;}
    public static byte[] HashPassword(string password,byte[] salt,int iterations)=>System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(password,salt,iterations,System.Security.Cryptography.HashAlgorithmName.SHA256,32);
    public static bool Verify(string password,byte[] salt,byte[] expected,int iterations)=>System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(HashPassword(password,salt,iterations),expected);
    public static string NewToken()=>Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
    public static byte[] TokenHash(string token)=>System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
    public static (string? Module,string Action) RequiredPermission(PathString path,string method)
    {
        var value=path.Value?.ToLowerInvariant()??"";
        string? module=value switch
        {
            var p when p.StartsWith("/api/users")=>"users",
            var p when p.StartsWith("/api/statistics")=>"statistics",
            var p when p.Contains("/liquidations/health-insurance")=>"liquidacion-obra-social",
            var p when p.Contains("/liquidations/professionals")=>"liquidacion-profesionales",
            var p when p.Contains("/liquidations/personnel")=>"liquidacion-personal",
            var p when p.StartsWith("/api/clinical-records")=>"clinical-history",
            var p when p.StartsWith("/api/patients")=>"patients",
            var p when p.StartsWith("/api/professionals")=>"professionals",
            var p when p.StartsWith("/api/personnel")=>"personnel",
            var p when p.StartsWith("/api/medications")=>"medications",
            var p when p.StartsWith("/api/health-insurances")||p.StartsWith("/api/catalogs/health-insurances")=>"health-insurances",
            var p when p.StartsWith("/api/nomenclatures")=>"nomenclature",
            var p when p.StartsWith("/api/appointments")||p.StartsWith("/api/availability")=>"appointments",
            var p when p.StartsWith("/api/cabos")=>"cabos",
            var p when p.StartsWith("/api/health-insurance-payments")||p.StartsWith("/api/cobros")=>"cobros-os",
            _=>null
        };
        var action=value.Contains("report")?"print":method switch{"POST"=>"create","PUT"=>"edit","DELETE"=>"delete",_=>"view"};
        return(module,action);
    }
}
sealed record PatientInput(object? Codigo, string Dni, string Nombre, string Apellido, string? Nacimiento, string? Sexo, string? EstadoCivil, string? Ocupacion, string? Telefono, string? Celular, string? Calle, string? Numero, int? IdLocalidad, string? Localidad, string? CodigoPostal, string? Partido, string? Provincia, string? ObraSocial, string? NumeroAfiliado, string? Beneficiario, string? Parentesco)
{
    public Dictionary<string,object?> Parameters()=>new(){["dni"]=int.TryParse(Dni,out var dni)?dni:null,["nombre"]=Nombre,["apellido"]=Apellido,["nacimiento"]=string.IsNullOrWhiteSpace(Nacimiento)?null:Nacimiento,["sexo"]=Sexo switch{"Masculino"=>1,"Femenino"=>2,_=>null},["estadoCivil"]=EstadoCivil switch{"Soltero/a"=>1,"Casado/a"=>2,"Divorciado/a"=>3,"Viudo/a"=>4,_=>null},["ocupacion"]=Ocupacion,["telefono"]=Telefono,["celular"]=Celular,["calle"]=Calle,["numero"]=Numero,["idLocalidad"]=IdLocalidad,["cp"]=CodigoPostal,["obraSocial"]=ObraSocial,["numeroAfiliado"]=NumeroAfiliado,["beneficiario"]=Beneficiario switch{"Titular"=>1,"Familiar"=>2,"Adherente"=>3,"Otro"=>4,_=>null},["parentesco"]=Parentesco switch{"Cónyuge"=>1,"Hijo/a"=>2,"Otro"=>3,_=>null}};
    public object ToResponse(int id)=>new{codigo=id,dni=Dni,nombre=Nombre,apellido=Apellido,nacimiento=Nacimiento,sexo=Sexo,estadoCivil=EstadoCivil,ocupacion=Ocupacion,telefono=Telefono,celular=Celular,calle=Calle,numero=Numero,idLocalidad=IdLocalidad,localidad=Localidad,codigoPostal=CodigoPostal,partido=Partido,provincia=Provincia,obraSocial=ObraSocial,numeroAfiliado=NumeroAfiliado,beneficiario=Beneficiario,parentesco=Parentesco};
}
sealed record ClinicalRecordInput(int PacienteId, int? ProfesionalId, int? TurnoId, int? CaboId, string FechaAtencion, string Descripcion, string? PedidosMedicos, string? Laboratorio)
{
    public Dictionary<string, object?> Parameters() => new()
    {
        ["paciente"] = PacienteId, ["profesional"] = ProfesionalId,
        ["turno"] = TurnoId, ["cabo"] = CaboId,
        ["fecha"] = FechaAtencion, ["descripcion"] = Descripcion.Trim(),
        ["pedidos"] = string.IsNullOrWhiteSpace(PedidosMedicos) ? null : PedidosMedicos.Trim(),
        ["laboratorio"] = string.IsNullOrWhiteSpace(Laboratorio) ? null : Laboratorio.Trim()
    };
}
sealed record ProfessionalInput(object? Codigo,string Dni,string Nombre,string Apellido,string? Telefono,string? Celular,string Matricula,string? Autogestion,string Especialidad,string? Calle,string? Numero,string? Localidad,string? CodigoPostal,string? Partido,string? Provincia)
{
    public Dictionary<string,object?> Parameters()=>new(){["dni"]=int.TryParse(Dni,out var dni)?dni:null,["nombre"]=Nombre,["apellido"]=Apellido,["telefono"]=Telefono,["celular"]=Celular,["matricula"]=Matricula,["autogestion"]=double.TryParse(Autogestion,out var porcentaje)?porcentaje:null,["especialidad"]=Especialidad,["calle"]=Calle,["numero"]=Numero,["localidad"]=Localidad,["cp"]=CodigoPostal};
    public object ToResponse(int id)=>new{codigo=id,dni=Dni,nombre=Nombre,apellido=Apellido,telefono=Telefono,celular=Celular,matricula=Matricula,autogestion=Autogestion,especialidad=Especialidad,calle=Calle,numero=Numero,localidad=Localidad,codigoPostal=CodigoPostal,partido=Partido,provincia=Provincia};
}
sealed record PersonnelInput(object? Codigo,string Dni,string Nombre,string Apellido,string? Legajo,string? Telefono,string? Celular,string Area,string? Calle,string? Numero,string? Localidad,string? CodigoPostal,string? Partido,string? Provincia)
{
    public Dictionary<string,object?> Parameters()=>new(){["dni"]=int.TryParse(Dni,out var dni)?dni:null,["nombre"]=Nombre,["apellido"]=Apellido,["legajo"]=Legajo,["telefono"]=Telefono,["celular"]=Celular,["area"]=Area,["calle"]=Calle,["numero"]=Numero,["localidad"]=Localidad,["cp"]=CodigoPostal};
    public object ToResponse(int id)=>new{codigo=id,dni=Dni,nombre=Nombre,apellido=Apellido,legajo=Legajo,telefono=Telefono,celular=Celular,area=Area,calle=Calle,numero=Numero,localidad=Localidad,codigoPostal=CodigoPostal,partido=Partido,provincia=Provincia};
}
sealed record PaymentInput(object? Id,int? ObraSocialId,string ObraSocialCodigo,string ObraSocial,string NumeroFactura,string Estado,string? FechaPrestacion,string? FechaPresentacion,string? FechaCobro,decimal ImporteFacturado,decimal ImporteCobrado)
{
    public Dictionary<string,object?> Parameters()=>new(){["obraSocialId"]=ObraSocialId,["obraSocialCodigo"]=ObraSocialCodigo,["obraSocial"]=ObraSocial,["factura"]=NumeroFactura,["estado"]=Estado,["prestacion"]=string.IsNullOrWhiteSpace(FechaPrestacion)?null:FechaPrestacion,["presentacion"]=string.IsNullOrWhiteSpace(FechaPresentacion)?null:FechaPresentacion,["cobro"]=string.IsNullOrWhiteSpace(FechaCobro)?null:FechaCobro,["facturado"]=ImporteFacturado,["cobrado"]=ImporteCobrado};
    public object ToResponse(int id)=>new{id,obraSocialId=ObraSocialId,obraSocialCodigo=ObraSocialCodigo,obraSocial=ObraSocial,numeroFactura=NumeroFactura,estado=Estado,fechaPrestacion=FechaPrestacion,fechaPresentacion=FechaPresentacion,fechaCobro=FechaCobro,importeFacturado=ImporteFacturado,importeCobrado=ImporteCobrado,debitos=Array.Empty<object>()};
}
sealed record CaboPracticeInput(string Codigo,string? Descripcion,decimal? Arancel,int? Cantidad,int? Profesional1Id,int? Profesional2Id,string? Profesional1,string? Profesional2);
sealed record CaboDiagnosisInput(string Codigo,string? Descripcion,string? Observaciones);
sealed record CaboMedicationInput(int MedicamentoId,string? Producto,string? Presentacion,int? Cantidad);
sealed record CaboLaboratoryInput(int? LaboratorioId,string Codigo,string? Descripcion,decimal? Arancel,decimal? Monto,decimal? Cantidad);
sealed record CaboInput(object? Id,string Fecha,string? Numero,string? CodigoRefes,int PacienteCodigo,string? Dni,string? Nombre,object? Edad,string? Sexo,string? Beneficiario,string? Parentesco,string ObraSocial,string Rnos,string TipoAtencion,string? FechaAlta,CaboPracticeInput[]? Prestaciones,CaboDiagnosisInput[]? Diagnosticos,CaboMedicationInput[]? Medicamentos,CaboLaboratoryInput[]? Laboratorio)
{
    public Dictionary<string,object?> Parameters()=>new(){["fecha"]=Fecha,["codigoRefes"]=CodigoRefes,["paciente"]=PacienteCodigo,["obraSocial"]=ObraSocial,["rnos"]=Rnos,["tipo"]=TipoAtencion=="Internación"?3:TipoAtencion=="Práctica"||TipoAtencion=="Imagen"?2:1,["fechaAlta"]=string.IsNullOrWhiteSpace(FechaAlta)?null:FechaAlta};
    public object ToResponse(int id)=>new{id,numero=id.ToString(),fecha=Fecha,codigoRefes=CodigoRefes,pacienteCodigo=PacienteCodigo,dni=Dni,nombre=Nombre,edad=Edad,sexo=Sexo,beneficiario=Beneficiario,parentesco=Parentesco,obraSocial=ObraSocial,rnos=Rnos,tipoAtencion=TipoAtencion,fechaAlta=FechaAlta,prestaciones=Prestaciones??[],diagnosticos=Diagnosticos??[],medicamentos=Medicamentos??[],laboratorio=Laboratorio??[]};
}
sealed record AppointmentInput(string Fecha, string Hora, int Duracion, int ProfesionalCodigo, int PacienteCodigo, string? Motivo, string Estado, string? Observaciones)
{
    public const string CollisionSql = """
        SELECT COUNT(*) FROM dbo.Turno
        WHERE idTurno<>@id AND fecha=@fecha AND idProfesional=@profesional AND estado<>N'Cancelado'
          AND DATEDIFF(MINUTE, CAST('00:00' AS time), hora) < DATEDIFF(MINUTE, CAST('00:00' AS time), CAST(@hora AS time)) + @duracion
          AND DATEDIFF(MINUTE, CAST('00:00' AS time), CAST(@hora AS time)) < DATEDIFF(MINUTE, CAST('00:00' AS time), hora) + duracion
        """;
    public Dictionary<string, object?> Parameters() => new()
    {
        ["fecha"] = Fecha, ["hora"] = Hora, ["duracion"] = Duracion,
        ["profesional"] = ProfesionalCodigo, ["paciente"] = PacienteCodigo,
        ["motivo"] = Motivo, ["estado"] = Estado, ["observaciones"] = Observaciones
    };
    public object ToResponse(int id) => new { id, fecha = Fecha, hora = Hora, duracion = Duracion, profesionalCodigo = ProfesionalCodigo, pacienteCodigo = PacienteCodigo, motivo = Motivo, estado = Estado, observaciones = Observaciones };
}
sealed record AvailabilityInput(int ProfesionalCodigo, int DiaSemana, string Desde, string Hasta, int Duracion)
{
    public Dictionary<string, object?> Parameters() => new() { ["profesional"] = ProfesionalCodigo, ["dia"] = DiaSemana, ["desde"] = Desde, ["hasta"] = Hasta, ["duracion"] = Duracion };
    public object ToResponse(int id) => new { id, profesionalCodigo = ProfesionalCodigo, diaSemana = DiaSemana, desde = Desde, hasta = Hasta, duracion = Duracion };
}
sealed record HealthInsuranceInput(string Codigo, string Descripcion, string? Sigla, string? Calle, string? Numero, string? Localidad, string? CodigoPostal)
{
    public Dictionary<string, object?> Parameters() => new()
    {
        ["codigo"] = double.TryParse(Codigo, out var code) ? code : null,
        ["descripcion"] = Descripcion, ["sigla"] = Sigla, ["calle"] = Calle,
        ["numero"] = Numero, ["localidad"] = Localidad, ["cp"] = CodigoPostal
    };
    public object ToResponse(int id) => new { id, codigo = Codigo, descripcion = Descripcion, sigla = Sigla, calle = Calle, numero = Numero, localidad = Localidad, codigoPostal = CodigoPostal };
}
