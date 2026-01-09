/* ----------------------------------
   Billing Plans – Single Source of Truth
---------------------------------- */

// Set renew days alwasys be set as 30 days
// This billing days used in renewExpriredPlan.cron.js
export const BILLING_DAYS = 30;

// Trial period in days
// Usage in app.pricing.jsx
export const TRIAL_DAYS = 15;

// initial  susbcription config (used in subscription creation subscription.server.js)
export const SUBSCRIPTION_CONFIG = {
  isTestMode: true,
  cappedAmount: 149.99,
  currencyCode: "USD",
  intervalDays: "EVERY_30_DAYS",
};

/**
 * Supported plan keys
 * @typedef {"TRIAL" | "STANDARD" | "GROW" | "ENTERPRISE"} PlanKey
 */

export const BILLING_PLANS = {
  TRIAL: {
    key: "TRIAL",
    basePrice: 0,
    orderThreshold: 0,
  },

  STANDARD: {
    key: "STANDARD",
    basePrice: 15,
    orderThreshold: 0,
  },

  GROW: {
    key: "GROW",
    basePrice: 40,
    orderThreshold: 2000,
  },

  ENTERPRISE: {
    key: "ENTERPRISE",
    basePrice: 50,
    orderThreshold: 5000,
  },
};

/* ----------------------------------
   Plan ranking (used for upgrades)
---------------------------------- */

export const PLAN_RANK = {
  TRIAL: -1,
  STANDARD: 0,
  GROW: 1,
  ENTERPRISE: 2,
};

/* ----------------------------------
   Helpers (NO LOGIC CHANGE)
---------------------------------- */

/**
 * Resolve plan based on order count
 * @param {number} orderCount
 * @returns {PlanKey}
 */
export function resolvePlanByOrders(orderCount) {
  if (orderCount > BILLING_PLANS.ENTERPRISE.orderThreshold) {
    return "ENTERPRISE";
  }

  if (orderCount > BILLING_PLANS.GROW.orderThreshold) {
    return "GROW";
  }

  return "STANDARD";
}

/**
 * Get base price for a plan
 * @param {PlanKey} plan
 * @returns {number}
 */
export function getPlanPrice(plan) {
  return BILLING_PLANS[plan]?.basePrice ?? 0;
}
