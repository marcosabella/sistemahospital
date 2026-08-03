IF OBJECT_ID(N'dbo.Turno', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Turno (
        idTurno int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Turno PRIMARY KEY,
        fecha date NOT NULL,
        hora time(0) NOT NULL,
        duracion int NOT NULL CONSTRAINT CK_Turno_Duracion CHECK (duracion > 0),
        idProfesional int NOT NULL,
        idPaciente int NOT NULL,
        motivo nvarchar(250) NULL,
        estado nvarchar(20) NOT NULL CONSTRAINT DF_Turno_Estado DEFAULT N'Programado',
        observaciones nvarchar(1000) NULL,
        fechaCreacion datetime2(0) NOT NULL CONSTRAINT DF_Turno_FechaCreacion DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_Turno_Agenda ON dbo.Turno(fecha, idProfesional, hora);
END;

IF OBJECT_ID(N'dbo.DisponibilidadProfesional', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DisponibilidadProfesional (
        idDisponibilidad int IDENTITY(1,1) NOT NULL CONSTRAINT PK_DisponibilidadProfesional PRIMARY KEY,
        idProfesional int NOT NULL,
        diaSemana tinyint NOT NULL CONSTRAINT CK_Disponibilidad_Dia CHECK (diaSemana BETWEEN 0 AND 6),
        desde time(0) NOT NULL,
        hasta time(0) NOT NULL,
        duracion int NOT NULL CONSTRAINT CK_Disponibilidad_Duracion CHECK (duracion > 0),
        CONSTRAINT CK_Disponibilidad_Horario CHECK (desde < hasta)
    );
    CREATE INDEX IX_Disponibilidad_ProfesionalDia ON dbo.DisponibilidadProfesional(idProfesional, diaSemana, desde);
END;
