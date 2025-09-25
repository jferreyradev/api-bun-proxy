import type { TableData, ProcedureCall } from './types';
import { corsHeaders } from './config';

// ================================
// FUNCIONES DE VALIDACIÓN
// ================================

/**
 * Valida que el input sea un array válido de TableData
 */
export function validateInput(input: unknown): { isValid: boolean; error?: string; data?: TableData[] } {
  // Validar que sea un array
  if (!Array.isArray(input)) {
    return {
      isValid: false,
      error: "Se esperaba un array de objetos"
    };
  }

  // Validar estructura de cada elemento
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (!item || typeof item !== 'object' || !item.tableName) {
      return {
        isValid: false,
        error: `Elemento ${i + 1} debe ser un objeto con 'tableName'`
      };
    }
  }

  return {
    isValid: true,
    data: input as TableData[]
  };
}

/**
 * Valida que el input sea un array válido de ProcedureCall
 */
export function validateProcedureInput(input: unknown): { isValid: boolean; error?: string; data?: ProcedureCall[] } {
  // Si es un objeto individual, convertirlo en array
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    input = [input];
  }

  // Validar que sea un array
  if (!Array.isArray(input)) {
    return {
      isValid: false,
      error: "Se esperaba un array de objetos o un objeto individual"
    };
  }

  // Validar estructura de cada elemento
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (!item || typeof item !== 'object') {
      return {
        isValid: false,
        error: `Elemento ${i + 1} debe ser un objeto`
      };
    }
    
    // Validar campos requeridos
    if (!item.name || typeof item.name !== 'string') {
      return {
        isValid: false,
        error: `Elemento ${i + 1} debe tener 'name' (string)`
      };
    }
    
    if (typeof item.isFunction !== 'boolean') {
      return {
        isValid: false,
        error: `Elemento ${i + 1} debe tener 'isFunction' (boolean)`
      };
    }
    
    // Validar parámetros si están presentes
    if (item.params) {
      if (!Array.isArray(item.params)) {
        return {
          isValid: false,
          error: `Elemento ${i + 1}: 'params' debe ser un array`
        };
      }
      
      // Validar cada parámetro
      for (let j = 0; j < item.params.length; j++) {
        const param = item.params[j];
        if (!param || typeof param !== 'object') {
          return {
            isValid: false,
            error: `Elemento ${i + 1}, parámetro ${j + 1} debe ser un objeto`
          };
        }
        
        if (!param.name || typeof param.name !== 'string') {
          return {
            isValid: false,
            error: `Elemento ${i + 1}, parámetro ${j + 1} debe tener 'name' (string)`
          };
        }
        
        if (!param.direction || !['IN', 'OUT', 'IN_OUT'].includes(param.direction)) {
          return {
            isValid: false,
            error: `Elemento ${i + 1}, parámetro ${j + 1} debe tener 'direction' (IN, OUT, o IN_OUT)`
          };
        }
        
        // 'value' es opcional para parámetros OUT, pero requerido para IN e IN_OUT
        if ((param.direction === 'IN' || param.direction === 'IN_OUT') && param.value === undefined) {
          return {
            isValid: false,
            error: `Elemento ${i + 1}, parámetro ${j + 1} con direction '${param.direction}' debe tener 'value'`
          };
        }
      }
    }
  }

  return {
    isValid: true,
    data: input as ProcedureCall[]
  };
}

/**
 * Parsea JSON de forma segura
 */
export function parseJsonSafely(bodyText: string): { success: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(bodyText);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error parseando JSON' 
    };
  }
}

// ================================
// FUNCIONES DE RESPUESTA
// ================================

/**
 * Crea una respuesta de error JSON
 */
export function createErrorResponse(error: string, message: string, additionalData?: any): Response {
  const body = {
    error,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/**
 * Crea una respuesta de health check
 */
export function createHealthResponse(logFile?: string): Response {
  const healthData = {
    status: "OK",
    message: "Servidor proxy funcionando correctamente",
    timestamp: new Date().toISOString(),
    server_info: {
      version: "1.0.0",
      uptime: process.uptime(),
      log_file: logFile || "Log no disponible"
    },
    endpoints: [
      "GET /health, /ping - Verificar estado del servidor",
      "POST /api/oracle/convert - Convertir datos JSON a SQL Oracle (INSERTs)",
      "POST /api/oracle/procedure - Ejecutar procedimientos almacenados Oracle"
    ]
  };
  
  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/**
 * Crea respuesta de éxito
 */
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}