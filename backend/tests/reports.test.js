import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import User from "../models/User.js";
import Report from "../models/Report.js";

const TEST_DB_URI = "mongodb://localhost:27017/nawi_test_db";

let token;
let userId;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_DB_URI);

  // Register inspector and get token
  await User.deleteMany({});
  await Report.deleteMany({});

  await request(app)
    .post("/api/auth/register")
    .send({
      email: "inspector@nawi.com",
      password: "Password99",
      username: "InspectorOne",
    });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "inspector@nawi.com",
      password: "Password99",
    });

  token = loginRes.body.token;
  userId = loginRes.body.user.id;
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("Report Operations Integration Tests", () => {
  const sampleReportData = {
    client_name: "Radhe Agro",
    client_address: "CIDCO Aurangabad",
    instrument_make: "Mettler",
    instrument_model: "MT-10",
    serial_number: "SN-9021",
    capacity_max: 500,
    capacity_min: 5,
    verification_interval: "e",
    accuracy_class: "III",
  };

  let createdReportId;

  test("Create Report - Success", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleReportData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.report.report_number).toBeDefined();
    expect(res.body.report.report_number.startsWith("REP-")).toBe(true);
    expect(res.body.report.status).toBe("draft");
    expect(res.body.report.current_step).toBe(1);

    createdReportId = res.body.report._id;
  });

  test("Get Report Details (Recovery/Refresh)", async () => {
    const res = await request(app)
      .get(`/api/reports/${createdReportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdReportId);
    expect(res.body.client_name).toBe(sampleReportData.client_name);
  });

  test("Update Report - Track Modifications", async () => {
    const updates = {
      client_name: "Radhe Agro Private Limited",
      capacity_max: 600,
    };

    const res = await request(app)
      .put(`/api/reports/${createdReportId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report.client_name).toBe("Radhe Agro Private Limited");
    expect(res.body.report.capacity_max).toBe(600);

    // Verify history logs
    expect(res.body.report.modification_history.length).toBeGreaterThan(0);
    const historyItem = res.body.report.modification_history[0];
    expect(historyItem.field_changed).toBe("client_name");
    expect(historyItem.old_value).toBe("Radhe Agro");
    expect(historyItem.new_value).toBe("Radhe Agro Private Limited");
  });

  test("Soft Delete Report", async () => {
    const res = await request(app)
      .delete(`/api/reports/${createdReportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify state is archived in DB and not removed completely
    const dbReport = await Report.findById(createdReportId);
    expect(dbReport).toBeDefined();
    expect(dbReport.status).toBe("archived");
  });

  test("PDF Export Document Generation", async () => {
    const res = await request(app)
      .get(`/api/reports/${createdReportId}/pdf`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });
});
