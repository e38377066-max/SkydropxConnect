# Configuración de Skydropx API - OAuth

## 📋 Resumen de Configuración Actual

### URLs y Endpoints
- **URL Base**: `https://app.skydropx.com/v1`
- **Endpoint OAuth**: `https://pro.skydropx.com/api/v1/oauth/token` ✅ (Corregido)
- **Endpoint Cotizaciones**: `https://app.skydropx.com/v1/quotations`
- **Endpoint Envíos**: `https://app.skydropx.com/v1/shipments`
- **Endpoint Rastreo**: `https://app.skydropx.com/v1/trackings/{tracking_number}`

### Credenciales Configuradas
- **Client ID**: Almacenado en `SKYDROPX_API_KEY`
- **Client Secret**: Almacenado en `SKYDROPX_API_SECRET`

### Implementación OAuth (según documentación)

#### Request OAuth Token
```http
POST https://pro.skydropx.com/api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={SKYDROPX_API_KEY}
&client_secret={SKYDROPX_API_SECRET}
&scope=default orders.create
```

**Nota**: Se removió `redirect_uri` del request (causaba problemas)

#### Respuesta Esperada
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 7200
}
```

### Implementación en el Código

#### Archivo: `server/skydropx.ts`

1. **Autenticación OAuth** (líneas 100-166):
   - Genera token Bearer usando client_credentials
   - Auto-refresca 5 minutos antes de expirar
   - Guarda token en memoria durante 2 horas

2. **Headers de Autenticación**:
   ```typescript
   headers: {
     "Content-Type": "application/json",
     "Authorization": `Bearer ${token}`
   }
   ```

3. **Endpoints Implementados**:
   - ✅ `/quotations` - Obtener cotizaciones
   - ✅ `/shipments` - Crear envíos
   - ✅ `/trackings/{tracking_number}` - Rastrear paquetes

### 🟡 Problema Actual (Actualizado)

**Error 401 - invalid_client** en el endpoint OAuth:
```
POST https://pro.skydropx.com/api/v1/oauth/token
Response: 401 Unauthorized
{
  "error": "invalid_client",
  "error_description": "La autenticación del cliente ha fallado por cliente desconocido, cliente no autenticado, o método de autenticación incompatible."
}
```

**Progreso**: ✅ Endpoint correcto encontrado (`pro.skydropx.com`), ahora solo falta resolver la autenticación.

### ✅ Lo que Funciona

1. **Estructura de Autenticación OAuth**: Correctamente implementada según documentación
2. **Parámetros OAuth**: Todos los requeridos están presentes
3. **Auto-refresh de Token**: Implementado con margen de 5 minutos
4. **Modo MOCK**: Funciona correctamente cuando no hay credenciales
5. **Logging Detallado**: Para debugging del OAuth

### ❓ Preguntas para Soporte Skydropx

1. **✅ Endpoint OAuth confirmado**
   - Correcto: `https://pro.skydropx.com/api/v1/oauth/token`
   - Estado: Responde correctamente pero con error 401

2. **❌ Error de autenticación: "invalid_client"**
   - Las credenciales (Client ID y Secret) están configuradas
   - Error: "cliente desconocido, cliente no autenticado, o método de autenticación incompatible"
   - ¿Las credenciales son correctas?
   - ¿Están activadas para OAuth?

3. **¿Los parámetros OAuth son correctos?**
   - `grant_type=client_credentials`
   - `client_id={SKYDROPX_API_KEY}`
   - `client_secret={SKYDROPX_API_SECRET}`
   - `scope=default orders.create`
   - ¿Falta algún parámetro?

4. **¿Hay configuración adicional necesaria?**
   - ¿Activación de OAuth en el panel de Skydropx?
   - ¿Whitelist de IPs o dominios?
   - ¿Entorno correcto (sandbox vs producción)?

### 🛠️ Archivos Relevantes

- **`server/skydropx.ts`**: Servicio principal de Skydropx con OAuth
- **`.env`**: Variables `SKYDROPX_API_KEY` y `SKYDROPX_API_SECRET`
- **`server/routes.ts`**: Endpoints que usan el servicio (líneas 539-862)

### 📝 Logging Actual

El sistema genera logs detallados:
```
🔄 Generating new Skydropx Bearer token...
📡 Request details: { 
  endpoint: 'https://pro.skydropx.com/api/v1/oauth/token',
  method: 'POST',
  clientId: 'by_vHwMhLf...' 
}
📥 Response status: 401
📥 Response headers: {
  'www-authenticate': 'Bearer realm="Doorkeeper", error="invalid_client"...',
  'content-type': 'application/json; charset=utf-8',
  ...
}
❌ Failed to generate token: 401
❌ Response body: {
  "error": "invalid_client",
  "error_description": "La autenticación del cliente ha fallado..."
}
```

### 🔧 Ajustes Necesarios (pendientes de soporte)

Una vez que soporte confirme la configuración correcta, posiblemente será necesario:

1. ✅ **Endpoint OAuth**: Ya corregido a `https://pro.skydropx.com/api/v1/oauth/token`
2. ❓ **Verificar credenciales**: Confirmar que Client ID y Secret tienen permisos OAuth
3. ❓ **Activación OAuth**: Posiblemente se necesite activar OAuth en el panel de Skydropx
4. ❓ **Parámetros adicionales**: Confirmar si faltan parámetros en el request

**La estructura está lista** - Solo falta resolver el error de autenticación "invalid_client".

---

## 📊 Resumen Ejecutivo

### Estado Actual: 🟡 En Progreso

**✅ Completado:**
- Endpoint OAuth correcto identificado: `https://pro.skydropx.com/api/v1/oauth/token`
- Estructura OAuth implementada con auto-refresh
- Parámetros correctos según documentación
- Logging detallado para debugging
- Modo MOCK funcional como fallback

**❌ Bloqueador:**
- Error 401 "invalid_client" al autenticar
- Posibles causas: credenciales incorrectas, OAuth no activado, o parámetros faltantes

**🎯 Próximo Paso:**
- Reunión con soporte Skydropx para resolver autenticación
- Una vez resuelto, la plataforma estará 100% funcional
