require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Client } = require("pg");
const { MilvusClient, DataType } = require("@zilliz/milvus2-sdk-node");
const { HfInference } = require("@huggingface/inference");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());
app.set("trust proxy", true);

/* ===================================================
   1️⃣ PostgreSQL Connection
=================================================== */

const pgClient = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

pgClient.connect()
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch(err => console.error("❌ Postgres Error:", err));

/* ===================================================
   2️⃣ Milvus Connection
=================================================== */

const milvusClient = new MilvusClient({
  address: process.env.MILVUS_ADDRESS,
});

console.log("✅ Milvus Connected");

/* ===================================================
   3️⃣ HuggingFace Embedding
=================================================== */

const hf = new HfInference(process.env.HF_API_KEY);

async function getEmbedding(text) {
  const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  return embedding;
}

/* ===================================================
   4️⃣ Groq LLM
=================================================== */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ===================================================
   5️⃣ Create Collection + Index (Proper Schema)
=================================================== */

async function setupMilvus() {
  const collections = await milvusClient.showCollections();
  const exists = collections.data.some(c => c.name === "ev_reviews");

  if (!exists) {
    console.log("🆕 Creating Milvus Collection...");

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
          name: "review_id",   // 🔥 IMPORTANT FIX
          data_type: DataType.Int64,
        },
        {
          name: "ev_id",
          data_type: DataType.Int64,
        },
        {
          name: "embedding",
          data_type: DataType.FloatVector,
          dim: 384,
        },
      ],
    });

    await milvusClient.createIndex({
      collection_name: "ev_reviews",
      field_name: "embedding",
      index_type: "IVF_FLAT",
      metric_type: "L2",
      params: { nlist: 128 },
    });

    console.log("✅ Milvus Collection Ready");
  }

  await milvusClient.loadCollection({
    collection_name: "ev_reviews",
  });

  console.log("✅ Milvus Collection Loaded");
}

setupMilvus();

/* ===================================================
   6️⃣ INGEST REVIEWS (Batch + Correct Mapping)
=================================================== */

app.post("/ingest", async (req, res) => {
  try {
    const reviews = await pgClient.query(
      "SELECT id, ev_id, review_text FROM reviews"
    );

    const embeddings = await Promise.all(
      reviews.rows.map(r => getEmbedding(r.review_text))
    );

    const dataToInsert = reviews.rows.map((row, index) => ({
      review_id: row.id,
      ev_id: row.ev_id || 0,
      embedding: embeddings[index],
    }));

    await milvusClient.insert({
      collection_name: "ev_reviews",
      fields_data: dataToInsert,
    });

    await milvusClient.flush({
      collection_names: ["ev_reviews"],
    });

    res.json({ message: "✅ Ingestion Complete" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ingestion failed" });
  }
});

/* ===================================================
   7️⃣ TRUE HYBRID RAG CHAT
=================================================== */

app.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    /* -------- Structured Budget Filter -------- */

    let budget = null;
    const match = query.match(/(\d+)\s?(lakhs?|l)/i);
    if (match) budget = parseInt(match[1]) * 100000;

    let sql = "SELECT * FROM evs";
    let values = [];

    if (budget) {
      sql += " WHERE price_inr <= $1";
      values.push(budget);
    }

    const evResult = await pgClient.query(sql, values);

    const evSummary = evResult.rows
      .slice(0, 5)
      .map(ev =>
        `Model: ${ev.model}, Price: ₹${ev.price_inr}, Range: ${ev.range_km}km`
      )
      .join("\n");

    /* -------- Vector Search -------- */

    const queryEmbedding = await getEmbedding(query);

    const searchResult = await milvusClient.search({
      collection_name: "ev_reviews",
      vectors: [queryEmbedding],
      search_params: {
        anns_field: "embedding",
        topk: 5,
        metric_type: "L2",
        params: JSON.stringify({ nprobe: 10 }),
      },
      output_fields: ["review_id"],
    });

    const reviewIds =
      searchResult.results?.[0]?.fields_data?.map(r => r.review_id) || [];

    let reviewSummary = "";

    if (reviewIds.length > 0) {
      const reviewQuery = `
        SELECT review_text FROM reviews
        WHERE id = ANY($1::int[])
        LIMIT 5
      `;

      const reviewResult = await pgClient.query(reviewQuery, [reviewIds]);

      reviewSummary = reviewResult.rows
        .map(r => r.review_text)
        .join("\n");
    }

    /* -------- LLM -------- */

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are an expert EV advisor." },
        {
          role: "user",
          content: `
User Question:
${query}

Filtered EV Data:
${evSummary}

Relevant Reviews:
${reviewSummary}

Provide a clear recommendation with reasoning.
          `,
        },
      ],
    });

    res.json({
      answer: completion.choices[0].message.content,
      evs: evResult.rows.slice(0, 5),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "RAG failed" });
  }
});

/* ===================================================
   ROOT
=================================================== */

app.get("/", (req, res) => {
  res.json({ message: "EVAssist Hybrid RAG Running 🚀" });
});

/* ===================================================
   START SERVER
=================================================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});