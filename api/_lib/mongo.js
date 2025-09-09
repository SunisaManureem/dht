
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI");

let clientPromise;
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, { maxPoolSize: 5 });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
