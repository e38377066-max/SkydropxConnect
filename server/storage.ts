import { 
  type Shipment, 
  type InsertShipment,
  type Quote,
  type InsertQuote,
  type TrackingEvent,
  type InsertTrackingEvent,
  type User,
  type UpsertUser,
  shipments,
  quotes,
  trackingEvents,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentByTracking(trackingNumber: string): Promise<Shipment | undefined>;
  getAllShipments(): Promise<Shipment[]>;
  updateShipment(id: string, data: Partial<InsertShipment>): Promise<Shipment | undefined>;
  
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuote(id: string): Promise<Quote | undefined>;
  
  createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]>;
  
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const [shipment] = await db
      .insert(shipments)
      .values(insertShipment)
      .returning();
    return shipment;
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));
    return shipment || undefined;
  }

  async getShipmentByTracking(trackingNumber: string): Promise<Shipment | undefined> {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));
    return shipment || undefined;
  }

  async getAllShipments(): Promise<Shipment[]> {
    return await db
      .select()
      .from(shipments)
      .orderBy(desc(shipments.createdAt));
  }

  async updateShipment(id: string, data: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const [updated] = await db
      .update(shipments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return updated || undefined;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db
      .insert(quotes)
      .values(insertQuote)
      .returning();
    return quote;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id));
    return quote || undefined;
  }

  async createTrackingEvent(insertEvent: InsertTrackingEvent): Promise<TrackingEvent> {
    const [event] = await db
      .insert(trackingEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]> {
    return await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.trackingNumber, trackingNumber))
      .orderBy(desc(trackingEvents.eventDate));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
