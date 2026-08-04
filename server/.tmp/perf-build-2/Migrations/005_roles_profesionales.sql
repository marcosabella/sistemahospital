IF COL_LENGTH(N'dbo.SistemaUsuario', N'idProfesional') IS NULL
    ALTER TABLE dbo.SistemaUsuario ADD idProfesional int NULL;

IF OBJECT_ID(N'dbo.SistemaRol', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SistemaRol (
        idRol int IDENTITY(1,1) NOT NULL CONSTRAINT PK_SistemaRol PRIMARY KEY,
        nombre nvarchar(80) NOT NULL,
        descripcion nvarchar(250) NULL,
        activo bit NOT NULL CONSTRAINT DF_SistemaRol_Activo DEFAULT 1,
        fechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_SistemaRol_Fecha DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_SistemaRol_Nombre UNIQUE(nombre)
    );
END;

IF OBJECT_ID(N'dbo.SistemaRolPermiso', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SistemaRolPermiso (
        idRol int NOT NULL,
        modulo nvarchar(50) NOT NULL,
        accion nvarchar(30) NOT NULL,
        permitido bit NOT NULL,
        CONSTRAINT PK_SistemaRolPermiso PRIMARY KEY(idRol, modulo, accion),
        CONSTRAINT FK_SistemaRolPermiso_Rol FOREIGN KEY(idRol) REFERENCES dbo.SistemaRol(idRol) ON DELETE CASCADE
    );
END;

IF OBJECT_ID(N'dbo.SistemaUsuarioRol', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SistemaUsuarioRol (
        idUsuario int NOT NULL,
        idRol int NOT NULL,
        CONSTRAINT PK_SistemaUsuarioRol PRIMARY KEY(idUsuario, idRol),
        CONSTRAINT FK_SistemaUsuarioRol_Usuario FOREIGN KEY(idUsuario) REFERENCES dbo.SistemaUsuario(idUsuario) ON DELETE CASCADE,
        CONSTRAINT FK_SistemaUsuarioRol_Rol FOREIGN KEY(idRol) REFERENCES dbo.SistemaRol(idRol) ON DELETE CASCADE
    );
END;

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaRol WHERE nombre=N'Profesional')
    INSERT dbo.SistemaRol(nombre,descripcion,activo)
    VALUES(N'Profesional',N'Acceso asistencial a pacientes, Cabos e historias clínicas.',1);

DECLARE @rolProfesional int=(SELECT idRol FROM dbo.SistemaRol WHERE nombre=N'Profesional');
MERGE dbo.SistemaRolPermiso AS target
USING (VALUES
    (@rolProfesional,N'patients',N'view',1),
    (@rolProfesional,N'appointments',N'view',1),
    (@rolProfesional,N'appointments',N'edit',1),
    (@rolProfesional,N'clinical-history',N'view',1),
    (@rolProfesional,N'clinical-history',N'create',1)
) AS source(idRol,modulo,accion,permitido)
ON target.idRol=source.idRol AND target.modulo=source.modulo AND target.accion=source.accion
WHEN NOT MATCHED THEN INSERT(idRol,modulo,accion,permitido)
VALUES(source.idRol,source.modulo,source.accion,source.permitido);

DELETE dbo.SistemaRolPermiso
WHERE idRol=@rolProfesional AND modulo=N'cabos' AND accion=N'view';

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'005_roles_profesionales')
    INSERT dbo.SistemaMigracion(id) VALUES(N'005_roles_profesionales');
