import { describe, it, expect } from 'vitest';
import {
  extractSessionId,
  buildPatientUrl,
  buildFormData,
  buildRequestHeaders
} from '../../lib/http.js';

describe('HTTP Helper Functions', () => {
  describe('extractSessionId', () => {
    it('should extract session ID from cookies', () => {
      const cookies = [
        'pll_language=es; Path=/',
        'PHPSESSID=abc123def456; Path=/',
        'other=value; Path=/'
      ];

      const sessionId = extractSessionId(cookies);
      expect(sessionId).toBe('abc123def456');
    });

    it('should return null when no session ID found', () => {
      const cookies = ['pll_language=es; Path=/', 'other=value; Path=/'];

      const sessionId = extractSessionId(cookies);
      expect(sessionId).toBeNull();
    });
  });

  describe('buildPatientUrl', () => {
    it('should build patient URL correctly', () => {
      const url = buildPatientUrl('12345', '6789');
      expect(url).toBe(
        'https://misresultados.com/soy-un-paciente/?controlnumber=12345&lablicense=6789'
      );
    });
  });

  describe('buildFormData', () => {
    it('should build form data correctly', () => {
      const patientInfo = {
        name: 'Del Pueblo',
        year: '1985',
        month: '03',
        day: '20'
      };

      const formData = buildFormData(patientInfo, '12345', '6789');
      const params = new URLSearchParams(formData);

      expect(params.get('patientLastName')).toBe('Del Pueblo');
      expect(params.get('birthDateAnio')).toBe('1985');
      expect(params.get('birthDateMes')).toBe('03');
      expect(params.get('birthDateDia')).toBe('20');
      expect(params.get('labControlNumber')).toBe('12345');
      expect(params.get('labLicenseNumber')).toBe('6789');
    });
  });

  describe('buildRequestHeaders', () => {
    it('should build request headers with session ID', () => {
      const headers = buildRequestHeaders('test123', 'https://example.com');

      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(headers['Cookie']).toContain('PHPSESSID=test123');
      expect(headers['Referer']).toBe('https://example.com');
      expect(headers['Origin']).toBe('https://misresultados.com');
    });
  });
});
