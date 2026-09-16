import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

type TokenPayload = JwtPayload & {
  sub: string;
  sid?: string;
  type: "access" | "refresh";
  role?: UserRole;
};

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createAccessToken = (userId: string, role: UserRole) =>
  jwt.sign({ sub: userId, role, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"]
  });

export const createRefreshToken = (userId: string, sessionId: string) =>
  jwt.sign({ sub: userId, sid: sessionId, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"]
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

export const refreshExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt;
};
