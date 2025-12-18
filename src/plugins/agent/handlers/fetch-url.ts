import { FastifyReply, FastifyRequest } from 'fastify';
import puppeteer, { Browser } from 'puppeteer';

interface FetchUrlBody {
  url: string;
}

interface FetchUrlResponse {
  url: string;
  title: string;
  content: string;
  error?: string;
}

// Configuration constants
const PUPPETEER_TIMEOUT_MS = 15000; // 15 seconds
const DYNAMIC_CONTENT_WAIT_MS = 1000; // 1 second
const MAX_CONTENT_LENGTH = 50000; // 50KB

// Browser instance for reuse
let browserInstance: Browser | null = null;

/**
 * Check if URL points to private/internal network (SSRF protection)
 */
function isPrivateOrLocalUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();

  // Block localhost variants
  if (hostname === 'localhost' || hostname === '0.0.0.0') {
    return true;
  }

  // Block private IPv4 ranges
  const privateIPv4Patterns = [
    /^127\./, // Loopback (127.0.0.0/8)
    /^10\./, // Private class A (10.0.0.0/8)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B (172.16.0.0/12)
    /^192\.168\./, // Private class C (192.168.0.0/16)
    /^169\.254\./, // Link-local / AWS metadata (169.254.0.0/16)
    /^0\./, // Reserved (0.0.0.0/8)
  ];

  // Block private IPv6 ranges
  const privateIPv6Patterns = [
    /^::1$/, // IPv6 loopback
    /^fc00:/, // IPv6 private (fc00::/7)
    /^fe80:/, // IPv6 link-local (fe80::/10)
  ];

  return [...privateIPv4Patterns, ...privateIPv6Patterns].some((pattern) =>
    pattern.test(hostname),
  );
}

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

/**
 * Handler for fetching and extracting content from URLs using Puppeteer
 * Supports JavaScript-rendered pages
 */
export function fetchUrlHandler() {
  return async (
    request: FastifyRequest<{ Body: FetchUrlBody }>,
    reply: FastifyReply,
  ) => {
    // Exit early if no authenticated user
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const { url } = request.body;

    // Validate URL
    if (!url) {
      return reply.status(400).send({
        error: 'URL is required',
      });
    }

    let page = null;

    try {
      // Validate URL format
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return reply.status(400).send({
          error: 'Only HTTP and HTTPS URLs are supported',
        });
      }

      // SSRF protection: Block private and internal networks
      if (isPrivateOrLocalUrl(parsedUrl)) {
        request.log.warn({ url }, 'Blocked access to private network');
        return reply.status(400).send({
          error: 'Access to private networks is not allowed',
        });
      }

      // Get browser and create new page
      const browser = await getBrowser();
      page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Block unnecessary resources for faster loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to URL with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: PUPPETEER_TIMEOUT_MS,
      });

      // Wait a bit for any dynamic content
      await new Promise((resolve) =>
        setTimeout(resolve, DYNAMIC_CONTENT_WAIT_MS),
      );

      // Extract title
      const title = await page.title();

      // Extract text content
      const content = await page.evaluate(() => {
        // Remove unwanted elements
        const selectorsToRemove = [
          'script',
          'style',
          'noscript',
          'iframe',
          'nav',
          'footer',
          'header',
          'aside',
          '[role="navigation"]',
          '[role="banner"]',
          '[role="contentinfo"]',
          '.nav',
          '.navbar',
          '.footer',
          '.header',
          '.sidebar',
          '.menu',
          '.advertisement',
          '.ad',
          '.cookie-banner',
          '.popup',
          '.modal',
        ];

        selectorsToRemove.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        });

        // Try to get main content first
        const mainContent =
          document.querySelector('main') ||
          document.querySelector('article') ||
          document.querySelector('[role="main"]') ||
          document.querySelector('.content') ||
          document.querySelector('.main-content') ||
          document.querySelector('#content') ||
          document.querySelector('#main');

        const targetElement = mainContent || document.body;

        // Get text content
        const text = targetElement.innerText || targetElement.textContent || '';

        // Clean up whitespace
        return text
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
      });

      // Close the page
      await page.close();
      page = null;

      // Limit content length for LLM
      const truncatedContent = content.slice(0, MAX_CONTENT_LENGTH);

      // Log successful fetch
      request.log.info(
        {
          url,
          titleLength: title.length,
          contentLength: content.length,
          truncated: content.length > MAX_CONTENT_LENGTH,
        },
        'Successfully fetched URL content',
      );

      return reply.status(200).send({
        url,
        title,
        content: truncatedContent,
      } as FetchUrlResponse);
    } catch (error) {
      // Close page if still open
      if (page) {
        try {
          await page.close();
        } catch {
          // Ignore close errors
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Handle specific errors
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('Navigation timeout')
      ) {
        return reply.status(200).send({
          url,
          title: '',
          content: '',
          error: 'Request timed out (15s limit)',
        } as FetchUrlResponse);
      }

      if (errorMessage.includes('net::ERR_')) {
        return reply.status(200).send({
          url,
          title: '',
          content: '',
          error: `Network error: ${errorMessage}`,
        } as FetchUrlResponse);
      }

      request.log.error({ error, url }, 'Failed to fetch URL with Puppeteer');

      return reply.status(200).send({
        url,
        title: '',
        content: '',
        error: `Failed to fetch URL: ${errorMessage}`,
      } as FetchUrlResponse);
    }
  };
}

/**
 * Cleanup function to close browser on shutdown
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
