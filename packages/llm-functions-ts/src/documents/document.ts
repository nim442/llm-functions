import { chain, range } from 'lodash';
import { DocumentOutput } from '../action/documentAction';
import { getUrlDocument } from './urlDocument';
import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

export type DocumentCommonProps = {
  customFetcher?: (url: string) => Promise<string>;
  chunkingQuery?: string;
  chunkSize?: number;
  topK?: number;
};

export type Document = (
  | { type: 'pdf'; input: Buffer }
  | { type: 'text'; input: string }
  | { type: 'url'; input: string }
) &
  DocumentCommonProps;

export const splitDocument = async (
  document: Document,
  executionId: string,
  query?: string
): Promise<DocumentOutput> => {
  switch (document.type) {
    case 'pdf':
      const buffer = Buffer.from(document.input as unknown as string, 'base64');
      //Only add this on the browser
      if (typeof window !== 'undefined') {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
      }
      const p = await pdfjs.getDocument(buffer).promise;
      const csv = await Promise.all(
        range(p.numPages).map(async (i) => {
          const page = await p.getPage(i + 1);
          const text = await page.getTextContent();
          return chain(text.items as TextItem[])
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

      return { result: csv, fullDocument: csv };
    case 'text':
      return { result: document.input, fullDocument: document.input };
    case 'url': {
      const doc = await getUrlDocument(document, query);     
      return doc;
    }
  }
};
