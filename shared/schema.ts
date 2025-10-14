import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both local auth and OAuth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // null for OAuth-only users, can be added later
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  dateOfBirth: timestamp("date_of_birth"), // fecha de nacimiento
  
  // OAuth provider IDs (null if not connected)
  googleId: varchar("google_id").unique(),
  
  // Role for access control
  role: varchar("role").notNull().default("user"), // 'admin' or 'user'
  
  // Contact information
  phone: varchar("phone"),
  
  // Billing information
  rfc: varchar("rfc"),
  razonSocial: varchar("razon_social"),
  direccionFiscal: text("direccion_fiscal"),
  codigoPostalFiscal: varchar("codigo_postal_fiscal"),
  ciudadFiscal: varchar("ciudad_fiscal"),
  estadoFiscal: varchar("estado_fiscal"),
  
  // Wallet balance
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Owner of the shipment
  trackingNumber: text("tracking_number").unique(), // Nullable porque Skydropx lo da después
  carrier: text("carrier").notNull(),
  
  senderName: text("sender_name").notNull(),
  senderPhone: text("sender_phone").notNull(),
  senderAddress: text("sender_address").notNull(),
  senderZipCode: text("sender_zip_code").notNull(),
  senderColonia: text("sender_colonia"),
  senderCity: text("sender_city"),
  senderState: text("sender_state"),
  
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone").notNull(),
  receiverAddress: text("receiver_address").notNull(),
  receiverZipCode: text("receiver_zip_code").notNull(),
  receiverColonia: text("receiver_colonia"),
  receiverCity: text("receiver_city"),
  receiverState: text("receiver_state"),
  
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  description: text("description"),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  
  status: text("status").notNull().default("pending"),
  labelUrl: text("label_url"),
  
  skydropxShipmentId: text("skydropx_shipment_id"),
  skydropxData: jsonb("skydropx_data"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  fromZipCode: text("from_zip_code").notNull(),
  toZipCode: text("to_zip_code").notNull(),
  
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  
  quotesData: jsonb("quotes_data").notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trackingEvents = pgTable("tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").references(() => shipments.id),
  trackingNumber: text("tracking_number").notNull(),
  
  status: text("status").notNull(),
  description: text("description"),
  location: text("location"),
  eventDate: timestamp("event_date"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System settings table for configurable values
export const settings = pgTable("settings", {
  key: varchar("key").primaryKey(), // e.g., 'profit_margin_percentage'
  value: text("value").notNull(), // stored as string, parsed as needed
  description: text("description"), // human-readable description
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Mexican zip codes (SEPOMEX) table
export const zipCodes = pgTable("zip_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigoPostal: varchar("codigo_postal", { length: 5 }).notNull(),
  colonia: text("colonia").notNull(),
  tipoAsentamiento: varchar("tipo_asentamiento"),
  municipio: text("municipio").notNull(),
  estado: text("estado").notNull(),
  ciudad: text("ciudad"),
}, (table) => [
  index("idx_codigo_postal").on(table.codigoPostal),
  index("idx_estado").on(table.estado),
]);

// Transactions table for wallet operations
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Transaction type: 'deposit', 'withdrawal', 'shipment'
  type: varchar("type").notNull(),
  
  // Amount (positive for deposits, negative for withdrawals/shipments)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // Balance after transaction
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  // Description of the transaction
  description: text("description").notNull(),
  
  // Reference to related entities (e.g., shipment ID, recharge request ID)
  referenceId: varchar("reference_id"),
  referenceType: varchar("reference_type"), // 'shipment', 'recharge_request', etc.
  
  // Status: 'pending', 'completed', 'failed', 'refunded'
  status: varchar("status").notNull().default("completed"),
  
  // Metadata for additional information
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recharge requests table for manual balance top-ups
export const rechargeRequests = pgTable("recharge_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Requested amount
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment method: 'bank_transfer', 'cash_deposit', 'oxxo', etc.
  paymentMethod: varchar("payment_method").notNull(),
  
  // Payment reference/proof (optional, can be added later)
  paymentReference: text("payment_reference"),
  
  // Status: 'pending', 'approved', 'rejected'
  status: varchar("status").notNull().default("pending"),
  
  // Admin notes (reason for rejection, etc.)
  adminNotes: text("admin_notes"),
  
  // Admin who approved/rejected
  adminId: varchar("admin_id").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Saved addresses for quick shipment creation
export const savedAddresses = pgTable("saved_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  name: varchar("name").notNull(), // Alias/name for the address
  contactName: varchar("contact_name").notNull(),
  phone: varchar("phone").notNull(),
  address: text("address").notNull(),
  zipCode: varchar("zip_code").notNull(),
  city: varchar("city"),
  state: varchar("state"),
  
  // Address type: 'origin', 'destination', 'both'
  type: varchar("type").notNull().default("both"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Saved package presets for quick selection
export const savedPackages = pgTable("saved_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  alias: varchar("alias").notNull(), // e.g., "Caja blanca pastel", "Caja Cafe Mediana"
  
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }).notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Billing profiles (multiple RFC per user)
export const billingProfiles = pgTable("billing_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  rfc: varchar("rfc").notNull(),
  razonSocial: varchar("razon_social").notNull(),
  usoCFDI: varchar("uso_cfdi"), // e.g., "G03 - Gastos en general"
  email: varchar("email").notNull(),
  
  // Fiscal address
  direccionFiscal: text("direccion_fiscal"),
  codigoPostalFiscal: varchar("codigo_postal_fiscal"),
  ciudadFiscal: varchar("ciudad_fiscal"),
  estadoFiscal: varchar("estado_fiscal"),
  
  // Is this the default billing profile?
  isDefault: varchar("is_default").notNull().default("false"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingEventSchema = createInsertSchema(trackingEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type TrackingEvent = typeof trackingEvents.$inferSelect;

export type Setting = typeof settings.$inferSelect;
export type UpsertSetting = typeof settings.$inferInsert;

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const insertRechargeRequestSchema = createInsertSchema(rechargeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
});

export type InsertRechargeRequest = z.infer<typeof insertRechargeRequestSchema>;
export type RechargeRequest = typeof rechargeRequests.$inferSelect;

// Update type for recharge requests (includes processedAt, compatible with DB types)
export type UpdateRechargeRequest = {
  amount?: string;
  paymentMethod?: string;
  paymentReference?: string;
  status?: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  adminId?: string;
  processedAt?: Date;
};

export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavedAddress = z.infer<typeof insertSavedAddressSchema>;
export type SavedAddress = typeof savedAddresses.$inferSelect;

export const insertSavedPackageSchema = createInsertSchema(savedPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavedPackage = z.infer<typeof insertSavedPackageSchema>;
export type SavedPackage = typeof savedPackages.$inferSelect;

export const insertBillingProfileSchema = createInsertSchema(billingProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBillingProfile = z.infer<typeof insertBillingProfileSchema>;
export type BillingProfile = typeof billingProfiles.$inferSelect;

export const quoteRequestSchema = z.object({
  fromZipCode: z.string().min(5, "Código postal inválido"),
  fromColonia: z.string().min(1, "Colonia requerida"),
  toZipCode: z.string().min(5, "Código postal inválido"),
  toColonia: z.string().min(1, "Colonia requerida"),
  weight: z.number().positive("El peso debe ser mayor a 0"),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const shipmentRequestSchema = z.object({
  senderName: z.string().min(1, "Nombre requerido"),
  senderPhone: z.string().min(10, "Teléfono inválido"),
  senderAddress: z.string().min(1, "Dirección requerida"),
  senderZipCode: z.string().min(5, "Código postal inválido"),
  senderColonia: z.string().min(1, "Colonia requerida"),
  
  receiverName: z.string().min(1, "Nombre requerido"),
  receiverPhone: z.string().min(10, "Teléfono inválido"),
  receiverAddress: z.string().min(1, "Dirección requerida"),
  receiverZipCode: z.string().min(5, "Código postal inválido"),
  receiverColonia: z.string().min(1, "Colonia requerida"),
  
  weight: z.number().positive("El peso debe ser mayor a 0"),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  description: z.string().optional(),
  
  carrier: z.string().min(1, "Selecciona una paquetería"),
  rateId: z.string().optional(),
  expectedAmount: z.number().positive("Monto esperado requerido"),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type ShipmentRequest = z.infer<typeof shipmentRequestSchema>;
