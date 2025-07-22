const fetch = require("node-fetch");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { email, phone } = JSON.parse(event.body);

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Airtable Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
