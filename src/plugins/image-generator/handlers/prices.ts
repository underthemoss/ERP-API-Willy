import { ImageGeneratorService } from '../../../services/image_generator';
import { PricesService } from '../../../services/prices';
import { PimCategoriesService } from '../../../services/pim_categories';
import { PimProductsService } from '../../../services/pim_products';
import { ImagePromptBuilder } from '../../../services/image_generator/prompt-builder';
import { createEntityImageHandler } from './generic';

export const priceImageHandler = (
  imageGeneratorService: ImageGeneratorService,
  pricesService: PricesService,
  pimCategoriesService: PimCategoriesService,
  pimProductsService: PimProductsService,
) => {
  return createEntityImageHandler(imageGeneratorService, {
    entityType: 'prices',
    fetchEntity: async (id, user) => {
      // Fetch the base price
      const price = await pricesService.getPriceById(id, user);
      if (!price) return null;

      // Enrich with category data if available
      if (price.pimCategoryId) {
        const category = await pimCategoriesService.getPimCategoryById(
          price.pimCategoryId,
          user,
        );
        if (category) {
          // Use fresh category data
          price.pimCategoryName = category.name;
          price.pimCategoryPath = category.path;
        }
      }

      // Enrich with product data if available
      if (price.pimProductId) {
        const product = await pimProductsService.getPimProductById(
          price.pimProductId,
          user,
        );
        if (product) {
          // Use product name if price doesn't have a custom name
          if (!price.name) {
            price.name = product.name;
          }
        }
      }

      return price;
    },
    buildPrompt: (price) =>
      ImagePromptBuilder.buildPricePrompt({
        name: price.name,
        pimCategoryName: price.pimCategoryName,
        pimCategoryPath: price.pimCategoryPath,
        priceType: price.priceType,
      }),
  });
};
