// test.js - paste this and run: node test.js
require("dotenv").config();
const { HfInference } = require("@huggingface/inference");
const { MilvusClient } = require("@zilliz/milvus2-sdk-node");

const hf = new HfInference(process.env.HF_API_KEY);
const milvusClient = new MilvusClient({
  address: process.env.ZILLIZ_ENDPOINT,
  token: process.env.ZILLIZ_TOKEN,
});

async function test() {
  // Step 1: Test embedding
  console.log("Testing HuggingFace embedding...");
  try {
    const embedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: "test query",
    });
    console.log("✅ Embedding OK, length:", embedding.length);
  } catch (err) {
    console.error("❌ Embedding failed:", err.message);
    return;
  }

  // Step 2: Test Milvus search
  console.log("Testing Milvus search...");
  try {
    await milvusClient.loadCollection({ collection_name: "ev_reviews" });
    const result = await milvusClient.search({
      collection_name: "ev_reviews",
      vector: new Array(384).fill(0.1),
      limit: 3,
      metric_type: "COSINE",
      params: { ef: 64 },
      output_fields: ["review_id"],
    });
    console.log("✅ Milvus search OK:", result.results?.length, "results");
  } catch (err) {
    console.error("❌ Milvus search failed:", err.message);
  }
}

test();