IF OBJECT_ID(N'dbo.HistoriaClinicaRegistro', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistoriaClinicaRegistro (
        idRegistro int IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistoriaClinicaRegistro PRIMARY KEY,
        idPaciente int NOT NULL,
        idProfesional int NULL,
        idTurno int NULL,
        idCabo int NULL,
        fechaAtencion datetime2(0) NOT NULL,
        descripcion nvarchar(max) NOT NULL,
        pedidosMedicos nvarchar(max) NULL,
        laboratorio nvarchar(max) NULL,
        idUsuarioCreacion int NOT NULL,
        fechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_HistoriaClinicaRegistro_FechaCreacion DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_HistoriaClinicaRegistro_PacienteFecha
        ON dbo.HistoriaClinicaRegistro(idPaciente, fechaAtencion DESC, idRegistro DESC);
END;

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'004_historia_clinica')
    INSERT dbo.SistemaMigracion(id) VALUES(N'004_historia_clinica');
