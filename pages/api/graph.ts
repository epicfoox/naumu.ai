import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { input } = req.body;

    if (!input) {
        res.status(400).json({ message: 'Input is required' });
        return;
    }

    try {
        const systemPrompt = `You are the Naumu Product Architect. Your goal is to extract a structured product definition graph from the user's unstructured idea.

Rules:

Identify key entities and classify them strictly as one of: Product, Persona, Need, Feature, ValueProposition, Constraint, Goal.

Identify logical relationships between them (e.g., 'Persona -> has -> Need', 'Product -> provides -> Feature').

id must be unique and derived from the label (lowercase, no spaces, slugified). Ensure IDs are unique.

Output ONLY valid JSON matching the schema below. Do not output any conversational text or markdown.

Schema:

{
  "nodes": [{"id": "...", "label": "...", "type": "Feature"}],
  "edges": [{"source": "...", "target": "...", "label": "..."}]
}`;

        // Using the pre-fill trick
        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Cheapest available Haiku model
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: "user", content: `Input text: ${input}` },
                { role: "assistant", content: "{" }
            ],
        });

        // Handle the response
        const contentBlock = msg.content[0];
        if (contentBlock.type !== 'text') {
            throw new Error('Unexpected response type from Claude');
        }

        const completion = contentBlock.text;
        const fullJson = "{" + completion;

        try {
            const graphData = JSON.parse(fullJson);
            res.status(200).json(graphData);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw output:", fullJson);
            res.status(500).json({ message: "Failed to parse graph data", raw: fullJson });
        }

    } catch (error: any) {
        console.error("API Error:", error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
}
