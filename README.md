# API GAN PROXY

Servidor proxy Oracle ↔ REST API

## ¿QUÉ ES Y PARA QUÉ SIRVE?

**API GAN PROXY** es un servidor proxy que actúa como puente de comunicación entre aplicaciones cliente y una API Oracle, proporcionando una interfaz REST simplificada para operaciones de base de datos.

### 🎯 **Propósito Principal**
- **Conversión de datos**: Transforma datos JSON en consultas SQL INSERT optimizadas para Oracle
- **Ejecución de procedimientos**: Permite ejecutar procedimientos almacenados de Oracle de forma remota
- **Proxy transparente**: Actúa como intermediario seguro entre el cliente y el servidor Oracle

### 🔧 **Casos de Uso**
- **Migración de datos**: Envío masivo de registros JSON que se convierten automáticamente en INSERTs
- **Integración de sistemas**: Conectar aplicaciones web/mobile con bases de datos Oracle legacy
- **Ejecución remota**: Llamar procedimientos almacenados Oracle desde aplicaciones externas
- **API unificada**: Centralizar el acceso a múltiples operaciones Oracle bajo una sola interfaz REST

### ⚡ **Características**
- **Alto rendimiento**: Construido con Bun para máxima velocidad
- **Logging detallado**: Trazabilidad completa de todas las operaciones
- **Ejecutable standalone**: No requiere instalación de Node.js en producción
- **Configuración flexible**: Parámetros personalizables por línea de comandos
- **CORS habilitado**: Listo para aplicaciones web frontend

## USO

```bash
.\dist\api-gan-proxy-standalone.exe --port 3000 --oracle-host 192.168.1.100
```

**Parámetros disponibles:**
- `--port <number>` - Puerto del servidor proxy
- `--oracle-host <ip>` - IP del servidor Oracle
- `--oracle-port <number>` - Puerto del servidor Oracle (opcional, default: 3011)
- `--token <string>` - Token de autenticación (opcional, default: demo)
- `--help` - Mostrar ayuda

## ENDPOINTS

- `POST http://localhost:3000/api/oracle/convert` - JSON → SQL INSERT
- `POST http://localhost:3000/api/oracle/procedure` - Ejecutar procedimientos

## EJEMPLOS

```bash
# Servidor en puerto 8080 conectando a Oracle en 192.168.1.50:1521
.\dist\api-gan-proxy-standalone.exe --port 8080 --oracle-host 192.168.1.50 --oracle-port 1521

# Uso básico con puerto Oracle por defecto
.\dist\api-gan-proxy-standalone.exe --port 3000 --oracle-host 192.168.1.100

# Con token personalizado
.\dist\api-gan-proxy-standalone.exe --port 3000 --oracle-host 192.168.1.100 --token mi-token-secreto

# Configuración completa
.\dist\api-gan-proxy-standalone.exe --port 8080 --oracle-host 10.6.46.114 --oracle-port 8087 --token production-key
```

## DESARROLLO

```bash
# Instalar dependencias
bun install

# Ejecutar en desarrollo
bun run start

# Compilar ejecutable
bun run build:standalone
```

### Para Desarrolladores

📘 **[GUIA-DESARROLLADOR.md](GUIA-DESARROLLADOR.md)** - Guía completa para agregar nuevos endpoints
