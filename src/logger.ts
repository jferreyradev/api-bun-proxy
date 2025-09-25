import { writeFile, existsSync, mkdirSync } from "fs";
import { join } from "path";

// ================================
// SISTEMA DE LOGGING
// ================================

export class Logger {
  private logFile: string;
  private logDir: string;

  constructor(baseDir: string = "./logs") {
    this.logDir = baseDir;
    
    // Crear directorio de logs si no existe
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // Crear nombre de archivo con timestamp
    const now = new Date();
    const isoString = now.toISOString();
    const datePart = isoString.split('T')[0];
    const timePart = isoString.split('T')[1]?.replace(/:/g, '-').split('.')[0] || '00-00-00';
    const timestamp = `${datePart}_${timePart}`;
    
    this.logFile = join(this.logDir, `server-${timestamp}.log`);
    
    // Escribir header inicial
    this.writeToFile(`
===============================================
🚀 SERVIDOR PROXY INICIADO
===============================================
Fecha: ${now.toLocaleString('es-ES')}
Archivo de log: ${this.logFile}
===============================================

`);
  }

  private writeToFile(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    // Escribir a archivo de forma asíncrona
    writeFile(this.logFile, logEntry, { flag: 'a' }, (err) => {
      if (err) {
        console.error('❌ Error escribiendo log:', err);
      }
    });
  }

  private formatMessage(level: string, ...messages: any[]): string {
    const formattedMessages = messages.map(msg => 
      typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)
    ).join(' ');
    
    return `${level} ${formattedMessages}\n`;
  }

  // Métodos de logging que escriben tanto a consola como archivo
  info(...messages: any[]) {
    const formatted = this.formatMessage('ℹ️  INFO:', ...messages);
    console.log(...messages);
    this.writeToFile(formatted);
  }

  success(...messages: any[]) {
    const formatted = this.formatMessage('✅ SUCCESS:', ...messages);
    console.log(...messages);
    this.writeToFile(formatted);
  }

  error(...messages: any[]) {
    const formatted = this.formatMessage('❌ ERROR:', ...messages);
    console.error(...messages);
    this.writeToFile(formatted);
  }

  warn(...messages: any[]) {
    const formatted = this.formatMessage('⚠️  WARN:', ...messages);
    console.warn(...messages);
    this.writeToFile(formatted);
  }

  request(method: string, path: string, additional?: any) {
    const timestamp = new Date().toISOString();
    const message = `📨 REQUEST: ${method} ${path}`;
    const fullMessage = additional ? `${message} | ${JSON.stringify(additional)}` : message;
    
    console.log(`${timestamp} - ${method} ${path}`);
    this.writeToFile(this.formatMessage('📨 REQUEST:', fullMessage));
  }

  response(status: number, message: string, additional?: any) {
    const fullMessage = additional ? `${message} | ${JSON.stringify(additional)}` : message;
    const formatted = this.formatMessage(`📤 RESPONSE (${status}):`, fullMessage);
    
    console.log(`📤 Response ${status}: ${message}`);
    this.writeToFile(formatted);
  }

  sql(query: string, index?: number, total?: number) {
    const prefix = index !== undefined && total !== undefined 
      ? `SQL ${index + 1}/${total}:` 
      : 'SQL:';
    
    const message = `📝 ${prefix} ${query}`;
    console.log(message);
    this.writeToFile(this.formatMessage('📝 SQL:', query));
  }

  api(url: string, method: string, body?: any, response?: any) {
    const message = `🌐 API CALL: ${method} ${url}`;
    console.log(message);
    
    let logEntry = this.formatMessage('🌐 API:', `${method} ${url}`);
    
    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      logEntry += this.formatMessage('📤 BODY:', bodyStr);
      console.log('📤 Body:', bodyStr);
    }
    
    if (response) {
      logEntry += this.formatMessage('📥 RESPONSE:', JSON.stringify(response));
      console.log('📥 Response:', response);
    }
    
    this.writeToFile(logEntry);
  }

  section(title: string) {
    const separator = '='.repeat(50);
    const message = `${separator}\n${title}\n${separator}`;
    
    console.log(message);
    this.writeToFile(`${message}\n`);
  }

  // Método para obtener la ruta del archivo de log actual
  getLogFile(): string {
    return this.logFile;
  }

  // Método para cerrar el archivo de log con resumen
  close() {
    const summary = `
===============================================
🛑 SERVIDOR PROXY DETENIDO
===============================================
Fecha: ${new Date().toLocaleString('es-ES')}
Log guardado en: ${this.logFile}
===============================================

`;
    this.writeToFile(summary);
    console.log('📄 Log guardado en:', this.logFile);
  }
}

// Instancia singleton del logger
let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

export function createNewLogger(baseDir?: string): Logger {
  loggerInstance = new Logger(baseDir);
  return loggerInstance;
}