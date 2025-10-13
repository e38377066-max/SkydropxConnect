# Configuración de Skydropx API - OAuth

## 📋 Resumen de Configuración Actual

### URLs y Endpoints
- **URL Base**: `https://app.skydropx.com/v1`
- **Endpoint OAuth**: `https://app.skydropx.com/api/v1/oauth/token`
- **Endpoint Cotizaciones**: `https://app.skydropx.com/v1/quotations`
- **Endpoint Envíos**: `https://app.skydropx.com/v1/shipments`
- **Endpoint Rastreo**: `https://app.skydropx.com/v1/trackings/{tracking_number}`

### Credenciales Configuradas
- **Client ID**: Almacenado en `SKYDROPX_API_KEY`
- **Client Secret**: Almacenado en `SKYDROPX_API_SECRET`

### Implementación OAuth (según documentación)

#### Request OAuth Token
```http
POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={SKYDROPX_API_KEY}
&client_secret={SKYDROPX_API_SECRET}
&redirect_uri=urn:ietf:wg:oauth:2.0:oob
&scope=default orders.create
```

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

### 🔴 Problema Actual

**Error 404** en el endpoint OAuth:
```
POST https://app.skydropx.com/api/v1/oauth/token
Response: 404 Not Found (HTML page)
```

### ✅ Lo que Funciona

1. **Estructura de Autenticación OAuth**: Correctamente implementada según documentación
2. **Parámetros OAuth**: Todos los requeridos están presentes
3. **Auto-refresh de Token**: Implementado con margen de 5 minutos
4. **Modo MOCK**: Funciona correctamente cuando no hay credenciales
5. **Logging Detallado**: Para debugging del OAuth

### ❓ Preguntas para Soporte Skydropx

1. **¿La URL base es correcta?**
   - Actualmente: `https://app.skydropx.com`
   - ¿Debería ser otra? (api.skydropx.com, etc.)

2. **¿El endpoint OAuth es correcto?**
   - Actualmente: `https://app.skydropx.com/api/v1/oauth/token`
   - Recibiendo: Error 404

3. **¿Las credenciales tienen los permisos correctos?**
   - Client ID y Secret configurados
   - Scope: `default orders.create`

4. **¿Hay algún paso adicional de configuración?**
   - ¿Whitelist de IPs?
   - ¿Activación de OAuth en la cuenta?
   - ¿Entorno sandbox vs producción?

### 🛠️ Archivos Relevantes

- **`server/skydropx.ts`**: Servicio principal de Skydropx con OAuth
- **`.env`**: Variables `SKYDROPX_API_KEY` y `SKYDROPX_API_SECRET`
- **`server/routes.ts`**: Endpoints que usan el servicio (líneas 539-862)

### 📝 Logging Actual

El sistema genera logs detallados:
```
🔄 Generating new Skydropx Bearer token...
📡 Request details: { endpoint, method, clientId }
📥 Response status: 404
📥 Response headers: {...}
❌ Failed to generate token: 404
❌ Response body: <!DOCTYPE html>...
```

### 🔧 Ajustes Necesarios (pendientes de soporte)

Una vez que soporte confirme la configuración correcta, solo será necesario:

1. ✅ Actualizar URL base (si es diferente)
2. ✅ Actualizar endpoint OAuth (si es diferente)
3. ✅ Verificar credenciales tienen permisos OAuth
4. ✅ Confirmar scope correcto

**La estructura está lista** - Solo faltan los detalles específicos de configuración de Skydropx.
