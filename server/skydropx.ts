interface SkydropxQuoteRequest {
  zip_from: string;
  zip_to: string;
  parcel: {
    weight: string;
    length?: string;
    width?: string;
    height?: string;
  };
}

interface SkydropxProQuotationRequest {
  quotation: {
    order_id?: string;
    address_from: {
      country_code: string;
      postal_code: string;
      area_level1: string;
      area_level2: string;
      area_level3: string;
    };
    address_to: {
      country_code: string;
      postal_code: string;
      area_level1: string;
      area_level2: string;
      area_level3: string;
    };
    parcels: Array<{
      length: number;
      width: number;
      height: number;
      weight: number;
    }>;
    requested_carriers?: string[];
  };
}

interface SkydropxZipCodeInfo {
  country_code: string;
  postal_code: string;
  area_level1: string;
  area_level2: string;
  area_level3: string;
}

interface SkydropxRate {
  id: string;
  provider: string;
  service_level_name: string;
  total_pricing: number;
  currency: string;
  days: number;
  available_for_pickup: boolean;
}

interface SkydropxShipmentRequest {
  shipment: {
    rate_id: string;
    printing_format?: string;
    address_from: {
      street1: string;
      name: string;
      company: string;
      phone: string;
      email: string;
      reference: string;
    };
    address_to: {
      street1: string;
      name: string;
      company: string;
      phone: string;
      email: string;
      reference?: string;
    };
    packages: Array<{
      package_number: string;
      package_protected: boolean;
      weight: number;
      length: number;
      width: number;
      height: number;
      weight_unit: string;
      distance_unit: string;
      declared_value: number;
      consignment_note: string;
      package_type: string;
      content: string;
      products: Array<{
        product_id?: string;
        name: string;
        description_en?: string;
        quantity: number;
        price: number;
        sku?: string;
        hs_code?: string;
        hs_code_description?: string;
        product_type_code?: string;
        product_type_name?: string;
        country_code?: string;
      }>;
    }>;
  };
}

interface SkydropxShipmentResponse {
  id: string;
  tracking_number: string;
  label_url: string;
  tracking_url_provider: string;
  rate: {
    amount_local: number;
    currency_local: string;
    provider: string;
    service_level_name: string;
  };
}

interface SkydropxTrackingEvent {
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

interface SkydropxTrackingResponse {
  tracking_number: string;
  tracking_status: string;
  tracking_history: SkydropxTrackingEvent[];
}

interface SkydropxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class SkydropxService {
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private baseUrl = "https://pro.skydropx.com/api/v1";
  private bearerToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {
    this.clientId = process.env.SKYDROPX_API_KEY;
    this.clientSecret = process.env.SKYDROPX_API_SECRET;
    
    if (!this.clientId || !this.clientSecret) {
      console.error("❌ Error: Credenciales de Skydropx no configuradas. La aplicación requiere SKYDROPX_API_KEY y SKYDROPX_API_SECRET");
      throw new Error("Credenciales de Skydropx no configuradas. Por favor configura SKYDROPX_API_KEY y SKYDROPX_API_SECRET en el archivo .env");
    }
    
    console.log("✅ Skydropx credentials configured (Client ID & Secret)");
  }

  private async getBearerToken(): Promise<string> {
    // Si el token existe y no ha expirado (con margen de 5 minutos), retornarlo
    const now = Date.now();
    if (this.bearerToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      const remainingMinutes = Math.floor((this.tokenExpiresAt - now) / 1000 / 60);
      console.log(`🔑 Using existing Bearer token (expires in ${remainingMinutes} minutes)`);
      return this.bearerToken;
    }

    // Si no tenemos credenciales, lanzar error
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Skydropx credentials not configured");
    }

    try {
      console.log("🔄 Generating new Skydropx Bearer token...");
      
      const endpoint = "https://pro.skydropx.com/api/v1/oauth/token";
      
      console.log("📡 Request details:", {
        endpoint,
        method: "POST",
        clientId: this.clientId?.substring(0, 10) + "...",
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: "default orders.create",
        }),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to generate token: ${response.status}`);
        console.error(`❌ Response body (first 500 chars):`, errorText.substring(0, 500));
        throw new Error(`Error de autenticación Skydropx: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const tokenResponse: SkydropxTokenResponse = await response.json();
      console.log("✅ Skydropx Bearer token generated successfully!");
      
      // Guardar el token y calcular cuándo expira (2 horas = 7200 segundos)
      // Restamos 5 minutos (300 segundos) para renovar antes de que expire
      this.bearerToken = tokenResponse.access_token;
      const expiresIn = tokenResponse.expires_in || 7200; // Default 2 horas
      this.tokenExpiresAt = Date.now() + ((expiresIn - 300) * 1000);
      
      const expiresInMinutes = Math.floor(expiresIn / 60);
      console.log(`✅ Bearer token generated successfully (expires in ${expiresInMinutes} minutes)`);
      
      return this.bearerToken;
    } catch (error: any) {
      console.error("❌ Error generating Skydropx Bearer token:", error);
      throw new Error(`Error de autenticación Skydropx: ${error.message}`);
    }
  }

  async getQuotes(request: SkydropxQuoteRequest): Promise<SkydropxRate[]> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Credenciales de Skydropx no configuradas");
    }
    return this.getRealQuotes(request);
  }

  async createShipment(request: SkydropxShipmentRequest): Promise<SkydropxShipmentResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Credenciales de Skydropx no configuradas");
    }
    return this.createRealShipment(request);
  }

  async trackShipment(trackingNumber: string): Promise<SkydropxTrackingResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Credenciales de Skydropx no configuradas");
    }
    return this.trackRealShipment(trackingNumber);
  }

  private async getZipCodeInfo(postalCode: string): Promise<SkydropxZipCodeInfo> {
    try {
      const token = await this.getBearerToken();
      const endpoint = `${this.baseUrl}/zip_codes/${postalCode}`;
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          country_code: data.country_code || "MX",
          postal_code: postalCode,
          area_level1: data.area_level1 || data.state || "",
          area_level2: data.area_level2 || data.city || "",
          area_level3: data.area_level3 || data.neighborhood || "",
        };
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch zip code info for ${postalCode}, using defaults`);
    }

    // Fallback: retornar datos genéricos para México
    return {
      country_code: "MX",
      postal_code: postalCode,
      area_level1: "México",
      area_level2: "Ciudad de México",
      area_level3: "Centro",
    };
  }

  private async getRealQuotes(request: SkydropxQuoteRequest): Promise<SkydropxRate[]> {
    try {
      const token = await this.getBearerToken();
      
      // Obtener información de códigos postales
      const [fromInfo, toInfo] = await Promise.all([
        this.getZipCodeInfo(request.zip_from),
        this.getZipCodeInfo(request.zip_to),
      ]);

      // Construir request en formato Skydropx PRO
      const proRequest: SkydropxProQuotationRequest = {
        quotation: {
          address_from: fromInfo,
          address_to: toInfo,
          parcels: [{
            length: parseInt(request.parcel.length || "10"),
            width: parseInt(request.parcel.width || "10"),
            height: parseInt(request.parcel.height || "10"),
            weight: parseFloat(request.parcel.weight),
          }],
        },
      };
      
      const endpoint = `${this.baseUrl}/quotations`;
      console.log("📤 Sending request to Skydropx /quotations");
      console.log("📤 Endpoint:", endpoint);
      console.log("📤 Request body:", JSON.stringify(proRequest, null, 2));
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(proRequest),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response statusText:", response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Skydropx API error response (first 500 chars):", errorText.substring(0, 500));
        
        let errorMessage = `Skydropx API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // It's HTML or not JSON, stick with status text
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Skydropx quotes response received");
      console.log("📊 Full response structure:", JSON.stringify(result, null, 2).substring(0, 2000));
      
      // Skydropx PRO devuelve { rates: [...], is_completed: boolean, ... }
      if (!result.rates || !Array.isArray(result.rates)) {
        console.warn("⚠️ Unexpected Skydropx response structure:", result);
        return [];
      }

      // Log primera cotización para ver estructura
      if (result.rates.length > 0) {
        console.log("📦 Sample rate structure:", JSON.stringify(result.rates[0], null, 2));
      }

      // Filtrar solo cotizaciones exitosas con precio
      const validRates = result.rates
        .filter((rate: any) => rate.success === true && rate.total && rate.total > 0)
        .map((rate: any) => ({
          id: rate.id,
          provider: rate.provider_display_name || rate.provider_name,
          service_level_name: rate.provider_service_name,
          total_pricing: rate.total,
          currency: rate.currency_code || 'MXN',
          days: rate.days || 0,
          available_for_pickup: true,
        }));

      console.log(`✅ Found ${validRates.length} valid quotes out of ${result.rates.length} total`);
      return validRates;
    } catch (error: any) {
      console.error("❌ Error calling Skydropx quotes API:", error);
      throw new Error(`Error al obtener cotizaciones: ${error.message}`);
    }
  }

  private async createRealShipment(request: SkydropxShipmentRequest): Promise<SkydropxShipmentResponse> {
    try {
      const token = await this.getBearerToken();
      
      console.log("📤 Sending request to Skydropx /shipments");
      console.log("📤 Request body:", JSON.stringify(request, null, 2));
      
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      console.log("📥 Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Skydropx shipment error:", errorText);
        
        let errorMessage = `Error de Skydropx: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText.substring(0, 200);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Skydropx shipment response received:", JSON.stringify(result, null, 2));
      
      // Skydropx PRO puede devolver el shipment directamente o en result.data
      const shipmentData = result.data || result;
      
      if (!shipmentData.id && !shipmentData.tracking_number) {
        console.warn("⚠️ Unexpected Skydropx shipment response structure:", result);
        throw new Error("Respuesta inválida de Skydropx");
      }

      return shipmentData;
    } catch (error: any) {
      console.error("❌ Error calling Skydropx shipment API:", error);
      throw new Error(`Error al crear guía: ${error.message}`);
    }
  }

  private async trackRealShipment(trackingNumber: string): Promise<SkydropxTrackingResponse> {
    try {
      const token = await this.getBearerToken();
      
      console.log(`📤 Sending request to Skydropx /trackings/${trackingNumber}`);
      const response = await fetch(`${this.baseUrl}/trackings/${trackingNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Skydropx tracking error:", errorData);
        throw new Error(errorData.message || `Skydropx API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Skydropx tracking response received:", JSON.stringify(result, null, 2));
      
      if (!result.data) {
        console.warn("⚠️ Unexpected Skydropx tracking response structure:", result);
        throw new Error("Respuesta inválida de Skydropx");
      }

      return result.data;
    } catch (error: any) {
      console.error("❌ Error calling Skydropx tracking API:", error);
      throw new Error(`Error al rastrear paquete: ${error.message}`);
    }
  }

}

export const skydropxService = new SkydropxService();
