import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const TEST_DB_URI = "mongodb://localhost:27017/nawi_test_db";

beforeAll(async () => {
  // If mongoose is already connected, disconnect first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await AuditLog.deleteMany({});
});

describe("Authentication Integration Tests", () => {
  const registerPayload = {
    email: "testuser@nawi.com",
    password: "Password99",
    username: "TestInspector",
  };

  test("User Registration - Success", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(registerPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();

    // Verify Audit Log
    const logs = await AuditLog.find({ action: "REGISTER" });
    expect(logs.length).toBe(1);

    // Verify bcrypt hashing in DB
    const dbUser = await User.findOne({ email: "testuser@nawi.com" });
    expect(dbUser).toBeDefined();
    expect(dbUser.password_hash).not.toBe("Password99");
    expect(dbUser.password_hash.startsWith("$2a$") || dbUser.password_hash.startsWith("$2b$")).toBe(true);
  });

  test("User Registration - Duplicate Email", async () => {
    // Register first user
    await request(app).post("/api/auth/register").send(registerPayload);

    // Register second user with same email
    const res = await request(app)
      .post("/api/auth/register")
      .send(registerPayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("User Registration - Weak Password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "weakpass@nawi.com",
        password: "123",
        username: "Weak",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("User Login - Success", async () => {
    // Register first
    await request(app).post("/api/auth/register").send(registerPayload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testuser@nawi.com",
        password: "Password99",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password_hash).toBeUndefined();

    // Verify Audit Log
    const logs = await AuditLog.find({ action: "LOGIN" });
    expect(logs.length).toBe(1);
  });

  test("User Login - Invalid Credentials", async () => {
    await request(app).post("/api/auth/register").send(registerPayload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testuser@nawi.com",
        password: "WrongPassword123",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("Admin Whitelist Verification", async () => {
    // Non-admin email
    const regResUser = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@nawi.com",
        password: "Password99",
        username: "NormalUser",
      });

    // Admin whitelist email
    const regResAdmin = await request(app)
      .post("/api/auth/register")
      .send({
        email: "ilmchikhli@gmail.com",
        password: "Password99",
        username: "AdminUser",
      });

    // Make AdminUser role = 'admin' in database
    await User.updateOne({ email: "ilmchikhli@gmail.com" }, { role: "admin" });

    // Login Admin
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "ilmchikhli@gmail.com",
        password: "Password99",
      });

    expect(loginRes.body.user.role).toBe("admin");
  });
});
