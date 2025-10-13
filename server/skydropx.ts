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
  address_from: {
    name: string;
    phone: string;
    street1: string;
    zip: string;
    city?: string;
    province?: string;
    country: string;
  };
  address_to: {
    name: string;
    phone: string;
    street1: string;
    zip: string;
    city?: string;
    province?: string;
    country: string;
  };
  parcels: Array<{
    weight: number;
    length?: number;
    width?: number;
    height?: number;
  }>;
  rate_id?: string;
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
  private baseUrl = "https://api.skydropx.com/v1";
  private bearerToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {
    this.clientId = process.env.SKYDROPX_API_KEY;
    this.clientSecret = process.env.SKYDROPX_API_SECRET;
    
    if (this.clientId && this.clientSecret) {
      console.log("✅ Skydropx credentials configured (Client ID & Secret)");
    } else {
      console.log("⚠️ Skydropx running in MOCK mode (no credentials configured)");
    }
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
    if (this.clientId && this.clientSecret) {
      return this.getRealQuotes(request);
    }
    console.log("📝 Using MOCK quotes (no credentials configured)");
    return this.getMockQuotes(request);
  }

  async createShipment(request: SkydropxShipmentRequest): Promise<SkydropxShipmentResponse> {
    if (this.clientId && this.clientSecret) {
      return this.createRealShipment(request);
    }
    console.log("📝 Using MOCK shipment (no credentials configured)");
    return this.createMockShipment(request);
  }

  async trackShipment(trackingNumber: string): Promise<SkydropxTrackingResponse> {
    if (this.clientId && this.clientSecret) {
      return this.trackRealShipment(trackingNumber);
    }
    console.log("📝 Using MOCK tracking (no credentials configured)");
    return this.trackMockShipment(trackingNumber);
  }

  private async getRealQuotes(request: SkydropxQuoteRequest): Promise<SkydropxRate[]> {
    try {
      const token = await this.getBearerToken();
      
      const endpoint = `${this.baseUrl}/quotations`;
      console.log("📤 Sending request to Skydropx /quotations");
      console.log("📤 Endpoint:", endpoint);
      console.log("📤 Request body:", JSON.stringify(request, null, 2));
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response statusText:", response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Skydropx API error response (first 500 chars):", errorText.substring(0, 500));
        
        // Try to parse as JSON, but if it's HTML, just use status text
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
      console.log("✅ Skydropx quotes response received:", JSON.stringify(result, null, 2));
      
      if (!result.data || !Array.isArray(result.data)) {
        console.warn("⚠️ Unexpected Skydropx response structure:", result);
        return [];
      }

      return result.data;
    } catch (error: any) {
      console.error("❌ Error calling Skydropx quotes API:", error);
      throw new Error(`Error al obtener cotizaciones: ${error.message}`);
    }
  }

  private getMockQuotes(request: SkydropxQuoteRequest): SkydropxRate[] {
    const weight = parseFloat(request.parcel.weight);
    const basePrice = weight * 50;
    const distance = Math.abs(parseInt(request.zip_from.slice(0, 2)) - parseInt(request.zip_to.slice(0, 2))) * 10;
    
    return [
      {
        id: "rate_dhl_express",
        provider: "DHL",
        service_level_name: "Express",
        total_pricing: basePrice + distance + 150,
        currency: "MXN",
        days: 1,
        available_for_pickup: true,
      },
      {
        id: "rate_fedex_standard",
        provider: "FedEx",
        service_level_name: "Standard",
        total_pricing: basePrice + distance + 120,
        currency: "MXN",
        days: 2,
        available_for_pickup: true,
      },
      {
        id: "rate_estafeta_terrestre",
        provider: "Estafeta",
        service_level_name: "Terrestre",
        total_pricing: basePrice + distance + 80,
        currency: "MXN",
        days: 3,
        available_for_pickup: false,
      },
      {
        id: "rate_ups_ground",
        provider: "UPS",
        service_level_name: "Ground",
        total_pricing: basePrice + distance + 100,
        currency: "MXN",
        days: 3,
        available_for_pickup: true,
      },
      {
        id: "rate_redpack_express",
        provider: "Redpack",
        service_level_name: "Express",
        total_pricing: basePrice + distance + 90,
        currency: "MXN",
        days: 2,
        available_for_pickup: false,
      },
    ].sort((a, b) => a.total_pricing - b.total_pricing);
  }

  private async createRealShipment(request: SkydropxShipmentRequest): Promise<SkydropxShipmentResponse> {
    try {
      const token = await this.getBearerToken();
      
      console.log("📤 Sending request to Skydropx /shipments");
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Skydropx shipment error:", errorData);
        throw new Error(errorData.message || `Skydropx API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Skydropx shipment response received:", JSON.stringify(result, null, 2));
      
      if (!result.data) {
        console.warn("⚠️ Unexpected Skydropx shipment response structure:", result);
        throw new Error("Respuesta inválida de Skydropx");
      }

      return result.data;
    } catch (error: any) {
      console.error("❌ Error calling Skydropx shipment API:", error);
      throw new Error(`Error al crear guía: ${error.message}`);
    }
  }

  private createMockShipment(request: SkydropxShipmentRequest): SkydropxShipmentResponse {
    const trackingNumber = `SKY${Date.now().toString().slice(-9)}MX`;
    const mockProvider = request.rate_id?.split("_")[1]?.toUpperCase() || "ESTAFETA";
    const mockPrice = Math.floor(Math.random() * 200) + 100;
    
    return {
      id: `shipment_${Date.now()}`,
      tracking_number: trackingNumber,
      label_url: `https://api.skydropx.com/labels/${trackingNumber}.pdf`,
      tracking_url_provider: `https://track.carrier.com/${trackingNumber}`,
      rate: {
        amount_local: mockPrice,
        currency_local: "MXN",
        provider: mockProvider,
        service_level_name: "Express",
      },
    };
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

  private trackMockShipment(trackingNumber: string): SkydropxTrackingResponse {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    return {
      tracking_number: trackingNumber,
      tracking_status: "in_transit",
      tracking_history: [
        {
          status: "in_transit",
          description: "El paquete está en tránsito",
          location: "Centro de Distribución Monterrey, NL",
          timestamp: now.toISOString(),
        },
        {
          status: "in_transit",
          description: "El paquete llegó al centro de distribución",
          location: "Centro de Distribución CDMX",
          timestamp: yesterday.toISOString(),
        },
        {
          status: "pickup",
          description: "Paquete recolectado",
          location: "Sucursal Roma Norte, CDMX",
          timestamp: twoDaysAgo.toISOString(),
        },
      ],
    };
  }
}

export const skydropxService = new SkydropxService();
