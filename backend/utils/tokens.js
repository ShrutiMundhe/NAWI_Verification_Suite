import jwt from "jsonwebtoken";

/**
 * Generates a signed JSON Web Token (JWT) valid for 7 days.
 * @param {object} payload - The token payload (e.g. { userId, email, role })
 * @returns {string} Signed JWT
 */
export function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

/**
 * Verifies the validity and expiration of a JWT token.
 * @param {string} token - The signed JWT string
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }
  return jwt.verify(token, secret);
}
