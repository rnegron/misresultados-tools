import { PATTERNS, BASE_URL } from './constants.js';
import pc from 'picocolors';
import debug from 'debug';

const debugLog = debug('resultados:parser');

export function parseResults(html) {
  const results = [];

  debugLog('Starting HTML parsing, content length: %d', html.length);

  // First try to extract from the large-only table (desktop version), then main table
  let largeTableMatch = html.match(PATTERNS.LARGE_TABLE);
  if (!largeTableMatch) {
    largeTableMatch = html.match(PATTERNS.MAIN_TABLE);
  }

  if (!largeTableMatch) {
    debugLog('No results table found in HTML');
    return results;
  }

  const tableHtml = largeTableMatch[1];
  debugLog('Results table found, processing %d bytes', tableHtml.length);

  // Extract all table rows
  const rowMatches = [...tableHtml.matchAll(PATTERNS.TABLE_ROW)];
  debugLog('Table rows found: %d', rowMatches.length);

  for (let i = 0; i < rowMatches.length; i++) {
    const rowContent = rowMatches[i][1];
    // Skip header rows and rows without data cells
    if (rowContent.includes('<th') || !rowContent.includes('<td')) {
      continue;
    }

    // Extract PDF URL from the row
    const pdfLinkMatch = rowContent.match(PATTERNS.PDF_LINK);

    if (pdfLinkMatch) {
      // Use a simpler approach: split by <td> tags and extract text
      const cells = rowContent.split('<td>').slice(1); // Skip first empty element

      if (cells.length >= 4) {
        // Extract text content from each cell, removing HTML tags
        const cleanCell = cellHtml => {
          return cellHtml
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, '')
            .trim();
        };

        const result = {
          order: cleanCell(cells[1]) || '', // Second cell: order
          license: cleanCell(cells[2]) || '', // Third cell: license
          transmitted: cleanCell(cells[3]) || '', // Fourth cell: transmitted
          pdfUrl: BASE_URL + pdfLinkMatch[1]
        };

        // Only add if we have the required data
        if (
          result.order &&
          result.license &&
          result.transmitted &&
          result.pdfUrl
        ) {
          results.push(result);
        } else {
          debugLog(
            'Row skipped: missing data - order=%s, license=%s, transmitted=%s, pdfUrl=%s',
            !!result.order,
            !!result.license,
            !!result.transmitted,
            !!result.pdfUrl
          );
        }
      } else {
        debugLog('Row skipped: insufficient cells (%d)', cells.length);
      }
    }
  }

  debugLog('Total results parsed: %d', results.length);
  return results;
}

export function displayResultsTable(results, options = {}) {
  console.log('\n' + pc.cyan(pc.bold('📋 Resultados de Laboratorio')));
  console.log(pc.gray('─'.repeat(60)));

  // Header
  console.log(
    pc.yellow(pc.bold('Orden'.padEnd(12))) +
      pc.yellow(pc.bold('Licencia'.padEnd(10))) +
      pc.yellow(pc.bold('Transmitido'.padEnd(22)))
  );
  console.log(pc.gray('─'.repeat(60)));

  // Results
  for (const result of results) {
    console.log(
      pc.white((result.order || '').padEnd(12)) +
        pc.blue((result.license || '').padEnd(10)) +
        pc.green((result.transmitted || '').padEnd(22))
    );
  }

  console.log(pc.gray('─'.repeat(60)));
  console.log(pc.bold(`📊 Total de resultados: ${pc.green(results.length)}`));

  // Always show curl commands when we have a session ID
  if (options.sessionId) {
    console.log(
      '\n' + pc.yellow(pc.bold('💻 Comandos curl para descargar PDFs:'))
    );
    console.log(pc.gray('─'.repeat(60)));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const dateStr = result.transmitted.replace(/[^0-9]/g, '-');
      const filename = `resultado_${result.order}_${dateStr}.pdf`;

      const curlCommand = `curl -H "Cookie: PHPSESSID=${options.sessionId}" "${result.pdfUrl}" -o "${filename}"`;

      console.log(pc.cyan(`# Resultado ${i + 1}: ${result.transmitted}`));
      console.log(pc.white(curlCommand));
      console.log('');
    }

    console.log(
      pc.gray(
        '💡 Copia y pega estos comandos en tu terminal para descargar los PDFs'
      )
    );
    console.log(
      pc.gray(
        '💡 O usa el comando "download" para descargarlos automáticamente'
      )
    );
  }
}
