require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { MilvusClient, DataType } = require("@zilliz/milvus2-sdk-node");
const { HfInference } = require("@huggingface/inference");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());
app.set("trust proxy", true);

/* ===================================================
   1️⃣ PostgreSQL (Neon Cloud - Using Pool)
=================================================== */

const pgClient = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pgClient.on("connect", () => {
  console.log("✅ PostgreSQL (Neon) Connected");
});

pgClient.on("error", (err) => {
  console.error("❌ Unexpected Postgres error:", err);
});

/* ===================================================
   2️⃣ Zilliz Cloud Connection
=================================================== */

const milvusClient = new MilvusClient({
  address: process.env.ZILLIZ_ENDPOINT,
  token: process.env.ZILLIZ_TOKEN,
});

console.log("✅ Zilliz Connected");

/* ===================================================
   3️⃣ HuggingFace Embedding (MiniLM 384 dim)
=================================================== */

const hf = new HfInference(process.env.HF_API_KEY);

async function getEmbedding(text) {
  const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  return Array.from(embedding);
}

/* ===================================================
   4️⃣ Groq LLM
=================================================== */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ===================================================
   5️⃣ Setup Zilliz Collection (One-time Safe Check)
=================================================== */

async function setupMilvus() {
  try {
    const collections = await milvusClient.showCollections();
    const exists = collections.data.some((c) => c.name === "ev_reviews");

    if (!exists) {
      console.log("🆕 Creating Zilliz Collection...");

      await milvusClient.createCollection({
        collection_name: "ev_reviews",
        fields: [
          {
            name: "id",
            data_type: DataType.Int64,
            is_primary_key: true,
            autoID: true,
          },
          {
            name: "review_id",
            data_type: DataType.Int64,
          },
          {
            name: "ev_id",
            data_type: DataType.Int64,
          },
          {
            name: "embedding",
            data_type: DataType.FloatVector,
            type_params: { dim: "384" },
          },
        ],
      });

      await milvusClient.createIndex({
        collection_name: "ev_reviews",
        field_name: "embedding",
        index_type: "HNSW",
        metric_type: "COSINE",
        params: { M: 16, efConstruction: 200 },
      });

      console.log("✅ Zilliz Collection Created");
    }

    await milvusClient.loadCollection({ collection_name: "ev_reviews" });
    console.log("✅ Zilliz Collection Loaded");
  } catch (err) {
    console.error("❌ Zilliz Setup Error:", err);
  }
}

setupMilvus();

/* ===================================================
   6️⃣ Hybrid RAG Chat
=================================================== */

app.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    console.log("1️⃣ Query received:", query);

    /* -------- Budget Extraction -------- */
    let budget = null;
    const match = query.match(/(\d+)\s?(lakhs?|l)/i);
    if (match) budget = parseInt(match[1]) * 100000;

    /* -------- Postgres EV Query -------- */
    console.log("2️⃣ Running Postgres query...");
    let sql = "SELECT * FROM evs";
    let values = [];
    if (budget) {
      sql += " WHERE price_inr <= $1";
      values.push(budget);
    }

    const evResult = await pgClient.query(sql, values);
    console.log("3️⃣ Postgres done, rows:", evResult.rows.length);

    const evSummary = evResult.rows
      .slice(0, 5)
      .map((ev) => `Model: ${ev.model}, Price: ₹${ev.price_inr}, Range: ${ev.range_km}km`)
      .join("\n");

    /* -------- Embedding -------- */
    console.log("4️⃣ Getting embedding...");
    const queryEmbedding = await getEmbedding(query);
    console.log("5️⃣ Embedding done");

    /* -------- Vector Search -------- */
    let reviewSummary = "";
    try {
      console.log("6️⃣ Running Milvus search...");
      const searchResult = await milvusClient.search({
        collection_name: "ev_reviews",
        vector: queryEmbedding,
        limit: 5,
        metric_type: "COSINE",
        params: { ef: 64 },
        output_fields: ["review_id"],
      });
      console.log("7️⃣ Milvus done");

      const reviewIds = (searchResult.results || [])
        .map((r) => r.review_id)
        .filter(Boolean);

      if (reviewIds.length > 0) {
        console.log("8️⃣ Fetching reviews from Postgres...");
        const reviewResult = await pgClient.query(
          `SELECT review_text FROM reviews WHERE id = ANY($1::int[]) LIMIT 5`,
          [reviewIds]
        );
        console.log("9️⃣ Reviews done");
        reviewSummary = reviewResult.rows.map((r) => r.review_text).join("\n");
      }
    } catch (searchErr) {
      console.error("⚠️ Vector search failed (continuing without reviews):", searchErr.message);
    }

    /* -------- Groq LLM -------- */
    console.log("🔟 Calling Groq...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an expert EV advisor.",
        },
        {
          role: "user",
          content: `User Question:\n${query}\n\nFiltered EV Data:\n${evSummary || "No EV data available."}\n\nRelevant Reviews:\n${reviewSummary || "No reviews available."}\n\nProvide a clear recommendation with reasoning.`,
        },
      ],
    });
    console.log("✅ Groq done");

    res.json({
      answer: completion.choices[0].message.content,
      evs: evResult.rows.slice(0, 5),
    });
  } catch (err) {
    console.error("❌ RAG Error:", err.message || err);
    res.status(500).json({ error: err.message || "RAG failed" });
  }
});

/* ===================================================
   Root Route
=================================================== */

app.get("/", (req, res) => {
  res.json({ message: "EVAssist Hybrid RAG Running 🚀" });
});

/* ===================================================
   Start Server
=================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});