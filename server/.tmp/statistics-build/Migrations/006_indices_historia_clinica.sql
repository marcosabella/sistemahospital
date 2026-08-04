IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Cabo_PacienteFecha' AND object_id=OBJECT_ID(N'dbo.Cabo'))
    CREATE INDEX IX_Cabo_PacienteFecha ON dbo.Cabo(idPaciente, fechaCabo DESC, idCabo DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Turno_PacienteFecha' AND object_id=OBJECT_ID(N'dbo.Turno'))
    CREATE INDEX IX_Turno_PacienteFecha ON dbo.Turno(idPaciente, fecha DESC, hora DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_NomencladorXcabo_Cabo' AND object_id=OBJECT_ID(N'dbo.NomencladorXcabo'))
    CREATE INDEX IX_NomencladorXcabo_Cabo ON dbo.NomencladorXcabo(idCabo) INCLUDE(idNomenclador, cantidad, montoPractica);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_ProfesionalXpractica_CaboNomenclador' AND object_id=OBJECT_ID(N'dbo.ProfesionalXpractica'))
    CREATE INDEX IX_ProfesionalXpractica_CaboNomenclador ON dbo.ProfesionalXpractica(idCabo, idNomencladorXcabo) INCLUDE(idProfesional);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_CIExCabo_Cabo' AND object_id=OBJECT_ID(N'dbo.CIExCabo'))
    CREATE INDEX IX_CIExCabo_Cabo ON dbo.CIExCabo(idCabo) INCLUDE(idCIE, observaciones);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_MedicamentoXcabo_Cabo' AND object_id=OBJECT_ID(N'dbo.MedicamentoXcabo'))
    CREATE INDEX IX_MedicamentoXcabo_Cabo ON dbo.MedicamentoXcabo(idCabo) INCLUDE(idMedicamento, cantidad);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_LaboratorioXcabo_Cabo' AND object_id=OBJECT_ID(N'dbo.LaboratorioXcabo'))
    CREATE INDEX IX_LaboratorioXcabo_Cabo ON dbo.LaboratorioXcabo(idCabo) INCLUDE(idLaboratorio, cantidad, monto);

IF NOT EXISTS(SELECT 1 FROM dbo.SistemaMigracion WHERE id=N'006_indices_historia_clinica')
    INSERT dbo.SistemaMigracion(id) VALUES(N'006_indices_historia_clinica');
