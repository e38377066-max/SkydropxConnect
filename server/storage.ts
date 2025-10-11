import { 
  type Shipment, 
  type InsertShipment,
  type Quote,
  type InsertQuote,
  type TrackingEvent,
  type InsertTrackingEvent,
  type User,
  type UpsertUser,
  type Setting,
  type UpsertSetting,
  shipments,
  quotes,
  trackingEvents,
  users,
  settings,
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
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: UpsertSetting): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
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

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting || undefined;
  }

  async upsertSetting(settingData: UpsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(settingData)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: settingData.value,
          description: settingData.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db
      .select()
      .from(settings);
  }
}

export const storage = new DatabaseStorage();
