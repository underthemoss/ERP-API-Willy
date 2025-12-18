import crypto from 'crypto';

export type EntityType = 'prices' | 'pim_products';

export interface PricePromptData {
  name?: string;
  pimCategoryName: string;
  pimCategoryPath: string;
  priceType: 'RENTAL' | 'SALE';
}

export interface PimProductPromptData {
  name: string;
  category?: string;
  description?: string;
}

export class ImagePromptBuilder {
  /**
   * Generate a hash from a prompt string for cache invalidation
   * When the prompt changes, the hash changes, automatically invalidating old images
   * @param prompt The prompt string to hash
   * @returns 8-character hex hash
   */
  static generatePromptHash(prompt: string): string {
    return crypto
      .createHash('sha256')
      .update(prompt)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Build an AI image prompt for a price entity
   * @param data Price data to construct prompt from
   * @returns Prompt string for OpenAI image generation
   */
  static buildPricePrompt(data: PricePromptData): string {
    const productName = data.name || data.pimCategoryName;
    const categoryBreadcrumb = data.pimCategoryPath
      ? data.pimCategoryPath
          .split('|')
          .filter((p) => p.length > 0)
          .join(' > ')
      : data.pimCategoryName;

    return `Generate a hyper-realistic, professional product photograph of ${productName}${
      categoryBreadcrumb ? ` from ${categoryBreadcrumb}` : ''
    } in the context of construction work tools and machinery.

IMPORTANT: Show ONLY the single item mentioned - do not add any additional equipment or items.

Style: Professional e-commerce product photography with photorealistic quality. High-resolution image as if taken by a professional product photographer in a studio setting. Sharp focus with proper depth of field, capturing realistic materials, textures, and finishes.

Lighting & Colors: Professional studio lighting setup with soft, diffused lighting to minimize harsh shadows. Natural, accurate colors showing realistic materials (metal, plastic, rubber, etc.). Subtle shadows and highlights to create depth and dimension. Clean, bright, and professionally lit appearance.

Text Guidelines:
- Do NOT include ANY text in the image
- Do NOT use logos or branding
- Do NOT add text labels or numbers
- Pure visual representation only

Composition: Single item only, isolated on clean white or light neutral background. 3/4 angle view (standard product photography perspective) showing the product's key features. The product should occupy approximately 60-70% of the frame, leaving generous white space margins on all sides (minimum 15-20% margin from each edge). The item must NOT touch or come close to the edges of the image. Slight drop shadow beneath the item for depth. Centered composition with substantial breathing room around the product. Professional e-commerce quality with realistic proportions and scale.
Aspect ratio: 1:1`;
  }

  /**
   * Build an AI image prompt for a PIM product entity
   * @param data PIM product data to construct prompt from
   * @returns Prompt string for OpenAI image generation
   */
  static buildPimProductPrompt(data: PimProductPromptData): string {
    const categoryContext = data.category ? ` from ${data.category}` : '';
    const descriptionContext = data.description ? ` (${data.description})` : '';

    return `Generate a hyper-realistic, professional product photograph of ${data.name}${categoryContext}${descriptionContext} in the context of construction work tools and machinery.

IMPORTANT: Show ONLY the single item mentioned - do not add any additional equipment or items.

Style: Professional e-commerce product photography with photorealistic quality. High-resolution image as if taken by a professional product photographer in a studio setting. Sharp focus with proper depth of field, capturing realistic materials, textures, and finishes.

Lighting & Colors: Professional studio lighting setup with soft, diffused lighting to minimize harsh shadows. Natural, accurate colors showing realistic materials (metal, plastic, rubber, etc.). Subtle shadows and highlights to create depth and dimension. Clean, bright, and professionally lit appearance.

Text Guidelines:
- Do NOT include ANY text in the image
- Do NOT use logos or branding
- Do NOT add text labels or numbers
- Pure visual representation only

Composition: Single item only, isolated on clean white or light neutral background. 3/4 angle view (standard product photography perspective) showing the product's key features. The product should occupy approximately 60-70% of the frame, leaving generous white space margins on all sides (minimum 15-20% margin from each edge). The item must NOT touch or come close to the edges of the image. Slight drop shadow beneath the item for depth. Centered composition with substantial breathing room around the product. Professional e-commerce quality with realistic proportions and scale.
Aspect ratio: 1:1`;
  }
}
