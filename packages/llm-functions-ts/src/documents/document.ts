export type Document =
  | { type: 'pdf'; input: Buffer }
  | { type: 'text'; input: string }
  | {
      type: 'url';
      input: string;
      customFetcher?: (url: string) => Promise<string>;
      chunkingQuery?: string;
      chunkSize?: number;
      similaritySearch?: number;
    };
