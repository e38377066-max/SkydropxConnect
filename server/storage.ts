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
  type Transaction,
  type InsertTransaction,
  type RechargeRequest,
  type InsertRechargeRequest,
  type UpdateRechargeRequest,
  type SavedAddress,
  type InsertSavedAddress,
  type SavedPackage,
  type InsertSavedPackage,
  type BillingProfile,
  type InsertBillingProfile,
  type PromotionalBanner,
  type InsertPromotionalBanner,
  type PromoCode,
  type InsertPromoCode,
  shipments,
  quotes,
  trackingEvents,
  users,
  settings,
  transactions,
  rechargeRequests,
  savedAddresses,
  savedPackages,
  billingProfiles,
  promotionalBanners,
  promoCodes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentByTracking(trackingNumber: string): Promise<Shipment | undefined>;
  getAllShipments(): Promise<Shipment[]>;
  getUserShipments(userId: string): Promise<Shipment[]>;
  updateShipment(id: string, data: Partial<InsertShipment>): Promise<Shipment | undefined>;
  
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuote(id: string): Promise<Quote | undefined>;
  
  createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getTrackingEvents(trackingNumber: string): Promise<TrackingEvent[]>;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  updateUserBalance(userId: string, newBalance: string): Promise<User | undefined>;
  
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: UpsertSetting): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  
  // Recharge Requests
  createRechargeRequest(request: InsertRechargeRequest): Promise<RechargeRequest>;
  getRechargeRequest(id: string): Promise<RechargeRequest | undefined>;
  getUserRechargeRequests(userId: string): Promise<RechargeRequest[]>;
  getAllRechargeRequests(): Promise<RechargeRequest[]>;
  getPendingRechargeRequests(): Promise<RechargeRequest[]>;
  updateRechargeRequest(id: string, data: UpdateRechargeRequest): Promise<RechargeRequest | undefined>;
  
  // Saved Addresses
  createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress>;
  getUserSavedAddresses(userId: string): Promise<SavedAddress[]>;
  getSavedAddress(id: string): Promise<SavedAddress | undefined>;
  updateSavedAddress(id: string, data: Partial<InsertSavedAddress>): Promise<SavedAddress | undefined>;
  deleteSavedAddress(id: string): Promise<void>;
  
  // Saved Packages
  createSavedPackage(pkg: InsertSavedPackage): Promise<SavedPackage>;
  getUserSavedPackages(userId: string): Promise<SavedPackage[]>;
  getSavedPackage(id: string): Promise<SavedPackage | undefined>;
  updateSavedPackage(id: string, data: Partial<InsertSavedPackage>): Promise<SavedPackage | undefined>;
  deleteSavedPackage(id: string): Promise<void>;
  
  // Billing Profiles
  createBillingProfile(profile: InsertBillingProfile): Promise<BillingProfile>;
  getUserBillingProfiles(userId: string): Promise<BillingProfile[]>;
  getBillingProfile(id: string): Promise<BillingProfile | undefined>;
  updateBillingProfile(id: string, data: Partial<InsertBillingProfile>): Promise<BillingProfile | undefined>;
  deleteBillingProfile(id: string): Promise<void>;
  
  // Promotional Banners
  createPromotionalBanner(banner: InsertPromotionalBanner): Promise<PromotionalBanner>;
  getAllPromotionalBanners(): Promise<PromotionalBanner[]>;
  getActivePromotionalBanners(): Promise<PromotionalBanner[]>;
  getPromotionalBanner(id: string): Promise<PromotionalBanner | undefined>;
  updatePromotionalBanner(id: string, data: Partial<InsertPromotionalBanner>): Promise<PromotionalBanner | undefined>;
  deletePromotionalBanner(id: string): Promise<void>;
  
  // Promo Codes
  createPromoCode(code: InsertPromoCode): Promise<PromoCode>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  getPromoCode(id: string): Promise<PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  updatePromoCode(id: string, data: Partial<InsertPromoCode>): Promise<PromoCode | undefined>;
  incrementPromoCodeUsage(id: string): Promise<PromoCode | undefined>;
  deletePromoCode(id: string): Promise<void>;
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
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

  // User Shipments
  async getUserShipments(userId: string): Promise<Shipment[]> {
    return await db
      .select()
      .from(shipments)
      .where(eq(shipments.userId, userId))
      .orderBy(desc(shipments.createdAt));
  }

  // User Balance
  async updateUserBalance(userId: string, newBalance: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  // Transactions
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction || undefined;
  }

  // Recharge Requests
  async createRechargeRequest(insertRequest: InsertRechargeRequest): Promise<RechargeRequest> {
    const [request] = await db
      .insert(rechargeRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getRechargeRequest(id: string): Promise<RechargeRequest | undefined> {
    const [request] = await db
      .select()
      .from(rechargeRequests)
      .where(eq(rechargeRequests.id, id));
    return request || undefined;
  }

  async getUserRechargeRequests(userId: string): Promise<RechargeRequest[]> {
    return await db
      .select()
      .from(rechargeRequests)
      .where(eq(rechargeRequests.userId, userId))
      .orderBy(desc(rechargeRequests.createdAt));
  }

  async getAllRechargeRequests(): Promise<RechargeRequest[]> {
    return await db
      .select()
      .from(rechargeRequests)
      .orderBy(desc(rechargeRequests.createdAt));
  }

  async getPendingRechargeRequests(): Promise<RechargeRequest[]> {
    return await db
      .select()
      .from(rechargeRequests)
      .where(eq(rechargeRequests.status, 'pending'))
      .orderBy(desc(rechargeRequests.createdAt));
  }

  async updateRechargeRequest(id: string, data: UpdateRechargeRequest): Promise<RechargeRequest | undefined> {
    const [updated] = await db
      .update(rechargeRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rechargeRequests.id, id))
      .returning();
    return updated || undefined;
  }

  // Saved Addresses
  async createSavedAddress(insertAddress: InsertSavedAddress): Promise<SavedAddress> {
    const [address] = await db
      .insert(savedAddresses)
      .values(insertAddress)
      .returning();
    return address;
  }

  async getUserSavedAddresses(userId: string): Promise<SavedAddress[]> {
    return await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.userId, userId))
      .orderBy(desc(savedAddresses.createdAt));
  }

  async getSavedAddress(id: string): Promise<SavedAddress | undefined> {
    const [address] = await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.id, id));
    return address || undefined;
  }

  async updateSavedAddress(id: string, data: Partial<InsertSavedAddress>): Promise<SavedAddress | undefined> {
    const [updated] = await db
      .update(savedAddresses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savedAddresses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSavedAddress(id: string): Promise<void> {
    await db
      .delete(savedAddresses)
      .where(eq(savedAddresses.id, id));
  }

  // Saved Packages
  async createSavedPackage(insertPackage: InsertSavedPackage): Promise<SavedPackage> {
    const [pkg] = await db
      .insert(savedPackages)
      .values(insertPackage)
      .returning();
    return pkg;
  }

  async getUserSavedPackages(userId: string): Promise<SavedPackage[]> {
    return await db
      .select()
      .from(savedPackages)
      .where(eq(savedPackages.userId, userId))
      .orderBy(desc(savedPackages.createdAt));
  }

  async getSavedPackage(id: string): Promise<SavedPackage | undefined> {
    const [pkg] = await db
      .select()
      .from(savedPackages)
      .where(eq(savedPackages.id, id));
    return pkg || undefined;
  }

  async updateSavedPackage(id: string, data: Partial<InsertSavedPackage>): Promise<SavedPackage | undefined> {
    const [updated] = await db
      .update(savedPackages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savedPackages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSavedPackage(id: string): Promise<void> {
    await db
      .delete(savedPackages)
      .where(eq(savedPackages.id, id));
  }

  // Billing Profiles
  async createBillingProfile(insertProfile: InsertBillingProfile): Promise<BillingProfile> {
    const [profile] = await db
      .insert(billingProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async getUserBillingProfiles(userId: string): Promise<BillingProfile[]> {
    return await db
      .select()
      .from(billingProfiles)
      .where(eq(billingProfiles.userId, userId))
      .orderBy(desc(billingProfiles.createdAt));
  }

  async getBillingProfile(id: string): Promise<BillingProfile | undefined> {
    const [profile] = await db
      .select()
      .from(billingProfiles)
      .where(eq(billingProfiles.id, id));
    return profile || undefined;
  }

  async updateBillingProfile(id: string, data: Partial<InsertBillingProfile>): Promise<BillingProfile | undefined> {
    const [updated] = await db
      .update(billingProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingProfiles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBillingProfile(id: string): Promise<void> {
    await db
      .delete(billingProfiles)
      .where(eq(billingProfiles.id, id));
  }
  
  // Promotional Banners
  async createPromotionalBanner(banner: InsertPromotionalBanner): Promise<PromotionalBanner> {
    const [created] = await db
      .insert(promotionalBanners)
      .values(banner)
      .returning();
    return created;
  }

  async getAllPromotionalBanners(): Promise<PromotionalBanner[]> {
    return await db
      .select()
      .from(promotionalBanners)
      .orderBy(promotionalBanners.displayOrder, desc(promotionalBanners.createdAt));
  }

  async getActivePromotionalBanners(): Promise<PromotionalBanner[]> {
    return await db
      .select()
      .from(promotionalBanners)
      .where(eq(promotionalBanners.isActive, 'true'))
      .orderBy(promotionalBanners.displayOrder, desc(promotionalBanners.createdAt));
  }

  async getPromotionalBanner(id: string): Promise<PromotionalBanner | undefined> {
    const [banner] = await db
      .select()
      .from(promotionalBanners)
      .where(eq(promotionalBanners.id, id));
    return banner || undefined;
  }

  async updatePromotionalBanner(id: string, data: Partial<InsertPromotionalBanner>): Promise<PromotionalBanner | undefined> {
    const [updated] = await db
      .update(promotionalBanners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promotionalBanners.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePromotionalBanner(id: string): Promise<void> {
    await db
      .delete(promotionalBanners)
      .where(eq(promotionalBanners.id, id));
  }
  
  // Promo Codes
  async createPromoCode(code: InsertPromoCode): Promise<PromoCode> {
    const [created] = await db
      .insert(promoCodes)
      .values({
        ...code,
        discountValue: code.discountValue.toString(),
        usageLimit: code.usageLimit ? code.usageLimit.toString() : undefined,
      } as any)
      .returning();
    return created;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db
      .select()
      .from(promoCodes)
      .orderBy(desc(promoCodes.createdAt));
  }

  async getPromoCode(id: string): Promise<PromoCode | undefined> {
    const [code] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id));
    return code || undefined;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code));
    return promoCode || undefined;
  }

  async updatePromoCode(id: string, data: Partial<InsertPromoCode>): Promise<PromoCode | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.discountValue !== undefined) {
      updateData.discountValue = data.discountValue.toString();
    }
    if (data.usageLimit !== undefined) {
      updateData.usageLimit = data.usageLimit.toString();
    }
    
    const [updated] = await db
      .update(promoCodes)
      .set(updateData)
      .where(eq(promoCodes.id, id))
      .returning();
    return updated || undefined;
  }

  async incrementPromoCodeUsage(id: string): Promise<PromoCode | undefined> {
    const promoCode = await this.getPromoCode(id);
    if (!promoCode) return undefined;
    
    const newUsedCount = (parseInt(promoCode.usedCount || '0') + 1).toString();
    
    const [updated] = await db
      .update(promoCodes)
      .set({ usedCount: newUsedCount, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePromoCode(id: string): Promise<void> {
    await db
      .delete(promoCodes)
      .where(eq(promoCodes.id, id));
  }
}

export const storage = new DatabaseStorage();
