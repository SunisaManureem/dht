
import clientPromise from "../../_lib/mongo.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    let body = req.body ?? {};
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const now = new Date();
    const deviceId = body.deviceId || "ESP32-DHT11-001";

    const doc = {
      deviceId,
      location: body.location ?? null,
      sensorData: body.sensorData ?? {},
      createdAt: now
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "dht");

    await db.collection("readings").insertOne(doc);
    await db.collection("latest").updateOne({ deviceId }, { $set: doc }, { upsert: true });

    return res.status(200).json({ ok: true, saved: { deviceId, createdAt: now } });
  } catch (e) {
    console.error("POST /api/sensors/data error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
