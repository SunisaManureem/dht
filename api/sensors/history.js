
import clientPromise from "../../_lib/mongo.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const deviceId = (req.query && req.query.deviceId) || "ESP32-DHT11-001";
    const limit = Math.min(parseInt((req.query && req.query.limit) || "500", 10), 2000);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "dht");

    const docs = await db.collection("readings")
      .find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    docs.reverse();
    res.status(200).json({ ok: true, count: docs.length, data: docs });
  } catch (e) {
    console.error("GET /api/sensors/history error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
