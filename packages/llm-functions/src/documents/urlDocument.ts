import { Document } from './document';
import { load } from 'cheerio';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import memoize from 'memoizee';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { getApiKeyFromLocalStorage } from '../utils';
import { DocumentOutput } from '../action/documentAction';

const scrape = async function (
  url: string,
  customFetcher: Extract<Document, { type: 'url' }>['customFetcher']
) {
  if (customFetcher === 'browserless') {
    return fetch(
      `https://chrome.browserless.io/content?token=${process.env.BROWSERLESS_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          waitFor: 4000,
        }),
      }
    ).then((r) => r.text());
  }
  return customFetcher
    ? await customFetcher(url)
    : await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
      }).then((r) => r.text());
};
const memoizedScrape = memoize(scrape, { max: 50 });

export async function getHtml(document: Extract<Document, { type: 'url' }>) {
  const url = document.input;
  const html = await memoizedScrape(url, document.customFetcher);

  let $ = load(html);
  if (document.chunkingStrategy === undefined) {
    // Remove comments
    $('*')
      .contents()
      .each(function () {
        if (this.type === 'comment') $(this).remove();
      });

    // Remove script and style tags
    $('script').remove();
    $('style').remove();
    $('iframe').remove();
    $('noscript').remove();
  }

  const selectedEl = (function () {
    if (document.selector) {
      const selectedEl = $(document.selector);
      return selectedEl;
    } else {
      return $('body');
    }
  })();

  // ATTRIBUTE REMOVAL
  if (document.removeAttrs === 'all') {
    selectedEl.find('*').each((index, element) => {
      const $element = $(element);
      element.attributes.forEach((attr) => {
        $element.removeAttr(attr.name);
      });
    });
  } else {
    document.removeAttrs?.forEach((attr) => {
      selectedEl.find('*').each((index, element) => {
        const $element = $(element);

        $element.removeAttr('class');
      });
    });
  }

  //Selector removal
  document.removeSelectors?.forEach((selector) => {
    $(selectedEl).find(selector).remove();
  });

  const body = selectedEl
    .map((_, element) =>
      document.returnType === 'text' ? $(element).text() : $(element).html()
    )
    .get()
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();

  return { body, html, url };
}

export const getUrlDocument = async (
  document: Extract<Document, { type: 'url' }>,
  query: string | undefined
): Promise<DocumentOutput> => {
  const { body, html: urlHtml, url } = await getHtml(document);
  const chunkingStrategy = document.chunkingStrategy;
  if (chunkingStrategy) {
    const c = RecursiveCharacterTextSplitter.fromLanguage('html', {
      chunkOverlap: 0,
      chunkSize: chunkingStrategy.options.chunkSize || 8000,
    });
    const openAIEmbeddings = new OpenAIEmbeddings({
      openAIApiKey:
        process.env.OPENAI_API_KEY || getApiKeyFromLocalStorage() || undefined,
      maxRetries: 20,
    });

    const splitHtml = await c.createDocuments([body || '']);
    const vectorStores = await MemoryVectorStore.fromDocuments(
      splitHtml,
      openAIEmbeddings
    );

    const similaritySearch = await vectorStores.similaritySearch(
      chunkingStrategy.options.chunkingQuery || query || '',
      chunkingStrategy.options.topK || 4
    );

    const search = similaritySearch.map((s) => s.pageContent).join('\n\n');

    return {
      fullDocument: urlHtml,
      result: `Scraped ${url}\n${search}`,
      chunks: splitHtml.map((s) => s.pageContent),
    };
  } else
    return {
      fullDocument: urlHtml,
      result: `Scraped ${url}\n${body}`,
      chunks: [body || ''],
    };
};
