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

const userA = {
  userUid: "user-a-uid",
  userName: "Alice",
  userEmail: "alice@example.com",
};

const userB = {
  otherUid: "user-b-uid",
  otherName: "Bob",
  otherEmail: "bob@example.com",
};

describe("POST /api/conversations", () => {
  it("creates a new conversation between two different users", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .send({ ...userA, ...userB });
    expect(res.status).toBe(200);
    expect(res.body.participants).toEqual(
      expect.arrayContaining(["user-a-uid", "user-b-uid"])
    );
  });

  it("returns the same conversation if one already exists between the two users", async () => {
    const first = await request(app)
      .post("/api/conversations")
      .send({ ...userA, ...userB });
    const second = await request(app)
      .post("/api/conversations")
      .send({ ...userA, ...userB });
    expect(second.body._id).toBe(first.body._id);
  });

  it("rejects when otherUid is missing", async () => {
    const res = await request(app).post("/api/conversations").send(userA);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/otherUid is required/);
  });

  it("rejects when userUid equals otherUid", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .send({ userUid: "same-uid", otherUid: "same-uid" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot start a conversation with yourself/);
  });
});

describe("GET /api/conversations/:uid", () => {
  it("returns conversations for a user", async () => {
    await request(app).post("/api/conversations").send({ ...userA, ...userB });
    const res = await request(app).get("/api/conversations/user-a-uid");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("returns an empty array for a user with no conversations", async () => {
    const res = await request(app).get("/api/conversations/nobody-uid");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("messages", () => {
  async function createConversation() {
    const res = await request(app)
      .post("/api/conversations")
      .send({ ...userA, ...userB });
    return res.body._id;
  }

  it("sends a message in a valid conversation", async () => {
    const conversationId = await createConversation();
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .send({ senderUid: "user-a-uid", text: "hello there" });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe("hello there");
  });

  it("rejects sending a message with no text", async () => {
    const conversationId = await createConversation();
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .send({ senderUid: "user-a-uid" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/text is required/);
  });

  it("rejects a malformed conversationId when sending a message", async () => {
    const res = await request(app)
      .post("/api/conversations/not-a-real-id/messages")
      .send({ senderUid: "user-a-uid", text: "hello" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid ID/);
  });

  it("fetches messages for a conversation", async () => {
    const conversationId = await createConversation();
    await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .send({ senderUid: "user-a-uid", text: "hello there" });
    const res = await request(app).get(`/api/conversations/${conversationId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("marks messages as read", async () => {
    const conversationId = await createConversation();
    await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .send({ senderUid: "user-b-uid", text: "hi from bob" });
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/read`)
      .send({ uid: "user-a-uid" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects marking as read with no uid", async () => {
    const conversationId = await createConversation();
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/read`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/uid is required/);
  });
});