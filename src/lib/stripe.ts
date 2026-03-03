import Stripe from "stripe";

/**
 * Lazy-initialised Stripe client.
 * Avoids crashing the build when STRIPE_SECRET_KEY isn't set yet —
 * the error only fires at request time if the key is still missing.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/**
 * Stripe Price IDs — set these in your .env.local (and Vercel) after
 * creating products in the Stripe Dashboard.
 *
 * STRIPE_PRICE_ANNUAL  = the $24.99/year recurring price
 */
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL || "";
