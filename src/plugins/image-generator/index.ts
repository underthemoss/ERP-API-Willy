import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { ImageGeneratorService } from '../../services/image_generator';
import { PricesService } from '../../services/prices';
import { PimProductsService } from '../../services/pim_products';
import { PimCategoriesService } from '../../services/pim_categories';
import { priceImageHandler } from './handlers/prices';
import { pimProductImageHandler } from './handlers/pim-products';

export interface ImageGeneratorPluginOptions {
  imageGeneratorService: ImageGeneratorService;
  pricesService: PricesService;
  pimProductsService: PimProductsService;
  pimCategoriesService: PimCategoriesService;
}

/**
 * Fastify plugin for AI-generated images
 * Registers REST API endpoints under /api/images
 */
const imageGeneratorPlugin: FastifyPluginAsync<
  ImageGeneratorPluginOptions
> = async (fastify, opts) => {
  const {
    imageGeneratorService,
    pricesService,
    pimProductsService,
    pimCategoriesService,
  } = opts;

  fastify.register(
    async (fastify) => {
      // Add authentication to all routes in this context
      fastify.addHook('preHandler', fastify.authenticate);

      // Entity-specific image routes
      // GET /api/images/prices/:entityId?size=list|card|preview|full
      fastify.get(
        '/prices/:entityId',
        priceImageHandler(
          imageGeneratorService,
          pricesService,
          pimCategoriesService,
          pimProductsService,
        ),
      );

      // GET /api/images/pim-products/:entityId?size=list|card|preview|full
      fastify.get(
        '/pim-products/:entityId',
        pimProductImageHandler(imageGeneratorService, pimProductsService),
      );
    },
    {
      prefix: '/api/images',
    },
  );
};

export default fp(imageGeneratorPlugin, {
  name: 'image-generator',
  fastify: '5.x',
});
