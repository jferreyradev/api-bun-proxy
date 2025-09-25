import type { ServerConfig } from './types';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ================================
// CONFIGURACIÓN DEL SERVIDOR
// ================================

/**
 * Interfaz para el archivo de configuración JSON
 */
interface ConfigFile {
  proxy: {
    port: number;
    host: string;
  };
  oracle: {
    host: string;
    port: number;
    endpoints: {
      inserts: string;
      procedures: string;
    };
    token: string;
  };
  logging: {
    enabled: boolean;
    directory: string;
  };
  cors: {
    enabled: boolean;
    origins: string[];
  };
}

/**
 * Carga la configuración desde archivo JSON o configuración embebida
 */
function loadConfigFromFile(): Partial<ConfigFile> {
  // Prioridad 1: Configuración embebida (para standalone)
  if (process.env.EMBEDDED_CONFIG) {
    try {
      const config = JSON.parse(process.env.EMBEDDED_CONFIG);
      console.log(`✅ Configuración cargada desde: embedded config`);
      return config;
    } catch (error) {
      console.warn(`⚠️  Error leyendo configuración embebida:`, error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  // Prioridad 2: Archivos de configuración
  const configPaths = [
    './config.json',           // Directorio actual
    '../config.json',          // Un nivel arriba (para dist/)
    './config/config.json',    // Subdirectorio config
    process.env.CONFIG_FILE    // Variable de entorno
  ].filter(Boolean);

  for (const configPath of configPaths) {
    if (configPath && existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        console.log(`✅ Configuración cargada desde: ${configPath}`);
        return config;
      } catch (error) {
        console.warn(`⚠️  Error leyendo ${configPath}:`, error instanceof Error ? error.message : 'Error desconocido');
      }
    }
  }

  console.log('ℹ️  No se encontró archivo de configuración, usando valores por defecto');
  return {};
}

/**
 * Obtiene el puerto desde argumentos de línea de comandos, archivo de config, o valor por defecto
 */
function getPort(fileConfig: Partial<ConfigFile>): number {
  // Prioridad: 1) Argumentos CLI, 2) Archivo config, 3) Por defecto
  const args = process.argv;
  const portIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
  
  if (portIndex !== -1 && portIndex + 1 < args.length) {
    const portArg = args[portIndex + 1];
    if (portArg) {
      const portValue = parseInt(portArg, 10);
      if (!isNaN(portValue) && portValue > 0 && portValue <= 65535) {
        return portValue;
      }
      console.warn(`⚠️  Puerto inválido: ${portArg}. Usando configuración por defecto.`);
    }
  }
  
  // Usar valor del archivo de configuración si existe
  if (fileConfig.proxy?.port) {
    return fileConfig.proxy.port;
  }
  
  return 8005; // Por defecto
}

/**
 * Obtiene la configuración del Oracle API desde argumentos CLI, archivo config, o valores por defecto
 */
function getOracleConfig(fileConfig: Partial<ConfigFile>) {
  const args = process.argv;
  
  // Buscar argumentos CLI
  const hostIndex = args.findIndex(arg => arg === '--oracle-host');
  const oraclePortIndex = args.findIndex(arg => arg === '--oracle-port');
  
  let host = fileConfig.oracle?.host || '10.6.46.114';
  let oraclePort = fileConfig.oracle?.port || 8087;
  
  // Argumentos CLI tienen prioridad
  if (hostIndex !== -1 && hostIndex + 1 < args.length) {
    const hostArg = args[hostIndex + 1];
    if (hostArg) {
      host = hostArg;
    }
  }
  
  if (oraclePortIndex !== -1 && oraclePortIndex + 1 < args.length) {
    const oraclePortArg = args[oraclePortIndex + 1];
    if (oraclePortArg) {
      const oraclePortValue = parseInt(oraclePortArg, 10);
      if (!isNaN(oraclePortValue) && oraclePortValue > 0 && oraclePortValue <= 65535) {
        oraclePort = oraclePortValue;
      } else {
        console.warn(`⚠️  Puerto Oracle inválido: ${oraclePortArg}. Usando configuración por defecto.`);
      }
    }
  }
  
  return {
    BASE_URL: `http://${host}:${oraclePort}`,
    ENDPOINT: fileConfig.oracle?.endpoints?.inserts || '/exec',
    PROCEDURE_ENDPOINT: fileConfig.oracle?.endpoints?.procedures || '/procedure',
    BEARER_TOKEN: fileConfig.oracle?.token || 'demo'
  };
}

// Cargar configuración desde archivo
const fileConfig = loadConfigFromFile();

export const CONFIG: ServerConfig = {
  PROXY_PORT: getPort(fileConfig),
  ORACLE_API: getOracleConfig(fileConfig)
};

export const DESTINATION_URL = `${CONFIG.ORACLE_API.BASE_URL}${CONFIG.ORACLE_API.ENDPOINT}`;
export const PROCEDURE_DESTINATION_URL = `${CONFIG.ORACLE_API.BASE_URL}${CONFIG.ORACLE_API.PROCEDURE_ENDPOINT}`;

// Headers CORS reutilizables
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};