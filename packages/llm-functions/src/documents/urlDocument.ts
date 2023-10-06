import { Document } from './document';
import { load } from 'cheerio';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import memoize from 'memoizee';
import { Document as LangChainDocument } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { getApiKeyFromLocalStorage } from '../utils';
import { DocumentOutput } from '../action/documentAction';
import _, { chunk } from 'lodash';
import { createClient } from '@supabase/supabase-js';

import {
  PineconeClient,
  PineconeConfiguration,
} from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

const scrape = async function (
  url: string,
  customFetcher: Extract<Document, { type: 'url' }>['customFetcher']
) {
  if (customFetcher === 'browserless') {
    return fetch(
      `https://chrome.browserless.io/content?token=304bb18b-fa28-4f27-8576-10b9f38779ee`,
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

export async function getHtml(
  input: string,
  customFetcher: Extract<Document, { type: 'url' }>['customFetcher'],
  chunkingStrategy: Extract<Document, { type: 'url' }>['chunkingStrategy'],
  selector: Extract<Document, { type: 'url' }>['selector'],
  removeAttrs: Extract<Document, { type: 'url' }>['removeAttrs'],
  removeSelectors: Extract<Document, { type: 'url' }>['removeSelectors'],
  returnType: Extract<Document, { type: 'url' }>['returnType']
) {
  const url = input;
  const html = await memoizedScrape(url, customFetcher);

  let $ = load(html);

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

  const selectedEl = (function () {
    if (selector) {
      const selectedEl = $(selector);
      return selectedEl;
    } else {
      return $('body');
    }
  })();

  // ATTRIBUTE REMOVAL
  if (removeAttrs === 'all') {
    selectedEl.find('*').each((index, element) => {
      const $element = $(element);
      element.attributes.forEach((attr) => {
        $element.removeAttr(attr.name);
      });
    });
  } else {
    removeAttrs?.forEach((attr) => {
      selectedEl.find('*').each((index, element) => {
        const $element = $(element);

        $element.removeAttr('class');
      });
    });
  }

  //Selector removal
  removeSelectors?.forEach((selector) => {
    $(selectedEl).find(selector).remove();
  });

  const text = selectedEl
    .map((_, element) => $(element).text())
    .get()
    .join('\n')
    .trim();

  const htmlContent = selectedEl
    .map((_, element) => $(element).html())
    .get()
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();

  const body = returnType === 'text' ? text : htmlContent;

  return { body, text, htmlContent, url };
}
export type VectorDatabase =
  | {
      type: 'pinecone';
      configuration: PineconeConfiguration & { index: string };
    }
  | { type: 'supabase'; configuration: { url: string; apiKey: string } };

export type VectorDatabaseMetadata = {
  url: string;
  html: string;
  chunkSize: number;
  origin: string;
};

export const getUrlDocument = async (
  document: Extract<Document, { type: 'url' }>,
  query: string | undefined,
  vectorDatabase?: VectorDatabase
): Promise<DocumentOutput> => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey:
      process.env.OPENAI_API_KEY || getApiKeyFromLocalStorage() || undefined,
    maxRetries: 20,
  });

  const vectorStore = await (async () => {
    if (vectorDatabase?.type === 'pinecone') {
      const client = new PineconeClient();
      await client.init(vectorDatabase.configuration);

      const pineconeIndex = client.Index(vectorDatabase.configuration.index);
      return PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
      });
    } else if (vectorDatabase?.type === 'supabase') {
      const { url: supabaseUrl, apiKey } = vectorDatabase.configuration;
      const supabase = createClient(supabaseUrl, apiKey);
      return SupabaseVectorStore.fromExistingIndex(embeddings, {
        client: supabase,
      });
    } else {
      return new MemoryVectorStore(embeddings);
    }
  })();
  const urls = Array.isArray(document.input)
    ? document.input
    : [document.input];

  const getUrlFromVectorDatabase = async (url: string, chunkSize: number) => {
    if (vectorStore instanceof MemoryVectorStore) {
      const results = await vectorStore.similaritySearchVectorWithScore(
        new Array(1536).fill(0).map(() => Math.random()),
        1,
        (doc) =>
          doc.metadata.url === url && doc.metadata.chunksize === chunkSize
      );
      return results;
    } else if (
      vectorDatabase?.type === 'supabase' ||
      vectorDatabase?.type === 'pinecone'
    ) {
      const results = await vectorStore.similaritySearchVectorWithScore(
        new Array(1536).fill(0).map(() => Math.random()),
        1,
        { url: url, chunkSize: chunkSize }
      );
      return results;
    }
  };

  const urlsThatNeedToBeVectorized = document.chunkingStrategy
    ? _.compact(
        await Promise.all(
          urls.map(async (url) => {
            const vector = await getUrlFromVectorDatabase(
              url,
              document.chunkingStrategy?.options?.chunkSize || 8000
            );
            return vector?.length === 0 ? url : undefined;
          })
        )
      )
    : urls;

  const results = await Promise.all(
    urlsThatNeedToBeVectorized.map((input) =>
      getHtml(
        input,
        document.customFetcher,
        document.chunkingStrategy,
        document.selector,
        document.removeAttrs,
        document.removeSelectors,
        document.returnType
      )
    )
  );

  const chunkingStrategy = document.chunkingStrategy;

  if (chunkingStrategy) {
    const chunkSize = chunkingStrategy.options.chunkSize || 8000;
    const documents = results.map(
      (r) =>
        new LangChainDocument({
          pageContent: r.text,
          metadata: {
            url: r.url,
            html: r.body,
            chunkSize,
            origin: new URL(r.url).origin,
          },
        })
    );

    const c = RecursiveCharacterTextSplitter.fromLanguage('html', {
      chunkOverlap: 0,
      chunkSize: chunkSize,
    });

    const splitDocs = await c.splitDocuments(documents);

    // const docsWithMetadata = Object.values(
    //   _.mapValues(
    //     _.groupBy(splitDocs, (d) => d.metadata.url),
    //     (docs) =>
    //       docs.map((doc, index) => {
    //         const { chunkSize, chunkOverlap } = doc.metadata;
    //         const totalSize = docs.length;
    //         const metadata = {
    //           ...doc.metadata,
    //           sizeInfo: `${index + 1}/${totalSize}`,
    //         };
    //         return { ...doc, metadata };
    //       })
    //   )
    // ).flat();

    for await (const doc of splitDocs) {
      await vectorStore.addDocuments([doc]);
    }
    const similaritySearch =
      vectorStore instanceof MemoryVectorStore
        ? await vectorStore.similaritySearchWithScore(
            chunkingStrategy.options.chunkingQuery || query || '',
            5,
            (document) =>
              document.metadata.chunkSize === chunkSize &&
              document.metadata.origin === new URL(urls[0]).origin
          )
        : await vectorStore.similaritySearchWithScore(
            chunkingStrategy.options.chunkingQuery || query || '',
            5,
            { origin: new URL(urls[0]).origin, chunkSize: chunkSize }
          );

    const groupedUrls = _.groupBy(similaritySearch, (s) => s[0].metadata.url);

    const mostCommonUrl = Object.entries(groupedUrls).sort(
      (a, b) => b[1].length - a[1].length
    )[0][0];

    const mostCommonChunk = similaritySearch.find(
      ([s, score]) => s.metadata.url === mostCommonUrl
    );

    if (!mostCommonChunk) return [];

    const $ = load(mostCommonChunk[0].metadata.html);
    const textContent = $('body').text();

    return [
      {
        result:
          document.returnType === 'text'
            ? `Scraped ${mostCommonChunk[0].metadata.url}\n${textContent}`
            : `Scraped ${mostCommonChunk[0].metadata.url}\n${mostCommonChunk[0].metadata.html}`,
        source: mostCommonChunk[0].metadata.url,
        score: mostCommonChunk[1],
      },
    ];
  } else
    return results.map((s) => {
      return {
        result: `Scraped ${s.url}\n${s.body}`,
        source: s.url,
        score: 1,
      };
    });
};
