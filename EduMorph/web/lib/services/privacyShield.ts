import { collection, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import CryptoJS from "crypto-js";

// Privacy compliance settings
interface PrivacySettings {
  userId: string;
  dataSharing: {
    analytics: boolean;
    matchmaking: boolean;
    teacherView: boolean;
  };
  dataRetention: {
    progressHistory: number; // days
    activityLogs: number; // days
  };
  encryption: {
    enabled: boolean;
    sensitiveFields: string[];
  };
  lastUpdated: Date;
}

export class PrivacyShield {
  private static readonly ENCRYPTION_KEY =
    process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default-key-change-in-production";

  /**
   * Initialize privacy settings for a new user
   */
  static async initializePrivacySettings(userId: string): Promise<void> {
    const defaultSettings: PrivacySettings = {
      userId,
      dataSharing: {
        analytics: true,
        matchmaking: true,
        teacherView: true,
      },
      dataRetention: {
        progressHistory: 365, // 1 year
        activityLogs: 90, // 3 months
      },
      encryption: {
        enabled: true,
        sensitiveFields: ["email", "displayName"],
      },
      lastUpdated: new Date(),
    };

    const settingsRef = doc(db, "privacySettings", userId);
    await setDoc(settingsRef, {
      ...defaultSettings,
      lastUpdated: Timestamp.fromDate(defaultSettings.lastUpdated),
    });
  }

  /**
   * Get privacy settings for a user
   */
  static async getPrivacySettings(
    userId: string,
  ): Promise<PrivacySettings | null> {
    const settingsRef = doc(db, "privacySettings", userId);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      await this.initializePrivacySettings(userId);
      return await this.getPrivacySettings(userId);
    }

    const data = settingsSnap.data();
    return {
      ...data,
      lastUpdated: data.lastUpdated.toDate(),
    } as PrivacySettings;
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
  ): Promise<void> {
    const settingsRef = doc(db, "privacySettings", userId);
    await setDoc(
      settingsRef,
      {
        ...updates,
        lastUpdated: Timestamp.now(),
      },
      { merge: true },
    );
  }

  /**
   * Encrypt sensitive data
   */
  static encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Anonymize user data for analytics
   */
  static anonymizeData(data: any): any {
    const anonymized = { ...data };

    // Remove personal identifiers
    delete anonymized.email;
    delete anonymized.displayName;
    delete anonymized.uid;

    // Replace with anonymized IDs
    anonymized.anonymousId = CryptoJS.SHA256(data.uid || "").toString();

    return anonymized;
  }

  /**
   * Check if user has consented to data usage
   */
  static async hasConsent(
    userId: string,
    purpose: "analytics" | "matchmaking" | "teacherView",
  ): Promise<boolean> {
    const settings = await this.getPrivacySettings(userId);
    if (!settings) return false;

    return settings.dataSharing[purpose];
  }

  /**
   * Delete old data based on retention settings
   */
  static async cleanupOldData(userId: string): Promise<void> {
    const settings = await this.getPrivacySettings(userId);
    if (!settings) return;

    const now = new Date();

    // Calculate cutoff dates
    const progressCutoff = new Date(
      now.getTime() - settings.dataRetention.progressHistory * 24 * 60 * 60 * 1000,
    );
    const activityCutoff = new Date(
      now.getTime() - settings.dataRetention.activityLogs * 24 * 60 * 60 * 1000,
    );

    // Note: Actual deletion logic would go here
    // For now, just log the operation
    console.log(`Cleaning up data older than:`, {
      progress: progressCutoff,
      activity: activityCutoff,
    });
  }
}
