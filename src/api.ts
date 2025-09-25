import type { QueryResult, ProcessingSummary } from './types';
import { CONFIG, DESTINATION_URL } from './config';
import { getLogger } from './logger';

// ================================
// FUNCIONES DE API
// ================================

/**
 * Ejecuta una consulta individual en la API Oracle
 */
export async function executeQuery(query: string, index: number, total: number): Promise<QueryResult> {
  const logger = getLogger();
  logger.sql(query, index, total);

  try {
    const bodyToSend = { query }; // Formato esperado por la API
    const bodyJson = JSON.stringify(bodyToSend);
    
    logger.api(DESTINATION_URL, 'POST', bodyToSend);

    const response = await fetch(DESTINATION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.ORACLE_API.BEARER_TOKEN}`
      },
      body: bodyJson,
    });

    const result = await response.text();
    
    logger.response(response.status, `INSERT ${index + 1} completado`, { 
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      result: result.substring(0, 200) + (result.length > 200 ? '...' : '')
    });

    return {
      insert: query,
      status: response.status,
      result: result
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error en INSERT ${index + 1}: ${errorMsg}`);
    
    return {
      insert: query,
      status: 500,
      result: errorMsg
    };
  }
}

/**
 * Procesa todos los INSERTs secuencialmente
 */
export async function processInserts(inserts: string[]): Promise<ProcessingSummary> {
  const logger = getLogger();
  logger.section(`PROCESANDO ${inserts.length} INSERTS`);
  
  // Mostrar INSERTs generados
  inserts.forEach((insert, index) => {
    logger.sql(insert, index, inserts.length);
  });

  const results: QueryResult[] = [];
  
  // Procesar cada INSERT secuencialmente
  for (let i = 0; i < inserts.length; i++) {
    const insert = inserts[i];
    if (insert) {
      const result = await executeQuery(insert, i, inserts.length);
      results.push(result);
    }
  }

  // Calcular estadísticas
  const successful = results.filter(r => r.status >= 200 && r.status < 300).length;
  const failed = results.length - successful;

  logger.success(`Procesamiento completado: ${successful} exitosos, ${failed} fallidos`);

  return {
    total: inserts.length,
    successful,
    failed,
    details: results
  };
}