import { fromZodError } from 'zod-validation-error';
import { backOff } from 'exponential-backoff';

import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  ChatCompletionResponseMessageRoleEnum,
  Configuration,
  CreateCompletionRequest,
  OpenAIApi,
} from 'openai-edge';

import { OpenAIStream } from 'ai';
import { Pipe, Tuples, Objects, Fn, Call } from 'hotscript';
import { z, ZodError } from 'zod';

import { Document, splitDocument } from './documents/document';
import { stringToJSONSchema } from './jsonSchema';
import {
  DeepPartial,
  ExtractTemplateParams,
  Simplify,
  getApiKeyFromLocalStorage,
  interpolateFString,
  mergeOrUpdate,
} from './utils';

import _ from 'lodash';

import * as nanoid from 'nanoid';
import { printNode, zodToTs } from 'zod-to-ts';

import { cyrb53 } from './cyrb53';

import { DocumentAction } from './action/documentAction';
import {
  FunctionDef,
  FunctionProcedureBuilder,
  openAifunctionCalling,
  toOpenAiFunction,
} from './functions';
import {
  Message,
  MessageType,
  fromLangChainMessage,
  streamToPromise,
} from './Message';
import { zodToJsonSchema } from 'zod-to-json-schema';

import fixPartialJson from './fix-partial-json';

type Parser = z.ZodSchema;

export type inferParser<TParser extends Parser> =
  TParser extends z.infer<TParser> ? z.infer<TParser> : never;

export interface ProcedureParams<
  Output = string,
  Input = unknown,
  Documents extends DocumentWithoutInput[] | unknown = unknown,
  Query extends ((...args: any) => any) | unknown = unknown,
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

export type Execution<T = unknown> = {
  id: string;
  createdAt: Date;
  functionsExecuted: {
    functionExecutionId: string;
    inputs: FunctionArgs;
    trace: Trace;
    finalResponse?: T;
    partialFinalResponse?: DeepPartial<T>;
    functionDef: ProcedureBuilderDef;
  }[];
  finalResponse?: T;
  documentContext?: string[];
  partialFinalResponse?: DeepPartial<T>;
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
  model?: Pick<CreateCompletionRequest, 'model' | 'temperature' | 'top_p'>;
  settings?: {
    selfHealingRetries?: number;
  };
  documents?: DocumentWithoutInput[];
  functions?: FunctionDef[];
  query?: { queryInput: boolean; fn: QueryFn<I, O> };
  instructions?: string;
  dataset?: FunctionArgs[];
  mapFns?: (((a: any) => any) | AiFunction<any>)[];
  verify?: (a: Execution<unknown>, b: FunctionArgs) => boolean;
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

type Response =
  | {
      type: 'loading';
    }
  | {
      type: 'success';
      output: any;
    }
  | {
      type: 'error';
      error: string;
    };

type FunctionCallData = Pick<FunctionDef, 'name' | 'description'> & {
  parameters: unknown;
};

export type Action =
  | Log
  | {
      id: string;
      action: 'executing-function';
      functionDef: ProcedureBuilderDef;
      input: FunctionArgs;
    }
  | DocumentAction
  | {
      id: string;
      action: 'query';
      input?: object;
      response: Response;
    }
  | {
      id: string;
      action: 'calling-function';
      input: FunctionCallData;
      response: Response;
    }
  | {
      id: string;
      action: 'calling-open-ai';
      input?: object;
      messages: Message[];
      response:
        | { type: 'loading' }
        | {
            type: 'success';
            output:
              | { type: 'functionCall'; data: FunctionCallData }
              | { type: 'response'; data: unknown };
          }
        | { type: 'error'; error: string }
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
    model: Partial<ProcedureBuilderDef['model']>
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
  functions: (
    functions: FunctionProcedureBuilder<FunctionDef>[]
  ) => ProcedureBuilder<TParams>;
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
  onExecutionUpdate?: (execution: Execution<unknown>) => void,
  onCreated?: (fnDef: ProcedureBuilderDef) => void,
  openApiKey?: string
) => ProcedureBuilder<TParams>;

export const createFn: createFn = (initDef, ...args) => {
  let execution: Execution<unknown> | undefined;
  let functionExecutionId: string;
  const selfHealingRetries = initDef?.settings?.selfHealingRetries || 1;
  const [onExecutionUpdate, onCreated, openApiKey] = args;
  const def = {
    model: {
      model: 'gpt-3.5-turbo-16k',
      temperature: 0.7,
    },
    settings: { selfHealingRetries },
    ...initDef,
  };

  const getOpenAiModel = () => {
    const config = new Configuration({
      apiKey:
        openApiKey ||
        process.env.OPENAI_API_KEY ||
        getApiKeyFromLocalStorage() ||
        undefined,
    });
    return new OpenAIApi(config);
  };

  const callZodOutput = async <T>(
    messages: ChatCompletionRequestMessage[],
    zodSchema: z.ZodSchema<T>,
    retries: number = 1
  ): Promise<[T, ChatCompletionResponseMessage[]]> => {
    const id = createTrace({
      action: 'calling-open-ai',
      messages: messages.map(fromLangChainMessage),
      response: { type: 'loading' },
    });
    const printFn = openAifunctionCalling
      .name('print')
      .description(
        'Answer the user prompt using this function. This is the function you call once you have your final answer'
      )
      .parameters(zodSchema)
      .implement(() => Promise.resolve('Return'));

    const userFunctions = def.functions || [];
    const functions = [...userFunctions, printFn.def];
    const openAiFunctions = functions.map(toOpenAiFunction);

    const onFunctionCallUpdate = (
      fnCall: Parameters<
        Exclude<Parameters<typeof streamToPromise>[1], undefined>
      >[0]
    ) => {
      if (execution) {
        const executionWithPartialResponse = {
          ...execution,
          functionsExecuted: execution.functionsExecuted.map((e) =>
            e.functionExecutionId === functionExecutionId
              ? {
                  ...e,
                  partialFinalResponse: fnCall.arguments,
                }
              : e
          ),
          partialFinalResponse: fnCall.arguments,
        };
        execution = executionWithPartialResponse;

        onExecutionUpdate?.(execution);
      }
    };

    const debouncedOnFunctionCallUpdate = _.debounce(
      (arg) => onFunctionCallUpdate(arg),
      15,
      { leading: true }
    );
    try {
      const resp = await backOff(
        async () => {
          const respStream = await getOpenAiModel().createChatCompletion({
            ...def.model,
            messages,
            stream: true,
            functions: openAiFunctions,
            function_call:
              userFunctions.length === 0 ? { name: 'print' } : 'auto',
          });

          const stream = OpenAIStream(respStream);
          return streamToPromise(stream, debouncedOnFunctionCallUpdate);
        },
        {
          numOfAttempts: 15,
          startingDelay: 1000,
          jitter: 'full',
          retry: (e) => {
            return e.message === 'rate_limit_exceeded';
          },
        }
      );
      messages = [...messages, resp];

      const functionCallSchema = z.object({
        name: z.string(),
        arguments: stringToJSONSchema,
      });
      if (!resp.function_call) {
        updateTrace(id, {
          response: {
            type: 'error',
            error: `No function call found, Got text instead: ${resp.content}`,
          },
        });
        return callZodOutput(
          [
            ...messages,
            {
              role: ChatCompletionResponseMessageRoleEnum.User,
              content: `Please use the print function to respond. print function has the following scheme:
  ${JSON.stringify(zodToJsonSchema(zodSchema, { target: 'openApi3' }))}         
  `,
            },
          ],
          zodSchema,
          retries + 1
        );
      }

      const functionCallJson = await functionCallSchema.safeParseAsync({
        ...resp.function_call,
        arguments: fixPartialJson(resp.function_call.arguments || ''),
      });

      if (functionCallJson.success) {
        const fn = functions?.find(
          (f) => f.name === functionCallJson.data.name
        );
        if (!fn) {
          throw new Error(
            `Function ${
              functionCallJson.data.name
            } not found in ${JSON.stringify(functions.map((f) => f.name))}`
          );
        }

        const argument = fn?.parameters?.safeParse(
          functionCallJson.data.arguments
        );

        if (argument.success) {
          if (fn.name === 'print') {
            const response = (argument.data as any).argument;
            updateTrace(id, {
              response: {
                type: 'success',
                output: { type: 'response', data: response },
              },
            });

            return [
              response,
              [
                ...messages,
                {
                  role: 'function',
                  content: `Success`,
                  name: 'print',
                },
              ],
            ];
          } else {
            updateTrace(id, {
              response: {
                type: 'success',
                output: {
                  type: 'functionCall',
                  data: {
                    ..._.pick(fn, ['name', 'description']),
                    parameters: argument.data,
                  },
                },
              },
            });
            const id2 = createTrace({
              action: 'calling-function',
              input: {
                ..._.pick(fn, ['name', 'description']),
                parameters: argument.data,
              },
              response: { type: 'loading' },
            });
            const fnResponse = await fn?.implements?.(argument.data);
            updateTrace(id2, {
              response: { type: 'success', output: fnResponse },
            });

            return callZodOutput(
              [
                ...messages,
                {
                  role: 'function',
                  content: fnResponse || 'No response',
                  name: fn.name,
                },
              ],
              zodSchema,
              retries + 1
            );
          }
        } else {
          updateTrace(id, {
            response: {
              type: 'zod-error',
              output: functionCallJson.data.arguments,
              error: argument.error.message,
            },
          });
          if (retries > selfHealingRetries) {
            updateTrace(id, {
              response: {
                type: 'timeout-error',
              },
            });
            return [argument.error.message as any, messages];
          }

          return callZodOutput(
            [...messages, createValidationErrorFunctionMessage(argument.error)],
            zodSchema,
            retries + 1
          );
        }
      } else {
        updateTrace(id, {
          response: {
            type: 'zod-error',
            output: resp.function_call,
            error: functionCallJson.error.message,
          },
        });
        if (retries > selfHealingRetries) {
          updateTrace(id, {
            response: {
              type: 'timeout-error',
            },
          });
          return [functionCallJson.error.message as any, messages];
        }

        return callZodOutput(
          [
            ...messages,
            createValidationErrorFunctionMessage(functionCallJson.error),
          ],
          zodSchema,
          retries + 1
        );
      }
    } catch (e: any) {
      updateTrace(id, {
        response: {
          type: 'error',
          error: e.message,
        },
      });

      return [{ error: e.message } as any, messages];
    }
  };

  const createExecution = (args: FunctionArgs, _executionId?: string) => {
    const id = _executionId || nanoid.nanoid();
    functionExecutionId = nanoid.nanoid();
    execution = {
      id,
      createdAt: new Date(),
      functionsExecuted: [
        {
          functionExecutionId: functionExecutionId,
          trace: [],
          inputs: args,
          functionDef: def,
        },
      ],
    };
    return id;
  };
  const resolveExecution = (
    finalResponse: any,
    documentContext?: string[],
    trace: Trace = []
  ) => {
    if (!execution) {
      throw new Error('Execution not found');
    }
    execution = {
      ...execution,
      functionsExecuted: execution.functionsExecuted.map((e) =>
        e.functionExecutionId === functionExecutionId
          ? {
              ...e,
              trace: [...e.trace, ...trace],
              finalResponse,
              documentContext,
            }
          : e
      ),
      finalResponse,
      documentContext,
    };
    if (onExecutionUpdate && execution) {
      onExecutionUpdate(execution);
    }
    if (finalResponse.error) {
      throw new Error(finalResponse.error);
    }
    return execution;
  };

  const createTrace = (action: DOmit<Action, 'id'>) => {
    const id = nanoid.nanoid();
    const actionWithId = { ...action, id };
    if (!execution) {
      throw new Error('Execution not found');
    }
    execution = {
      ...execution,
      functionsExecuted: execution.functionsExecuted.map((e) =>
        e.functionExecutionId === functionExecutionId
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
        e.functionExecutionId === functionExecutionId
          ? {
              ...e,
              trace: e.trace.map((t) =>
                t.id === id ? { ...t, ...action } : t
              ),
            }
          : e
      ),
    } as Execution<unknown>;
    if (onExecutionUpdate && execution) {
      onExecutionUpdate(execution);
    }
  };

  const run = async (
    arg: FunctionArgs,
    _executionId?: string
  ): Promise<Execution<unknown>> => {
    const executionId = createExecution(arg, _executionId);

    const {
      instructions,
      documents: docs,
      query: queryArg,
    } = arg as FunctionArgs;

    createTrace({
      action: 'executing-function',
      functionDef: def,
      input: arg,
    });

    async function getQueryDoc() {
      if (queryArg && def.query) {
        const id = createTrace({
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
      documents.map(async (d) => {
        const id = createTrace({
          action: 'get-document',
          input: d,
          response: { type: 'loading' },
        });
        const documentContext = await splitDocument(d, executionId, userPrompt);
        updateTrace(id, {
          response: { type: 'success', output: documentContext },
        });

        return `DOCUMENT:"""
${documentContext.map((d) => d.result).join('\n')}
"""`;
      })
    );
    if (!def.output && !def.instructions) {
      return resolveExecution(undefined);
    }
    const zodSchema: z.ZodTypeAny = def.output
      ? z.object({
          argument: z.union([def.output, z.object({ error: z.string() })]),
        })
      : z.string();

    const systemPrompt = {
      role: ChatCompletionResponseMessageRoleEnum.System,
      content: `Use the DOCUMENT to answer user prompts.
Once you have the answer, use the print function. Always call one of the provided functions`,
    };

    const userMessages = _.compact([
      queryTemplate && {
        role: ChatCompletionResponseMessageRoleEnum.User,
        content: queryTemplate,
      },
      documentsTemplate.length > 0 && {
        role: ChatCompletionResponseMessageRoleEnum.System,
        content: documentsTemplate.join('\n'),
      },
      userPrompt && {
        role: ChatCompletionResponseMessageRoleEnum.User,
        content: userPrompt,
      },
    ]);

    let chatMessages: ChatCompletionResponseMessage[] = [
      systemPrompt,
      ...userMessages,
    ];

    const [aiMessage, messages] = await callZodOutput(chatMessages, zodSchema);
    chatMessages = messages;

    return resolveExecution(aiMessage, documentsTemplate);
  };
  return {
    __internal: { def: def },
    name: (name: string) => {
      return createFn({ ...def, name }, ...args);
    },
    description: (description: string) => {
      return createFn({ ...def, description }, ...args);
    },
    functions: (functions) => {
      return createFn(
        {
          ...def,
          functions: [...(def.functions || []), ...functions.map((f) => f.def)],
        },
        ...args
      );
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
              createTrace({
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
              return resolveExecution(appliedMap, execution?.documentContext);
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

export type LogsProvider = {
  getLogsByFunctionId: (functionId: string) => Promise<Execution<unknown>[]>;
  getLogs: () => Promise<Execution<unknown>[]>;
  saveLog: (exec: Execution<unknown>) => void;
};

export type Registry = {
  logsProvider?: LogsProvider;
  getFunctionsDefs: () => Promise<ProcedureBuilderDef[]>;
  evaluateDataset: (
    idx: string,
    callback?: (ex: Execution<unknown>) => void
  ) => Promise<Execution<unknown>[]>;
  evaluateFn: (
    idx: string,
    args: FunctionArgs,
    callback?: (ex: Execution<unknown>) => void
  ) => Promise<Execution<unknown>>;
};

export const initLLmFunction = (
  logsProvider?: LogsProvider,
  openApiKey?: string
): {
  registry: Registry;
  llmFunction: ProcedureBuilder<ProcedureParams>;
} => {
  let executionLogs: Execution<unknown>[] = [];
  logsProvider?.getLogs().then((l) => (executionLogs = l));
  const logHandler = (l: Execution<unknown>) => {
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
          (o) => o.functionExecutionId || ''
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

  const llmFunction = createFn(undefined, logHandler, onCreate, openApiKey);

  return {
    registry: {
      logsProvider: logsProvider,
      getFunctionsDefs: () => Promise.resolve(functionsDefs),
      evaluateFn: async (idx, args, respCallback) => {
        const fnDef = functionsDefs.find((d) => d.id === idx);
        if (!fnDef) {
          throw new Error('Function not found');
        }

        const _resp = await createFn(
          fnDef,
          (l) => {
            const finalResp = logHandler(l);
            respCallback && respCallback(finalResp);
          },
          undefined,
          openApiKey
        ).run(args);

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
        const resp = createFn(
          fnDef,
          (l) => {
            logHandler(l);
            respCallback && respCallback(l);
          },
          undefined,
          openApiKey
        ).runDataset();

        return resp;
      },
    },
    llmFunction,
  };
};

const getUnionError = (error: ZodError) => {
  const e = error.issues[0];
  if (e?.code === 'invalid_union') {
    return fromZodError(e.unionErrors[0]);
  } else {
    return error.message;
  }
};
function createValidationErrorFunctionMessage(error: ZodError) {
  return {
    role: ChatCompletionResponseMessageRoleEnum.Function,
    content: `function 'print' returned a Validation error: ${getUnionError(
      error
    )}
Try again with a valid response. You may be forgetting to add key called 'argument'`,
    name: 'print',
  };
}
