// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mockCookieSet, get: mockCookieGet })),
}));

import { createSession, getSession } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  mockCookieSet.mockClear();
  mockCookieGet.mockClear();
});

test("sets a cookie named auth-token", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  expect(mockCookieSet.mock.calls[0][0]).toBe("auth-token");
});

test("cookie is httpOnly with lax sameSite and root path", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("cookie is not secure outside of production", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.secure).toBe(false);
});

test("cookie is secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");

  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.secure).toBe(true);

  vi.unstubAllEnvs();
});

test("cookie expires in 7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const options = mockCookieSet.mock.calls[0][2];
  const expiresAt: Date = options.expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expiresAt.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("cookie value is a JWT containing userId and email", async () => {
  await createSession("user-1", "user@example.com");

  const token = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("user@example.com");
});

test("JWT payload contains an expiresAt date matching the cookie expiry", async () => {
  await createSession("user-1", "user@example.com");

  const token = mockCookieSet.mock.calls[0][1];
  const options = mockCookieSet.mock.calls[0][2];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const jwtExpiresAt = new Date(payload.expiresAt as string).getTime();
  const cookieExpiresAt = (options.expires as Date).getTime();
  expect(jwtExpiresAt).toBe(cookieExpiresAt);
});

test("getSession returns null when no cookie is present", async () => {
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "user@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("user@example.com");
});

test("getSession returns null for a tampered token", async () => {
  mockCookieGet.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken({ userId: "user-1", email: "user@example.com" }, "-1s");
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns expiresAt in the session payload", async () => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const token = await makeToken({ userId: "user-1", email: "user@example.com", expiresAt });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session?.expiresAt).toBeTruthy();
});
