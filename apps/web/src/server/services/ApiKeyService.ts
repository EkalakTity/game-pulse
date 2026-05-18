import crypto from "crypto";
import { prisma, type ApiKey } from "@gamepulse/database";

export type { ApiKey };

function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export class ApiKeyService {
  async list(): Promise<ApiKey[]> {
    return prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  }

  /** Creates a new key and returns it with the raw plaintext (shown once only) */
  async create(name: string): Promise<{ key: ApiKey; plaintext: string }> {
    const plaintext = "gpk_" + crypto.randomBytes(32).toString("hex");
    const keyHash = hashKey(plaintext);
    const keyPrefix = plaintext.slice(0, 12);

    const key = await prisma.apiKey.create({
      data: { name, keyHash, keyPrefix },
    });

    return { key, plaintext };
  }

  async revoke(id: string): Promise<void> {
    await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  async delete(id: string): Promise<void> {
    await prisma.apiKey.delete({ where: { id } });
  }

  /** Validates a bearer token from the Authorization header. Returns the key record or null. */
  async validate(rawKey: string): Promise<ApiKey | null> {
    const hash = hashKey(rawKey);
    const key = await prisma.apiKey.findFirst({ where: { keyHash: hash, isActive: true } });
    if (!key) return null;

    // Fire-and-forget lastUsedAt update
    prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    return key;
  }
}
