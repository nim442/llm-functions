import { OpenAI } from 'langchain/llms/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

import { Pipe, Tuples, Objects, Fn, Call } from 'hotscript';
import { load } from 'cheerio';
import { z, ZodAny } from 'zod';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { json, stringToJSONSchema } from './jsonSchema';
import { ExtractTemplateParams, interpolateFString } from './utils';

import * as pdfjs from 'pdfjs-dist';

import _ from 'lodash';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

import * as nanoid from 'nanoid';
import { printNode, zodToTs } from 'zod-to-ts';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIInput } from 'langchain/dist/types/openai-types';
import { BaseLLMParams } from 'langchain/dist/llms/base';
import { cyrb53 } from './cyrb53';

export type ParserZodEsque<TInput, TParsedInput> = {
  _input: TInput;
  _output: TParsedInput;
};

type Parser = z.ZodSchema;

export type inferParser<TParser extends Parser> =
  TParser extends z.infer<TParser> ? z.infer<TParser> : never;

export interface ProcedureParams<
  Output = string,
  Input = unknown,
  Documents extends DocumentWithoutInput[] | unknown = unknown,
  Query extends ((...args: any) => any) | unknown = unknown
> {
  /**
   * @internal
   */
  _output: Output;
  /**
   * @internal
   */
  _input?: Input;
  /**
   * @internal
   */
  _documents?: Documents;
  /**
   * @internal
   */
  _query?: Query;
}
export type Document =
  | { type: 'pdf'; input: Buffer }
  | { type: 'text'; input: string }
  | { type: 'url'; input: string; chunkingQuery?: string };

export type DocumentWithoutInput = DOmit<Document, 'input'>;

export type Execution<T> = {
  id: string;
  inputs: FunctionArgs;
  trace: Trace;
  finalResponse?: FinalResponse<T>;
};

export type ProcedureBuilderDef<I = unknown, O = unknown> = {
  id?: string;
  name?: string;
  description?: string;
  output?: Parser;
  tsOutputString?: string;
  model?: Partial<Simplify<OpenAIInput & BaseLLMParams>>;
  documents?: DocumentWithoutInput[];
  query?: { queryInput: boolean; fn: QueryFn<I, O> };
  instructions?: string;
  dataset?: any;
  executions: Execution<any>[];
  mapFns?: Function[];
  sequences?: ProcedureBuilderDef[];
};
interface GetName extends Fn {
  return: this['arg0']['type'] extends infer A
    ? Extract<Document, { type: A }>['input']
    : never;
}
interface IsUndefined extends Fn {
  return: this['arg0'] extends undefined ? true : false;
}
type OmitUndefined<A> = Call<Objects.OmitBy<IsUndefined>, A>;

export type Simplify<TType> = TType extends any[] | Date
  ? TType
  : { [K in keyof TType]: TType[K] };

export type FunctionArgs = Partial<
  InferredFunctionArgs<{
    _documents: [Document];
    _input: Record<string, string>;
    _query: (t: any) => any;
    _output: string;
  }>
>;

export type InferredFunctionArgs<TParams extends ProcedureParams> = Simplify<
  OmitUndefined<{
    query: TParams['_query'] extends (...args: infer P) => any ? P[0] : never;
    instructions: Simplify<keyof TParams['_input']> extends never
      ? never
      : Simplify<TParams['_input']>;
    documents: Pipe<TParams['_documents'], [Tuples.Map<GetName>]> extends never
      ? undefined
      : Pipe<TParams['_documents'], [Tuples.Map<GetName>]>;
  }>
>;

export type Log = {
  id: string;
  action: 'log';
  response: { type: 'success'; output: string };
};

export type Action =
  | Log
  | {
      id: string;
      action: 'calling-another-function';
      functionDef: ProcedureBuilderDef;
      input: FunctionArgs;
    }
  | {
      id: string;
      action: 'get-document';
      logs?: Log[];
      input: Document;
      response:
        | { type: 'loading' }
        | { type: 'success'; output: any }
        | { type: 'error'; error: string };
    }
  | {
      id: string;
      action: 'query';
      input?: object;
      response:
        | { type: 'loading' }
        | { type: 'success'; output: any }
        | { type: 'error'; error: string };
    }
  | {
      id: string;
      action: 'calling-open-ai';
      input?: object;
      template: string;
      response:
        | { type: 'loading' }
        | { type: 'success'; output: any }
        | { type: 'zod-error'; output: any; error: string }
        | { type: 'timeout-error' };
    };

export type Trace = Action[];

type QueryFn<T, O> = (arg: T) => Promise<O>;
type DOmit<T, K extends string> = T extends any ? Omit<T, K> : never;
type FinalResponse<T> = T extends z.ZodSchema ? z.infer<T> : string;

export interface ProcedureBuilder<TParams extends ProcedureParams> {
  __internal: { def: ProcedureBuilderDef };
  output<$Parser extends Parser>(
    schema: $Parser
  ): ProcedureBuilder<{
    _output: FinalResponse<$Parser>;
    _input: TParams['_input'];
    _documents: TParams['_documents'];
    _query: TParams['_query'];
  }>;
  dataset(dataset: InferredFunctionArgs<TParams>[]): ProcedureBuilder<{
    _output: TParams['_output'];
    _input: TParams['_input'];
    _documents: TParams['_documents'];
    _query: TParams['_query'];
  }>;
  document<$Document extends DocumentWithoutInput>(
    document: $Document
  ): ProcedureBuilder<{
    _output: TParams['_output'];
    _input: TParams['_input'];
    _documents: [$Document];
    _query: TParams['_query'];
  }>;
  query<T, O>(
    query: (arg: T) => Promise<O>
  ): ProcedureBuilder<{
    _output: TParams['_output'];
    _input: TParams['_input'];
    _documents: TParams['_documents'];
    _query: QueryFn<T, O>;
  }>;

  withModelParams(
    model: ProcedureBuilderDef['model']
  ): ProcedureBuilder<TParams>;
  instructions<T extends string>(
    arg0: T
  ): ProcedureBuilder<{
    _input: ExtractTemplateParams<T>;
    _output: TParams['_output'];
    _documents: TParams['_documents'];
    _query: TParams['_query'];
  }>;

  name: (name: string) => ProcedureBuilder<TParams>;
  description: (description: string) => ProcedureBuilder<TParams>;
  create(): (
    args: InferredFunctionArgs<TParams>
  ) => Promise<TParams['_output']>;

  map: <Input extends TParams['_output'], Output>(
    aiFn: (args: Input) => Output
  ) => //@ts-ignore
  ProcedureBuilder<{
    _input: TParams['_input'];
    _output: Output;
    _documents: TParams['_documents'];
    _query: TParams['_query'];
  }>;

  sequence: <Input extends TParams['_output'], Output>(
    aiFn: (args: Input) => Promise<Output>
  ) => //@ts-ignore
  ProcedureBuilder<{
    _input: TParams['_input'];
    _output: Output;
    _documents: TParams['_documents'];
    _query: TParams['_query'];
  }>;

  run(
    args: InferredFunctionArgs<TParams>
  ): Promise<Execution<TParams['_output']>>;
  runDataset(): Promise<Execution<TParams['_output']>[]>;
}
const getApiKeyFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('OPENAI_API_KEY');
  } else return undefined;
};
export const createFn = <TParams extends ProcedureParams>(
  initDef?: ProcedureBuilderDef,
  onExecutionUpdate?: (execution: Execution<ProcedureParams['_output']>) => void
): ProcedureBuilder<TParams> => {
  const def = {
    model: {
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: -1,
    },
    executions: [],
    ...initDef,
  };
  const getOpenAiModel = () =>
    new OpenAI({
      ...def.model,
      openAIApiKey:
        process.env.OPENAI_API_KEY || getApiKeyFromLocalStorage() || undefined,
    });

  const getDocumentText = async (
    document: Document,
    executionId: string,
    query?: string
  ) => {
    switch (document.type) {
      case 'pdf':
        const buffer = Buffer.from(
          document.input as unknown as string,
          'base64'
        );
        //Only add this on the browser
        if (typeof window !== 'undefined') {
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
        }
        const p = await pdfjs.getDocument(buffer).promise;
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

        return csv;
      case 'text':
        return document.input;
      case 'url':
        const id = pushToTrace(executionId, {
          action: 'get-document',
          input: document,
          response: { type: 'loading' },
        });
        const url = document.input;
        const urlHtml = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          },
        }).then((r) => r.text());
        const cleanedHtml = load(urlHtml).html();
        const c = new RecursiveCharacterTextSplitter({ chunkSize: 2700 });
        const openAIEmbeddings = new OpenAIEmbeddings({
          openAIApiKey:
            process.env.OPENAI_API_KEY ||
            getApiKeyFromLocalStorage() ||
            undefined,
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

        updateTrace(id, {
          response: { type: 'success', output: search },
        });

        return search;
    }
  };
  const fixZodOutput = async (
    zodError: z.ZodError,
    object: z.infer<ReturnType<typeof json>>,
    executionId: string
  ) => {
    const template = `ZOD ERROR:"""
{zodError}
"""
TASK:"""
ZOD ERROR is an error generated by parsing a json object. Output a fixed json based so that the ZOD ERROR doesn't happen when parsing. Only fix the fields in the error. Leave other fields untouched.
Code only, no commentary, no introduction sentence, no codefence block.
You are generating a fixed json - make sure to escape any double quotes.
"""
    
PROMPT:"""
{object}
"""`;
    const prompt = interpolateFString(template, {
      zodError: JSON.stringify(zodError),
      object: JSON.stringify(object),
    });
    const traceId = pushToTrace(executionId, {
      action: 'calling-open-ai',
      template: prompt,
      response: { type: 'loading' },
    });
    const response = await getOpenAiModel().call(prompt);
    return { response, prompt, traceId };
  };
  const createExecution = (args: FunctionArgs) => {
    const id = nanoid.nanoid();
    def.executions.push({ id, trace: [], inputs: args });
    return id;
  };
  const resolveExecution = (
    executionId: string,
    finalResponse: any,
    trace: Trace = []
  ) => {
    def.executions = def.executions.map((e) =>
      e.id === executionId
        ? { ...e, finalResponse, trace: [...e.trace, ...trace] }
        : e
    ) as ProcedureBuilderDef['executions'];
    const execution = def.executions.find((e) => e.id === executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }
    return execution;
  };

  const pushToTrace = (executionId: string, action: DOmit<Action, 'id'>) => {
    const id = nanoid.nanoid();
    const actionWithId = { ...action, id };
    def.executions = def.executions.map((e) =>
      e.id === executionId ? { ...e, trace: [...e.trace, actionWithId] } : e
    ) as ProcedureBuilderDef['executions'];
    const execution = def.executions.find((e) => e.id === executionId);
    if (onExecutionUpdate && execution) {
      onExecutionUpdate(execution);
    }
    return id;
  };
  const updateTrace = (id: string, action: Partial<Action>) => {
    def.executions = def.executions.map((e) => ({
      ...e,
      trace: e.trace.map((t) => (t.id === id ? { ...t, ...action } : t)),
    })) as ProcedureBuilderDef['executions'];
  };

  const fixZodOutputRecursive = async <T extends z.Schema>(
    zodSchema: T,
    response: string,
    template: string,
    traceId: string,
    executionId: string,
    retries = 0
  ): Promise<z.infer<T>> => {
    if (retries > 5) {
      pushToTrace(executionId, {
        action: 'calling-open-ai',
        template,
        response: {
          type: 'timeout-error',
        },
      });
      return resolveExecution(executionId, response);
    }

    const json = stringToJSONSchema.safeParse(response);

    if (json.success) {
      const r = zodSchema.safeParse(json.data);
      if (r.success) {
        updateTrace(traceId, {
          response: { type: 'success', output: response },
        });
        return resolveExecution(executionId, r.data);
      } else {
        updateTrace(traceId, {
          response: {
            type: 'zod-error',
            output: response,
            error: r.error.message,
          },
        });

        const {
          response: zodResponse,
          prompt: zodTemplate,
          traceId: newTraceId,
        } = await fixZodOutput(r.error, json.data, executionId);

        return fixZodOutputRecursive(
          zodSchema,
          zodResponse,
          zodTemplate,
          newTraceId,
          executionId,
          retries + 1
        );
      }
    } else {
      updateTrace(traceId, {
        response: {
          type: 'zod-error',
          output: response,
          error: json.error.message,
        },
      });

      const {
        response: zodResponse,
        prompt: zodTemplate,
        traceId: newTraceId,
      } = await fixZodOutput(json.error, response, executionId);

      return fixZodOutputRecursive(
        zodSchema,
        zodResponse,
        zodTemplate,
        newTraceId,
        executionId,
        retries + 1
      );
    }
  };
  const run = async (arg: FunctionArgs) => {
    const {
      instructions,
      documents: docs,
      query: queryArg,
    } = arg as FunctionArgs;
    const executionId = createExecution(arg);

    async function getQueryDoc() {
      if (queryArg && def.query) {
        const id = pushToTrace(executionId, {
          action: 'query',
          input: queryArg,
          response: { type: 'loading' },
        });
        const query = await def.query.fn(queryArg);
        const queryDoc = JSON.stringify(query);

        updateTrace(id, {
          response: { type: 'success', output: queryDoc },
        });
        return queryDoc;
      } else return undefined;
    }
    const queryDoc = await getQueryDoc();
    const documents = (def.documents || []).map((d, i) => ({
      ...d,
      input: docs?.[i],
    })) as Document[];

    const queryTemplate =
      queryArg && def.query
        ? `DOCUMENT:"""
  ${queryDoc}
  """\n`
        : '';
    const userPrompt = (
      def.instructions
        ? interpolateFString(def.instructions, instructions as any)
        : instructions
        ? instructions
        : ''
    ) as string;

    const documentsTemplate = await Promise.all(
      documents.map(
        async (d) => `DOCUMENT:"""
  ${await getDocumentText(d, executionId, userPrompt)}
  """`
      )
    );
    const jsonSchema = def.output
      ? JSON.stringify(
          zodToJsonSchema(def.output as ZodAny, { target: 'openApi3' })
        )
      : '';
    const zodTemplate = `${queryTemplate}${documentsTemplate.join(`\n`)}${
      def.output
        ? `JSON SCHEMA:"""
${jsonSchema}
  
"""
TASK:"""
Output a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.
Code only, no commentary, no introduction sentence, no codefence block.
You are generating json - make sure to escape any double quotes.
Do not hallucinate or generate anything that is not in the document.
Make sure your answer fits the schema.

  
If you are not sure or cannot generate something for any possible reason, return:
{"error" : <the reason of the error>};
"""`
        : `TASK:"""
Output text based on the PROMPT section below.
"""`
    }
PROMPT:"""
${userPrompt}
"""`;

    const id = pushToTrace(executionId, {
      action: 'calling-open-ai',
      template: zodTemplate,
      response: { type: 'loading' },
    });

    try {
      const response = await getOpenAiModel().call(zodTemplate);

      if (def.output) {
        return fixZodOutputRecursive(
          def.output as ZodAny,
          response,
          zodTemplate,
          id,
          executionId
        );
      } else {
        updateTrace(id, {
          response: { type: 'success', output: response },
        });
        return resolveExecution(executionId, response);
      }
    } catch (e) {
      updateTrace(id, {
        response: { type: 'error', error: (e as any).message },
      });
      return resolveExecution(executionId, {
        type: 'error',
        error: (e as any).message,
      });
    }
  };
  return {
    __internal: { def: def },
    name: (name: string) => {
      return createFn({ ...def, name });
    },
    description: (description: string) => {
      return createFn({ ...def, description });
    },
    dataset: (dataset) => {
      return createFn({ ...def, dataset });
    },

    instructions: (template) => {
      return createFn({ ...def, instructions: template });
    },
    withModelParams: (model) => {
      return createFn({ ...def, model: { ...def.model, ...model } });
    },

    output: (t) => {
      const tsOutputString = printNode(zodToTs(t).node);
      return createFn({
        output: t,
        tsOutputString,
        ...def,
      });
    },
    map: (mapFn) => {
      return createFn({
        ...def,
        mapFns: [...(def.mapFns || []), mapFn],
      }) as any;
    },
    sequence: (t) => {
      const aiFn = assertAiFn(t);
      return createFn({
        ...def,
        sequences: [...(def.sequences || []), aiFn.__internal_def],
      }) as any;
    },
    document: (d) => {
      return createFn({
        ...def,
        documents: [...(def.documents || []), d],
      });
    },
    query: (q) => {
      return createFn({
        ...def,
        query: { queryInput: true, fn: q as any },
      });
    },
    create: () => {
      const sha = cyrb53(JSON.stringify(def));
      const fn = (arg: FunctionArgs) =>
        createFn(def)
          .run(arg as FunctionArgs)
          .then((r) => r.finalResponse);
      fn.__internal_def = { ...def, id: sha.toString() };
      return fn as any;
    },
    runDataset() {
      const { dataset } = def;
      if (!dataset) {
        throw new Error('No dataset');
      }
      return Promise.all(dataset.map((d: any) => this.run(d)));
    },
    run: async (args) => {
      const resp = run(args as FunctionArgs).then((r) => {
        const mapFns = def.mapFns || [];
        const finalResponse = mapFns.reduce((p, fn) => {
          return fn(p);
        }, r.finalResponse);
        return resolveExecution(r.id, finalResponse);
      });

      const sequenceResp = (def.sequences || []).reduce((p, aiFun) => {
        return p.then(({ finalResponse, id }) => {
          pushToTrace(id, {
            action: 'calling-another-function',
            functionDef: aiFun,
            input: finalResponse,
          });
          return createFn(aiFun)
            .run(finalResponse)
            .then((r) => {
              return resolveExecution(id, r.finalResponse, r.trace);
            });
        });
      }, resp);

      return sequenceResp;
    },
  };
};

type AiFunction<T> = T & {
  __internal_def: ProcedureBuilderDef;
};

export const assertAiFn = <T>(fn: T): AiFunction<T> => {
  if (!(fn as any).__internal_def) {
    throw new Error('Not an Ai function.');
  }
  return fn as any;
};

export const llmFunction = createFn();
