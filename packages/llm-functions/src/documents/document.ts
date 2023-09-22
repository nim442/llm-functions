import { DocumentOutput } from '../action/documentAction';
import { VectorDatabase, getUrlDocument } from './urlDocument';
import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import _ from 'lodash';
import { VectorStore } from 'langchain/dist/vectorstores/base';
import { PineconeConfiguration } from '@pinecone-database/pinecone';

export type DocumentCommonProps = {
  selector?: string;
  returnType?: 'text' | 'html';
  removeSelectors?: string[];
  removeAttrs?: 'all' | string[];
  chunkingStrategy?: {
    strategy: 'textSplitter';
    options: { chunkingQuery?: string; chunkSize?: number; topK?: number };
  };
};
type CustomFetcher = (url: string) => Promise<string>;

export type Document = DocumentCommonProps &
  (
    | {
        type: 'pdf';
        input: { name: string; file: Buffer | string };
        customFetcher?: CustomFetcher;
      }
    | {
        type: 'text';
        input: string;
        customFetcher?: CustomFetcher;
      }
    | {
        type: 'url';
        input: string | string[];
        customFetcher?: CustomFetcher | 'browserless';
      }
  );

export const splitDocument = async (
  document: Document,
  executionId: string,
  query?: string,
  vectorDatabase?: VectorDatabase
): Promise<DocumentOutput> => {
  switch (document.type) {
    case 'pdf':
      const file = document.input.file as unknown as string;

      const buffer = Buffer.from(file, 'base64');
      const bufferOrUrl = Buffer.isBuffer(buffer) ? buffer : file;

      //Only add this on the browser
      if (typeof window !== 'undefined') {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
      }
      const p = await pdfjs.getDocument(bufferOrUrl).promise;
      const csv = await Promise.all(
        _.range(p.numPages).map(async (i) => {
          const page = await p.getPage(i + 1);
          const text = await page.getTextContent();

          return _.chain(text.items as TextItem[])
            .filter((d) => 'transform' in d)
            .groupBy((d) => d.transform[5])
            .mapValues((d) => d.map((t) => t.str).join(','))
            .entries()
            .sortBy((t) => Number(t[0]))
            .map((t) => t[1])
            .reverse()
            .join('\n')
            .value();
        })
      ).then((s) => s.join('\n'));

      return [{ result: csv, source: 'pdf' }];
    case 'text':
      return [{ result: document.input, source: 'text' }];
    case 'url': {
      const doc = await getUrlDocument(document, query, vectorDatabase);
      return doc;
    }
  }
};
