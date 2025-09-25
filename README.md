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
