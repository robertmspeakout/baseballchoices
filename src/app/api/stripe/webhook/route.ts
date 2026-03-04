import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, sendProfileReminderEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // Checkout completed — subscription created
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (customerId && subscriptionId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
            membershipActive: true,
          },
        });

        // Send verification/profile email and create profile notification
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          include: { profile: true },
        });

        if (user) {
          try {
            if (!user.emailVerified) {
              // Send verification email with link
              const token = randomUUID();
              await prisma.verificationToken.create({
                data: {
                  email: user.email,
                  code: token,
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
              });
              await sendVerificationEmail(user.email, token, user.firstName);
            } else if (!user.profile?.profileComplete) {
              // Already verified but profile incomplete — send profile reminder
              await sendProfileReminderEmail(user.email, user.firstName);
            }
          } catch (emailErr) {
            console.error("Failed to send post-purchase email:", emailErr);
          }

          // Create notification to fill out profile
          if (!user.profile?.profileComplete) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                schoolId: 0,
                type: "profile_incomplete",
                title: "Complete your player profile",
                body: "Fill out your profile so we can match you with the best college baseball programs.",
                link: "/auth/profile",
                schoolLogo: null,
              },
            });
          }
        }
      }
      break;
    }

    // Subscription updated (renewal, plan change, trial end)
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      const membershipActive =
        status === "active" || status === "trialing";

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: status,
          membershipActive,
          stripeSubscriptionId: subscription.id,
        },
      });
      break;
    }

    // Subscription deleted (canceled at period end or immediately)
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: "canceled",
          membershipActive: false,
          stripeSubscriptionId: null,
        },
      });
      break;
    }

    // Payment failed (card declined, expired, etc.)
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId as string },
          data: {
            subscriptionStatus: "past_due",
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
