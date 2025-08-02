import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseResults, displayResultsTable } from '../../lib/parser.js';

const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Parser Functions', () => {
  let resultsHtml;

  beforeEach(async () => {
    resultsHtml = await readFile(
      join(process.cwd(), 'tests/fixtures/results-response.html'), 
      'utf-8'
    );
    vi.clearAllMocks();
  });

  describe('parseResults', () => {
    it('should parse results from HTML correctly', () => {
      const results = parseResults(resultsHtml);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({
        order: '98765432',
        license: '5678',
        transmitted: '2024-03-15T10:30:00',
        pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=QWJjRGVmR2hpSmsxMjM0NQ=='
      });
      expect(results[1]).toMatchObject({
        order: '98765432',
        license: '5678',
        transmitted: '2024-03-16T14:20:15',
        pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=UXdlUnR5VWlPcDY3ODkw'
      });
      expect(results[2]).toMatchObject({
        order: '98765432',
        license: '5678',
        transmitted: '2024-03-17T09:45:30',
        pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=WnhjVmJuTTU2NzgxMjM0'
      });
    });

    it('should return empty array when no results found', () => {
      const results = parseResults('<html><body>No results</body></html>');
      expect(results).toEqual([]);
    });

    it('should handle malformed HTML gracefully', () => {
      const results = parseResults('<table><tr><td>Invalid</td></tr></table>');
      expect(results).toEqual([]);
    });
  });

  describe('displayResultsTable', () => {
    it('should display results table correctly', () => {
      const results = [
        {
          order: '98765432',
          license: '5678',
          transmitted: '2024-03-15T10:30:00',
          pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=test123'
        }
      ];

      displayResultsTable(results);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📋 Resultados de Laboratorio')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('98765432')
      );
    });

    it('should display curl commands when sessionId is provided', () => {
      const results = [
        {
          order: '98765432',
          license: '5678',
          transmitted: '2024-03-15T10:30:00',
          pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=test123'
        }
      ];

      displayResultsTable(results, { sessionId: 'test123' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('💻 Comandos curl para descargar PDFs:')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('curl')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('PHPSESSID=test123')
      );
    });

    it('should handle empty results', () => {
      displayResultsTable([]);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('📋 Resultados de Laboratorio')
      );
    });

    it('should display multiple results correctly', () => {
      const results = [
        {
          order: '98765432',
          license: '5678',
          transmitted: '2024-03-15T10:30:00',
          pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=test1'
        },
        {
          order: '98765433',
          license: '5679',
          transmitted: '2024-03-16T14:20:15',
          pdfUrl: 'https://misresultados.com/resultados/resultadopdf.php?resul=test2'
        }
      ];

      displayResultsTable(results, { sessionId: 'test123' });

      // Should display both results
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('98765432')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('98765433')
      );
      
      // Should display two curl commands
      const curlCalls = mockConsoleLog.mock.calls.filter(call => 
        call[0].includes('curl')
      );
      expect(curlCalls.length).toBeGreaterThanOrEqual(2);
    });
  });
});