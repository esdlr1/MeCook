import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
