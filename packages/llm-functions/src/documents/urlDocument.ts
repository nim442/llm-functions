import { Document } from './document';
import { load } from 'cheerio';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import memoize from 'memoizee';
import { Document as LangChainDocument } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { getApiKeyFromLocalStorage } from '../utils';
import { DocumentOutput } from '../action/documentAction';
import _ from 'lodash';

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
  if (chunkingStrategy === undefined) {
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

export const getUrlDocument = async (
  document: Extract<Document, { type: 'url' }>,
  query: string | undefined
): Promise<DocumentOutput> => {
  const results = Array.isArray(document.input)
    ? await Promise.all(
        document.input.map((input) =>
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
      )
    : [
        await getHtml(
          document.input,
          document.customFetcher,
          document.chunkingStrategy,
          document.selector,
          document.removeAttrs,
          document.removeSelectors,
          document.returnType
        ),
      ];

  const documents = results.map(
    (r) =>
      new LangChainDocument({
        pageContent: r.text,
        metadata: { url: r.url, html: r.body },
      })
  );

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

    const splitDocs = await c.splitDocuments(documents);

    const docsWithMetadata = Object.values(
      _.mapValues(
        _.groupBy(splitDocs, (d) => d.metadata.url),
        (docs) =>
          docs.map((doc, index) => {
            const { chunkSize, chunkOverlap } = doc.metadata;
            const totalSize = docs.length;
            const metadata = {
              ...doc.metadata,
              chunkSize: chunkingStrategy.options.chunkSize,
              chunkQuery: chunkingStrategy.options.chunkingQuery,
              sizeInfo: `${index + 1}/${totalSize}`,
            };
            return { ...doc, metadata };
          })
      )
    ).flat();

    const vectorStores = await MemoryVectorStore.fromDocuments(
      docsWithMetadata,
      openAIEmbeddings
    );

    const similaritySearch = await vectorStores.similaritySearch(
      chunkingStrategy.options.chunkingQuery || query || '',
      chunkingStrategy.options.topK || 4
    );

    return similaritySearch.map((s) => {
      return {
        result: `Scraped ${s.metadata.url}\n${s.metadata.html}`,
        source: s.metadata.url,
      };
    });
  } else
    return results.map((s) => {
      return {
        result: `Scraped ${s.url}\n${s.body}`,
        source: s.url,
      };
    });
};
