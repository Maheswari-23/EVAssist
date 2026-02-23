require("dotenv").config();

const { Pool } = require("pg");
const { MilvusClient } = require("@zilliz/milvus2-sdk-node");
const { HfInference } = require("@huggingface/inference");

const pgClient = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const milvusClient = new MilvusClient({
  address: process.env.ZILLIZ_ENDPOINT,
  token: process.env.ZILLIZ_TOKEN,
});

const hf = new HfInference(process.env.HF_API_KEY);

async function runIngestion() {
  try {
    console.log("Connecting to Postgres...");
    const reviews = await pgClient.query(
      "SELECT id, ev_id, review_text FROM reviews"
    );

    console.log(`Found ${reviews.rows.length} reviews`);

    const texts = reviews.rows.map(r => r.review_text);

    console.log("Generating embeddings (batch)...");
    const embeddings = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: texts,
    });

    const dataToInsert = reviews.rows.map((row, index) => ({
      review_id: row.id,
      ev_id: row.ev_id || 0,
      embedding: embeddings[index],
    }));

    console.log("Inserting into Zilliz...");
    await milvusClient.insert({
      collection_name: "ev_reviews",
      fields_data: dataToInsert,
    });

    console.log("✅ Ingestion completed successfully!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Ingestion failed:", err);
    process.exit(1);
  }
}

runIngestion();