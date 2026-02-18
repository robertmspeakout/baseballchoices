import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(SALT_LENGTH).toString("hex");
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Support legacy bcrypt hashes (starts with $2a$ or $2b$)
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }

  // New scrypt-based hashes (salt:hash format)
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) {
      resolve(false);
      return;
    }
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      const hashBuffer = Buffer.from(hash, "hex");
      resolve(timingSafeEqual(hashBuffer, derivedKey));
    });
  });
}
