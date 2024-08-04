
import { OpenAI } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, only POST requests are accepted' });
  }

  try {
    const { pantry_items } = req.body;

    if (!pantry_items || !Array.isArray(pantry_items) || pantry_items.length === 0) {
      throw new Error("pantry_items is required and should be a non-empty array");
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

    const result = response.choices[0].message.content;
    console.log(result);
    return res.status(200).json({ recipe: JSON.parse(result) });

  } catch (error: any) {
    console.error("Error in POST /api/recipe", error);
    if (error.response) {
      // Handling specific OpenAI errors
      return res.status(error.response.status).json({ error: error.response.data.error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

