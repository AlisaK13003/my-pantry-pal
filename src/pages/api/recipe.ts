import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

const MIN_RECIPE_ITEMS = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, only POST requests are accepted' });
  }

  try {
    const { pantry_items } = req.body;

    if (!pantry_items || !Array.isArray(pantry_items) || pantry_items.length === 0) {
      throw new Error("pantry_items is required and should be a non-empty array");
    }

    if (pantry_items.length < MIN_RECIPE_ITEMS) {
      return res.status(400).json({
        error: `Add at least ${MIN_RECIPE_ITEMS} ingredients before generating recipe ideas.`,
      });
    }

    const formattedPantryItems = pantry_items.map(item => `${item.name},${item.quantity},${item.expirationDate}`).join('; ');

    const payload: ChatCompletionCreateParams = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `
Here is a list of pantry items: ${formattedPantryItems}.
Please generate a simple and tasty recipe that can be made using this list. 
The recipe doesn't need to include all the items from the pantry. Ensure the response follows this JSON format and ensure its a json string.:
{
  "id": "",
  "title": "",
  "ingredients": [""],
  "directions": "",
  "suggestions": "",
  "imageUrl": ""
}
`
        }
      ],
      max_tokens: 150
    };

    const response = await openai.chat.completions.create(payload);

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("No response from OpenAI");
    }

    try {
      const result = response.choices[0].message.content;
      if (result === null) {
        console.error("Received null content");
        return res.status(500).json({ error: "Received null content" });
      } else {
        console.log(result);
        return res.status(200).json({ recipe: JSON.parse(result) });
      }
    } catch (error: any) {
      console.error("Error in POST /api/recipe", error);
      if (error.response) {
        return res.status(error.response.status).json({ error: error.response.data.error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  } catch (error: any) {
    console.error("Error in POST /api/recipe", error);
    return res.status(500).json({ error: error.message });
  }
}
