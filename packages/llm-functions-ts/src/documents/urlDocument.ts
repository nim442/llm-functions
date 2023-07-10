import { Document } from './document';
import { load } from 'cheerio';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import _, { memoize } from 'lodash';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { getApiKeyFromLocalStorage } from '../utils';
import { DocumentOutput } from '../action/documentAction';

async function _getHtml(document: Extract<Document, { type: 'url' }>) {
  const url = document.input;
  const html = await (async function () {
    if (document.customFetcher === 'browserless') {
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
    return document.customFetcher
      ? await document.customFetcher(url)
      : await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          },
        }).then((r) => r.text());
  })();

  const body = load(html)('body').html();
  return { body, html, url };
}

const getHtml = memoize(_getHtml, (d) => d.input);

const _getUrl = async (
  document: Extract<Document, { type: 'url' }>,
  query: string | undefined
): Promise<DocumentOutput> => {
  const { body, html: urlHtml, url } = await getHtml(document);

  const c = RecursiveCharacterTextSplitter.fromLanguage('html', {
    chunkOverlap: 0,
    chunkSize: document.chunkSize || 8000,
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
    document.chunkingQuery || query || '',
    document.topK || 4
  );

  const search = similaritySearch.map((s) => s.pageContent).join('\n');

  return {
    fullDocument: urlHtml,
    result: `Scraped ${url}\n${search}`,
    chunks: splitHtml.map((s) => s.pageContent),
  };
};

export const getUrlDocument = memoize(
  _getUrl,
  (d) => d.input + d.chunkSize + d.topK
);
