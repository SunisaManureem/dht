
import clientPromise from "../../_lib/mongo.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const deviceId = (req.query && req.query.deviceId) || "ESP32-DHT11-001";
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "dht");
    const latest = await db.collection("latest").findOne({ deviceId });
    res.status(200).json({ ok: true, latest });
  } catch (e) {
    console.error("GET /api/sensors/latest error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
