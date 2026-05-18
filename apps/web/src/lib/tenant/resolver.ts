import { prismaRead } from "@gamepulse/database";
import type { Tenant } from "@gamepulse/database";

/**
 * Resolves the active tenant from:
 * 1. X-Tenant-Slug header (set by a proxy or ingress)
 * 2. Subdomain of the Host header (e.g. "acme.gamepulse.app" → slug "acme")
 * 3. Custom domain exact match
 *
 * Returns null when no tenant matches — the app falls back to default (single-tenant) mode.
 */
export async function resolveTenant(
  headers: Headers,
): Promise<Tenant | null> {
  // 1. Explicit header — used by reverse proxies or internal services
  const slugHeader = headers.get("x-tenant-slug");
  if (slugHeader) {
    return prismaRead.tenant.findUnique({ where: { slug: slugHeader, isActive: true } });
  }

  const host = headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";

  // 2. Subdomain detection — expects format: {slug}.gamepulse.app or {slug}.localhost
  const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.(gamepulse\.app|localhost)$/);
  if (subdomainMatch?.[1] && subdomainMatch[1] !== "www") {
    return prismaRead.tenant.findUnique({
      where: { slug: subdomainMatch[1], isActive: true },
    });
  }

  // 3. Custom domain
  if (hostname && hostname !== "localhost") {
    return prismaRead.tenant.findUnique({ where: { domain: hostname, isActive: true } });
  }

  return null;
}
