# 📘 GUÍA DEL DESARROLLADOR - API GAN PROXY

## 🎯 Cómo Agregar Nuevos Endpoints

Esta guía te mostrará paso a paso cómo agregar nuevos endpoints al API GAN PROXY.

---

## 📁 **ARQUITECTURA DEL PROYECTO**

```
📁 src/
├── api.ts      # 🌐 Cliente HTTP para Oracle
├── config.ts   # ⚙️  Sistema de configuración
├── logger.ts   # 📝 Sistema de logging
├── oracle.ts   # 🔄 Transformadores SQL
├── types.ts    # 📋 Definiciones TypeScript
└── utils.ts    # 🛠️  Utilidades generales

📄 main-modular.ts  # 🚀 Servidor principal con endpoints
```

---

## 🛠️ **PASOS PARA AGREGAR UN NUEVO ENDPOINT**

### **Paso 1: Definir Tipos (src/types.ts)**

```typescript
// Agregar nuevos tipos para tu endpoint
export interface MiNuevoRequest {
  campo1: string;
  campo2: number;
  datos: any[];
}

export interface MiNuevaRespuesta {
  success: boolean;
  resultado: string;
  timestamp: string;
}
```

### **Paso 2: Crear Función de Procesamiento (src/oracle.ts)**

```typescript
// Agregar función para procesar tu lógica específica
export function procesarMiNuevoEndpoint(data: MiNuevoRequest): string {
  // Tu lógica personalizada aquí
  const sqlQuery = `SELECT * FROM tabla WHERE campo = '${data.campo1}'`;
  
  // Sanitizar y validar datos
  // Transformar según necesidades
  
  return sqlQuery;
}
```

### **Paso 3: Agregar Cliente API si necesario (src/api.ts)**

```typescript
// Si necesitas un nuevo tipo de comunicación con Oracle
export async function enviarMiNuevaOperacion(
  data: any, 
  config: OracleConfig
): Promise<any> {
  const url = `${config.BASE_URL}/mi-nuevo-endpoint`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.TOKEN}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
```

### **Paso 4: Implementar Endpoint (main-modular.ts)**

```typescript
// Importar nuevas funciones
import { procesarMiNuevoEndpoint } from './src/oracle';
import { enviarMiNuevaOperacion } from './src/api';
import type { MiNuevoRequest, MiNuevaRespuesta } from './src/types';

// Agregar nuevo endpoint en el servidor
server = Bun.serve({
  port: CONFIG.PROXY_PORT,
  
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // ... endpoints existentes ...

    // ✨ NUEVO ENDPOINT
    if (path === '/api/oracle/mi-nuevo-endpoint' && req.method === 'POST') {
      try {
        // 1. Parsear request
        const body = await req.json() as MiNuevoRequest;
        
        // 2. Validar datos
        if (!body.campo1 || typeof body.campo2 !== 'number') {
          logger.error('Datos inválidos para mi-nuevo-endpoint:', body);
          return new Response(JSON.stringify({
            error: 'Datos requeridos faltantes: campo1, campo2'
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // 3. Procesar lógica
        const sqlQuery = procesarMiNuevoEndpoint(body);
        logger.info(`Query generado: ${sqlQuery}`);

        // 4. Enviar a Oracle
        const resultado = await enviarMiNuevaOperacion(sqlQuery, CONFIG.ORACLE_API);

        // 5. Preparar respuesta
        const respuesta: MiNuevaRespuesta = {
          success: true,
          resultado: resultado,
          timestamp: new Date().toISOString()
        };

        // 6. Log y retornar
        logger.info('Mi nuevo endpoint ejecutado exitosamente');
        return new Response(JSON.stringify(respuesta), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        logger.error('Error en mi-nuevo-endpoint:', error);
        return new Response(JSON.stringify({
          error: 'Error interno del servidor',
          details: error instanceof Error ? error.message : 'Error desconocido'
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ... resto del código ...
  }
});
```

---

## 🧪 **TESTING Y VALIDACIÓN**

### **1. Recompilar Ejecutable**
```bash
bun run build:standalone
```

### **2. Probar Endpoint**
```bash
# Iniciar servidor
.\dist\api-gan-proxy-standalone.exe --port 3000 --oracle-host tu-oracle.com

# Probar con curl o Postman
curl -X POST http://localhost:3000/api/oracle/mi-nuevo-endpoint \
  -H "Content-Type: application/json" \
  -d '{
    "campo1": "test",
    "campo2": 123,
    "datos": ["item1", "item2"]
  }'
```

### **3. Verificar Logs**
Los logs se guardan en `logs/server-[fecha].log` para debugging.

---

## 📝 **EJEMPLOS COMUNES**

### **Endpoint de Consulta**
```typescript
// Para hacer SELECT a Oracle
if (path === '/api/oracle/consultar' && req.method === 'POST') {
  const { tabla, condiciones } = await req.json();
  const query = `SELECT * FROM ${tabla} WHERE ${condiciones}`;
  const resultado = await enviarConsulta(query, CONFIG.ORACLE_API);
  return new Response(JSON.stringify(resultado));
}
```

### **Endpoint de Actualización**
```typescript
// Para hacer UPDATE a Oracle
if (path === '/api/oracle/actualizar' && req.method === 'PUT') {
  const { tabla, datos, where } = await req.json();
  const query = `UPDATE ${tabla} SET ${datos} WHERE ${where}`;
  const resultado = await enviarActualizacion(query, CONFIG.ORACLE_API);
  return new Response(JSON.stringify({ success: true, rows: resultado }));
}
```

### **Endpoint de Eliminación**
```typescript
// Para hacer DELETE a Oracle
if (path === '/api/oracle/eliminar' && req.method === 'DELETE') {
  const { tabla, id } = await req.json();
  const query = `DELETE FROM ${tabla} WHERE id = ${id}`;
  const resultado = await enviarEliminacion(query, CONFIG.ORACLE_API);
  return new Response(JSON.stringify({ deleted: true }));
}
```

---

## ⚠️ **MEJORES PRÁCTICAS**

### **Seguridad**
- ✅ Siempre validar y sanitizar entradas
- ✅ Usar parámetros preparados cuando sea posible
- ✅ Nunca concatenar strings directamente en SQL
- ✅ Logear errores pero no exponer detalles internos

### **Performance**
- ✅ Usar async/await apropiadamente
- ✅ Implementar timeouts para requests
- ✅ Cachear respuestas cuando sea apropiado
- ✅ Limitar tamaño de payloads

### **Logging**
- ✅ Logear todas las operaciones importantes
- ✅ Incluir timestamps y contexto
- ✅ Usar niveles apropiados (info, error, debug)
- ✅ No logear datos sensibles

### **Manejo de Errores**
```typescript
try {
  // Lógica del endpoint
} catch (error) {
  logger.error('Error en endpoint:', error);
  
  if (error instanceof ValidationError) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }
  
  return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
}
```

---

## 🔄 **FLUJO COMPLETO DE DESARROLLO**

1. **Planificar** → Definir qué hará el endpoint
2. **Tipos** → Crear interfaces en `types.ts`  
3. **Lógica** → Implementar transformaciones en archivos apropiados
4. **Endpoint** → Agregar ruta en `main-modular.ts`
5. **Compilar** → `bun run build:standalone`
6. **Probar** → Usar curl/Postman
7. **Validar** → Revisar logs y respuestas
8. **Documentar** → Actualizar README con nuevo endpoint

---

## 📚 **RECURSOS ÚTILES**

- **Bun Docs**: https://bun.sh/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Oracle REST**: Documentación de tu API Oracle específica

---

**¡Con esta guía puedes agregar tantos endpoints como necesites manteniendo la arquitectura limpia y escalable!** 🚀