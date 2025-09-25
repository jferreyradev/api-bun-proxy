#!/usr/bin/env bun

// ================================
// API GAN PROXY - STANDALONE LAUNCHER (CLI ONLY)
// ================================

function showHelp() {
  console.log(`
🚀 API GAN PROXY - Standalone v1.0

USAGE:
  api-gan-proxy-standalone --port <number> --oracle-host <ip> [--oracle-port <number>]

OPCIONES REQUERIDAS:
  --port <number>        - Puerto del servidor proxy
  --oracle-host <ip>     - IP del servidor Oracle

OPCIONES OPCIONALES:
  --oracle-port <number> - Puerto del servidor Oracle (default: 3011)
  --help, -h             - Mostrar esta ayuda

EJEMPLOS:
  api-gan-proxy-standalone --port 3000 --oracle-host 192.168.1.100
  api-gan-proxy-standalone --port 8080 --oracle-host 10.6.46.114 --oracle-port 1521
  api-gan-proxy-standalone --port 3000 --oracle-host 192.168.1.100 --oracle-port 8087
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Validar argumentos requeridos
  const portIndex = args.findIndex(arg => arg === '--port');
  const hostIndex = args.findIndex(arg => arg === '--oracle-host');

  if (portIndex === -1 || hostIndex === -1) {
    console.error('❌ Argumentos requeridos faltantes');
    console.error('Uso: api-gan-proxy-standalone --port <number> --oracle-host <ip> [--oracle-port <number>]');
    console.error('Para ayuda: --help');
    process.exit(1);
  }

  // Extraer valores
  const portArg = args[portIndex + 1];
  const hostArg = args[hostIndex + 1];
  const oraclePortIndex = args.findIndex(arg => arg === '--oracle-port');
  const oraclePortArg = oraclePortIndex !== -1 ? args[oraclePortIndex + 1] : '3011';

  // Validar puerto
  const port = parseInt(portArg);
  if (!port || port <= 0 || port > 65535) {
    console.error('❌ Puerto inválido:', portArg);
    process.exit(1);
  }

  // Validar host
  if (!hostArg || hostArg.startsWith('--')) {
    console.error('❌ Host Oracle inválido:', hostArg);
    process.exit(1);
  }

  // Validar puerto Oracle
  const oraclePort = parseInt(oraclePortArg);
  if (!oraclePort || oraclePort <= 0 || oraclePort > 65535) {
    console.error('❌ Puerto Oracle inválido:', oraclePortArg);
    process.exit(1);
  }

  // Crear configuración básica
  const config = {
    proxy: { port, host: "localhost" },
    oracle: { 
      host: hostArg, 
      port: oraclePort, 
      endpoints: { inserts: "/exec", procedures: "/procedure" }, 
      token: "demo" 
    },
    logging: { enabled: true, directory: "logs" },
    cors: { enabled: true, origins: ["*"] }
  };

  return config;
}

async function main() {
  console.log('🚀 API GAN PROXY - Standalone Launcher');
  console.log('=====================================\n');
  
  const config = parseArgs();
  
  console.log(`🌐 Puerto proxy: ${config.proxy.port}`);
  console.log(`🎯 Oracle destino: ${config.oracle.host}:${config.oracle.port}`);
  console.log(`📁 Logs: ${config.logging.directory}\n`);

  // Crear configuración temporal
  const tempConfig = JSON.stringify(config, null, 2);
  
  // Sobrescribir process.env para que el servidor principal lea esta config
  process.env.EMBEDDED_CONFIG = tempConfig;
  
  console.log('🔄 Iniciando servidor...\n');
  
  // Importar y ejecutar el servidor principal
  try {
    await import('./main-modular');
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

main().catch(console.error);