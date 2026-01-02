import puppeteer, { Browser } from 'puppeteer';
import dns from 'node:dns/promises';
import net from 'node:net';

export interface WebFetchOptions {
  url: string;
  timeoutMs?: number;
  waitMs?: number;
  maxChars?: number;
  extractTables?: boolean;
  includeHtml?: boolean;
}

export interface WebFetchResult {
  url: string;
  title: string;
  text: string;
  tablesText: string;
  html?: string;
  truncated: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_WAIT_MS = 1000;
const DEFAULT_MAX_CHARS = 50000;
const MAX_MAX_CHARS = 200000;

let browserInstance: Browser | null = null;

// Cache hostname safety checks to avoid repeated DNS lookups
const hostnameSafetyCache = new Map<string, boolean>();

function clampMaxChars(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_MAX_CHARS;
  return Math.max(1, Math.min(MAX_MAX_CHARS, Math.floor(value)));
}

function truncate(value: string, maxChars: number) {
  const clamped = clampMaxChars(maxChars);
  if (value.length <= clamped) return value;
  return value.slice(0, clamped);
}

function isPrivateIpAddress(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    const parts = ip.split('.').map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      return true;
    }
    const [a, b] = parts;
    return (
      a === 0 || // 0.0.0.0/8
      a === 10 || // 10.0.0.0/8
      a === 127 || // 127.0.0.0/8
      a === 169 || // 169.254.0.0/16 (link-local, incl. metadata)
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      (a === 100 && b >= 64 && b <= 127) // 100.64.0.0/10 (CGNAT)
    );
  }

  if (net.isIP(ip) === 6) {
    const normalized = ip.toLowerCase();
    return (
      normalized === '::' ||
      normalized === '::1' || // loopback
      normalized.startsWith('fc') || // fc00::/7 (ULA)
      normalized.startsWith('fd') || // fd00::/8 (ULA subset)
      normalized.startsWith('fe80:') // fe80::/10 (link-local)
    );
  }

  // If we can’t parse it, treat as unsafe.
  return true;
}

async function isSafeHostname(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();

  if (lower === 'localhost' || lower === '0.0.0.0') return false;

  const cached = hostnameSafetyCache.get(lower);
  if (cached !== undefined) return cached;

  // If hostname is an IP literal, check directly
  if (net.isIP(lower)) {
    const safe = !isPrivateIpAddress(lower);
    hostnameSafetyCache.set(lower, safe);
    return safe;
  }

  try {
    const records = await dns.lookup(lower, { all: true, verbatim: true });
    const safe =
      records.length > 0 &&
      records.every((record) => !isPrivateIpAddress(record.address));
    hostnameSafetyCache.set(lower, safe);
    return safe;
  } catch {
    hostnameSafetyCache.set(lower, false);
    return false;
  }
}

function validateUrl(input: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  if (parsed.username || parsed.password) {
    throw new Error('URL credentials are not allowed');
  }

  return parsed;
}

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

export async function closeWebFetcherBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Fetch and extract page content in a way that’s usable for LLM “spec harvest”
 * (keeps line breaks and can optionally include table rows + HTML).
 */
export async function webFetch(
  options: WebFetchOptions,
): Promise<WebFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const waitMs = options.waitMs ?? DEFAULT_WAIT_MS;
  const maxChars = clampMaxChars(options.maxChars ?? DEFAULT_MAX_CHARS);
  const extractTables = options.extractTables ?? true;
  const includeHtml = options.includeHtml ?? false;

  const parsedUrl = validateUrl(options.url);

  // SSRF protection: Block private and internal networks (DNS-aware)
  if (!(await isSafeHostname(parsedUrl.hostname))) {
    throw new Error('Access to private networks is not allowed');
  }

  let page: Awaited<ReturnType<Browser['newPage']>> | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      try {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          await req.abort();
          return;
        }

        const requestUrl = new URL(req.url());
        if (!['http:', 'https:'].includes(requestUrl.protocol)) {
          await req.abort();
          return;
        }

        if (!(await isSafeHostname(requestUrl.hostname))) {
          await req.abort();
          return;
        }

        await req.continue();
      } catch {
        try {
          await req.abort();
        } catch {
          // ignore
        }
      }
    });

    await page.goto(parsedUrl.toString(), {
      waitUntil: 'networkidle2',
      timeout: timeoutMs,
    });

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const title = await page.title();

    const extracted = await page.evaluate(
      ({ extractTables, includeHtml }) => {
        const normalizeInline = (value: string) =>
          value.replace(/\s+/g, ' ').trim();

        const normalizeMultiline = (value: string) =>
          value
            .split('\n')
            .map((line) => normalizeInline(line))
            .filter(Boolean)
            .join('\n');

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

        const mainContent =
          document.querySelector('main') ||
          document.querySelector('article') ||
          document.querySelector('[role="main"]') ||
          document.querySelector('.content') ||
          document.querySelector('.main-content') ||
          document.querySelector('#content') ||
          document.querySelector('#main');

        const root = (mainContent || document.body) as HTMLElement;
        const rootText = normalizeMultiline(root.innerText || '');

        let tablesText = '';
        if (extractTables) {
          const tables = Array.from(root.querySelectorAll('table'));
          const lines: string[] = [];
          for (const table of tables) {
            const caption = normalizeInline(
              (table as HTMLTableElement).caption?.innerText || '',
            );
            if (caption) lines.push(`## ${caption}`);

            for (const row of Array.from(table.querySelectorAll('tr'))) {
              const cells = Array.from(row.querySelectorAll('th,td'))
                .map((cell) => normalizeInline(cell.textContent || ''))
                .filter(Boolean);
              if (cells.length) lines.push(cells.join(' | '));
            }
          }
          tablesText = lines.join('\n');
        }

        const html = includeHtml ? root.outerHTML : undefined;

        return {
          text: rootText,
          tablesText,
          html,
        };
      },
      { extractTables, includeHtml },
    );

    await page.close();
    page = null;

    const text = truncate(extracted.text ?? '', maxChars);
    const tablesText = truncate(extracted.tablesText ?? '', maxChars);
    const html = extracted.html ? truncate(extracted.html, maxChars) : undefined;

    const truncated =
      (extracted.text ?? '').length > text.length ||
      (extracted.tablesText ?? '').length > tablesText.length ||
      (!!extracted.html && extracted.html.length > (html?.length ?? 0));

    return {
      url: parsedUrl.toString(),
      title: title || '',
      text,
      tablesText,
      html,
      truncated,
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {
        // ignore
      }
    }
  }
}

