DECLARE @rolDireccion int;
SELECT @rolDireccion=idRol FROM dbo.SistemaRol WHERE nombre=N'Dirección';
IF @rolDireccion IS NULL
BEGIN
    INSERT dbo.SistemaRol(nombre,descripcion,activo)
    VALUES(N'Dirección',N'Acceso al tablero ejecutivo para análisis y toma de decisiones.',1);
    SET @rolDireccion=CONVERT(int,SCOPE_IDENTITY());
END;

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaRolPermiso WHERE idRol=@rolDireccion AND modulo=N'statistics' AND accion=N'view')
    INSERT dbo.SistemaRolPermiso(idRol,modulo,accion,permitido) VALUES(@rolDireccion,N'statistics',N'view',1);
IF NOT EXISTS(SELECT 1 FROM dbo.SistemaRolPermiso WHERE idRol=@rolDireccion AND modulo=N'statistics' AND accion=N'print')
    INSERT dbo.SistemaRolPermiso(idRol,modulo,accion,permitido) VALUES(@rolDireccion,N'statistics',N'print',1);

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'007_estadisticas_direccion')
    INSERT dbo.SistemaMigracion(id) VALUES(N'007_estadisticas_direccion');
