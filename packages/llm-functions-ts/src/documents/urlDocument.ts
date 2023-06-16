import { Document } from './document';
import { load } from 'cheerio';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import _, { memoize } from 'lodash';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { getApiKeyFromLocalStorage } from '../utils';
import { DocumentOutput } from '../action/documentAction';

const _getUrl = async (
  document: Extract<Document, { type: 'url' }>,
  query: string | undefined
): Promise<DocumentOutput> => {
  const url = document.input;
  const urlHtml = document.customFetcher
    ? await document.customFetcher(url)
    : await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
      }).then((r) => r.text());
  const cleanedHtml = load(urlHtml).html();
  const c = RecursiveCharacterTextSplitter.fromLanguage('html', {
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
    document.chunkingQuery || query || ''
  );

  const search = similaritySearch.map((s) => s.pageContent).join('\n');

  return {
    fullDocument: urlHtml,
    result: search,
    chunks: splitHtml.map((s) => s.pageContent),
  };
};

export const getUrl = memoize(_getUrl, (d) => JSON.stringify(d));
