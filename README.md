
# DHT Sensor + Vercel + MongoDB Atlas (Ready-to-Deploy)

โครงงานตัวอย่างสำหรับรับข้อมูลจาก ESP32 (DHT11/DHT22) แล้วบันทึกลง **MongoDB Atlas** ผ่าน **Vercel Serverless Functions** พร้อมหน้าเว็บเล็ก ๆ แสดงค่าล่าสุดและประวัติ

## โครงสร้าง
```
api/
  _lib/mongo.js
  sensors/
    data.js       # รับ POST จาก ESP32 -> บันทึก readings + อัปเดต latest
    latest.js     # GET ค่าล่าสุด
    history.js    # GET ประวัติ (ใช้ทำกราฟ)
  diag/
    ping.js       # เช็กว่า route ใช้งานได้
    mongo.js      # เช็กว่าสามารถเขียน/อ่าน Atlas ได้
public/
  index.html
  fe.js
package.json
vercel.json
.env.example
```

## ตั้งค่า Environment Variables (Vercel)
ไปที่ **Project → Settings → Environment Variables** แล้วเพิ่มค่า:
- `MONGODB_URI` = (ใส่ Connection String ของคุณ)
- `MONGODB_DB`  = `dht`

> จากนั้น Redeploy หนึ่งครั้ง

## ทดสอบ API
```bash
# เช็กว่า route ติด
curl https://<your-domain>/api/diag/ping

# เช็กว่าเชื่อมต่อ Atlas ได้
curl https://<your-domain>/api/diag/mongo

# ส่งข้อมูลจำลอง (แทน ESP32)
curl -X POST https://<your-domain>/api/sensors/data   -H "Content-Type: application/json"   -d '{"deviceId":"ESP32-DHT11-001","sensorData":{"temperature":26.1,"humidity":67,"source":"curl"}}'

# ค่าล่าสุด
curl https://<your-domain>/api/sensors/latest

# ประวัติ (ล่าสุด 10 ค่า)
curl "https://<your-domain>/api/sensors/history?limit=10"
```

## ฝั่ง ESP32 (ตั้งค่า URL)
```cpp
const char* serverURL = "https://<your-domain>/api";
http.begin(String(serverURL) + "/sensors/data");
```

## หมายเหตุ
- โปรเจกต์นี้ใช้ ESM (`"type": "module"` ใน package.json)
- สำหรับการใช้งานจริง ควรสร้าง Index ใน Atlas:
  - readings: `{ deviceId: 1, createdAt: -1 }`
  - latest: `{ deviceId: 1 }` (Unique)
