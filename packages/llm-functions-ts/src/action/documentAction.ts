import { Document } from '../documents/document';
import { Log } from '../llm';

export type DocumentOutput = {
  fullDocument: string;
  result: string;
  chunks?: string[];
  matchingChunk?: string;
};

export type DocumentAction = {
  id: string;
  action: 'get-document';
  logs?: Log[];
  input: Document;
  response:
    | {
        type: 'loading';
      }
    | {
        type: 'success';
        output: DocumentOutput;
      }
    | {
        type: 'error';
        error: string;
      };
};
