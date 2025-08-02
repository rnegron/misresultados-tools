import https from 'https';
import { URL, URLSearchParams } from 'url';
import debug from 'debug';
import { 
  BASE_URL, 
  PATIENT_PATH, 
  DEFAULT_HEADERS, 
  COOKIES, 
  PATTERNS, 
  FORM_FIELDS 
} from './constants.js';

const log = debug('resultados:http');

export async function makeRequest(url, options = {}) {
  const urlObj = new URL(url);
  const reqOptions = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: options.method || 'GET',
    headers: options.headers || {},
    ...options
  };

  log('Making %s request to %s', reqOptions.method, url);

  return new Promise((resolve, reject) => {
    const req = https.request(reqOptions, (res) => {
      const chunks = [];
      
      // Store cookies
      const cookies = res.headers['set-cookie'];
      
      res.on('data', chunk => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        // For binary data (like PDFs), return buffer; otherwise return string
        const buffer = Buffer.concat(chunks);
        const isBinary = options.binary || false;
        
        log('Response status: %d', res.statusCode);
        if (res.statusCode !== 200) {
          log('Response headers: %O', res.headers);
        }
        
        resolve({ 
          data: isBinary ? buffer : buffer.toString('utf-8'),
          buffer: buffer,
          statusCode: res.statusCode,
          headers: res.headers,
          cookies 
        });
      });
      
      res.on('error', reject);
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

export function extractSessionId(cookies) {
  if (!cookies) {
    log('No cookies provided for session extraction');
    return null;
  }
  
  for (const cookie of cookies) {
    const match = cookie.match(PATTERNS.SESSION_ID);
    if (match) {
      log('Session ID extracted: %s', match[1]);
      return match[1];
    }
  }
  log('No PHPSESSID found in cookies: %O', cookies);
  return null;
}

export function buildFormData(patientInfo, control, license) {
  const formData = new URLSearchParams({
    [FORM_FIELDS.LAST_NAME]: patientInfo.name,
    [FORM_FIELDS.BIRTH_YEAR]: patientInfo.year,
    [FORM_FIELDS.BIRTH_MONTH]: patientInfo.month,
    [FORM_FIELDS.BIRTH_DAY]: patientInfo.day,
    [FORM_FIELDS.CONTROL_NUMBER]: control,
    [FORM_FIELDS.LICENSE_NUMBER]: license,
    [FORM_FIELDS.RECAPTCHA]: '' // Empty for now
  });
  
  log('Form data built for user: %s', patientInfo.name);
  return formData;
}

export function buildPatientUrl(control, license) {
  return `${BASE_URL}${PATIENT_PATH}?controlnumber=${control}&lablicense=${license}`;
}

export function buildRequestHeaders(sessionId, referer) {
  return {
    ...DEFAULT_HEADERS,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `${COOKIES.LANGUAGE}; ${COOKIES.SESSION}=${sessionId}`,
    'Referer': referer,
    'Origin': BASE_URL
  };
}

export async function downloadPDF(url, sessionId) {
  const response = await makeRequest(url, {
    binary: true,
    headers: {
      ...DEFAULT_HEADERS,
      'Cookie': `${COOKIES.LANGUAGE}; ${COOKIES.SESSION}=${sessionId}`,
      'Accept': 'application/pdf,*/*'
    }
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }

  const buffer = response.buffer;

  // Check if it's actually a PDF
  if (!buffer.toString('utf-8', 0, 4).includes(PATTERNS.PDF_HEADER)) {
    throw new Error('Response is not a PDF');
  }

  return buffer;
}