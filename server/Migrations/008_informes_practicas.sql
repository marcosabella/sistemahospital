IF OBJECT_ID(N'dbo.HistoriaClinicaInforme', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistoriaClinicaInforme (
        idInforme int IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistoriaClinicaInforme PRIMARY KEY,
        idPaciente int NOT NULL,
        idRegistro int NULL,
        tipoPractica nvarchar(100) NOT NULL,
        fechaPractica date NOT NULL,
        titulo nvarchar(200) NOT NULL,
        descripcion nvarchar(max) NULL,
        idUsuarioCreacion int NOT NULL,
        fechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_HistoriaClinicaInforme_FechaCreacion DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_HistoriaClinicaInforme_PacienteFecha
        ON dbo.HistoriaClinicaInforme(idPaciente, fechaPractica DESC, idInforme DESC);
END;

IF OBJECT_ID(N'dbo.HistoriaClinicaInformeArchivo', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistoriaClinicaInformeArchivo (
        idArchivo int IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistoriaClinicaInformeArchivo PRIMARY KEY,
        idInforme int NOT NULL,
        nombre nvarchar(255) NOT NULL,
        tipoContenido nvarchar(100) NOT NULL,
        tamano bigint NOT NULL,
        contenido varbinary(max) NOT NULL,
        CONSTRAINT FK_HistoriaClinicaInformeArchivo_Informe FOREIGN KEY(idInforme)
            REFERENCES dbo.HistoriaClinicaInforme(idInforme) ON DELETE CASCADE
    );
    CREATE INDEX IX_HistoriaClinicaInformeArchivo_Informe
        ON dbo.HistoriaClinicaInformeArchivo(idInforme);
END;

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'008_informes_practicas')
    INSERT dbo.SistemaMigracion(id) VALUES(N'008_informes_practicas');
