import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { skydropxService } from "./skydropx";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcrypt";
import passport from "passport";
import { z } from "zod";
import { 
  quoteRequestSchema, 
  shipmentRequestSchema,
  type QuoteRequest,
  type ShipmentRequest 
} from "@shared/schema";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// Helper function to sanitize user data (remove sensitive fields)
const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Local registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: "Este email ya está registrado" 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
      });

      // Log in the user automatically
      req.login({
        id: user.id,
        email: user.email,
        isLocal: true
      }, (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            error: "Error al iniciar sesión" 
          });
        }
        res.json({ 
          success: true, 
          user: sanitizeUser(user)
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({ 
        success: false, 
        error: "Error al registrar usuario" 
      });
    }
  });

  // Local login endpoint
  app.post('/api/login', (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "Datos inválidos",
        details: error.errors,
      });
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: "Error en el servidor" 
        });
      }
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: info?.message || "Credenciales inválidas" 
        });
      }

      req.login(user, async (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            error: "Error al iniciar sesión" 
          });
        }

        // Get full user data
        const fullUser = await storage.getUser(user.id);
        res.json({ 
          success: true, 
          user: sanitizeUser(fullUser)
        });
      });
    })(req, res, next);
  });

  // Auth route to get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // For local or Google auth
      if (req.user.isLocal || req.user.isGoogle) {
        const user = await storage.getUser(req.user.id);
        return res.json(sanitizeUser(user));
      }
      
      // For Replit OAuth
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update contact information
  app.patch('/api/user/contact', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.isLocal || req.user.isGoogle ? req.user.id : req.user.claims.sub;
      
      // Validate input
      const contactSchema = z.object({
        firstName: z.string().min(1, "Nombre requerido").max(255),
        lastName: z.string().max(255).optional(),
        phone: z.string().max(50).optional(),
      });

      const validatedData = contactSchema.parse(req.body);

      await storage.updateUser(userId, validatedData);
      const user = await storage.getUser(userId);
      
      res.json({ 
        success: true, 
        user: sanitizeUser(user)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact information" });
    }
  });

  // Update billing information
  app.patch('/api/user/billing', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.isLocal || req.user.isGoogle ? req.user.id : req.user.claims.sub;
      
      // Validate input
      const billingSchema = z.object({
        rfc: z.string().max(13).optional(),
        razonSocial: z.string().max(255).optional(),
        direccionFiscal: z.string().max(500).optional(),
        codigoPostalFiscal: z.string().max(10).optional(),
        ciudadFiscal: z.string().max(100).optional(),
        estadoFiscal: z.string().max(100).optional(),
      });

      const validatedData = billingSchema.parse(req.body);

      await storage.updateUser(userId, validatedData);
      const user = await storage.getUser(userId);
      
      res.json({ 
        success: true, 
        user: sanitizeUser(user)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating billing:", error);
      res.status(500).json({ message: "Failed to update billing information" });
    }
  });

  // Update password
  app.patch('/api/user/password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.isLocal ? req.user.id : (req.user.isGoogle ? req.user.id : req.user.claims.sub);
      
      // Validate input
      const passwordSchema = z.object({
        currentPassword: z.string().min(1, "Contraseña actual requerida"),
        newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
      });

      const { currentPassword, newPassword } = passwordSchema.parse(req.body);

      // Get user
      const user = await storage.getUser(userId);
      
      if (!user || !user.password) {
        return res.status(400).json({ message: "Esta cuenta no tiene contraseña establecida" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ message: "Contraseña actual incorrecta" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ success: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });
  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse({
        fromZipCode: req.body.fromZipCode,
        toZipCode: req.body.toZipCode,
        weight: parseFloat(req.body.weight),
        length: req.body.length ? parseFloat(req.body.length) : undefined,
        width: req.body.width ? parseFloat(req.body.width) : undefined,
        height: req.body.height ? parseFloat(req.body.height) : undefined,
      }) as QuoteRequest;

      const skydropxRequest = {
        zip_from: validatedData.fromZipCode,
        zip_to: validatedData.toZipCode,
        parcel: {
          weight: validatedData.weight,
          length: validatedData.length,
          width: validatedData.width,
          height: validatedData.height,
        },
      };

      const rates = await skydropxService.getQuotes(skydropxRequest);

      const quote = await storage.createQuote({
        fromZipCode: validatedData.fromZipCode,
        toZipCode: validatedData.toZipCode,
        weight: validatedData.weight.toString(),
        length: validatedData.length?.toString(),
        width: validatedData.width?.toString(),
        height: validatedData.height?.toString(),
        quotesData: rates as any,
      });

      res.json({
        success: true,
        data: {
          quoteId: quote.id,
          rates: rates,
        },
      });
    } catch (error: any) {
      console.error("Error getting quotes:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos de entrada inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Error al obtener cotizaciones",
      });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const validatedData = shipmentRequestSchema.parse({
        senderName: req.body.senderName,
        senderPhone: req.body.senderPhone,
        senderAddress: req.body.senderAddress,
        senderZipCode: req.body.senderZipCode,
        receiverName: req.body.receiverName,
        receiverPhone: req.body.receiverPhone,
        receiverAddress: req.body.receiverAddress,
        receiverZipCode: req.body.receiverZipCode,
        weight: parseFloat(req.body.weight),
        length: req.body.length ? parseFloat(req.body.length) : undefined,
        width: req.body.width ? parseFloat(req.body.width) : undefined,
        height: req.body.height ? parseFloat(req.body.height) : undefined,
        description: req.body.description,
        carrier: req.body.carrier,
        rateId: req.body.rateId,
      }) as ShipmentRequest;

      const skydropxRequest = {
        address_from: {
          name: validatedData.senderName,
          phone: validatedData.senderPhone,
          street1: validatedData.senderAddress,
          zip: validatedData.senderZipCode,
          country: "MX",
        },
        address_to: {
          name: validatedData.receiverName,
          phone: validatedData.receiverPhone,
          street1: validatedData.receiverAddress,
          zip: validatedData.receiverZipCode,
          country: "MX",
        },
        parcels: [{
          weight: validatedData.weight,
          length: validatedData.length,
          width: validatedData.width,
          height: validatedData.height,
        }],
        rate_id: validatedData.rateId,
      };

      const skydropxShipment = await skydropxService.createShipment(skydropxRequest);

      const shipment = await storage.createShipment({
        trackingNumber: skydropxShipment.tracking_number,
        carrier: validatedData.carrier,
        senderName: validatedData.senderName,
        senderPhone: validatedData.senderPhone,
        senderAddress: validatedData.senderAddress,
        senderZipCode: validatedData.senderZipCode,
        receiverName: validatedData.receiverName,
        receiverPhone: validatedData.receiverPhone,
        receiverAddress: validatedData.receiverAddress,
        receiverZipCode: validatedData.receiverZipCode,
        weight: validatedData.weight.toString(),
        length: validatedData.length?.toString(),
        width: validatedData.width?.toString(),
        height: validatedData.height?.toString(),
        description: validatedData.description,
        amount: skydropxShipment.rate.amount_local.toString(),
        currency: skydropxShipment.rate.currency_local,
        status: "pending",
        labelUrl: skydropxShipment.label_url,
        skydropxShipmentId: skydropxShipment.id,
        skydropxData: skydropxShipment as any,
      });

      await storage.createTrackingEvent({
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: "created",
        description: "Guía de envío creada",
        location: "Sistema",
        eventDate: new Date(),
      });

      res.json({
        success: true,
        data: shipment,
      });
    } catch (error: any) {
      console.error("Error creating shipment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos de entrada inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Error al crear la guía de envío",
      });
    }
  });

  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getAllShipments();
      
      res.json({
        success: true,
        data: shipments,
      });
    } catch (error: any) {
      console.error("Error getting shipments:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener los envíos",
      });
    }
  });

  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const shipment = await storage.getShipment(id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          error: "Envío no encontrado",
        });
      }

      res.json({
        success: true,
        data: shipment,
      });
    } catch (error: any) {
      console.error("Error getting shipment:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener el envío",
      });
    }
  });

  app.get("/api/tracking/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      const shipment = await storage.getShipmentByTracking(trackingNumber);
      
      if (!shipment) {
        return res.status(404).json({
          success: false,
          error: "Número de guía no encontrado",
        });
      }

      const trackingData = await skydropxService.trackShipment(trackingNumber);
      const existingEvents = await storage.getTrackingEvents(trackingNumber);

      for (const event of trackingData.tracking_history) {
        const eventTime = new Date(event.timestamp).getTime();
        const isDuplicate = existingEvents.some(existing => 
          existing.eventDate && 
          existing.status === event.status &&
          Math.abs(existing.eventDate.getTime() - eventTime) < 1000
        );

        if (!isDuplicate) {
          await storage.createTrackingEvent({
            shipmentId: shipment.id,
            trackingNumber: trackingNumber,
            status: event.status,
            description: event.description,
            location: event.location,
            eventDate: new Date(event.timestamp),
          });
        }
      }

      if (trackingData.tracking_status !== shipment.status) {
        await storage.updateShipment(shipment.id, {
          status: trackingData.tracking_status,
        });
      }

      const updatedEvents = await storage.getTrackingEvents(trackingNumber);

      res.json({
        success: true,
        data: {
          shipment: {
            ...shipment,
            status: trackingData.tracking_status,
          },
          tracking: {
            status: trackingData.tracking_status,
            history: updatedEvents,
          },
        },
      });
    } catch (error: any) {
      console.error("Error tracking shipment:", error);
      const statusCode = error.message?.includes("no encontrado") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || "Error al rastrear el paquete",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
