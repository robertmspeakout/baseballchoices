import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

/**
 * Stripe Price IDs — set these in your .env.local after creating
 * products in the Stripe Dashboard.
 *
 * STRIPE_PRICE_ANNUAL  = the $19.99/year recurring price
 */
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL || "";
