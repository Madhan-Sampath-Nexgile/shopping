import { Router } from "express";
import pool from "../config/db.js";
import { auth } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";

const r = Router();
const DSPY_URL = process.env.DSPY_URL || "http://localhost:8000";
/* -------------------------------------------------------------------------- */
/* 🟢 Get All Products (with optional category + filters + sorting) */
/* -------------------------------------------------------------------------- */
r.get("/", async (req, res) => {
  const {
    category,
    q,
    minPrice = 0,
    maxPrice = 999999,
    rating = 0,
    inStock,
    sort = "newest",
  } = req.query;

  const params = [minPrice, maxPrice, rating];
  let where = `WHERE price BETWEEN $1 AND $2`;

  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }

  if (q) {
    params.push(`%${q}%`);
    where += ` AND (LOWER(name) LIKE LOWER($${params.length}) OR LOWER(description) LIKE LOWER($${params.length}))`;
  }

  if (inStock === "true") where += ` AND stock > 0`;

  const sortMap = {
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    rating: "avg_rating DESC",
    newest: "p.created_at DESC",
  };

  const query = `
    SELECT p.*, COALESCE(AVG(r.rating), 0) AS avg_rating
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    ${where}
    GROUP BY p.id
    HAVING COALESCE(AVG(r.rating), 0) >= $3
    ORDER BY ${sortMap[sort] || "p.created_at DESC"};
  `;

  try {
    const { rows } = await pool.query(query, params);
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
r.get("/wishlist", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    console.log("Fetching wishlist for user:", userId);
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.price, p.images, p.stock
       FROM wishlist w JOIN products p ON w.product_id=p.id
       WHERE w.user_id=$1`,
      [userId]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load wishlist" });
  }
});
/* -------------------------------------------------------------------------- */
/* 🟣 Get Distinct Categories */
/* -------------------------------------------------------------------------- */
r.get("/categories", async (_, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT category FROM products ORDER BY category"
    );
    res.json({ categories: rows.map((r) => r.category) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟣 Get Single Product (with specs, reviews, related, and stock status) */
/* -------------------------------------------------------------------------- */
r.get("/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    /* 1️⃣ Fetch Main Product Info */
    const productRes = await pool.query(
      `SELECT id, name, description, category, price, stock, specifications, images, accessories
       FROM products
       WHERE id=$1`,
      [id]
    );
    if (!productRes.rowCount)
      return res.status(404).json({ error: "Product not found" });
    const product = productRes.rows[0];

    /* 2️⃣ Fetch Reviews + Ratings */
    const reviewRes = await pool.query(
      `SELECT r.id, r.rating, r.comment, u.name AS reviewer, r.created_at
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id=$1
       ORDER BY r.created_at DESC`,
      [id]
    );
    product.reviews = reviewRes.rows;
    product.average_rating =
      reviewRes.rowCount > 0
        ? reviewRes.rows.reduce((a, c) => a + c.rating, 0) / reviewRes.rowCount
        : 0;

    /* 3️⃣ Fetch Q&A (if exists or placeholder) */
    const qaRes = await pool.query(
      `SELECT q.id, q.question, q.answer, u.name AS asked_by, q.created_at
       FROM product_questions q
       LEFT JOIN users u ON q.user_id = u.id
       WHERE q.product_id=$1
       ORDER BY q.created_at DESC`,
      [id]
    ).catch(() => ({ rows: [] })); // in case table doesn’t exist yet
    product.qa = qaRes.rows || [];

    /* 4️⃣ Fetch Related Products (same category or accessories) */
    const relatedRes = await pool.query(
      `SELECT id, name, price, category, images, stock
       FROM products
       WHERE (category = $1 OR id = ANY($2::uuid[]))
       AND id != $3
       LIMIT 6`,
      [product.category, product.accessories || [], product.id]
    );
    product.related = relatedRes.rows;

    /* 5️⃣ AI Summary from DSPy (optional) */
    try {
      const aiResponse = await fetch("http://localhost:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Summarize this product: ${product.name} - ${product.description}`,
        }),
      });
      const aiData = await aiResponse.json();
      product.ai_summary = aiData.results || "AI summary not available yet.";
    } catch (err) {
      console.error("⚠️ AI Summary fetch failed:", err.message);
      product.ai_summary = "AI summary not available.";
    }

    /* 6️⃣ Record Browsing History */
    if (userId) {
      try {
        const check = await pool.query(
          `SELECT id FROM browsing_history
           WHERE user_id = $1
           AND details->>'productId' = $2
           AND action_type = 'view'
           AND created_at > NOW() - INTERVAL '5 minutes'
           LIMIT 1`,
          [userId, id]
        );

        if (check.rowCount === 0) {
          await pool.query(
            `INSERT INTO browsing_history (user_id, action_type, details)
             VALUES ($1, $2, $3)`,
            [
              userId,
              "view",
              JSON.stringify({
                productId: id,
                name: product.name,
                category: product.category,
              }),
            ]
          );
        }
      } catch (err) {
        console.error("⚠️ Failed to log browsing:", err.message);
      }
    }

    /* 7️⃣ Recently Viewed Products */
    let recentlyViewed = [];
    if (userId) {
      const recentRes = await pool.query(
        `SELECT details->>'productId' AS id,
                details->>'name' AS name,
                details->>'category' AS category,
                MAX(created_at) AS viewed_at
         FROM browsing_history
         WHERE user_id = $1
         AND action_type='view'
         GROUP BY details->>'productId', details->>'name', details->>'category'
         ORDER BY viewed_at DESC
         LIMIT 5`,
        [userId]
      );
      recentlyViewed = recentRes.rows;
    }

    /* 8️⃣ Stock Availability */
    product.stock_status =
      product.stock > 0
        ? product.stock < 5
          ? `Only ${product.stock} left`
          : "In Stock"
        : "Out of Stock";

    /* ✅ Final Response */
    return res.json({
      ...product,
      recentlyViewed,
    });
  } catch (err) {
    console.error("❌ Product details error:", err);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

/* -------------------------------------------------------------------------- */
/* ❤️ Wishlist APIs */
/* -------------------------------------------------------------------------- */
r.post("/:id/wishlist", auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await pool.query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});



r.delete("/:id/wishlist", auth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2", [
      userId,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove wishlist item" });
  }
});

r.post("/:id/qa", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;

  if (!question || question.trim().length < 3)
    return res.status(400).json({ error: "Question is too short." });

  try {
    // Get product info for context
    const { rows } = await pool.query("SELECT name, description FROM products WHERE id=$1", [id]);
    const product = rows[0];
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Send to DSPy service
    const resp = await fetch(`${DSPY_URL}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: product.name,
        question,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "AI response failed");

    // Optionally log the question for analytics
    if (req.user?.id) {
      await pool.query(
        `INSERT INTO browsing_history (user_id, action_type, details)
         VALUES ($1, $2, $3)`,
        [req.user.id, "qa", { productId: id, question }]
      );
    }

    return res.json({ product: product.name, answer: data.answer });
  } catch (err) {
    console.error("❌ Q&A Error:", err);
    res.status(500).json({ error: "Failed to process question." });
  }
});

/* -------------------------------------------------------------------------- */
/* ✍️ Write Review */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Get Recently Viewed Products */
/* -------------------------------------------------------------------------- */
r.get('/recently-viewed', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (details->>'productId')
         details->>'productId' AS id,
         details->>'name' AS name,
         details->>'category' AS category,
         created_at
       FROM browsing_history
       WHERE user_id = $1 AND action_type = 'view'
       ORDER BY details->>'productId', created_at DESC
       LIMIT 12`,
      [userId]
    )

    // Fetch full product details
    if (rows.length > 0) {
      const productIds = rows.map(r => r.id)
      const productRes = await pool.query(
        `SELECT id, name, category, price, images
         FROM products
         WHERE id = ANY($1::uuid[])`,
        [productIds]
      )

      return res.json({ products: productRes.rows })
    }

    return res.json({ products: [] })
  } catch (err) {
    console.error('❌ Recently viewed error:', err)
    res.status(500).json({ error: 'Failed to fetch recently viewed products' })
  }
})

r.post("/:id/reviews", auth, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  if (!comment || comment.trim().length < 10) {
    return res.status(400).json({ error: "Comment must be at least 10 characters" });
  }

  try {
    // Check if product exists
    const productCheck = await pool.query("SELECT id FROM products WHERE id=$1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await pool.query(
      "SELECT id FROM reviews WHERE product_id=$1 AND user_id=$2",
      [id, userId]
    );

    if (existingReview.rows.length > 0) {
      // Update existing review
      await pool.query(
        "UPDATE reviews SET rating=$1, comment=$2, created_at=NOW() WHERE product_id=$3 AND user_id=$4",
        [rating, comment, id, userId]
      );
    } else {
      // Create new review
      await pool.query(
        "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)",
        [id, userId, rating, comment]
      );
    }

    return res.json({ success: true, message: "Review submitted successfully" });
  } catch (err) {
    console.error("❌ Review submission error:", err);
    return res.status(500).json({ error: "Failed to submit review" });
  }
});

export default r;
