# misresultados-cli

[![NPM Version](https://img.shields.io/npm/v/misresultados-cli)](https://www.npmjs.com/package/misresultados-cli)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CLI CI](https://github.com/rnegron/misresultados-tools/actions/workflows/cli-ci.yml/badge.svg)](https://github.com/rnegron/misresultados-tools/actions/workflows/cli-ci.yml)
[![codecov](https://codecov.io/gh/rnegron/misresultados-tools/branch/main/graph/badge.svg)](https://codecov.io/gh/rnegron/misresultados-tools)
[![Code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Downloads](https://img.shields.io/npm/dm/misresultados-cli.svg)](https://www.npmjs.com/package/misresultados-cli)

Herramienta CLI para acceder a récords médicos almacenados en misresultados.com de forma programática.

> 🔒 **Seguro y privado**: Esta herramienta es de código abierto, no almacena ni transmite tus datos médicos a otros servicios. Se conecta directamente desde tu computadora a [misresultados.com](https://misresultados.com).

> [Ver más detalles de seguridad](#seguridad-y-privacidad).

## Cómo Funciona

Esta herramienta te permite **descargar tus resultados de laboratorio** desde misresultados.com **usando el terminal** en lugar del navegador web. Es especialmente útil para:

- 📥 **Descargar múltiples PDFs** de una vez
- 🤖 **Automatizar** la descarga de resultados
- 💾 **Organizar** tus récords médicos localmente

### ¿Qué necesitas?

1. **Número de control del laboratorio** (lo encuentras en tu recibo o email)
2. **Número de licencia del laboratorio** (también en el recibo)
3. **Tus apellidos** tal como aparecen en los récords
4. **Tu fecha de nacimiento** en formato YYYY-MM-DD (ejemplo: "1988-03-22")

### Proceso básico:

1. **Configura** tus datos personales (paso opcional, para no repetirlos cada vez)
2. **Busca** los resultados disponibles - verás una tabla con las fechas
3. **Descarga** los PDFs automáticamente a tu computadora

La herramienta maneja automáticamente la autenticación y sesiones, por lo que no necesitas lidiar con cookies o sesiones web manualmente.

## Instalación

### Desde npm (recomendado)

```bash
npm install -g misresultados-cli
```

### Desde código fuente

```bash
git clone https://github.com/rnegron/misresultados-tools.git
cd misresultados-tools/cli
pnpm install
pnpm link --global  # o npm link --global
```

## Ejemplo Rápido

```bash
# Descargar todos los PDFs directamente (caso más común)
misresultados download --control 15387624 --licencia 9421 --apellidos "García Morales" --fecha 1987-11-23
```

## Uso

### Ejemplo paso a paso:

```bash
# 1. Configura tus datos (solo necesario una vez)
misresultados config --apellidos "Del Pueblo" --fecha 1995-04-30

# 2. Mirar cuales resultados están disponibles
misresultados fetch --control 98765432 --licencia 5678

# 3. Descarga todos los PDFs automáticamente
misresultados download --control 98765432 --licencia 5678 --output pdf_results
```

**¿Qué verás?**

- El comando `fetch` te muestra una tabla con las fechas de tus resultados
  - También incluye comandos `curl` que puedes copiar y pegar si prefieres descargar cada uno manualmente.
- El comando `download` descarga todos los PDFs directamente a una carpeta llamada `resultados/` en tu directorio actual (puedes cambiar el directorio con `--output`/`-o`).

### Guardar tus credenciales (opcional)

```bash
misresultados config --apellidos "Del Pueblo" --fecha 1990-01-15
```

### Buscar y mostrar resultados

```bash
# Usando credenciales guardadas
misresultados fetch --control 98765432 --licencia 5678

# Ad-hoc con todos los parámetros
misresultados fetch --control 98765432 --licencia 5678 --apellidos "Del Pueblo" --fecha 1990-01-15

# Salida como JSON (incluye sessionId para uso programático)
misresultados fetch --control 98765432 --licencia 5678 --format json
```

### Descargar PDFs

```bash
# Descargar al directorio ./resultados por defecto
misresultados download --control 98765432 --licencia 5678

# Descargar a un directorio personalizado
misresultados download --control 98765432 --licencia 5678 --output ~/Downloads/resultados-lab
```

## Comandos

- `config` - Guardar credenciales del paciente localmente
- `fetch` - Obtener y mostrar resultados con comandos curl para descargar PDFs
- `download` - Descargar PDFs de resultados de laboratorio

## Opciones

- `--control, -c` - Número de control del laboratorio (requerido para fetch/download)
- `--licencia, -l` - Número de licencia del laboratorio (requerido para fetch/download)
- `--apellidos, -a` - Apellidos del paciente tal como aparecen en los récords
- `--fecha, -f` - Fecha de nacimiento en formato YYYY-MM-DD
- `--format` - Formato de salida: table (con comandos curl) o json (con sessionId)
- `--output, -o` - Directorio de resultados para descargas (por defecto: ./resultados)

## Seguridad y Privacidad

**🔒 Tu data está en tus manos:**

- **Sin transmisión de datos**: Esta herramienta se conecta directamente a misresultados.com desde tu computadora. Nosotros no recibimos, almacenamos ni tenemos acceso a tus datos médicos.
- **Código abierto**: Todo el código es transparente y auditable. Puedes revisar exactamente qué hace la herramienta:
  - [🌐 Conexiones HTTP](https://github.com/rnegron/misresultados-tools/blob/main/cli/lib/http.js) - Solo se conecta a misresultados.com.
  - [📁 Configuración local](https://github.com/rnegron/misresultados-tools/blob/main/cli/lib/config.js) - Solo guarda datos en tu computadora.
  - [🔧 Lógica principal](https://github.com/rnegron/misresultados-tools/blob/main/cli/lib/services.js) - Automatiza lo que harías manualmente en el navegador.
- **Almacenamiento local**: Tus credenciales se guardan únicamente en tu computadora (`~/.misresultados-cli/config.json`)
- **Sin telemetría**: No enviamos estadísticas, métricas o datos de uso a ningún servidor externo
- **Sin dependencias sospechosas**: Solo usa librerías mínimas y confiables ([ver package.json](https://github.com/rnegron/misresultados-tools/blob/main/cli/package.json))

## Términos y Responsabilidades

**⚠️ Importante**: Al utilizar esta herramienta, aceptas que:

- **Te haces responsable** de cómo manejas tus datos médicos y tu información personal.
- **Esta herramienta almacena datos personales localmente** en tu computadora (`~/.misresultados-cli/config.json`) y archivos descargados (en un directorio llamado `resultados`, por defecto)
- **Debes limpiar tus datos** cuando termines de utilizar el CLI:

  ```bash
  # Para limpiar configuración guardada (apellidos y fecha de nacimiento)
  rm -rf ~/.misresultados-cli

  # Para limpiar PDFs descargados
  rm -rf ./resultados  # o el directorio que hayas especificado con --output
  ```

- **No somos responsables** por el uso inadecuado de la herramienta o por problemas con misresultados.com
- **Es tu responsabilidad** cumplir con las políticas de misresultados.com

## Legal

Qué se yo, contáctame y resolvemos sin problema.
