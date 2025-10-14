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
  type ShipmentRequest,
  type UpdateRechargeRequest,
} from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-.,])[A-Za-z\d@$!%*?&_\-.,]{8,}$/;

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(passwordRegex, "La contraseña debe contener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().optional(),
  birthDay: z.coerce.number().min(1).max(31, "Día inválido"),
  birthMonth: z.coerce.number().min(1).max(12, "Mes inválido"),
  birthYear: z.coerce.number().min(1900).max(new Date().getFullYear(), "Año inválido"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
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

      // Create date of birth from day, month, year
      const dateOfBirth = new Date(
        validatedData.birthYear,
        validatedData.birthMonth - 1, // Month is 0-indexed
        validatedData.birthDay
      );

      // Validate the date is valid
      if (isNaN(dateOfBirth.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Fecha de nacimiento inválida"
        });
      }

      // Create user (confirmPassword is only for validation, not stored)
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        dateOfBirth,
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

  // Middleware to check if user is admin
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.isLocal || req.user.isGoogle ? req.user.id : req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Acceso denegado: se requiere rol de administrador" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Error verificando permisos" });
    }
  };

  // Admin route to list all users
  app.get('/api/admin/usuarios', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ 
        success: true, 
        users: users.map(sanitizeUser) 
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get system settings (admin only)
  app.get('/api/admin/settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json({ 
        success: true, 
        settings 
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  // Get specific setting value (public for quotes)
  app.get('/api/settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Configuración no encontrada" });
      }
      
      res.json({ 
        success: true, 
        setting 
      });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  // Update system settings (admin only)
  app.patch('/api/admin/settings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      // Validate profit margin percentage setting
      if (req.body.key === 'profit_margin_percentage') {
        const profitMarginSchema = z.object({
          key: z.literal('profit_margin_percentage'),
          value: z.coerce.number().min(0, "El porcentaje no puede ser negativo").max(100, "El porcentaje no puede ser mayor a 100"),
          description: z.string().optional(),
        });

        const validated = profitMarginSchema.parse(req.body);
        
        // Convert number back to string for storage
        const setting = await storage.upsertSetting({
          key: validated.key,
          value: validated.value.toString(),
          description: validated.description,
        });
        
        return res.json({ 
          success: true, 
          setting 
        });
      }

      // Generic setting validation for other settings
      const settingsSchema = z.object({
        key: z.string().min(1),
        value: z.string().min(1),
        description: z.string().optional(),
      });

      const validatedData = settingsSchema.parse(req.body);
      const setting = await storage.upsertSetting(validatedData);
      
      res.json({ 
        success: true, 
        setting 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Error al actualizar configuración" });
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

  // Add password to OAuth account
  app.post('/api/user/add-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.isLocal ? req.user.id : (req.user.isGoogle ? req.user.id : req.user.claims.sub);
      
      // Validate input
      const addPasswordSchema = z.object({
        newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
      });

      const { newPassword } = addPasswordSchema.parse(req.body);

      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (user.password) {
        return res.status(400).json({ message: "Esta cuenta ya tiene contraseña configurada. Usa la opción de cambiar contraseña." });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Add password to account
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ success: true, message: "Contraseña agregada correctamente" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error adding password:", error);
      res.status(500).json({ message: "Error al agregar contraseña" });
    }
  });

  // Unlink OAuth provider
  app.post('/api/user/unlink-provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.isLocal ? req.user.id : (req.user.isGoogle ? req.user.id : req.user.claims.sub);
      
      // Validate input
      const unlinkSchema = z.object({
        provider: z.enum(['google'], { errorMap: () => ({ message: "Proveedor inválido" }) }),
      });

      const { provider } = unlinkSchema.parse(req.body);

      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Check that user has at least one other auth method
      const hasPassword = !!user.password;
      const hasGoogle = !!user.googleId;

      const totalAuthMethods = [hasPassword, hasGoogle].filter(Boolean).length;

      if (totalAuthMethods <= 1) {
        return res.status(400).json({ 
          message: "No puedes desvincular tu único método de autenticación. Agrega una contraseña primero." 
        });
      }

      // Unlink provider
      if (provider === 'google' && hasGoogle) {
        await storage.updateUser(userId, { googleId: null });
        res.json({ success: true, message: "Google desvinculado correctamente" });
      } else {
        res.status(400).json({ message: "Este proveedor no está vinculado a tu cuenta" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error unlinking provider:", error);
      res.status(500).json({ message: "Error al desvincular proveedor" });
    }
  });

  // Update avatar/profile image
  app.patch('/api/user/avatar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.isLocal ? req.user.id : (req.user.isGoogle ? req.user.id : req.user.claims.sub);
      
      // Validate input
      const avatarSchema = z.object({
        profileImageUrl: z.string().url("URL de imagen inválida").max(500),
      });

      const { profileImageUrl } = avatarSchema.parse(req.body);

      // Update avatar
      await storage.updateUser(userId, { profileImageUrl });
      const user = await storage.getUser(userId);
      
      res.json({ 
        success: true, 
        user: sanitizeUser(user),
        message: "Foto de perfil actualizada correctamente" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Error al actualizar foto de perfil" });
    }
  });

  // Search Mexican zip codes by CP or colonia name
  app.get("/api/zipcodes/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 3) {
        return res.json({ success: true, data: [] });
      }

      // Search by CP or colonia name
      const isNumeric = /^\d+$/.test(q);
      
      const results = await db.execute(
        isNumeric 
          ? sql`
              SELECT codigo_postal, colonia, municipio, estado
              FROM zip_codes
              WHERE codigo_postal LIKE ${q + '%'}
              ORDER BY codigo_postal, colonia
              LIMIT 20
            `
          : sql`
              SELECT codigo_postal, colonia, municipio, estado
              FROM zip_codes
              WHERE LOWER(colonia) LIKE ${q.toLowerCase() + '%'}
              ORDER BY colonia, codigo_postal
              LIMIT 20
            `
      );

      const formattedResults = results.rows.map((row: any) => ({
        codigo_postal: row.codigo_postal,
        colonia: row.colonia,
        municipio: row.municipio,
        estado: row.estado,
      }));

      res.json({ success: true, data: formattedResults });
    } catch (error) {
      console.error("Error searching zipcodes:", error);
      res.json({ success: true, data: [] });
    }
  });

  // Get colonias for a specific zip code
  app.get("/api/zipcodes/:codigo_postal/colonias", async (req, res) => {
    try {
      const { codigo_postal } = req.params;
      
      if (!codigo_postal || codigo_postal.length !== 5) {
        return res.status(400).json({ message: "Código postal inválido" });
      }

      // Get all colonias for this zip code
      const results = await db.execute(
        sql`
          SELECT DISTINCT colonia
          FROM zip_codes
          WHERE codigo_postal = ${codigo_postal}
          ORDER BY colonia
        `
      );

      const colonias = results.rows.map((row: any) => row.colonia);

      res.json({ success: true, data: colonias });
    } catch (error) {
      console.error("Error fetching colonias:", error);
      res.status(500).json({ message: "Error al obtener colonias" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse({
        fromZipCode: req.body.fromZipCode,
        fromColonia: req.body.fromColonia,
        toZipCode: req.body.toZipCode,
        toColonia: req.body.toColonia,
        weight: parseFloat(req.body.weight),
        length: req.body.length ? parseFloat(req.body.length) : undefined,
        width: req.body.width ? parseFloat(req.body.width) : undefined,
        height: req.body.height ? parseFloat(req.body.height) : undefined,
        packagingType: req.body.packagingType,
      }) as QuoteRequest;

      const skydropxRequest = {
        zip_from: validatedData.fromZipCode,
        zip_to: validatedData.toZipCode,
        colonia_from: validatedData.fromColonia,
        colonia_to: validatedData.toColonia,
        parcel: {
          weight: validatedData.weight.toString(),
          length: validatedData.length?.toString(),
          width: validatedData.width?.toString(),
          height: validatedData.height?.toString(),
        },
      };

      const rates = await skydropxService.getQuotes(skydropxRequest);

      // Get profit margin from settings
      const profitMarginSetting = await storage.getSetting('profit_margin_percentage');
      let profitMarginPercentage = 15; // Default 15%
      
      if (profitMarginSetting) {
        const parsed = parseFloat(profitMarginSetting.value);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          profitMarginPercentage = parsed;
        }
      }

      // Apply profit margin to all rates
      const ratesWithMargin = Array.isArray(rates) ? rates.map((rate: any) => {
        const basePricing = parseFloat(rate.total_pricing);
        
        // Validate that amount is a valid number
        if (isNaN(basePricing)) {
          console.error('Invalid rate pricing:', rate);
          return rate; // Return original rate if invalid
        }
        
        const finalPrice = basePricing * (1 + profitMarginPercentage / 100);
        
        return {
          ...rate,
          total_pricing: finalPrice,
          // Round to 2 decimal places
          total_pricing_display: Math.round(finalPrice * 100) / 100,
        };
      }) : rates;

      const quote = await storage.createQuote({
        fromZipCode: validatedData.fromZipCode,
        toZipCode: validatedData.toZipCode,
        weight: validatedData.weight.toString(),
        length: validatedData.length?.toString(),
        width: validatedData.width?.toString(),
        height: validatedData.height?.toString(),
        packagingType: validatedData.packagingType,
        quotesData: ratesWithMargin as any,
      });

      res.json({
        success: true,
        data: {
          quoteId: quote.id,
          rates: ratesWithMargin,
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

  app.post("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      // Get userId from authenticated user
      const userId = req.user!.isLocal || req.user!.isGoogle ? req.user!.id : req.user!.claims.sub;
      
      const validatedData = shipmentRequestSchema.parse({
        // Sender details
        senderName: req.body.senderName,
        senderCompany: req.body.senderCompany,
        senderEmail: req.body.senderEmail,
        senderPhone: req.body.senderPhone,
        senderStreet: req.body.senderStreet,
        senderExteriorNumber: req.body.senderExteriorNumber,
        senderInteriorNumber: req.body.senderInteriorNumber,
        senderReferences: req.body.senderReferences,
        senderAddress: req.body.senderAddress,
        senderZipCode: req.body.senderZipCode,
        senderColonia: req.body.senderColonia,
        senderMunicipality: req.body.senderMunicipality,
        senderCity: req.body.senderCity,
        senderState: req.body.senderState,
        senderRFC: req.body.senderRFC,
        
        // Receiver details
        receiverName: req.body.receiverName,
        receiverCompany: req.body.receiverCompany,
        receiverEmail: req.body.receiverEmail,
        receiverPhone: req.body.receiverPhone,
        receiverStreet: req.body.receiverStreet,
        receiverExteriorNumber: req.body.receiverExteriorNumber,
        receiverInteriorNumber: req.body.receiverInteriorNumber,
        receiverReferences: req.body.receiverReferences,
        receiverAddress: req.body.receiverAddress,
        receiverZipCode: req.body.receiverZipCode,
        receiverColonia: req.body.receiverColonia,
        receiverMunicipality: req.body.receiverMunicipality,
        receiverCity: req.body.receiverCity,
        receiverState: req.body.receiverState,
        receiverRFC: req.body.receiverRFC,
        
        // Package details
        shipmentType: req.body.shipmentType,
        weight: parseFloat(req.body.weight),
        length: req.body.length ? parseFloat(req.body.length) : undefined,
        width: req.body.width ? parseFloat(req.body.width) : undefined,
        height: req.body.height ? parseFloat(req.body.height) : undefined,
        packageAlias: req.body.packageAlias,
        description: req.body.description,
        declaredValue: req.body.declaredValue ? parseFloat(req.body.declaredValue) : undefined,
        productClassification: req.body.productClassification,
        packagingType: req.body.packagingType,
        
        // Options
        generateAsOcurre: req.body.generateAsOcurre,
        sendEmailNotification: req.body.sendEmailNotification,
        
        // Payment
        carrier: req.body.carrier,
        rateId: req.body.rateId,
        expectedAmount: parseFloat(req.body.expectedAmount),
      }) as ShipmentRequest;

      // Get user to check balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      // Verify balance BEFORE calling Skydropx
      const expectedAmount = validatedData.expectedAmount;
      const currentBalance = parseFloat(user.balance);
      
      if (currentBalance < expectedAmount) {
        return res.status(400).json({
          success: false,
          error: `Saldo insuficiente. Tu saldo actual es $${currentBalance.toFixed(2)} MXN y el costo estimado del envío es $${expectedAmount.toFixed(2)} MXN. Por favor, recarga tu billetera para continuar.`,
        });
      }

      // Only if balance is sufficient, create shipment in Skydropx PRO format
      if (!validatedData.rateId) {
        return res.status(400).json({
          success: false,
          error: "El ID de la cotización es requerido",
        });
      }

      // Build complete address strings with all granular fields
      const buildAddressStreet1 = (data: any) => {
        const parts = [];
        if (data.street) parts.push(data.street);
        if (data.exteriorNumber) parts.push(`#${data.exteriorNumber}`);
        if (data.interiorNumber) parts.push(`Int. ${data.interiorNumber}`);
        if (data.colonia) parts.push(data.colonia);
        return parts.length > 0 ? parts.join(', ') : data.address;
      };

      const buildReferences = (data: any) => {
        const parts = [];
        if (data.references) parts.push(data.references);
        if (data.municipality) parts.push(data.municipality);
        if (data.state) parts.push(data.state);
        return parts.join(', ') || data.zipCode;
      };

      const skydropxRequest = {
        shipment: {
          rate_id: validatedData.rateId as string,
          printing_format: "thermal",
          address_from: {
            street1: buildAddressStreet1({
              street: validatedData.senderStreet,
              exteriorNumber: validatedData.senderExteriorNumber,
              interiorNumber: validatedData.senderInteriorNumber,
              colonia: validatedData.senderColonia,
              address: validatedData.senderAddress
            }),
            name: validatedData.senderName,
            company: validatedData.senderCompany || user.razonSocial || "Particular",
            phone: validatedData.senderPhone,
            email: validatedData.senderEmail || user.email,
            reference: buildReferences({
              references: validatedData.senderReferences,
              municipality: validatedData.senderMunicipality,
              state: validatedData.senderState,
              zipCode: validatedData.senderZipCode
            }),
          },
          address_to: {
            street1: buildAddressStreet1({
              street: validatedData.receiverStreet,
              exteriorNumber: validatedData.receiverExteriorNumber,
              interiorNumber: validatedData.receiverInteriorNumber,
              colonia: validatedData.receiverColonia,
              address: validatedData.receiverAddress
            }),
            name: validatedData.receiverName,
            company: validatedData.receiverCompany || "Destinatario",
            phone: validatedData.receiverPhone,
            email: validatedData.receiverEmail || user.email,
            reference: buildReferences({
              references: validatedData.receiverReferences,
              municipality: validatedData.receiverMunicipality,
              state: validatedData.receiverState,
              zipCode: validatedData.receiverZipCode
            }),
          },
          packages: [{
            package_number: "1",
            package_protected: false, // El usuario puede configurar esto después
            weight: validatedData.weight,
            length: validatedData.length || 10, // Valor por defecto si no se especifica
            width: validatedData.width || 10,
            height: validatedData.height || 10,
            weight_unit: "KG",
            distance_unit: "CM",
            declared_value: validatedData.expectedAmount, // Valor del envío
            consignment_note: "53102400", // Código SAT genérico para envíos
            package_type: "4G", // Tipo de paquete genérico
            content: validatedData.description || "Paquete",
            products: [{
              name: validatedData.description || "Paquete",
              description_en: validatedData.description || "Package",
              quantity: 1,
              price: validatedData.expectedAmount,
              product_type_code: "P",
              product_type_name: "Producto",
              country_code: "MX",
            }],
          }],
        },
      };

      const skydropxShipment = await skydropxService.createShipment(skydropxRequest);
      
      // Use the expected amount (from the selected rate) as actual amount
      const actualAmount = expectedAmount;
      
      // Verify actual amount doesn't exceed current balance (already checked, but double verify)
      if (actualAmount > currentBalance) {
        return res.status(400).json({
          success: false,
          error: `El costo del envío ($${actualAmount.toFixed(2)} MXN) excede tu saldo disponible ($${currentBalance.toFixed(2)} MXN). Por favor, recarga tu billetera.`,
        });
      }

      // Calculate new balance using actual amount
      const newBalance = (currentBalance - actualAmount).toFixed(2);

      // Map Skydropx workflow_status to our status
      let shipmentStatus = "pending";
      if (skydropxShipment.workflow_status === "completed" && skydropxShipment.tracking_number) {
        shipmentStatus = "created";
      } else if (skydropxShipment.workflow_status === "in_progress") {
        shipmentStatus = "pending";
      } else if (skydropxShipment.workflow_status === "cancelled") {
        shipmentStatus = "cancelled";
      }

      // Create shipment with userId and all fields
      const shipment = await storage.createShipment({
        userId: userId,
        trackingNumber: skydropxShipment.tracking_number,
        carrier: validatedData.carrier,
        
        // Sender details
        senderName: validatedData.senderName,
        senderCompany: validatedData.senderCompany,
        senderEmail: validatedData.senderEmail,
        senderPhone: validatedData.senderPhone,
        senderStreet: validatedData.senderStreet,
        senderExteriorNumber: validatedData.senderExteriorNumber,
        senderInteriorNumber: validatedData.senderInteriorNumber,
        senderReferences: validatedData.senderReferences,
        senderAddress: validatedData.senderAddress,
        senderZipCode: validatedData.senderZipCode,
        senderColonia: validatedData.senderColonia,
        senderMunicipality: validatedData.senderMunicipality,
        senderCity: validatedData.senderCity,
        senderState: validatedData.senderState,
        senderRFC: validatedData.senderRFC,
        
        // Receiver details
        receiverName: validatedData.receiverName,
        receiverCompany: validatedData.receiverCompany,
        receiverEmail: validatedData.receiverEmail,
        receiverPhone: validatedData.receiverPhone,
        receiverStreet: validatedData.receiverStreet,
        receiverExteriorNumber: validatedData.receiverExteriorNumber,
        receiverInteriorNumber: validatedData.receiverInteriorNumber,
        receiverReferences: validatedData.receiverReferences,
        receiverAddress: validatedData.receiverAddress,
        receiverZipCode: validatedData.receiverZipCode,
        receiverColonia: validatedData.receiverColonia,
        receiverMunicipality: validatedData.receiverMunicipality,
        receiverCity: validatedData.receiverCity,
        receiverState: validatedData.receiverState,
        receiverRFC: validatedData.receiverRFC,
        
        // Package details
        shipmentType: validatedData.shipmentType,
        weight: validatedData.weight.toString(),
        length: validatedData.length?.toString(),
        width: validatedData.width?.toString(),
        height: validatedData.height?.toString(),
        packageAlias: validatedData.packageAlias,
        description: validatedData.description,
        declaredValue: validatedData.declaredValue?.toString(),
        productClassification: validatedData.productClassification,
        packagingType: validatedData.packagingType,
        
        // Options
        generateAsOcurre: validatedData.generateAsOcurre ? "true" : "false",
        sendEmailNotification: validatedData.sendEmailNotification ? "true" : "false",
        
        // Payment
        amount: actualAmount.toString(),
        currency: "MXN",
        
        // Status
        status: shipmentStatus,
        labelUrl: skydropxShipment.label_url,
        skydropxShipmentId: skydropxShipment.id,
        skydropxData: skydropxShipment as any,
      });

      // Update user balance
      await storage.updateUserBalance(userId, newBalance);

      // Create transaction record
      await storage.createTransaction({
        userId: userId,
        type: "withdrawal",
        amount: `-${actualAmount.toFixed(2)}`,
        balanceAfter: newBalance,
        description: `Envío ${validatedData.carrier} - ${shipment.trackingNumber || 'Procesando'}`,
        referenceId: shipment.id,
        referenceType: "shipment",
        status: "completed",
        metadata: {
          trackingNumber: shipment.trackingNumber || null,
          carrier: validatedData.carrier,
          senderZipCode: validatedData.senderZipCode,
          receiverZipCode: validatedData.receiverZipCode,
        } as any,
      });

      // Only create tracking event if we have a tracking number
      if (shipment.trackingNumber) {
        await storage.createTrackingEvent({
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          status: "created",
          description: "Guía de envío creada",
          location: "Sistema",
          eventDate: new Date(),
        });
      }

      res.json({
        success: true,
        data: shipment,
        message: `Envío creado exitosamente. Se descontaron $${actualAmount.toFixed(2)} MXN de tu saldo. Saldo restante: $${newBalance} MXN`,
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

  app.get("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.isLocal || req.user!.isGoogle ? req.user!.id : req.user!.claims.sub;
      const shipments = await storage.getUserShipments(userId);
      
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

  // Sincronizar estado del envío desde Skydropx
  app.post("/api/shipments/:id/sync", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.isLocal || req.user!.isGoogle ? req.user!.id : req.user!.claims.sub;
      
      const shipment = await storage.getShipment(id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          error: "Envío no encontrado",
        });
      }

      // Verificar que el usuario sea dueño del envío
      if (shipment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "No tienes permiso para sincronizar este envío",
        });
      }

      if (!shipment.skydropxShipmentId) {
        return res.status(400).json({
          success: false,
          error: "Este envío no tiene ID de Skydropx",
        });
      }

      // Obtener estado actualizado de Skydropx
      const skydropxData = await skydropxService.getShipmentStatus(shipment.skydropxShipmentId);
      
      // Mapear estado de Skydropx
      let newStatus = shipment.status;
      if (skydropxData.workflow_status === "completed" && skydropxData.tracking_number) {
        newStatus = "created";
      } else if (skydropxData.workflow_status === "in_progress") {
        newStatus = "pending";
      } else if (skydropxData.workflow_status === "cancelled") {
        newStatus = "cancelled";
      }

      // Actualizar envío en DB
      const updatedShipment = await storage.updateShipment(id, {
        trackingNumber: skydropxData.tracking_number || shipment.trackingNumber,
        status: newStatus,
        labelUrl: skydropxData.label_url || shipment.labelUrl,
        skydropxData: skydropxData as any,
      });

      // Si ahora tenemos tracking number y no había antes, crear evento
      if (skydropxData.tracking_number && !shipment.trackingNumber) {
        await storage.createTrackingEvent({
          shipmentId: shipment.id,
          trackingNumber: skydropxData.tracking_number,
          status: "created",
          description: "Guía de envío procesada",
          location: "Sistema",
          eventDate: new Date(),
        });
      }

      res.json({
        success: true,
        data: updatedShipment,
        message: "Estado del envío sincronizado correctamente",
      });
    } catch (error: any) {
      console.error("Error syncing shipment:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al sincronizar el envío",
      });
    }
  });

  // Cancelar envío con reembolso automático
  app.post("/api/shipments/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = "Ya no es necesario" } = req.body;
      const userId = req.user!.isLocal || req.user!.isGoogle ? req.user!.id : req.user!.claims.sub;
      
      const shipment = await storage.getShipment(id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          error: "Envío no encontrado",
        });
      }

      // Verificar que el usuario sea dueño del envío
      if (shipment.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "No tienes permiso para cancelar este envío",
        });
      }

      // Verificar que el envío no esté ya cancelado
      if (shipment.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: "Este envío ya está cancelado",
        });
      }

      if (!shipment.skydropxShipmentId) {
        return res.status(400).json({
          success: false,
          error: "Este envío no tiene ID de Skydropx y no puede ser cancelado",
        });
      }

      // Cancelar en Skydropx
      const cancelResult = await skydropxService.cancelShipment(shipment.skydropxShipmentId, reason);
      
      // Actualizar envío en DB
      const updatedShipment = await storage.updateShipment(id, {
        status: "cancelled",
      });

      // Reembolsar el monto a la billetera del usuario
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      const refundAmount = parseFloat(shipment.amount);
      const newBalance = (parseFloat(user.balance) + refundAmount).toFixed(2);

      await storage.updateUserBalance(userId, newBalance);

      // Crear transacción de reembolso
      await storage.createTransaction({
        userId: userId,
        type: "deposit",
        amount: refundAmount.toFixed(2),
        balanceAfter: newBalance,
        description: `Reembolso por cancelación de envío ${shipment.trackingNumber || shipment.id.substring(0, 8)}`,
        referenceId: shipment.id,
        referenceType: "shipment_refund",
        status: "completed",
        metadata: {
          originalAmount: shipment.amount,
          carrier: shipment.carrier,
          cancelReason: reason,
        } as any,
      });

      // Crear evento de tracking de cancelación si hay tracking number
      if (shipment.trackingNumber) {
        await storage.createTrackingEvent({
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          status: "cancelled",
          description: `Envío cancelado: ${reason}`,
          location: "Sistema",
          eventDate: new Date(),
        });
      }

      res.json({
        success: true,
        data: updatedShipment,
        refund: {
          amount: refundAmount,
          newBalance: newBalance,
        },
        message: `Envío cancelado exitosamente. Se reembolsaron $${refundAmount.toFixed(2)} MXN a tu billetera. Saldo actual: $${newBalance} MXN`,
      });
    } catch (error: any) {
      console.error("Error cancelling shipment:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Error al cancelar el envío",
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

      // Si el envío está cancelado, retornar estado sin intentar rastrear en Skydropx
      if (shipment.status === 'cancelled') {
        const existingEvents = await storage.getTrackingEvents(trackingNumber);
        return res.json({
          success: true,
          data: {
            shipment,
            tracking: {
              status: 'cancelled',
              history: existingEvents,
            },
          },
          message: "Este envío fue cancelado",
        });
      }

      // Pasar el carrier_name a Skydropx para mejor tracking
      const trackingData = await skydropxService.trackShipment(trackingNumber, shipment.carrier);
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

  // Wallet endpoints (protected)
  app.get("/api/wallet/balance", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuario no encontrado",
        });
      }

      res.json({
        success: true,
        data: {
          balance: user.balance,
        },
      });
    } catch (error: any) {
      console.error("Error getting balance:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener saldo",
      });
    }
  });

  app.get("/api/wallet/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user!.id);
      
      res.json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      console.error("Error getting transactions:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener transacciones",
      });
    }
  });

  const rechargeRequestSchema = z.object({
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    paymentMethod: z.string().min(1, "Método de pago requerido"),
    paymentReference: z.string().optional(),
  });

  app.post("/api/wallet/recharge/request", isAuthenticated, async (req, res) => {
    try {
      const validatedData = rechargeRequestSchema.parse(req.body);
      
      const rechargeRequest = await storage.createRechargeRequest({
        userId: req.user!.id,
        amount: validatedData.amount.toString(),
        paymentMethod: validatedData.paymentMethod,
        paymentReference: validatedData.paymentReference || null,
        status: 'pending',
        adminNotes: null,
        adminId: null,
      });

      res.json({
        success: true,
        data: rechargeRequest,
      });
    } catch (error: any) {
      console.error("Error creating recharge request:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al crear solicitud de recarga",
      });
    }
  });

  app.get("/api/wallet/recharge/requests", isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getUserRechargeRequests(req.user!.id);
      
      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      console.error("Error getting recharge requests:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener solicitudes de recarga",
      });
    }
  });

  // Admin-only middleware (reuse existing from profile section)

  app.get("/api/admin/recharge/requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      
      let requests;
      if (status === 'pending') {
        requests = await storage.getPendingRechargeRequests();
      } else {
        requests = await storage.getAllRechargeRequests();
        if (status) {
          requests = requests.filter(r => r.status === status);
        }
      }
      
      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      console.error("Error getting recharge requests:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener solicitudes de recarga",
      });
    }
  });

  const updateRechargeRequestSchema = z.object({
    status: z.enum(['pending', 'approved', 'rejected']),
    adminNotes: z.string().optional(),
  });

  app.patch("/api/admin/recharge/requests/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateRechargeRequestSchema.parse(req.body);
      
      const rechargeRequest = await storage.getRechargeRequest(id);
      if (!rechargeRequest) {
        return res.status(404).json({
          success: false,
          error: "Solicitud de recarga no encontrada",
        });
      }

      // Prepare update data
      const updateData: UpdateRechargeRequest = {
        status: validatedData.status,
        adminNotes: validatedData.adminNotes || undefined,
        adminId: req.user!.id,
      };

      // If approving, set processedAt and update user balance
      if (validatedData.status === 'approved') {
        updateData.processedAt = new Date();
        
        const user = await storage.getUserById(rechargeRequest.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: "Usuario no encontrado",
          });
        }

        const currentBalance = parseFloat(user.balance || '0');
        const rechargeAmount = parseFloat(rechargeRequest.amount);
        const newBalance = (currentBalance + rechargeAmount).toFixed(2);

        await storage.updateUserBalance(rechargeRequest.userId, newBalance);
        
        await storage.createTransaction({
          userId: rechargeRequest.userId,
          type: 'deposit',
          amount: rechargeRequest.amount,
          balanceAfter: newBalance,
          description: `Recarga aprobada - ${rechargeRequest.paymentMethod}`,
          metadata: { rechargeRequestId: id } as any,
        });
      } else if (validatedData.status === 'rejected') {
        updateData.processedAt = new Date();
      }

      const updated = await storage.updateRechargeRequest(id, updateData);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error("Error updating recharge request:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al actualizar solicitud de recarga",
      });
    }
  });

  // Saved Addresses endpoints (protected)
  app.get("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const addresses = await storage.getUserSavedAddresses(req.user!.id);
      
      res.json({
        success: true,
        data: addresses,
      });
    } catch (error: any) {
      console.error("Error getting addresses:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener direcciones",
      });
    }
  });

  const savedAddressSchema = z.object({
    name: z.string().min(1, "Nombre de la dirección requerido"),
    contactName: z.string().min(1, "Nombre de contacto requerido"),
    phone: z.string().min(1, "Teléfono requerido"),
    address: z.string().min(1, "Dirección requerida"),
    zipCode: z.string().min(1, "Código postal requerido"),
    city: z.string().optional(),
    state: z.string().optional(),
    type: z.enum(['origin', 'destination', 'both']).default('both'),
  });

  app.post("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const validatedData = savedAddressSchema.parse(req.body);
      
      const address = await storage.createSavedAddress({
        userId: req.user!.id,
        ...validatedData,
      });

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      console.error("Error creating address:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al crear dirección",
      });
    }
  });

  app.patch("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = savedAddressSchema.partial().parse(req.body);
      
      // Verify ownership before updating
      const addresses = await storage.getUserSavedAddresses(req.user!.id);
      const existingAddress = addresses.find(a => a.id === id);
      
      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          error: "Dirección no encontrada",
        });
      }
      
      const updated = await storage.updateSavedAddress(id, validatedData);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error("Error updating address:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al actualizar dirección",
      });
    }
  });

  app.delete("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify ownership before deleting
      const addresses = await storage.getUserSavedAddresses(req.user!.id);
      const existingAddress = addresses.find(a => a.id === id);
      
      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          error: "Dirección no encontrada",
        });
      }
      
      await storage.deleteSavedAddress(id);

      res.json({
        success: true,
        message: "Dirección eliminada correctamente",
      });
    } catch (error: any) {
      console.error("Error deleting address:", error);
      res.status(500).json({
        success: false,
        error: "Error al eliminar dirección",
      });
    }
  });

  // Saved Packages endpoints (protected)
  app.get("/api/packages", isAuthenticated, async (req, res) => {
    try {
      const packages = await storage.getUserSavedPackages(req.user!.id);
      
      res.json({
        success: true,
        data: packages,
      });
    } catch (error: any) {
      console.error("Error getting packages:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener paquetes",
      });
    }
  });

  const savedPackageSchema = z.object({
    alias: z.string().min(1, "Nombre del paquete requerido"),
    weight: z.coerce.number().positive("Peso debe ser mayor a 0"),
    length: z.coerce.number().positive("Largo debe ser mayor a 0"),
    width: z.coerce.number().positive("Ancho debe ser mayor a 0"),
    height: z.coerce.number().positive("Alto debe ser mayor a 0"),
  });

  app.post("/api/packages", isAuthenticated, async (req, res) => {
    try {
      const validatedData = savedPackageSchema.parse(req.body);
      
      const pkg = await storage.createSavedPackage({
        userId: req.user!.id,
        alias: validatedData.alias,
        weight: validatedData.weight.toString(),
        length: validatedData.length.toString(),
        width: validatedData.width.toString(),
        height: validatedData.height.toString(),
      });

      res.json({
        success: true,
        data: pkg,
      });
    } catch (error: any) {
      console.error("Error creating package:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al crear paquete",
      });
    }
  });

  app.patch("/api/packages/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = savedPackageSchema.partial().parse(req.body);
      
      // Verify ownership before updating
      const packages = await storage.getUserSavedPackages(req.user!.id);
      const existingPackage = packages.find(p => p.id === id);
      
      if (!existingPackage) {
        return res.status(404).json({
          success: false,
          error: "Paquete no encontrado",
        });
      }
      
      const updateData: any = {
        alias: validatedData.alias,
        weight: validatedData.weight?.toString(),
        length: validatedData.length?.toString(),
        width: validatedData.width?.toString(),
        height: validatedData.height?.toString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      const updated = await storage.updateSavedPackage(id, updateData);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error("Error updating package:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al actualizar paquete",
      });
    }
  });

  app.delete("/api/packages/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify ownership before deleting
      const packages = await storage.getUserSavedPackages(req.user!.id);
      const existingPackage = packages.find(p => p.id === id);
      
      if (!existingPackage) {
        return res.status(404).json({
          success: false,
          error: "Paquete no encontrado",
        });
      }
      
      await storage.deleteSavedPackage(id);

      res.json({
        success: true,
        message: "Paquete eliminado correctamente",
      });
    } catch (error: any) {
      console.error("Error deleting package:", error);
      res.status(500).json({
        success: false,
        error: "Error al eliminar paquete",
      });
    }
  });

  // Billing Profiles endpoints (protected)
  app.get("/api/billing-profiles", isAuthenticated, async (req, res) => {
    try {
      const profiles = await storage.getUserBillingProfiles(req.user!.id);
      
      res.json({
        success: true,
        data: profiles,
      });
    } catch (error: any) {
      console.error("Error getting billing profiles:", error);
      res.status(500).json({
        success: false,
        error: "Error al obtener perfiles de facturación",
      });
    }
  });

  const billingProfileSchema = z.object({
    rfc: z.string().min(12, "RFC debe tener al menos 12 caracteres").max(13),
    razonSocial: z.string().min(1, "Razón social requerida"),
    usoCFDI: z.string().optional(),
    email: z.string().email("Email inválido"),
    direccionFiscal: z.string().optional(),
    codigoPostalFiscal: z.string().optional(),
    ciudadFiscal: z.string().optional(),
    estadoFiscal: z.string().optional(),
    isDefault: z.enum(['true', 'false']).default('false'),
  });

  app.post("/api/billing-profiles", isAuthenticated, async (req, res) => {
    try {
      const validatedData = billingProfileSchema.parse(req.body);
      
      const profile = await storage.createBillingProfile({
        userId: req.user!.id,
        ...validatedData,
      });

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error("Error creating billing profile:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al crear perfil de facturación",
      });
    }
  });

  app.patch("/api/billing-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = billingProfileSchema.partial().parse(req.body);
      
      // Verify ownership before updating
      const profiles = await storage.getUserBillingProfiles(req.user!.id);
      const existingProfile = profiles.find(p => p.id === id);
      
      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          error: "Perfil de facturación no encontrado",
        });
      }
      
      const updated = await storage.updateBillingProfile(id, validatedData);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error("Error updating billing profile:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: "Datos inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: "Error al actualizar perfil de facturación",
      });
    }
  });

  app.delete("/api/billing-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify ownership before deleting
      const profiles = await storage.getUserBillingProfiles(req.user!.id);
      const existingProfile = profiles.find(p => p.id === id);
      
      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          error: "Perfil de facturación no encontrado",
        });
      }
      
      await storage.deleteBillingProfile(id);

      res.json({
        success: true,
        message: "Perfil de facturación eliminado correctamente",
      });
    } catch (error: any) {
      console.error("Error deleting billing profile:", error);
      res.status(500).json({
        success: false,
        error: "Error al eliminar perfil de facturación",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
