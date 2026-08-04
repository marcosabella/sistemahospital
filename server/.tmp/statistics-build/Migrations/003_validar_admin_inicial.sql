IF OBJECT_ID(N'dbo.SistemaMigracion', N'U') IS NULL
    CREATE TABLE dbo.SistemaMigracion(id nvarchar(100) NOT NULL CONSTRAINT PK_SistemaMigracion PRIMARY KEY, aplicada datetime2(0) NOT NULL DEFAULT SYSDATETIME());

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'003_validar_admin_inicial')
BEGIN
    UPDATE dbo.SistemaUsuario
       SET passwordHash=0x7825037888DDEEF40F54EEC3D8246FC6BA09903F308DF29B2F5C62D1B77B8136,
           passwordSalt=0xBAC03D3281358F879413A3627EEE29BF4E880F20D8B85A404303BCE9AF9671A2,
           iteraciones=210000,activo=1,administrador=1
     WHERE usuario=N'msabella';
    INSERT dbo.SistemaMigracion(id) VALUES(N'003_validar_admin_inicial');
END;
