IF OBJECT_ID(N'dbo.SistemaUsuario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SistemaUsuario (
        idUsuario int IDENTITY(1,1) NOT NULL CONSTRAINT PK_SistemaUsuario PRIMARY KEY,
        usuario nvarchar(50) NOT NULL,
        nombre nvarchar(100) NOT NULL,
        passwordHash varbinary(32) NOT NULL,
        passwordSalt varbinary(32) NOT NULL,
        iteraciones int NOT NULL,
        activo bit NOT NULL CONSTRAINT DF_SistemaUsuario_Activo DEFAULT 1,
        administrador bit NOT NULL CONSTRAINT DF_SistemaUsuario_Administrador DEFAULT 0,
        fechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_SistemaUsuario_Fecha DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_SistemaUsuario_Usuario UNIQUE(usuario),
        CONSTRAINT CK_SistemaUsuario_SinEmail CHECK(usuario NOT LIKE N'%@%')
    );
END;

IF OBJECT_ID(N'dbo.SistemaPermisoUsuario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SistemaPermisoUsuario (
        idUsuario int NOT NULL,
        modulo nvarchar(50) NOT NULL,
        accion nvarchar(30) NOT NULL,
        permitido bit NOT NULL,
        CONSTRAINT PK_SistemaPermisoUsuario PRIMARY KEY(idUsuario, modulo, accion),
        CONSTRAINT FK_SistemaPermisoUsuario_Usuario FOREIGN KEY(idUsuario) REFERENCES dbo.SistemaUsuario(idUsuario) ON DELETE CASCADE
    );
END;

IF OBJECT_ID(N'dbo.SistemaSesion', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SistemaSesion (
        idSesion uniqueidentifier NOT NULL CONSTRAINT PK_SistemaSesion PRIMARY KEY DEFAULT NEWID(),
        idUsuario int NOT NULL,
        tokenHash varbinary(32) NOT NULL,
        fechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_SistemaSesion_Fecha DEFAULT SYSDATETIME(),
        expira datetime2(0) NOT NULL,
        CONSTRAINT UQ_SistemaSesion_Token UNIQUE(tokenHash),
        CONSTRAINT FK_SistemaSesion_Usuario FOREIGN KEY(idUsuario) REFERENCES dbo.SistemaUsuario(idUsuario) ON DELETE CASCADE
    );
END;

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaUsuario WHERE usuario=N'msabella')
BEGIN
    INSERT dbo.SistemaUsuario(usuario,nombre,passwordHash,passwordSalt,iteraciones,activo,administrador)
    VALUES(N'msabella',N'Matías Sabella',0x7825037888DDEEF40F54EEC3D8246FC6BA09903F308DF29B2F5C62D1B77B8136,0xBAC03D3281358F879413A3627EEE29BF4E880F20D8B85A404303BCE9AF9671A2,210000,1,1);
END;
