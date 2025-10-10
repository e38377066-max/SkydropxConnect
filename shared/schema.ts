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
  password: varchar("password"), // null for OAuth users (Google, etc.)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Contact information
  phone: varchar("phone"),
  
  // Billing information
  rfc: varchar("rfc"),
  razonSocial: varchar("razon_social"),
  direccionFiscal: text("direccion_fiscal"),
  codigoPostalFiscal: varchar("codigo_postal_fiscal"),
  ciudadFiscal: varchar("ciudad_fiscal"),
  estadoFiscal: varchar("estado_fiscal"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingNumber: text("tracking_number").notNull().unique(),
  carrier: text("carrier").notNull(),
  
  senderName: text("sender_name").notNull(),
  senderPhone: text("sender_phone").notNull(),
  senderAddress: text("sender_address").notNull(),
  senderZipCode: text("sender_zip_code").notNull(),
  senderCity: text("sender_city"),
  senderState: text("sender_state"),
  
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone").notNull(),
  receiverAddress: text("receiver_address").notNull(),
  receiverZipCode: text("receiver_zip_code").notNull(),
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

export const quoteRequestSchema = z.object({
  fromZipCode: z.string().min(5, "Código postal inválido"),
  toZipCode: z.string().min(5, "Código postal inválido"),
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
  
  receiverName: z.string().min(1, "Nombre requerido"),
  receiverPhone: z.string().min(10, "Teléfono inválido"),
  receiverAddress: z.string().min(1, "Dirección requerida"),
  receiverZipCode: z.string().min(5, "Código postal inválido"),
  
  weight: z.number().positive("El peso debe ser mayor a 0"),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  description: z.string().optional(),
  
  carrier: z.string().min(1, "Selecciona una paquetería"),
  rateId: z.string().optional(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type ShipmentRequest = z.infer<typeof shipmentRequestSchema>;
