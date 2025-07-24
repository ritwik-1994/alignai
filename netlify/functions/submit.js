const fetch = require("node-fetch");

exports.handler = async function (event) {
  console.log("👉 Received request:", event.httpMethod, event.path);

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // Parse submitted data
    const { Email, Phone } = JSON.parse(event.body);
    console.log("📩 Data received:", { email, phone });

    // Load environment variables
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    // Check for missing env variables
    if (!AIRTABLE_TOKEN || !BASE_ID || !TABLE_NAME) {
      console.error("❌ Missing Airtable environment variables");
      return {
        statusCode: 500,
        body: "Server misconfigured: Missing Airtable environment variables",
      };
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

    const data = {
      records: [
        {
          fields: {
            Email: email,
            Phone: phone,
          },
        },
      ],
    };

    // Submit to Airtable
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("✅ Airtable response:", result);

    // If Airtable rejected the request
    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Airtable submission failed",
          airtableError: result,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message || "Internal server error",
      }),
    };
  }
};
