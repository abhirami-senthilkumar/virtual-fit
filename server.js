import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


// To resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/static-image", express.static(path.join(__dirname, "static-image")));

// const PORT = 5000;
const PORT = process.env.PORT || 5000;


// --- TRY ON API ---
app.post("/api/tryon", async (req, res) => {
    const { imageUrl, styleImageUrl } = req.body;

    try {
        // ✅ Convert base64 image to file and save locally
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const filename = `upload_${Date.now()}.png`;
        const uploadPath = path.join(__dirname, "uploads", filename);

        // Ensure uploads folder exists
        if (!fs.existsSync(path.join(__dirname, "uploads"))) {
            fs.mkdirSync(path.join(__dirname, "uploads"));
        }

        fs.writeFileSync(uploadPath, Buffer.from(base64Data, "base64"));

        // ✅ Create a local URL accessible by LightX API
        const localUrl = `http://localhost:${PORT}/uploads/${filename}`;
        // const localUrl = `${process.env.BASE_URL || "https://virtual-fit.onrender.com"}/uploads/${filename}`;

        /* const localUrl = "https://images.pexels.com/photos/1580271/pexels-photo-1580271.jpeg";
        const styleImageUrl = "https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg"; */

        const data = {
            "imageUrl": localUrl,
            "styleImageUrl": styleImageUrl, // already a URL from assets
        };
        console.log("data", data);


        // ✅ Send the URLs to LightX API
        const response = await axios.post(
            "https://api.lightxeditor.com/external/api/v2/aivirtualtryon",
            JSON.stringify(data),
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.LIGHTX_API_KEY,
                },
            }
        );

        // console.log("✅ LightX Success:", response.data);
        res.json(response.data);
    } catch (err) {
        console.error("❌ Error details:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || "API call failed" });
    }
});

// --- CHECK RESULT API ---
app.post("/api/tryonRes", async (req, res) => {
    const { orderId } = req.body;

    try {
        const response = await axios.post(
            "https://api.lightxeditor.com/external/api/v2/order-status",
            { orderId },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.LIGHTX_API_KEY,
                },
            }
        );

        console.log("✅ LightX Response:", response.data);
        res.json(response.data);
    } catch (err) {
        console.error("❌ Error details:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || "API call failed" });
    }
});

app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
);
