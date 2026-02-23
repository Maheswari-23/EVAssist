// test2.js
require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  console.log("Testing Groq...");
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are an EV advisor." },
        { role: "user", content: "What is an EV?" },
      ],
    });
    console.log("✅ Groq OK:", completion.choices[0].message.content.slice(0, 100));
  } catch (err) {
    console.error("❌ Groq failed:", err.message);
  }
}

test();