import { Resend } from "resend";

const FROM_EMAIL = process.env.EMAIL_FROM || "ExtraBase <noreply@extrabase.app>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function sendPasswordResetEmail(email: string, code: string, firstName: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your ExtraBase password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #CC0000;">EXTRA</span><span style="color: #111;">BASE</span>
          </span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #111; text-align: center; margin-bottom: 8px;">
          Reset Your Password
        </h1>
        <p style="font-size: 15px; color: #555; text-align: center; margin-bottom: 32px;">
          Hi ${firstName}, enter this code to reset your password.
        </p>
        <div style="background: #f8f8f8; border: 2px solid #e5e5e5; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #111;">
            ${code}
          </span>
        </div>
        <p style="font-size: 13px; color: #999; text-align: center;">
          This code expires in 15 minutes. If you didn't request a password reset, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, verificationCode: string, firstName: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://extrabase.app";
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Welcome to ExtraBase, ${firstName}!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #CC0000;">EXTRA</span><span style="color: #111;">BASE</span>
          </span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #111; text-align: center; margin-bottom: 8px;">
          Welcome to ExtraBase, ${firstName}!
        </h1>
        <p style="font-size: 15px; color: #555; text-align: center; margin-bottom: 32px;">
          Your account is ready. You have full access to explore 1,300+ college baseball programs during your 60-day free trial.
        </p>

        <div style="background: #fef9f0; border: 2px solid #f0e0c0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: 700; color: #111; margin: 0 0 8px 0;">
            Complete your player profile
          </p>
          <p style="font-size: 13px; color: #555; margin: 0 0 12px 0;">
            Fill out your profile so our AI Scout can match you with the best programs for your playing style, academics, and preferences.
          </p>
          <a href="${baseUrl}/auth/profile" style="display: inline-block; background: #CC0000; color: #fff; font-size: 13px; font-weight: 700; padding: 10px 24px; border-radius: 10px; text-decoration: none;">
            Fill Out Profile
          </a>
        </div>

        <div style="background: #f0f7ff; border: 2px solid #c0d8f0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: 700; color: #111; margin: 0 0 8px 0;">
            Verify your email
          </p>
          <p style="font-size: 13px; color: #555; margin: 0 0 12px 0;">
            Use this code to confirm your email address:
          </p>
          <div style="background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #111;">
              ${verificationCode}
            </span>
          </div>
          <a href="${baseUrl}/auth/verify?email=${encodeURIComponent(email)}" style="display: inline-block; background: #1a56db; color: #fff; font-size: 13px; font-weight: 700; padding: 10px 24px; border-radius: 10px; text-decoration: none;">
            Verify Email
          </a>
          <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
            This code expires in 15 minutes.
          </p>
        </div>

        <p style="font-size: 13px; color: #999; text-align: center;">
          If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

/** @deprecated Use sendWelcomeEmail instead — kept for backward compatibility with resend-code flow */
export async function sendVerificationEmail(email: string, code: string, firstName: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your ExtraBase verification code",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #CC0000;">EXTRA</span><span style="color: #111;">BASE</span>
          </span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #111; text-align: center; margin-bottom: 8px;">
          Verify Your Email
        </h1>
        <p style="font-size: 15px; color: #555; text-align: center; margin-bottom: 32px;">
          Hi ${firstName}, enter this code to verify your email address.
        </p>
        <div style="background: #f8f8f8; border: 2px solid #e5e5e5; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #111;">
            ${code}
          </span>
        </div>
        <p style="font-size: 13px; color: #999; text-align: center;">
          This code expires in 15 minutes.
        </p>
      </div>
    `,
  });
}

export async function sendProfileReminderEmail(email: string, firstName: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://extrabase.app";
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to ExtraBase — complete your profile",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #CC0000;">EXTRA</span><span style="color: #111;">BASE</span>
          </span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #111; text-align: center; margin-bottom: 8px;">
          Thanks for subscribing, ${firstName}!
        </h1>
        <p style="font-size: 15px; color: #555; text-align: center; margin-bottom: 32px;">
          You now have full access to ExtraBase. Complete your player profile so we can match you with the best college baseball programs.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${baseUrl}/auth/profile" style="display: inline-block; background: #CC0000; color: #fff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
            Complete Your Profile
          </a>
        </div>
        <p style="font-size: 13px; color: #999; text-align: center;">
          Your profile helps our AI Scout find the best program matches for your playing style, academics, and preferences.
        </p>
      </div>
    `,
  });
}
