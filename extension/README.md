# misresultados-helper

[![Firefox Extension](https://img.shields.io/badge/Firefox-Extension-orange)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Extensión de Firefox para auto-completar formularios de paciente en misresultados.com y e-labresults.com con un solo clic.

> 🔒 **Privado y seguro**: Código abierto, datos guardados solo en tu navegador, sin conexiones a servidores externos.

## Cómo Funciona

1. **Configura** tus datos (nombre y fecha de nacimiento) en la extensión
2. **Visita** un enlace de laboratorio con parámetros `?controlnumber=123&lablicense=ABC` (los links que recibes por email)
3. **Click** en "Completar Formulario" que aparece automáticamente
4. **¡Listo!** - formulario completado instantáneamente

## Instalación

### Firefox Add-ons (recomendado)
*Próximamente - pendiente de revisión de Mozilla*

### Desarrollo local
```bash
git clone https://github.com/rnegron/misresultados-tools.git
cd misresultados-tools/extension
pnpm install
pnpm start  # Carga la extensión en Firefox
```

## Configuración

1. Click en el ícono de la extensión
2. Introduce:
   - **Nombre completo** (tal como aparece en récords médicos)
   - **Fecha de nacimiento** (día, mes, año)
3. Click "Guardar"

## Sitios Compatibles

- **misresultados.com** (español)
- **e-labresults.com** (inglés)

*Requiere URLs con parámetros `controlnumber` y `lablicense` para activarse (los links que recibes por email)*

## Características

- ⚡ **Un click** - completa todos los campos instantáneamente
- 🔒 **100% local** - datos nunca salen de tu navegador
- 🌍 **Multiidioma** - español/inglés automático basado en tu browser
- 🎯 **Específico** - solo se activa cuando detecta páginas compatibles

## Desarrollo

```bash
pnpm install    # Instalar dependencias
pnpm start      # Ejecutar en Firefox
pnpm format     # Formatear código
pnpm run build  # Construir para distribución
```

## Licencia

MIT License - ver archivo [LICENSE](../LICENSE) para detalles.
