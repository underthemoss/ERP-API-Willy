import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';

interface TaxObligation {
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  order: number;
  reason: string;
}

interface TaxAnalysisResult {
  taxes: TaxObligation[];
}

export class LlmService {
  private cleanJsonResponse(text: string): string {
    // Remove markdown code block formatting if present
    let cleaned = text.trim();

    // Remove ```json at the start and ``` at the end
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
  }
  async getExampleTicket(): Promise<{ title: string; description: string }> {
    const prompt = `
Session ID: ${randomUUID()}
Todays date and time: ${new Date().toISOString()}.
You are an expert at generating kanban board tickets for construction site operations.
Generate a highly realistic and unique/random ticket for the fulfilment of a sales or rental item for a construction site that needs either machinery or consumable items.
- The ticket must reference a real, specific product, service, or item, including actual brand names, models, and technical specifications
- Only one product or item should be referenced, not multiple.
- The title must start with the product or item name, and the customer name must be a suffix at the end of the title 
- The product/item should be the most prominent and descriptive part of the title.
- Each run must produce a different, varied, and realistic scenario, product, and customer. Randomize the context, product, and customer for maximum variation between runs.
- The description must include a due date, which should be a realistic date.
Return only a JSON object with the following shape, array should have length 5:
[
  {
    "title": "...",
    "description": "..."
  }, 
  ...
]
`;

    const { text } = await generateText({
      model: openai('gpt-4.1', { structuredOutputs: true }),
      prompt,
    });

    if (!text) {
      throw new Error('No content returned from LLM');
    }
    const tickets = JSON.parse(text);
    const ticket = tickets[Math.floor(Math.random() * tickets.length)];
    return {
      title: ticket.title,
      description: ticket.description,
    };
  }

  async suggestTaxObligations(
    invoiceDescription: string,
  ): Promise<TaxAnalysisResult> {
    const systemPrompt = `You are a US tax expert specializing in construction and equipment rental taxation.
Your task is to analyze invoice descriptions and identify all applicable tax obligations.

Return a valid JSON array of tax obligations with the following structure (No MD decorations), I intend to parse the result as JSON:
{
  "taxes": [
    {
      "description": "Clear description of the tax",
      "type": "PERCENTAGE" or "FIXED_AMOUNT",
      "value": number (decimal for percentage, e.g., 0.08 for 8%, or fixed amount in cents),
      "order": number (order of application, starting from 1),
      "reason": "Detailed explanation of why this tax applies, including relevant laws or regulations and what part of the invoice detail makes this applicable"
    }
  ]
}

Important guidelines:
- For PERCENTAGE type, use decimal values (e.g., 0.08 for 8%)
- For FIXED_AMOUNT type, use cents (e.g., 500 for $5.00)
- Provide clear, specific reasons citing relevant tax laws when possible
- If there isn't enough information in the invoice description - provide some typical taxes that apply in USA

Common tax types to consider:
- State Sales Tax: varies by state, applies to most tangible goods
- County/Local Tax: additional percentage on top of state tax
- Equipment Rental Tax: special tax on equipment rentals in some jurisdictions
- Environmental Fees: fixed fees for certain equipment types
- Delivery Charges Tax: some states tax delivery fees`;

    try {
      const { text } = await generateText({
        model: openai('gpt-4o', { structuredOutputs: true }),
        system: systemPrompt,
        prompt: `Analyze this invoice and return applicable tax obligations as JSON:\n\n${invoiceDescription}`,
      });

      if (!text) {
        throw new Error('No response from LLM');
      }

      // Clean the response to remove any markdown formatting
      const cleanedText = this.cleanJsonResponse(text);
      logger.debug({ cleanedText }, 'Cleaned response');

      // Parse the JSON response
      const result = JSON.parse(cleanedText);

      // Validate and return the tax obligations
      return {
        taxes: (result.taxes || []).map((tax: any) => ({
          description: tax.description || '',
          type: tax.type || 'PERCENTAGE',
          value: tax.value || 0,
          order: tax.order || 1,
          reason: tax.reason || '',
        })),
      };
    } catch (err) {
      logger.error({ err }, 'Error in tax obligation analysis');
      // Return empty taxes array on error
      return {
        taxes: [],
      };
    }
  }
}
