# API GAN PROXY

Servidor proxy Oracle ↔ REST API

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
