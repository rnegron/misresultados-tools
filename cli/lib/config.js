import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import pc from 'picocolors';

const CONFIG_DIR = join(homedir(), '.misresultados-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export async function saveConfig(options) {
  try {
    if (!existsSync(CONFIG_DIR)) {
      await mkdir(CONFIG_DIR, { recursive: true });
    }

    let config = {};
    if (existsSync(CONFIG_FILE)) {
      const content = await readFile(CONFIG_FILE, 'utf-8');
      config = JSON.parse(content);
    }

    if (options.apellidos) config.name = options.apellidos;
    if (options.fecha) config.dob = options.fecha;

    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(pc.green('✅ Configuración guardada exitosamente'));

    if (config.name)
      console.log(`   ${pc.blue('👤 Nombre:')} ${pc.bold(config.name)}`);
    if (config.dob)
      console.log(
        `   ${pc.blue('📅 Fecha de nacimiento:')} ${pc.bold(config.dob)}`
      );
  } catch (error) {
    console.error(pc.red('❌ Error guardando configuración:'), error.message);
    process.exit(1);
  }
}

export async function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = await readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Ignore errors, return empty config
  }
  return {};
}

export async function getPatientInfo(options) {
  const config = await loadConfig();

  const name = options.apellidos || config.name;
  const dob = options.fecha || config.dob;

  if (!name || !dob) {
    console.error(
      pc.red('❌ Error: Se requiere nombre del paciente y fecha de nacimiento.')
    );
    console.error(
      pc.yellow(
        '💡 Provéelos con las opciones --apellidos y --fecha o guárdalos usando "misresultados config"'
      )
    );
    process.exit(1);
  }

  // Parse date
  const dobParts = dob.split('-');
  if (dobParts.length !== 3) {
    console.error(
      pc.red(
        '❌ Error: La fecha de nacimiento debe estar en formato YYYY-MM-DD'
      )
    );
    process.exit(1);
  }

  return {
    name,
    year: dobParts[0],
    month: dobParts[1],
    day: dobParts[2]
  };
}
