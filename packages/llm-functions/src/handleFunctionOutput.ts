import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageFunctionCall,
} from 'openai-edge';
import { z } from 'zod';
import { stringToSchema } from './jsonSchema';
import { Effect as E, Option as O, pipe } from 'effect';
import { FunctionDef } from './functions';
import { ZodError } from 'zod-validation-error';

type LLMError =
  | { type: 'error'; error: string }
  | { type: 'zod-error'; error: ZodError }
  | { type: 'function-not-found'; error: string }
  | { type: 'timeout-error'; error: string }
  | { type: 'unknown-error'; error: string };

const createLLMerror = (llmError: LLMError): LLMError => {
  return llmError;
};
type FunctionCallData<T = unknown> =
  | {
      type: 'function-executed';
      data: Pick<FunctionDef, 'name' | 'description'> & {
        parameters: T;
        content: string;
      };
    }
  | { type: 'resolve'; data: T };

export function succceedChatMessage<T>(
  chatMessage: FunctionCallData<T>
): E.Effect<never, LLMError, FunctionCallData<T>> {
  return E.succeed(chatMessage);
}

export function getFunctionOutput<T = any>(
  functionCall: ChatCompletionRequestMessageFunctionCall,
  functions: FunctionDef[]
) {
  const functionCallSchema = z.object({
    name: z.string().optional(),
    arguments: stringToSchema(
      z.union(
        //Tell zod that our array will have atleast two members
        functions.map((s) => s.parameters) as unknown as [z.ZodAny, z.ZodAny]
      )
    ),
  });

  const functionEffect = E.tryPromise({
    try: () => functionCallSchema.parseAsync(functionCall),
    catch: (e): LLMError => {
      if (e instanceof z.ZodError) {
        return {
          type: 'zod-error',
          error: e,
        };
      } else {
        return { type: 'unknown-error', error: 'Something went wrong' };
      }
    },
  });

  const functionParseEffect = pipe(
    functionEffect,
    E.map((fn) => {
      const a = functions.find((f) => f.name === fn.name);
      if (a) {
        return { ...a, arguments: fn.arguments };
      }
    }),
    E.filterOrFail(O.toRefinement(O.fromNullable), (fn) =>
      createLLMerror({
        type: 'function-not-found',
        error: `Function ${fn?.name} not found in ${JSON.stringify(
          functions.map((f) => f.name)
        )}`,
      })
    ),

    E.flatMap((fn) => {
      if (fn.name === 'print' || fn.name === 'error') {
        return succceedChatMessage({
          type: 'resolve',
          data: fn.arguments,
        });
      } else {
        return E.promise(() => fn?.implements?.(fn.arguments)).pipe(
          E.flatMap((s) =>
            succceedChatMessage({
              type: 'function-executed',
              data: {
                description: fn.description,
                name: fn.name,
                content: s,
                parameters: fn.arguments,
              },
            })
          )
        );
      }
    })
  );

  return functionParseEffect;
}
