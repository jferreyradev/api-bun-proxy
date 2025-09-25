// ================================
// TIPOS DE DATOS
// ================================

export interface TableData {
  tableName: string;
  [key: string]: any;
}

export interface ProcedureParameter {
  name: string;
  value: any;
  direction: "IN" | "OUT" | "IN_OUT";
}

export interface ProcedureCall {
  name: string;
  isFunction: boolean;
  params: ProcedureParameter[];
}

export interface QueryResult {
  insert: string;
  status: number;
  result: string;
}

export interface ProcedureResult {
  procedure: string;
  status: number;
  result: string;
  executionTime?: number;
}

export interface ProcessingSummary {
  total: number;
  successful: number;
  failed: number;
  details: QueryResult[];
}

export interface ProcedureProcessingSummary {
  total: number;
  successful: number;
  failed: number;
  details: ProcedureResult[];
}

export interface ServerConfig {
  PROXY_PORT: number;
  ORACLE_API: {
    BASE_URL: string;
    ENDPOINT: string;
    PROCEDURE_ENDPOINT: string;
    BEARER_TOKEN: string;
  };
}