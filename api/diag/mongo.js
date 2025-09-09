
import clientPromise from "../_lib/mongo.js";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "dht");
    const ts = new Date();
    await db.collection("diag").insertOne({ ts });
    const one = await db.collection("diag").findOne({}, { sort: { ts: -1 } });
    res.status(200).json({ ok: true, wrote: ts, readBack: one?.ts });
  } catch (e) {
    console.error("GET /api/diag/mongo error:", e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
