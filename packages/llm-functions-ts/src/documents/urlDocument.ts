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
  const urlHtml = document.customFetcher
    ? await document.customFetcher(url)
    : await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
      }).then((r) => r.text());

  const cleanedHtml = load(urlHtml)('body').html();
  return { cleanedHtml, urlHtml, url };
}
const getVectorStore = () => {};
const getHtml = memoize(_getHtml, (d) => d.input);

const _getUrl = async (
  document: Extract<Document, { type: 'url' }>,
  query: string | undefined
): Promise<DocumentOutput> => {
  const { cleanedHtml, urlHtml, url } = await getHtml(document);

  const c = RecursiveCharacterTextSplitter.fromLanguage('html', {
    chunkOverlap: 0,
    chunkSize: document.chunkSize || 8000,
  });
  const openAIEmbeddings = new OpenAIEmbeddings({
    openAIApiKey:
      process.env.OPENAI_API_KEY || getApiKeyFromLocalStorage() || undefined,
  });

  const splitHtml = await c.createDocuments([cleanedHtml]);

  const vectorStores = await MemoryVectorStore.fromDocuments(
    splitHtml,
    openAIEmbeddings
  );

  const similaritySearch = await vectorStores.similaritySearch(
    document.chunkingQuery || query || '',
    document.similaritySearch || 4
  );

  const search = similaritySearch.map((s) => s.pageContent).join('\n');

  return {
    fullDocument: urlHtml,
    result: `Scraped ${url}\n${search}`,
    chunks: splitHtml.map((s) => s.pageContent),
  };
};

export const getUrl = memoize(
  _getUrl,
  (d) => d.input + d.chunkSize + d.similaritySearch
);
