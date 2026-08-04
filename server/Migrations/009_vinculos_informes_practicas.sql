IF COL_LENGTH(N'dbo.HistoriaClinicaInforme', N'idTurno') IS NULL
    ALTER TABLE dbo.HistoriaClinicaInforme ADD idTurno int NULL;

IF COL_LENGTH(N'dbo.HistoriaClinicaInforme', N'idCabo') IS NULL
    ALTER TABLE dbo.HistoriaClinicaInforme ADD idCabo int NULL;

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'009_vinculos_informes_practicas')
    INSERT dbo.SistemaMigracion(id) VALUES(N'009_vinculos_informes_practicas');
