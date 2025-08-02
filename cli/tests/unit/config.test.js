import { describe, it, expect, vi } from 'vitest';
import { getPatientInfo, saveConfig, loadConfig } from '../../lib/config.js';

// Mock process.exit
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn()
}));

vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

describe('Config Functions', () => {
  describe('getPatientInfo', () => {
    it('should handle invalid date format', async () => {
      const options = {
        apellidos: 'Del Pueblo',
        fecha: 'invalid-date'
      };

      await expect(getPatientInfo(options)).rejects.toThrow(
        'process.exit called'
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('formato YYYY-MM-DD')
      );
    });

    it('should handle missing credentials', async () => {
      const options = {};

      await expect(getPatientInfo(options)).rejects.toThrow(
        'process.exit called'
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Se requiere nombre del paciente')
      );
    });

    it('should parse valid patient info correctly', async () => {
      const options = {
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20'
      };

      const patientInfo = await getPatientInfo(options);

      expect(patientInfo).toEqual({
        name: 'Del Pueblo',
        year: '1985',
        month: '03',
        day: '20'
      });
    });
  });

  describe('saveConfig', () => {
    it('should save config successfully', async () => {
      const { writeFile, readFile } = await import('fs/promises');
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue('{}'); // Mock existing config
      writeFile.mockResolvedValue();

      const options = {
        apellidos: 'Del Pueblo',
        fecha: '1990-01-15'
      };

      await saveConfig(options);

      expect(writeFile).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Configuración guardada exitosamente')
      );
    });

    it('should create directory if it does not exist', async () => {
      const { writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(false);
      mkdir.mockResolvedValue();
      writeFile.mockResolvedValue();

      const options = {
        apellidos: 'Del Pueblo',
        fecha: '1990-01-15'
      };

      await saveConfig(options);

      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
    });

    it('should handle partial options', async () => {
      const { writeFile, readFile } = await import('fs/promises');
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue('{}'); // Mock existing config
      writeFile.mockResolvedValue();

      const options = {
        apellidos: 'Del Pueblo'
        // fecha not provided
      };

      await saveConfig(options);

      expect(writeFile).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const { writeFile, readFile } = await import('fs/promises');
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue('{}');
      writeFile.mockRejectedValue(new Error('Write failed'));

      const options = {
        apellidos: 'Del Pueblo',
        fecha: '1990-01-15'
      };

      await expect(saveConfig(options)).rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error guardando configuración:'),
        'Write failed'
      );
    });
  });

  describe('loadConfig', () => {
    it('should load existing config', async () => {
      const { readFile } = await import('fs/promises');
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(
        JSON.stringify({
          name: 'Del Pueblo',
          dob: '1990-01-15'
        })
      );

      const config = await loadConfig();

      expect(config).toEqual({
        name: 'Del Pueblo',
        dob: '1990-01-15'
      });
    });

    it('should return empty config if file does not exist', async () => {
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(false);

      const config = await loadConfig();

      expect(config).toEqual({});
    });

    it('should handle read errors gracefully', async () => {
      const { readFile } = await import('fs/promises');
      const { existsSync } = await import('fs');

      existsSync.mockReturnValue(true);
      readFile.mockRejectedValue(new Error('Read error'));

      const config = await loadConfig();

      expect(config).toEqual({});
    });
  });
});
