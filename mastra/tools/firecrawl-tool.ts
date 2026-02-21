import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Check if we should use Firecrawl directly or the worker
const useFirecrawl = () => {
  return !!process.env.FIRECRAWL_API_KEY;
};

const getFirecrawlClient = async () => {
  const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
  return new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
};

const getFirecrawlWorkerUrl = () => {
  // Use custom worker URL or default shared proxy
  return process.env.FIRECRAWL_WORKER_URL || "https://firecrawl.tsai.assistant-ui.com";
};

export const firecrawlTool = createTool({
  id: "crawl-website",
  description: "Extract and analyze content from websites for research, context gathering, or information retrieval purposes.",
  inputSchema: z.object({
    url: z.string().describe("URL of the website to crawl")
  }),
  outputSchema: z.object({
    content: z.string().optional()
  }),
  execute: async ({ url }) => {
    // Use Firecrawl directly if API key is provided, otherwise use worker
    if (useFirecrawl()) {
      const firecrawl = await getFirecrawlClient();
      const scrapeResponse = await firecrawl.scrape(url, {
        formats: ['markdown'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p'],
        excludeTags: ['script', 'style', 'nav', 'footer'],
        waitFor: 3000
      });
      return {
        content: scrapeResponse.markdown
      };
    } else {
      const workerUrl = getFirecrawlWorkerUrl();
      const tsaiApiKey = process.env.TSAI_API_KEY;

      if (!tsaiApiKey) {
        throw new Error("TSAI_API_KEY is required when using the Firecrawl proxy. Please set it in your .env file.");
      }

      // Call the Firecrawl worker proxy
      const response = await fetch(`${workerUrl}/v1/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tsaiApiKey}`,
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown'],
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p'],
          excludeTags: ['script', 'style', 'nav', 'footer'],
          waitFor: 3000
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to crawl website: ${error.error || response.statusText}`);
      }

      const scrapeResponse = await response.json();

      // Handle both success and error responses from the worker
      if (!scrapeResponse.success) {
        throw new Error(`Firecrawl error: ${scrapeResponse.error || 'Unknown error'}`);
      }

      return {
        content: scrapeResponse.data?.markdown
      };
    }
  }
});
