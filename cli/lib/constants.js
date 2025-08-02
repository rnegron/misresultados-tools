// URLs
export const BASE_URL = 'https://misresultados.com';
export const PATIENT_PATH = '/soy-un-paciente/';
export const PDF_PATH = '/resultados/resultadopdf.php';

// Form field names
export const FORM_FIELDS = {
  LAST_NAME: 'patientLastName',
  BIRTH_YEAR: 'birthDateAnio',
  BIRTH_MONTH: 'birthDateMes',
  BIRTH_DAY: 'birthDateDia',
  CONTROL_NUMBER: 'labControlNumber',
  LICENSE_NUMBER: 'labLicenseNumber',
  RECAPTCHA: 'g-recaptcha-response'
};

// HTTP Headers
export const DEFAULT_HEADERS = {
  'User-Agent': 'misresultados-cli (+https://github.com/rnegron/misresultados-tools/tree/main/cli)',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br, zstd'
};

// Cookies
export const COOKIES = {
  SESSION: 'PHPSESSID',
  LANGUAGE: 'pll_language=es'
};

// RegEx patterns
export const PATTERNS = {
  PDF_LINK: /href=['"]([^'"]*\/resultados\/resultadopdf\.php\?resul=[^'"]+)['"]/,
  TABLE_ROW: /<tr[^>]*>(.*?)<\/tr>/gs,
  TABLE_CELL: /<td[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/td>/g,
  SESSION_ID: /PHPSESSID=([^;]+)/,
  PDF_HEADER: '%PDF',
  LARGE_TABLE: /<table[^>]*class="[^"]*large-only[^"]*"[^>]*>(.*?)<\/table>/s,
  MAIN_TABLE: /<table[^>]*id=['"]table_resultado['"][^>]*>(.*?)<\/table>/s
};

// Configuration
export const DEFAULT_OUTPUT_DIR = './resultados';
