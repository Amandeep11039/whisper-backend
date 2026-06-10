import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
