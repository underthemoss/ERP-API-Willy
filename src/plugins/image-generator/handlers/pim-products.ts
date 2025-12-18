import { ImageGeneratorService } from '../../../services/image_generator';
import { PimProductsService } from '../../../services/pim_products';
import { ImagePromptBuilder } from '../../../services/image_generator/prompt-builder';
import { createEntityImageHandler } from './generic';

export const pimProductImageHandler = (
  imageGeneratorService: ImageGeneratorService,
  pimProductsService: PimProductsService,
) => {
  return createEntityImageHandler(imageGeneratorService, {
    entityType: 'pim_products',
    fetchEntity: (id, user) => pimProductsService.getPimProductById(id, user),
    buildPrompt: (product) => {
      // Build description from available fields
      const description = [product.make, product.model, product.year]
        .filter(Boolean)
        .join(' ');

      return ImagePromptBuilder.buildPimProductPrompt({
        name: product.name,
        category: product.pim_category_path
          ? product.pim_category_path
              .split('|')
              .filter((p) => p.length > 0)
              .join(' > ')
          : undefined,
        description: description || undefined,
      });
    },
  });
};
