// Runs on the server, so the API key stays hidden from the browser.
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const RETRYABLE = [429, 500, 503, 504];

async function callModel(model, apiKey, prompt) {
    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
            }),
        }
    );
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
    }

    const { prompt } = req.body || {};
    if (typeof prompt !== "string" || prompt.length === 0 || prompt.length > 4000) {
        return res.status(400).json({ error: "Invalid prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    }

    // Try each model up to 3 times, waiting longer between attempts.
    for (const model of MODELS) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await callModel(model, apiKey, prompt);

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) {
                        return res.status(502).json({ error: "Empty AI response" });
                    }
                    return res.status(200).json({ text });
                }

                const detail = await response.text();
                console.error(`Gemini ${model} attempt ${attempt}:`, detail);

                if (!RETRYABLE.includes(response.status)) {
                    return res.status(502).json({ error: "AI request failed" });
                }
            } catch (err) {
                console.error(`Gemini ${model} attempt ${attempt} network error:`, err);
            }

            await new Promise((r) => setTimeout(r, attempt * 1500));
        }
    }

    return res.status(503).json({ error: "AI is busy right now. Try again in a minute." });
}