import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";

let server: Server;
let baseUrl: string;
let directory: string;
let prisma: typeof import("../src/lib/prisma.js").prisma;

async function request(route: string, options: { method?: string; token?: string; body?: unknown } = {}) {
  return fetch(`${baseUrl}/api/v1${route}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.body !== undefined ? { "content-type": "application/json" } : {})
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });
}

async function register(email: string, role: "CLIENT" | "FREELANCER") {
  const response = await request("/auth/register", {
    method: "POST",
    body: { name: role === "CLIENT" ? "Test Client" : "Test Freelancer", email, password: "Password123!", role }
  });
  expect(response.status).toBe(201);
  return (await response.json() as { data: { user: { id: string }; accessToken: string } }).data;
}

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "archer-api-tests-"));
  const databasePath = path.join(directory, "test.db");
  const migrationPath = path.resolve("prisma/migrations/20260908000000_init/migration.sql");
  const migration = await readFile(migrationPath, "utf8");
  const database = new Database(databasePath);
  database.exec(migration);
  database.close();

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = `file:${databasePath}`;
  process.env.JWT_ACCESS_SECRET = "test-access-secret-with-32-characters";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-32-characters";
  process.env.RATE_LIMIT_MAX = "1000";

  const api = await import("../src/app.js");
  ({ prisma } = await import("../src/lib/prisma.js"));
  server = api.app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not bind test server");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (prisma) await prisma.$disconnect();
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe("critical API workflows", () => {
  it("validates registration and protects authenticated role-specific routes", async () => {
    const invalid = await request("/auth/register", { method: "POST", body: { email: "bad", password: "short" } });
    expect(invalid.status).toBe(400);
    expect((await invalid.json() as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");

    const freelancer = await register("freelancer@example.test", "FREELANCER");
    const unauthenticated = await request("/jobs", { method: "POST", body: {} });
    expect(unauthenticated.status).toBe(401);
    const wrongRole = await request("/jobs", { method: "POST", token: freelancer.accessToken, body: {} });
    expect(wrongRole.status).toBe(403);
  });

  it("creates a project on proposal acceptance and restricts project access to participants", async () => {
    const client = await register("client@example.test", "CLIENT");
    const freelancer = await register("worker@example.test", "FREELANCER");
    const outsider = await register("outsider@example.test", "FREELANCER");

    const createdJob = await request("/jobs", {
      method: "POST",
      token: client.accessToken,
      body: { title: "Build a project dashboard", description: "Create a responsive dashboard with reporting and clear workflows.", budgetAmount: 125000, budgetCurrency: "USD" }
    });
    expect(createdJob.status).toBe(201);
    const jobId = (await createdJob.json() as { data: { id: string; status: string } }).data.id;

    const published = await request(`/jobs/${jobId}/publish`, { method: "POST", token: client.accessToken });
    expect(published.status).toBe(200);
    expect((await published.json() as { data: { status: string } }).data.status).toBe("PUBLISHED");

    const proposalResponse = await request("/proposals", {
      method: "POST",
      token: freelancer.accessToken,
      body: { jobId, coverLetter: "I have delivered similar dashboards and can complete this work with clear weekly updates.", bidAmount: 110000, bidCurrency: "USD", estimatedDays: 20 }
    });
    expect(proposalResponse.status).toBe(201);
    const proposalId = (await proposalResponse.json() as { data: { id: string } }).data.id;

    const duplicate = await request("/proposals", {
      method: "POST",
      token: freelancer.accessToken,
      body: { jobId, coverLetter: "I have delivered similar dashboards and can complete this work with clear weekly updates.", bidAmount: 110000, bidCurrency: "USD" }
    });
    expect(duplicate.status).toBe(409);

    const accepted = await request(`/proposals/${proposalId}/accept`, { method: "POST", token: client.accessToken });
    expect(accepted.status).toBe(200);
    const result = (await accepted.json() as { data: { project: { id: string; status: string; agreedAmount: number; agreedCurrency: string } } }).data;
    expect(result.project).toMatchObject({ status: "NOT_STARTED", agreedAmount: 110000, agreedCurrency: "USD" });

    const projectResponse = await request(`/projects/${result.project.id}`, { token: freelancer.accessToken });
    expect(projectResponse.status).toBe(200);
    const project = (await projectResponse.json() as { data: { conversation: { id: string } } }).data;
    expect(project.conversation.id).toBeTruthy();

    const denied = await request(`/projects/${result.project.id}`, { token: outsider.accessToken });
    expect(denied.status).toBe(404);
  });
});
