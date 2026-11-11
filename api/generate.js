// Runs on the server, so the API key stays hidden from the browser.
const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
const RETRYABLE = [429, 500, 503, 504];

async function callModel(model, apiKey, prompt, useFastMode) {
    const generationConfig = {
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
    };
    if (useFastMode) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
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
                generationConfig,
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

    for (const model of MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                // First try with thinking off (fast). If the model rejects that setting, try without it.
                let response = await callModel(model, apiKey, prompt, true);
                if (response.status === 400) {
                    response = await callModel(model, apiKey, prompt, false);
                }

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
                    break; // Not a busy error, so skip retries and try the next model
                }
            } catch (err) {
                console.error(`Gemini ${model} attempt ${attempt} network error:`, err);
            }

            await new Promise((r) => setTimeout(r, 800));
        }
    }

    return res.status(503).json({ error: "AI is busy right now. Try again in a minute." });
}