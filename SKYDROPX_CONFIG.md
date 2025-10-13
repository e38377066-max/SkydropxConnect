# Configuración de Skydropx PRO API

## 📋 Estado Actual: ✅ TOTALMENTE FUNCIONAL

### ✅ Autenticación OAuth
- **Endpoint OAuth**: `https://pro.skydropx.com/api/v1/oauth/token`
- **Método**: POST con JSON body
- **Credenciales**: Configuradas correctamente en Secrets
- **Bearer Token**: Generado exitosamente (expira en 2 horas)
- **Auto-refresh**: Implementado (renueva 5 minutos antes de expirar)

### ✅ Endpoint de Cotizaciones  
- **URL**: `https://pro.skydropx.com/api/v1/quotations`
- **Método**: POST
- **Autenticación**: Bearer token OAuth
- **Estado**: ✅ Funcionando correctamente
- **Resultado**: 10 cotizaciones válidas por solicitud

## 📦 Formato de Request (Skydropx PRO)

```json
{
  "quotation": {
    "address_from": {
      "country_code": "MX",
      "postal_code": "14370",
      "area_level1": "Estado",
      "area_level2": "Ciudad", 
      "area_level3": "Colonia"
    },
    "address_to": {
      "country_code": "MX",
      "postal_code": "30640",
      "area_level1": "Estado",
      "area_level2": "Ciudad",
      "area_level3": "Colonia"
    },
    "parcels": [{
      "length": 26,
      "width": 21,
      "height": 10,
      "weight": 5
    }]
  }
}
```

## 🚚 Paqueterías Disponibles

Actualmente retornando cotizaciones de:
- **DHL** (Express, Standard)
- **FedEx** (Express Saver)
- **Estafeta** (Terrestre, Servicio Express)
- **UPS** (Express)
- **Paquetexpress** (Nacional)
- **J&T Express** (Standard)
- **Imile** (Express)
- **ampm** (Standard)

## 💰 Sistema de Margen de Ganancia

- ✅ Margen configurable aplicado a todas las cotizaciones
- ✅ Default: 15% (ajustable desde panel de admin)
- ✅ Precios mostrados incluyen margen automáticamente

## 📊 Ejemplo de Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    "quoteId": "90584ba5-3f39-436d-b32f-f34d2869409a",
    "rates": [
      {
        "id": "dadc2554-b58d-4dfb-ad4f-23dc7a759845",
        "provider": "Imile",
        "service_level_name": "Express",
        "total_pricing": 155.135,
        "currency": "MXN",
        "days": 2,
        "available_for_pickup": true,
        "total_pricing_display": 155.14
      },
      // ... 9 cotizaciones más
    ]
  }
}
```

## 🛠️ Implementación Técnica

### OAuth Flow

1. **Generar Token**:
   ```http
   POST https://pro.skydropx.com/api/v1/oauth/token
   Content-Type: application/json
   
   {
     "grant_type": "client_credentials",
     "client_id": "SKYDROPX_API_KEY",
     "client_secret": "SKYDROPX_API_SECRET",
     "scope": "default orders.create"
   }
   ```

2. **Respuesta**:
   ```json
   {
     "access_token": "...",
     "token_type": "Bearer",
     "expires_in": 7200
   }
   ```

3. **Usar Token en Requests**:
   ```http
   POST https://pro.skydropx.com/api/v1/quotations
   Authorization: Bearer {access_token}
   Content-Type: application/json
   ```

### Archivos Clave

- **`server/skydropx.ts`**: Servicio principal con OAuth y manejo de cotizaciones
- **`server/routes.ts`**: Endpoints API (línea 539+)
- **Environment Secrets**: `SKYDROPX_API_KEY`, `SKYDROPX_API_SECRET`

## 📝 Logging y Debugging

El sistema genera logs detallados para monitoreo:

```
🔄 Generating new Skydropx Bearer token...
📡 Request details: { endpoint, method, clientId }
📥 Response status: 200
✅ Bearer token generated successfully (expires in 120 minutes)
📤 Sending request to Skydropx /quotations
✅ Found 10 valid quotes out of 26 total
```

## ✅ Checklist de Funcionalidad

- [x] OAuth authentication working
- [x] Bearer token generation
- [x] Auto-refresh token system
- [x] Quotations endpoint functional
- [x] Response parsing and mapping
- [x] Profit margin system
- [x] Error handling
- [x] Logging system
- [x] 10+ carriers integrated

## 🎯 Próximos Pasos

1. Mejorar búsqueda de información de códigos postales (área_level1-3)
2. Implementar creación de envíos (shipments)
3. Implementar rastreo de paquetes (tracking)
4. Agregar validación de direcciones completas
