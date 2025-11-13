import { Router } from "express";
import axios from "axios";

const r = Router();
const FLASK_AI_URL = process.env.FLASK_AI_URL || "http://localhost:5000";

// 🔹 1. Product Q&A
r.post("/qa", async (req, res) => {
  try {
    const { question, product } = req.body;
    const { data } = await axios.post(`${FLASK_AI_URL}/qa`, { question, product });
    res.json(data);
  } catch (err) {
    console.error("❌ AI QA Error:", err.message);
    res.status(500).json({ error: "AI Q&A failed" });
  }
});

// 🔹 2. Recommendations
r.post("/recommend", async (req, res) => {
  try {
    const { context } = req.body;
    const { data } = await axios.post(`${FLASK_AI_URL}/recommend`, { context });
    res.json(data);
  } catch (err) {
    console.error("❌ AI Recommend Error:", err.message);
    res.status(500).json({ error: "AI Recommendation failed" });
  }
});

// 🔹 3. Recently Viewed
r.post("/recent", async (req, res) => {
  try {
    const { history } = req.body;
    const { data } = await axios.post(`${FLASK_AI_URL}/recent`, { history });
    res.json(data);
  } catch (err) {
    console.error("❌ AI Recent Error:", err.message);
    res.status(500).json({ error: "AI Recently Viewed failed" });
  }
});

// 🔹 4. Product Comparison
r.post("/compare", async (req, res) => {
  try {
    const { product_a, product_b } = req.body;
    const { data } = await axios.post(`${FLASK_AI_URL}/compare`, { product_a, product_b });
    res.json(data);
  } catch (err) {
    console.error("❌ AI Compare Error:", err.message);
    res.status(500).json({ error: "AI Comparison failed" });
  }
});

// 🔹 5. Shopping Guide
r.post("/guide", async (req, res) => {
  try {
    const { context } = req.body;
    const { data } = await axios.post(`${FLASK_AI_URL}/guide`, { context });
    res.json(data);
  } catch (err) {
    console.error("❌ AI Guide Error:", err.message);
    res.status(500).json({ error: "AI Guide failed" });
  }
});

export default r;
