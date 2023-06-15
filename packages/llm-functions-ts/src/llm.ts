import { ChatOpenAI } from 'langchain/chat_models/openai';

import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { produce } from 'immer';

import { Pipe, Tuples, Objects, Fn, Call, S } from 'hotscript';
import { load } from 'cheerio';
import { z, ZodAny } from 'zod';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Document } from './documents/document';
import { json, stringToJSONSchema } from './jsonSchema';
import {
  ExtractTemplateParams,
  getApiKeyFromLocalStorage,
  interpolateFString,
  mergeOrUpdate,
} from './utils';

import * as pdfjs from 'pdfjs-dist';

import _, { memoize } from 'lodash';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

import * as nanoid from 'nanoid';
import { printNode, zodToTs } from 'zod-to-ts';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIInput } from 'langchain/dist/types/openai-types';
import { BaseLLMParams } from 'langchain/dist/llms/base';
import { cyrb53 } from './cyrb53';
import { getUrl } from './documents/urlDocument';
import {
  BaseChatMessage,
  ChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from 'langchain/schema';

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

export type DocumentWithoutInput = DOmit<Document, 'input'>;

export type Execution<T> = {
  id: string;
  createdAt: Date;
  functionsExecuted: {
    inputs: FunctionArgs;
    trace: Trace;
    finalResponse?: T;
    functionDef: ProcedureBuilderDef;
  }[];
  finalResponse?: T;
  verified?: boolean;
};

type Sequence<T = unknown> =
  | ProcedureBuilderDef
  | ((output: T) => ProcedureBuilderDef);

export type ProcedureBuilderDef<I = unknown, O = unknown> = {
  id?: string;
  name?: string;
  description?: string;
  output?: Parser;
  tsOutputString?: string;
  model?: ConstructorParameters<typeof ChatOpenAI>[number];
  documents?: DocumentWithoutInput[];
  query?: { queryInput: boolean; fn: QueryFn<I, O> };
  instructions?: string;
  dataset?: FunctionArgs[];
  mapFns?: (((a: any) => any) | AiFunction<any>)[];
  verify?: (a: Execution<any>, b: FunctionArgs) => boolean;
  sequences?: Sequence[];
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
      action: 'executing-function';
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
    args: InferredFunctionArgs<TParams>,
    execution?: string
  ) => Promise<TParams['_output']>;

  map: <Input extends TParams['_output'], Output>(
    aiFn: (
      args: Input,
      execution: Execution<Input>,
      inputs: InferredFunctionArgs<TParams>
    ) => Output | Promise<Output>
  ) => //@ts-ignore
  ProcedureBuilder<{
    _input: TParams['_input'];
    _output: Output;
    _documents: TParams['_documents'];
    _query: TParams['_query'];
  }>;
  verify: (
    aiFn: (
      execution: Execution<TParams['_output']>,
      inputs: InferredFunctionArgs<TParams>
    ) => boolean
  ) => ProcedureBuilder<TParams>;
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
    args: InferredFunctionArgs<TParams>,
    executionId?: string
  ): Promise<Execution<TParams['_output']>>;
  runDataset(): Promise<Execution<TParams['_output']>[]>;
}

export type createFn = <TParams extends ProcedureParams>(
  initDef?: ProcedureBuilderDef,
  onExecutionUpdate?: (
    execution: Execution<ProcedureParams['_output']>
  ) => void,
  onCreated?: (fnDef: ProcedureBuilderDef) => void
) => ProcedureBuilder<TParams>;

export const createFn: createFn = (initDef, ...args) => {
  let execution: Execution<any> | undefined;

  const [onExecutionUpdate, onCreated] = args;
  const def = {
    model: {
      modelName: 'gpt-3.5-turbo-16k',
      temperature: 0.7,
      maxTokens: -1,
    },
    ...initDef,
  };
  const getOpenAiModel = () =>
    new ChatOpenAI({
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
      case 'url': {
        const id = createTrace(executionId, {
          action: 'get-document',
          input: document,
          response: { type: 'loading' },
        });
        const doc = await getUrl(document, query);
        updateTrace(id, {
          response: { type: 'success', output: doc },
        });
        return doc;
      }
    }
  };
  const fixZodOutput = async (
    zodError: z.ZodError,
    object: z.infer<ReturnType<typeof json>>,
    executionId: string,
    chatMessages: BaseChatMessage[]
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
    const traceId = createTrace(executionId, {
      action: 'calling-open-ai',
      template: prompt,
      response: { type: 'loading' },
    });
    chatMessages.push(new HumanChatMessage(prompt));
    const { text: response } = await getOpenAiModel().call(chatMessages);
    return { response, prompt, traceId };
  };
  const createExecution = (args: FunctionArgs, _executionId?: string) => {
    const id = _executionId || nanoid.nanoid();
    execution = {
      id,
      createdAt: new Date(),
      functionsExecuted: [{ trace: [], inputs: args, functionDef: def }],
    };
    return id;
  };
  const resolveExecution = (finalResponse: any, trace: Trace = []) => {
    if (!execution) {
      throw new Error('Execution not found');
    }
    execution = {
      ...execution,
      functionsExecuted: execution.functionsExecuted.map((e) =>
        e.functionDef.id === def.id
          ? {
              ...e,
              trace: [...e.trace, ...trace],
              finalResponse,
            }
          : e
      ),
      finalResponse,
    };
    if (onExecutionUpdate && execution) {
      onExecutionUpdate(execution);
    }
    return execution;
  };

  const createTrace = (executionId: string, action: DOmit<Action, 'id'>) => {
    const id = nanoid.nanoid();
    const actionWithId = { ...action, id };
    if (!execution) {
      throw new Error('Execution not found');
    }
    execution = {
      ...execution,
      functionsExecuted: execution.functionsExecuted.map((e) =>
        e.functionDef.id === def.id
          ? {
              ...e,
              trace: [...e.trace, actionWithId],
            }
          : e
      ),
    };

    if (onExecutionUpdate && execution) {
      onExecutionUpdate(execution);
    }
    return id;
  };
  const updateTrace = (id: string, action: Partial<Action>) => {
    if (!execution) {
      throw new Error('Execution not found');
    }
    execution = {
      ...execution,
      functionsExecuted: execution.functionsExecuted.map((e) =>
        e.functionDef.id === def.id
          ? {
              ...e,
              trace: e.trace.map((t) =>
                t.id === id ? { ...t, ...action } : t
              ),
            }
          : e
      ),
    } as Execution<any>;
    if (onExecutionUpdate && execution) {
      onExecutionUpdate(execution);
    }
  };

  const fixZodOutputRecursive = async <T extends z.Schema>(
    zodSchema: T,
    response: string,
    template: string,
    traceId: string,
    executionId: string,
    chatMessages: BaseChatMessage[],
    retries = 0
  ): Promise<z.infer<T>> => {
    if (retries > 5) {
      createTrace(executionId, {
        action: 'calling-open-ai',
        template,
        response: {
          type: 'timeout-error',
        },
      });
      return resolveExecution(response);
    }

    const json = stringToJSONSchema.safeParse(response);

    if (json.success) {
      const r = zodSchema.safeParse(json.data);
      if (r.success) {
        updateTrace(traceId, {
          response: { type: 'success', output: response },
        });
        return resolveExecution(r.data);
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
        } = await fixZodOutput(r.error, json.data, executionId, chatMessages);

        return fixZodOutputRecursive(
          zodSchema,
          zodResponse,
          zodTemplate,
          newTraceId,
          executionId,
          chatMessages,
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
      } = await fixZodOutput(json.error, response, executionId, chatMessages);

      return fixZodOutputRecursive(
        zodSchema,
        zodResponse,
        zodTemplate,
        newTraceId,
        executionId,
        chatMessages,
        retries + 1
      );
    }
  };
  const run = async (
    arg: FunctionArgs,
    _executionId?: string
  ): Promise<Execution<any>> => {
    const {
      instructions,
      documents: docs,
      query: queryArg,
    } = arg as FunctionArgs;
    const executionId = createExecution(arg, _executionId);
    createTrace(executionId, {
      action: 'executing-function',
      functionDef: def,
      input: arg,
    });

    async function getQueryDoc() {
      if (queryArg && def.query) {
        const id = createTrace(executionId, {
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
    const systemPrompt =
      new SystemChatMessage(`Output a json object or array fitting JSON_SCHEMA, based on the PROMPT section below. Use the DOCUMENT section to answer the prompt.
    Code only, no commentary, no introduction sentence, no codefence block.
    You are generating json - make sure to escape any double quotes.
    Do not hallucinate or generate anything that is not in the document.
    Make sure your answer fits the schema.
    
      
    If you are not sure or cannot generate something for any possible reason, return:
    {"error" : <the reason of the error>};`);

    const zodTemplate = `${queryTemplate}${documentsTemplate.join(`\n`)}${
      def.output
        ? `
JSON SCHEMA:"""
${jsonSchema}`
        : `TASK:"""
Output text based on the PROMPT section below.
"""`
    }
PROMPT:"""
${userPrompt}
"""`;

    const id = createTrace(executionId, {
      action: 'calling-open-ai',
      template: zodTemplate,
      response: { type: 'loading' },
    });

    try {
      const chatMessages = [systemPrompt, new HumanChatMessage(zodTemplate)];
      const aiMessage = await getOpenAiModel().call(chatMessages);
      const response = aiMessage.text;

      chatMessages.push(aiMessage);

      if (def.output) {
        return fixZodOutputRecursive(
          def.output as ZodAny,
          response,
          zodTemplate,
          id,
          executionId,
          chatMessages
        );
      } else {
        updateTrace(id, {
          response: { type: 'success', output: response },
        });
        return resolveExecution(response);
      }
    } catch (e) {
      updateTrace(id, {
        response: { type: 'error', error: (e as any).message },
      });
      return resolveExecution({
        type: 'error',
        error: (e as any).message,
      });
    }
  };
  return {
    __internal: { def: def },
    name: (name: string) => {
      return createFn({ ...def, name }, ...args);
    },
    description: (description: string) => {
      return createFn({ ...def, description }, ...args);
    },
    dataset: (dataset) => {
      return createFn({ ...def, dataset: dataset as any }, ...args);
    },

    instructions: (template) => {
      return createFn({ ...def, instructions: template }, ...args);
    },
    withModelParams: (model) => {
      return createFn({ ...def, model: { ...def.model, ...model } }, ...args);
    },

    output: (t) => {
      const tsOutputString = printNode(zodToTs(t).node);
      return createFn(
        {
          output: t,
          tsOutputString,
          ...def,
        },
        ...args
      );
    },
    map: (mapFn) => {
      return createFn(
        {
          ...def,
          mapFns: [...(def.mapFns || []), mapFn],
        },
        ...args
      ) as any;
    },
    sequence: (t) => {
      const aiFn = parseAiFn(t);
      return createFn(
        {
          ...def,
          sequences: [...(def.sequences || []), aiFn.__internal_def],
        },
        ...args
      ) as any;
    },
    document: (d) => {
      return createFn(
        {
          ...def,
          documents: [...(def.documents || []), d],
        },
        ...args
      );
    },
    query: (q) => {
      return createFn(
        {
          ...def,
          query: { queryInput: true, fn: q as any },
        },
        ...args
      );
    },
    create: () => {
      const sha = cyrb53(JSON.stringify(def));
      const defWithId = { ...def, id: sha.toString() };
      const fn = function (arg: FunctionArgs, executionId?: string) {
        return createFn(defWithId, ...args)
          .run(arg as FunctionArgs, executionId)
          .then((r) => r.finalResponse);
      };
      fn.__internal_def = defWithId;
      onCreated && onCreated(fn.__internal_def);
      return fn as any;
    },
    runDataset() {
      const { dataset } = def;
      if (!dataset) {
        throw new Error('No dataset');
      }
      return Promise.all(dataset.map((d: any) => this.run(d)));
    },
    verify(verifyFn) {
      return createFn(
        {
          ...def,
          verify: verifyFn as any,
        },
        ...args
      );
    },
    run: async (runtimeArgs, executionId) => {
      const resp = await run(runtimeArgs as FunctionArgs, executionId).then(
        async (firstResponse) => {
          const mapFns = def.mapFns || [];
          const finalResponse = await mapFns.reduce(async (_p, fn) => {
            const p = await _p;
            const aiFunction = safeParseAiFn(fn);
            if (aiFunction) {
              const functionDef = aiFunction.__internal_def;
              createTrace(p.id, {
                action: 'executing-function',
                functionDef,
                input: p.finalResponse,
              });

              return createFn(functionDef, ...args).run(
                { ...p.finalResponse },
                execution?.id
              );
            } else {
              const appliedMap = await Promise.resolve(
                fn(p.finalResponse, execution, runtimeArgs)
              );
              return resolveExecution(appliedMap);
            }
          }, Promise.resolve(firstResponse));
          return finalResponse;
        }
      );

      return resp;
    },
  };
};

type AiFunction<T> = T & {
  __internal_def: ProcedureBuilderDef;
};

export const parseAiFn = <T>(fn: T): AiFunction<T> => {
  if (!(fn as any).__internal_def) {
    throw new Error('Not an Ai function.');
  }
  return fn as any;
};

export const safeParseAiFn = <T>(fn: T): AiFunction<T> | undefined => {
  try {
    const aiFunction = parseAiFn(fn);
    return aiFunction;
  } catch (e) {
    return undefined;
  }
};

export const llmFunction = createFn();

export type LogsProvider = {
  getLogs: () => Promise<Execution<any>[]>;
  saveLog: (exec: Execution<any>) => void;
};
export type Registry = {
  executionLogs: Execution<any>[];
  logsProvider?: LogsProvider;
  getFunctionsDefs: () => ProcedureBuilderDef[];
  evaluateDataset?: (
    idx: string,
    callback?: (ex: Execution<any>) => void
  ) => Promise<Execution<any>[]>;
  evaluateFn?: (
    idx: string,
    args: FunctionArgs,
    callback?: (ex: Execution<any>) => void
  ) => Promise<Execution<any>>;
};

export const initLLmFunction = (
  logsProvider?: LogsProvider
): {
  registry: Registry;
  llmFunction: ProcedureBuilder<ProcedureParams>;
} => {
  let executionLogs: Execution<any>[] = [];
  logsProvider?.getLogs().then((l) => (executionLogs = l));
  const logHandler = (l: Execution<string>) => {
    const existingLog = executionLogs.find((e) => e.id === l.id);

    if (!existingLog) {
      executionLogs.push(l);
      logsProvider?.saveLog(l);
      return l;
    } else {
      const mergedLogs = {
        ...existingLog,
        ...l,
        functionsExecuted: mergeOrUpdate(
          existingLog.functionsExecuted,
          l.functionsExecuted,
          (o) => o.functionDef.id || ''
        ),
      };
      executionLogs = executionLogs.map((e) => {
        return e.id === mergedLogs.id ? mergedLogs : e;
      });

      logsProvider?.saveLog(mergedLogs);
      return mergedLogs;
    }
  };

  const functionsDefs: ProcedureBuilderDef[] = [];

  const onCreate = (def: ProcedureBuilderDef) => {
    functionsDefs.push(def);
  };

  const llmFunction = createFn({ id: 'test' }, logHandler, onCreate);

  return {
    registry: {
      executionLogs,
      logsProvider: logsProvider,
      getFunctionsDefs: () => functionsDefs,
      evaluateFn: async (idx, args, respCallback) => {
        const fnDef = functionsDefs.find((d) => d.id === idx);
        if (!fnDef) {
          throw new Error('Function not found');
        }

        const _resp = await createFn(fnDef, (l) => {
          const finalResp = logHandler(l);
          respCallback && respCallback(finalResp);
        }).run(args);

        const resp = logHandler(_resp);
        const verified = fnDef.verify?.(resp, args as FunctionArgs);
        const respWithVerified =
          verified !== undefined ? { ...resp, verified } : resp;

        const final = logHandler(respWithVerified);

        respCallback && respCallback(final);

        return executionLogs.find((e) => e.id === resp.id) || final;
      },
      evaluateDataset: (idx, respCallback) => {
        const fnDef = functionsDefs.find((d) => d.id === idx);
        if (!fnDef) {
          throw new Error('Function not found');
        }
        const resp = createFn(fnDef, (l) => {
          logHandler(l);
          respCallback && respCallback(l);
        }).runDataset();

        return resp;
      },
    },
    llmFunction,
  };
};
