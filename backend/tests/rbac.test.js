import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/User.js";

const TEST_DB_URI = "mongodb://localhost:27017/nawi_test_db";

let normalToken;
let adminToken;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_DB_URI);

  await User.deleteMany({});

  // 1. Create a Normal User
  await request(app)
    .post("/api/auth/register")
    .send({
      email: "inspector_rbac@nawi.com",
      password: "Password99",
      username: "InspectorRbac",
    });

  const normalLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: "inspector_rbac@nawi.com",
      password: "Password99",
    });
  normalToken = normalLogin.body.token;

  // 2. Create an Admin Whitelist User
  await request(app)
    .post("/api/auth/register")
    .send({
      email: "ilmchikhli@gmail.com",
      password: "Password99",
      username: "AdminUser",
    });

  // Escalate AdminUser to admin role in database
  await User.updateOne({ email: "ilmchikhli@gmail.com" }, { role: "admin" });

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: "ilmchikhli@gmail.com",
      password: "Password99",
    });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("Role-Based Access Control (RBAC) Tests", () => {
  test("Normal Inspector accessing reports route - Allowed", async () => {
    const res = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${normalToken}`);

    expect(res.status).toBe(200);
  });

  test("Normal Inspector accessing admin dashboard route - Blocked (403)", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${normalToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Admin access denied");
  });

  test("Admin Whitelist User accessing admin dashboard route - Allowed (200)", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("Non-admin user accessing user management - Blocked (403)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${normalToken}`);

    expect(res.status).toBe(403);
  });

  test("Admin accessing user list - Allowed (200)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
