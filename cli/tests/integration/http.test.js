import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  makeRequest,
  downloadPDF,
  buildPatientUrl,
  extractSessionId,
  buildFormData,
  buildRequestHeaders
} from '../../lib/http.js';

describe('HTTP Integration Tests', () => {
  let resultsHtml;

  beforeEach(async () => {
    resultsHtml = await readFile(
      join(process.cwd(), 'tests/fixtures/results-response.html'),
      'utf-8'
    );
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('makeRequest', () => {
    it('should make initial request and extract session ID', async () => {
      const scope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': ['PHPSESSID=test123; Path=/', 'pll_language=es; Path=/']
        });

      const url = buildPatientUrl('12345', '6789');
      const response = await makeRequest(url);
      const sessionId = extractSessionId(response.cookies);

      expect(sessionId).toBe('test123');
      expect(scope.isDone()).toBe(true);
    });

    it('should submit form with correct headers and data', async () => {
      const sessionCookie = 'PHPSESSID=test123; Path=/';

      const initialScope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query({ controlnumber: '12345', lablicense: '6789' })
        .reply(200, '<html></html>', {
          'Set-Cookie': [sessionCookie, 'pll_language=es; Path=/']
        });

      const submitScope = nock('https://misresultados.com')
        .post('/soy-un-paciente/', body => {
          const params = new URLSearchParams(body);
          return (
            params.get('patientLastName') === 'Del Pueblo' &&
            params.get('labControlNumber') === '12345'
          );
        })
        .query({ controlnumber: '12345', lablicense: '6789' })
        .matchHeader('Cookie', /PHPSESSID=test123/)
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, resultsHtml);

      const url = buildPatientUrl('12345', '6789');
      const initialResponse = await makeRequest(url);
      const sessionId = extractSessionId(initialResponse.cookies);

      const patientInfo = {
        name: 'Del Pueblo',
        year: '1985',
        month: '03',
        day: '20'
      };
      const formData = buildFormData(patientInfo, '12345', '6789');
      const headers = buildRequestHeaders(sessionId, url);

      const submitResponse = await makeRequest(url, {
        method: 'POST',
        headers,
        body: formData.toString()
      });

      expect(submitResponse.statusCode).toBe(200);
      expect(initialScope.isDone()).toBe(true);
      expect(submitScope.isDone()).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      const scope = nock('https://misresultados.com')
        .get('/soy-un-paciente/')
        .query(true)
        .replyWithError('Network error');

      const url = buildPatientUrl('12345', '6789');

      await expect(makeRequest(url)).rejects.toThrow('Network error');

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('downloadPDF', () => {
    it('should download PDF with correct headers', async () => {
      const fakePdfBuffer = Buffer.from('%PDF-1.4\n%fake pdf content');

      const scope = nock('https://misresultados.com')
        .get('/resultados/resultadopdf.php')
        .query({ resul: 'test123' })
        .matchHeader('Cookie', /PHPSESSID=session123/)
        .reply(200, fakePdfBuffer, {
          'Content-Type': 'application/pdf'
        });

      const pdfUrl =
        'https://misresultados.com/resultados/resultadopdf.php?resul=test123';
      const buffer = await downloadPDF(pdfUrl, 'session123');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
      expect(scope.isDone()).toBe(true);
    });

    it('should throw error for non-PDF response', async () => {
      const scope = nock('https://misresultados.com')
        .get('/resultados/resultadopdf.php')
        .query({ resul: 'test123' })
        .reply(200, '<html>Not a PDF</html>');

      const pdfUrl =
        'https://misresultados.com/resultados/resultadopdf.php?resul=test123';

      await expect(downloadPDF(pdfUrl, 'session123')).rejects.toThrow(
        'Response is not a PDF'
      );

      expect(scope.isDone()).toBe(true);
    });

    it('should throw error for HTTP error status', async () => {
      const scope = nock('https://misresultados.com')
        .get('/resultados/resultadopdf.php')
        .query({ resul: 'test123' })
        .reply(404, 'Not Found');

      const pdfUrl =
        'https://misresultados.com/resultados/resultadopdf.php?resul=test123';

      await expect(downloadPDF(pdfUrl, 'session123')).rejects.toThrow(
        'HTTP 404'
      );

      expect(scope.isDone()).toBe(true);
    });
  });
});
