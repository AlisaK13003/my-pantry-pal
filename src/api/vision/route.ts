import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs';

// Initialize OpenAI with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export async function POST(req: NextRequest) {
  try {
    const { base64_image } = await req.json();

    if (!base64_image) {
      throw new Error("base64_image is required");
    }

    const payload: ChatCompletionCreateParams = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "I want you to tell me what is in this image and how many of that thing are there. Provide the output in the format: type,quantity."
            },
            {
              type: "image_url",
              image_url: {
                url: `${base64_image}`
              }
            }
          ]
        }
      ],
      max_tokens: 50
    };

    const response = await openai.chat.completions.create(payload);

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("No response from OpenAI");
    }

    const result = response.choices[0].message.content;
    return NextResponse.json({ result });

  } catch (error: any) {
    console.error("Error in POST /api/vision:", error);
    if (error.response) {
      // Handling specific OpenAI errors
      return NextResponse.json({ error: error.response.data.error.message }, { status: error.response.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
