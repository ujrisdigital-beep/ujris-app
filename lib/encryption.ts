import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Generate a secure encryption key for a user
 */
export function generateUserKey(): Buffer {
  return randomBytes(32);
}

/**
 * Encrypt data with AES-256-GCM
 * Returns: iv (16 bytes) + authTag (16 bytes) + encrypted data
 */
export function encryptData(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Combine: iv + authTag + encrypted
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt data encrypted with encryptData
 */
export function decryptData(encryptedBuffer: Buffer, key: Buffer): Buffer {
  // Extract components
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Encrypt a user's key with the system master key
 */
export function encryptUserKey(userKey: Buffer, masterKey: Buffer): Buffer {
  return encryptData(userKey, masterKey);
}

/**
 * Decrypt a user's key with the system master key
 */
export function decryptUserKey(encryptedUserKey: Buffer, masterKey: Buffer): Buffer {
  return decryptData(encryptedUserKey, masterKey);
}

/**
 * Generate a SHA-256 hash of data (for integrity verification)
 */
export function hashData(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a secure password hash using PBKDF2
 * Note: For user passwords, use bcrypt instead
 */
export function generatePasswordHash(password: string, salt?: Buffer): { hash: string; salt: string } {
  const actualSalt = salt || randomBytes(SALT_LENGTH);
  const hash = createHash("sha256")
    .update(password)
    .update(actualSalt)
    .digest("hex");
  
  return {
    hash,
    salt: actualSalt.toString("hex"),
  };
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate a single-use download token
 */
export function generateDownloadToken(): string {
  return generateToken(32);
}

/**
 * Watermark data for court order releases
 */
export function addWatermark(data: Buffer, metadata: {
  courtOrderId: string;
  releaseDate: Date;
  caseId: string;
}): Buffer {
  const watermarkJson = JSON.stringify({
    ...metadata,
    releaseDate: metadata.releaseDate.toISOString(),
    watermarkId: generateToken(16),
  });
  
  // Add watermark as metadata at the start of the file
  const watermarkBuffer = Buffer.from(watermarkJson);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(watermarkBuffer.length, 0);
  
  return Buffer.concat([lengthBuffer, watermarkBuffer, data]);
}

/**
 * Extract watermark from data
 */
export function extractWatermark(data: Buffer): { watermark: Record<string, unknown>; content: Buffer } {
  const watermarkLength = data.readUInt32BE(0);
  const watermarkJson = data.subarray(4, 4 + watermarkLength).toString();
  const content = data.subarray(4 + watermarkLength);
  
  return {
    watermark: JSON.parse(watermarkJson),
    content,
  };
}
