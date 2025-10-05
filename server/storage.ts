import { 
  type Shipment, 
  type InsertShipment,
  type Quote,
  type InsertQuote,
  type TrackingEvent,
  type InsertTrackingEvent
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private shipments: Map<string, Shipment>;
  private quotes: Map<string, Quote>;
  private trackingEvents: Map<string, TrackingEvent>;

  constructor() {
    this.shipments = new Map();
    this.quotes = new Map();
    this.trackingEvents = new Map();
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const id = randomUUID();
    const now = new Date();
    const shipment: Shipment = { 
      ...insertShipment,
      currency: insertShipment.currency ?? "MXN",
      status: insertShipment.status ?? "pending",
      length: insertShipment.length ?? null,
      width: insertShipment.width ?? null,
      height: insertShipment.height ?? null,
      description: insertShipment.description ?? null,
      senderCity: insertShipment.senderCity ?? null,
      senderState: insertShipment.senderState ?? null,
      receiverCity: insertShipment.receiverCity ?? null,
      receiverState: insertShipment.receiverState ?? null,
      labelUrl: insertShipment.labelUrl ?? null,
      skydropxShipmentId: insertShipment.skydropxShipmentId ?? null,
      skydropxData: insertShipment.skydropxData ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.shipments.set(id, shipment);
    return shipment;
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    return this.shipments.get(id);
  }

  async getShipmentByTracking(trackingNumber: string): Promise<Shipment | undefined> {
    return Array.from(this.shipments.values()).find(
      (shipment) => shipment.trackingNumber === trackingNumber
    );
  }

  async getAllShipments(): Promise<Shipment[]> {
    return Array.from(this.shipments.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateShipment(id: string, data: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    const updated = { ...shipment, ...data, updatedAt: new Date() };
    this.shipments.set(id, updated);
    return updated;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = randomUUID();
    const quote: Quote = { 
      ...insertQuote,
      length: insertQuote.length ?? null,
      width: insertQuote.width ?? null,
      height: insertQuote.height ?? null,
      id,
      createdAt: new Date(),
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async createTrackingEvent(insertEvent: InsertTrackingEvent): Promise<TrackingEvent> {
    const id = randomUUID();
    const event: TrackingEvent = { 
      ...insertEvent,
      shipmentId: insertEvent.shipmentId ?? null,
      description: insertEvent.description ?? null,
      location: insertEvent.location ?? null,
      eventDate: insertEvent.eventDate ?? null,
      id,
      createdAt: new Date(),
    };
    this.trackingEvents.set(id, event);
    return event;
  }

  async getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]> {
    return Array.from(this.trackingEvents.values())
      .filter((event) => event.trackingNumber === trackingNumber)
      .sort((a, b) => {
        if (!a.eventDate || !b.eventDate) return 0;
        return b.eventDate.getTime() - a.eventDate.getTime();
      });
  }
}

export const storage = new MemStorage();
