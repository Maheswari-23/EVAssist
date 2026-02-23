// test3.js
require("dotenv").config();

async function test() {
  console.log("Hitting /chat endpoint...");
  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "best EV under 40 lakhs" }),
    });
    const data = await res.json();
    console.log("✅ Response:", JSON.stringify(data).slice(0, 300));
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

test();