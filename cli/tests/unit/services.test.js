import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fetchResults, downloadResults } from '../../lib/services.js';

// Mock fs operations
vi.mock('fs/promises', async () => {
  const actual = await vi.importActual('fs/promises');
  return {
    ...actual,
    writeFile: vi.fn(),
    mkdir: vi.fn()
  };
});

vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

// Mock process.exit
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Services Functions', () => {
  let resultsHtml;

  beforeEach(async () => {
    resultsHtml = await readFile(
      join(process.cwd(), 'tests/fixtures/results-response.html'), 
      'utf-8'
    );
    nock.cleanAll();
    vi.clearAllMocks();
    
    // Reset all mocks to default behavior
    const { writeFile, mkdir } = await import('fs/promises');
    const { existsSync } = await import('fs');
    
    writeFile.mockResolvedValue();
    mkdir.mockResolvedValue();
    existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchResults', () => {
    it('should fetch and display results successfully', async () => {
      const sessionCookie = 'PHPSESSID=test123; Path=/';
      
      // Mock initial request
      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie, 'pll_language=es; Path=/']
        });

      // Mock form submission
      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .matchHeader('Cookie', /PHPSESSID=test123/)
        .reply(200, resultsHtml);

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20',
        format: 'table'
      };

      await fetchResults(options);

      expect(initialScope.isDone()).toBe(true);
      expect(submitScope.isDone()).toBe(true);
      // Verify some output was generated
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle no session ID error', async () => {
      // Mock request without session cookie
      const scope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>'); // No Set-Cookie header

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20'
      };

      await expect(fetchResults(options))
        .rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalled();
      expect(scope.isDone()).toBe(true);
    });

    it('should handle no results found', async () => {
      const sessionCookie = 'PHPSESSID=test123; Path=/';
      
      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie]
        });

      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html><body>No results</body></html>');

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20'
      };

      await fetchResults(options);

      expect(mockConsoleLog).toHaveBeenCalled();
      expect(initialScope.isDone()).toBe(true);
      expect(submitScope.isDone()).toBe(true);
    });

    it('should output JSON format correctly', async () => {
      const sessionCookie = 'PHPSESSID=test123; Path=/';
      
      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie]
        });

      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, resultsHtml);

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20',
        format: 'json'
      };

      await fetchResults(options);

      // Check that JSON was logged
      const jsonOutput = mockConsoleLog.mock.calls.find(call => 
        call[0].includes('"sessionId"')
      );
      expect(jsonOutput).toBeDefined();
      
      const parsedOutput = JSON.parse(jsonOutput[0]);
      expect(parsedOutput).toHaveProperty('sessionId', 'test123');
      expect(parsedOutput).toHaveProperty('results');
      expect(parsedOutput).toHaveProperty('totalResults');
    });

    it('should handle network errors', async () => {
      const scope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .replyWithError('Network error');

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20'
      };

      await expect(fetchResults(options))
        .rejects.toThrow('process.exit called');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error buscando resultados:',
        'Network error'
      );
    });
  });

  describe('downloadResults', () => {
    it('should download PDFs successfully', async () => {
      const { writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');
      
      // Mock file system
      existsSync.mockReturnValue(false); // Directory doesn't exist
      mkdir.mockResolvedValue();
      writeFile.mockResolvedValue();
      
      const sessionCookie = 'PHPSESSID=test123; Path=/';
      const fakePdfBuffer = Buffer.from('%PDF-1.4\n%fake pdf content');
      
      // Mock initial request and form submission
      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie]
        });

      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, resultsHtml);

      // Mock PDF downloads
      const pdfScope = nock('https://misresultados.com')
        .get('/resultados/resultadopdf.php')
        .query(true)
        .times(3) // We have 3 results in fixture
        .reply(200, fakePdfBuffer, {
          'Content-Type': 'application/pdf'
        });

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20',
        output: './test-output'
      };

      await downloadResults(options);

      // Verify file system operations were called
      expect(mkdir).toHaveBeenCalledWith('./test-output', { recursive: true });
      expect(writeFile).toHaveBeenCalledTimes(3); // 3 PDFs from fixture
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.pdf'),
        fakePdfBuffer
      );
      
      expect(initialScope.isDone()).toBe(true);
      expect(submitScope.isDone()).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle no results in download', async () => {
      const sessionCookie = 'PHPSESSID=test123; Path=/';
      
      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie]
        });

      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html><body>No results</body></html>');

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20',
        output: './test-output'
      };

      await downloadResults(options);

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle PDF download errors gracefully', async () => {
      const sessionCookie = 'PHPSESSID=test123; Path=/';
      
      // Mock successful initial requests
      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie]
        });

      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, resultsHtml);

      // Mock PDF download failure
      const pdfScope = nock('https://misresultados.com')
        .get('/resultados/resultadopdf.php')
        .query(true)
        .reply(404, 'Not Found');

      const options = {
        control: '12345',
        licencia: '6789',
        apellidos: 'Del Pueblo',
        fecha: '1985-03-20',
        output: './test-output'
      };

      await downloadResults(options);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('❌ Falló:')
      );
    });

  });
});