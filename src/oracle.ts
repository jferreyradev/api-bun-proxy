import type { TableData } from './types';

// ================================
// FUNCIONES DE SQL ORACLE
// ================================

/**
 * Formatea un valor para usar en una consulta SQL Oracle
 */
export function formatOracleValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'string') {
    // Detectar fechas en formato DD-MM-YYYY
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (datePattern.test(value)) {
      return `TO_DATE('${value}', 'DD-MM-YYYY')`;
    }
    
    // Para strings normales, escapar comillas simples
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  return String(value);
}

/**
 * Genera una consulta INSERT SQL para Oracle
 */
export function generateOracleInsert(data: TableData): string {
  const { tableName, ...fields } = data;
  
  if (!tableName) {
    throw new Error('tableName es requerido');
  }
  
  const columns = Object.keys(fields);
  const values = Object.values(fields);
  
  if (columns.length === 0) {
    throw new Error('Se requiere al menos un campo además de tableName');
  }
  
  const columnsStr = columns.join(', ');
  const valuesStr = values.map(formatOracleValue).join(', ');
  
  return `INSERT INTO GANANCIAS.${tableName} (${columnsStr}) VALUES (${valuesStr})`;
}

/**
 * Genera múltiples consultas INSERT SQL para Oracle
 */
export function generateOracleInserts(dataArray: TableData[]): string[] {
  return dataArray.map(generateOracleInsert);
}