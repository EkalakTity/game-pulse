import crypto from "node:crypto";
import { prisma } from "@gamepulse/database";

export class DuplicateDetector {
  buildHash(title: string, url: string): string {
    const cleanUrl = this.normalizeUrl(url);
    const cleanTitle = title.toLowerCase().trim();
    return crypto.createHash("sha256").update(`${cleanTitle}${cleanUrl}`).digest("hex");
  }

  async isDuplicate(hash: string): Promise<boolean> {
    const existing = await prisma.duplicateHash.findUnique({ where: { hash } });
    return existing !== null;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const paramsToRemove = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
      paramsToRemove.forEach((p) => parsed.searchParams.delete(p));
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return url;
    }
  }
}
