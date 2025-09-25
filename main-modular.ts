import { serve } from "bun";
import { CONFIG, corsHeaders, PROCEDURE_DESTINATION_URL } from './src/config';
import { generateOracleInserts } from './src/oracle';
import { processInserts } from './src/api';
import { 
  validateInput, 
  parseJsonSafely, 
  createErrorResponse, 
  createHealthResponse, 
  createSuccessResponse 
} from './src/utils';
import { createNewLogger } from './src/logger';

// ================================
// SERVIDOR PRINCIPAL
// ================================

// Crear logger para esta sesión
const logger = createNewLogger();

// Mostrar información inicial en consola
console.log("🚀 Iniciando servidor proxy...");
console.log(`📄 Log de esta sesión: ${logger.getLogFile()}`);

// También guardar en log
logger.info("🚀 Iniciando servidor proxy...");

const server = serve({
  port: CONFIG.PROXY_PORT,
  
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    
    logger.request(req.method, url.pathname);
    
    // Manejar CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    // Health check endpoints
    if (url.pathname === "/health" || url.pathname === "/ping") {
      logger.info("Health check solicitado");
      return createHealthResponse(logger.getLogFile());
    }
    
    // Solo procesar endpoints principales
    if (url.pathname !== "/api/oracle/convert" && url.pathname !== "/api/oracle/procedure") {
      logger.warn(`Ruta no encontrada: ${url.pathname}`);
      return new Response("Ruta no encontrada", { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Solo métodos POST
    if (req.method !== "POST") {
      logger.warn(`Método no permitido: ${req.method}`);
      return new Response("Método no permitido - Use POST", { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    try {
      // Leer el body
      const bodyText = await req.text();
      logger.info("📨 Body recibido", {
        preview: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : ''),
        length: bodyText.length
      });

      // Parsear JSON de forma segura
      const parseResult = parseJsonSafely(bodyText);
      if (!parseResult.success) {
        logger.error("Error parseando JSON:", parseResult.error);
        return createErrorResponse(
          "JSON inválido",
          "El cuerpo de la petición debe ser un JSON válido",
          {
            receivedBody: bodyText.substring(0, 200) + (bodyText.length > 200 ? "..." : ""),
            example: url.pathname === "/api/oracle/convert" ? [
              {
                "tableName": "usuarios",
                "id": 1,
                "nombre": "Juan"
              }
            ] : [
              {
                "name": "GANANCIAS.MOV.PRINCIPAL_MOVIMIENTOS",
                "isFunction": false,
                "params": [
                  {
                    "name": "vPERIODO",
                    "value": 2025,
                    "direction": "IN"
                  }
                ]
              }
            ]
          }
        );
      }

      // Manejar endpoint de procedimientos - PROXY DIRECTO
      if (url.pathname === "/api/oracle/procedure") {
        logger.info("Enviando datos directamente al endpoint de procedimientos (proxy directo)");
        
        try {
          const response = await fetch(PROCEDURE_DESTINATION_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${CONFIG.ORACLE_API.BEARER_TOKEN}`
            },
            body: bodyText, // Enviar exactamente el mismo body recibido
          });

          const responseText = await response.text();
          
          logger.api(PROCEDURE_DESTINATION_URL, 'POST', parseResult.data);
          logger.response(response.status, responseText);

          if (!response.ok) {
            logger.error(`Error del servidor Oracle: ${response.status}`);
            return new Response(responseText, {
              status: response.status,
              headers: corsHeaders
            });
          }

          logger.success("Procedimiento ejecutado exitosamente");
          return new Response(responseText, {
            status: 200,
            headers: corsHeaders
          });

        } catch (error) {
          logger.error("Error ejecutando procedimiento:", error);
          return createErrorResponse(
            "Error de conexión",
            "No se pudo conectar con el servidor Oracle"
          );
        }
      }

      // Manejar endpoint de conversión (INSERTs) - código existente
      const validation = validateInput(parseResult.data);
      if (!validation.isValid) {
        logger.error("Validación de INSERTs falló:", validation.error);
        return createErrorResponse(
          "Datos inválidos",
          validation.error || "Error de validación"
        );
      }

      // Procesar los datos
      logger.info(`Generando INSERTs para ${validation.data!.length} registros`);
      const inserts = generateOracleInserts(validation.data!);
      const summary = await processInserts(inserts);

      logger.success("Petición procesada exitosamente", {
        total: summary.total,
        successful: summary.successful,
        failed: summary.failed
      });

      return createSuccessResponse(summary);

    } catch (error) {
      logger.error("Error general:", error);
      
      return createErrorResponse(
        "Error interno",
        error instanceof Error ? error.message : "Error desconocido"
      );
    }
  },
});

// ================================
// INFORMACIÓN DE INICIO - CONSOLA Y LOG
// ================================

// Extraer host y puerto del destino para mostrar por separado
const oracleUrl = new URL(CONFIG.ORACLE_API.BASE_URL);

const startupInfo = {
  proxy: {
    host: "localhost",
    puerto: CONFIG.PROXY_PORT,
    url: `http://localhost:${CONFIG.PROXY_PORT}`
  },
  oracle: {
    host: oracleUrl.hostname,
    puerto: parseInt(oracleUrl.port),
    baseUrl: CONFIG.ORACLE_API.BASE_URL,
    endpointInserts: CONFIG.ORACLE_API.ENDPOINT,
    endpointProcedures: CONFIG.ORACLE_API.PROCEDURE_ENDPOINT,
    token: CONFIG.ORACLE_API.BEARER_TOKEN
  },
  logFile: logger.getLogFile(),
  endpoints: [
    "GET  /health - Verificar estado del servidor",
    "GET  /ping   - Verificar estado del servidor", 
    "POST /api/oracle/convert - Convertir datos JSON a SQL Oracle (INSERTs)",
    "POST /api/oracle/procedure - Ejecutar procedimientos almacenados Oracle"
  ]
};

// Mostrar en consola con formato bonito
console.log(`🚀 Servidor iniciado en http://localhost:${CONFIG.PROXY_PORT}`);
console.log(`🎯 Oracle destino: ${CONFIG.ORACLE_API.BASE_URL}`);
console.log(`📝 Log: ${logger.getLogFile()}`);
console.log(`🟢 Listo para recibir peticiones...\n`);
console.log("\n📡 CONFIGURACIÓN DEL PROXY:");
console.log(`   🌐 Host:        ${startupInfo.proxy.host}`);
console.log(`   🔌 Puerto:      ${startupInfo.proxy.puerto}`);
console.log(`   🌍 URL:         ${startupInfo.proxy.url}`);

console.log("\n🎯 CONFIGURACIÓN ORACLE DESTINO:");
console.log(`   🏠 Host:        ${startupInfo.oracle.host}`);
console.log(`   🔌 Puerto:      ${startupInfo.oracle.puerto}`);
console.log(`   📍 Base URL:    ${startupInfo.oracle.baseUrl}`);
console.log(`   📤 INSERTs:     ${startupInfo.oracle.baseUrl}${startupInfo.oracle.endpointInserts}`);
console.log(`   📋 Procedures:  ${startupInfo.oracle.baseUrl}${startupInfo.oracle.endpointProcedures}`);
console.log(`   🔐 Token:       Bearer ${startupInfo.oracle.token}`);

console.log("\n� LOGGING:");
console.log(`   📝 Archivo Log: ${startupInfo.logFile}`);

console.log("\n📡 ENDPOINTS DISPONIBLES:");
startupInfo.endpoints.forEach(endpoint => {
  console.log(`   ${endpoint}`);
});
console.log("\n🟢 Servidor listo para recibir peticiones...");
console.log("=".repeat(70) + "\n");

// Guardar información completa en log
logger.section("SERVIDOR INICIADO CORRECTAMENTE");
logger.info("Información del servidor:", startupInfo);
logger.info("🟢 Servidor listo para recibir peticiones...");

// Manejo de señales de cierre para guardar log final
process.on('SIGTERM', () => {
  logger.info('🛑 Señal SIGTERM recibida, cerrando servidor...');
  logger.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('� Señal SIGINT recibida, cerrando servidor...');
  logger.close();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('💥 Error no capturado:', error);
  logger.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Promise rechazada no manejada:', reason);
  logger.close();
  process.exit(1);
});