import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import debug from 'debug';
import {
  makeRequest,
  extractSessionId,
  buildFormData,
  buildPatientUrl,
  buildRequestHeaders,
  downloadPDF
} from './http.js';
import { parseResults, displayResultsTable } from './parser.js';
import { getPatientInfo } from './config.js';
import { createSpinner } from './ui.js';
import pc from 'picocolors';

const debugLog = debug('resultados:services');

async function getResultsData(options) {
  const patientInfo = await getPatientInfo(options);
  debugLog('Fetching results for user');

  // Step 1: Get initial page to obtain session cookie
  const initialUrl = buildPatientUrl(options.control, options.licencia);
  const initialResponse = await makeRequest(initialUrl);

  // Extract PHPSESSID from cookies
  const sessionId = extractSessionId(initialResponse.cookies);

  if (!sessionId) {
    throw new Error('No se pudo obtener la cookie de sesión');
  }

  // Step 2: Submit form
  const formData = buildFormData(
    patientInfo,
    options.control,
    options.licencia
  );
  const headers = buildRequestHeaders(sessionId, initialUrl);

  const submitResponse = await makeRequest(initialUrl, {
    method: 'POST',
    headers,
    body: formData.toString()
  });

  // Parse results
  const results = parseResults(submitResponse.data);

  return { results, sessionId, patientInfo };
}

export async function fetchResults(options) {
  try {
    const spinner = createSpinner('🔍 Buscando resultados...');
    spinner.start();

    try {
      spinner.text = '📝 Enviando formulario...';

      const { results, sessionId } = await getResultsData(options);

      spinner.succeed(`${results.length} resultado(s) encontrado(s)`);

      if (results.length === 0) {
        console.log(pc.yellow('⚠️  No se encontraron resultados.'));
        console.log(
          pc.gray('💡 Tip: Use DEBUG=resultados:* to see debug output')
        );
        return;
      }

      // Display results
      if (options.format === 'json') {
        const jsonOutput = {
          sessionId: sessionId,
          results: results,
          totalResults: results.length
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        displayResultsTable(results, { sessionId: sessionId });
      }
    } catch (spinnerError) {
      spinner.fail('Error durante la búsqueda');
      throw spinnerError;
    }
  } catch (error) {
    console.error('Error buscando resultados:', error.message);
    process.exit(1);
  }
}

export async function downloadResults(options) {
  try {
    const spinner = createSpinner('🔍 Buscando resultados...');
    spinner.start();

    const { results, sessionId } = await getResultsData(options);

    if (results.length === 0) {
      spinner.succeed('Búsqueda completada');
      console.log(pc.yellow('⚠️  No se encontraron resultados.'));
      return;
    }

    spinner.succeed(`${results.length} resultado(s) encontrado(s)`);

    // Create output directory
    if (!existsSync(options.output)) {
      await mkdir(options.output, { recursive: true });
    }

    console.log(
      pc.blue(
        `\n⬇️  Descargando ${pc.bold(results.length)} PDF(s) a ${pc.cyan(options.output)}...`
      )
    );

    // Download each PDF
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log(
        pc.gray(
          `\n📄 Descargando ${pc.bold(i + 1)}/${pc.bold(results.length)}: ${pc.white(result.transmitted)}`
        )
      );

      try {
        const pdfData = await downloadPDF(result.pdfUrl, sessionId);

        // Generate filename
        const dateStr = result.transmitted.replace(/[^0-9]/g, '-');
        const filename = `misresultados_${options.control}_${dateStr}.pdf`;
        const filepath = join(options.output, filename);

        await writeFile(filepath, pdfData);
        console.log(pc.green(`   ✅ Guardado: ${pc.bold(filename)}`));
      } catch (error) {
        console.error(pc.red(`   ❌ Falló: ${error.message}`));
      }
    }

    console.log(pc.green(pc.bold('\n🎉 Descarga completada!')));
  } catch (error) {
    console.error('Error descargando resultados:', error.message);
    process.exit(1);
  }
}
