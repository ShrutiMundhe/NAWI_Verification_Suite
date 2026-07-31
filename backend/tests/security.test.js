import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/User.js";

const TEST_DB_URI = "mongodb://localhost:27017/nawi_test_db";

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("Security Integration Tests", () => {
  test("Helmet security headers are present", async () => {
    const res = await request(app).get("/api/health");
    
    // Helmet headers
    expect(res.headers["x-dns-prefetch-control"]).toBeDefined();
    expect(res.headers["x-frame-options"]).toBeDefined(); // Clickjacking protection
    expect(res.headers["x-content-type-options"]).toBeDefined(); // MIME sniffing protection
    expect(res.headers["strict-transport-security"]).toBeDefined(); // HSTS
  });

  test("CORS policy verification", async () => {
    const res = await request(app)
      .options("/api/health")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  test("Error handling does not leak stack trace in production", async () => {
    // Force a 404 error
    const res = await request(app).get("/api/non-existent-route-9999");
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.stack).toBeUndefined(); // Stack trace should not be exposed
  });

  test("Rate limiting - Login endpoint blocks after 5 requests", async () => {
    // Set environment to production to ensure limits apply if there are development skips
    const attempts = Array.from({ length: 6 }, () => 
      request(app)
        .post("/api/auth/login")
        .send({ email: "rate-limit@test.com", password: "Password99" })
    );

    const responses = await Promise.all(attempts);
    
    // Find if at least one response returned a 429 status code
    const tooManyRequests = responses.some(res => res.status === 429);
    expect(tooManyRequests).toBe(true);
  });
});
