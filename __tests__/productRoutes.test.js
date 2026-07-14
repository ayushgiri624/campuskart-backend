const request = require("supertest");
const app = require("../app");
const { connect, closeDatabase, clearDatabase } = require("./testSetup");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

const validProduct = {
  title: "Test Book",
  description: "A test listing",
  price: 100,
  category: "Books",
  sellerName: "Ayush Giri",
  sellerEmail: "giriayush624@gmail.com",
  sellerUid: "test-uid-123",
};

describe("POST /api/products", () => {
  it("creates a product with valid data", async () => {
    const res = await request(app).post("/api/products").send(validProduct);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Book");
    expect(res.body.price).toBe(100);
  });

  it("rejects a product with no title", async () => {
    const { title, ...rest } = validProduct;
    const res = await request(app).post("/api/products").send(rest);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Title is required/);
  });

  it("rejects a negative price", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ ...validProduct, price: -50 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/positive number/);
  });

  it("rejects an invalid seller email", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ ...validProduct, sellerEmail: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Seller email is invalid/);
  });

  it("rejects an invalid category", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ ...validProduct, category: "NotARealCategory" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/products", () => {
  it("returns an empty array when no products exist", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns created products", async () => {
    await request(app).post("/api/products").send(validProduct);
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Test Book");
  });
});

describe("GET /api/products/:id", () => {
  it("returns 400 for an invalid id", async () => {
    const res = await request(app).get("/api/products/not-a-real-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed but nonexistent id", async () => {
    const res = await request(app).get("/api/products/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/:id", () => {
  it("deletes an existing product", async () => {
    const created = await request(app).post("/api/products").send(validProduct);
    const res = await request(app).delete(`/api/products/${created.body._id}`);
    expect(res.status).toBe(200);
  });

  it("returns 404 when deleting a nonexistent product", async () => {
    const res = await request(app).delete("/api/products/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });
});