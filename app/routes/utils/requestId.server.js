import crypto from "crypto";

/**
 * Returns a stable request correlation ID.
 *
 * Priority:
 * 1. Existing request ID (reverse proxy / gateway)
 * 2. Shopify webhook ID (best for webhooks)
 * 3. Generated UUID (fallback)
 */
export function getRequestId(request) {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("x-shopify-webhook-id") ||
    crypto.randomUUID()
  );
}
