#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { saveConfig } from '../lib/config.js';
import { fetchResults, downloadResults } from '../lib/services.js';
import { DEFAULT_OUTPUT_DIR } from '../lib/constants.js';
import { setupGracefulShutdown } from '../lib/ui.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

// Setup graceful shutdown handling
setupGracefulShutdown();

const program = new Command();

program
  .name('misresultados')
  .description('CLI para acceder a récords médicos desde misresultados.com')
  .version(packageJson.version);

// Config command to store credentials
program
  .command('config')
  .description('Guardar credenciales del paciente localmente')
  .option('-a, --apellidos <apellidos>', 'Apellidos del paciente (tal como aparecen en los récords)')
  .option('-f, --fecha <fecha>', 'Fecha de nacimiento (formato YYYY-MM-DD)')
  .action(async (options) => {
    if (!options.apellidos && !options.fecha) {
      console.error('Error: Debe proporcionar al menos --apellidos o --fecha');
      console.log('');
      console.log('Uso:');
      console.log('  misresultados config --apellidos "Del Pueblo" --fecha "1985-03-20"');
      console.log('  misresultados config --apellidos "Del Pueblo"');
      console.log('  misresultados config --fecha "1985-03-20"');
      process.exit(1);
    }
    await saveConfig(options);
  });

// Fetch command to retrieve and display results
program
  .command('fetch')
  .description('Buscar y mostrar resultados de laboratorio')
  .requiredOption('-c, --control <number>', 'Número de control del laboratorio')
  .requiredOption('-l, --licencia <number>', 'Número de licencia del laboratorio')
  .option('-a, --apellidos <apellidos>', 'Apellidos del paciente (reemplaza la configuración guardada)')
  .option('-f, --fecha <fecha>', 'Fecha de nacimiento YYYY-MM-DD (reemplaza la configuración guardada)')
  .option('--format <format>', 'Formato de salida (table|json)', 'table')
  .action(async (options) => {
    await fetchResults(options);
  });

// Download command to fetch and save PDFs
program
  .command('download')
  .description('Descargar PDFs de resultados de laboratorio')
  .requiredOption('-c, --control <number>', 'Número de control del laboratorio')
  .requiredOption('-l, --licencia <number>', 'Número de licencia del laboratorio')
  .option('-a, --apellidos <apellidos>', 'Apellidos del paciente (reemplaza la configuración guardada)')
  .option('-f, --fecha <fecha>', 'Fecha de nacimiento YYYY-MM-DD (reemplaza la configuración guardada)')
  .option('-o, --output <dir>', 'Directorio de salida', DEFAULT_OUTPUT_DIR)
  .action(async (options) => {
    await downloadResults(options);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
