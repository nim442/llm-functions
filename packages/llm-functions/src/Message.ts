import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  ChatCompletionResponseMessageRoleEnum,
} from 'openai-edge';

import _ from 'lodash';
import fixPartialJson from './fix-partial-json';
import { z } from 'zod';

export type MessageType = 'system' | 'user' | 'asssistant' | 'function';
export type Message =
  | {
      type: 'system';
      content: string;
    }
  | {
      type: 'user';
      content: string;
    }
  | {
      type: 'asssistant';
      content: string;
      function_call?: { name?: string; arguments?: unknown };
    }
  | {
      type: 'function';
      content: string;
      name?: string;
    };

export const fromLangChainMessage = (
  m: ChatCompletionRequestMessage
): Message => {
  switch (m.role) {
    case 'system':
      return { type: 'system', content: m.content || '' };
    case 'user':
      return { type: 'user', content: m.content || '' };

    case 'assistant':
      const functionCall = m.function_call;
      return {
        type: 'asssistant',
        content: m.content || '',
        function_call: functionCall
          ? { name: functionCall.name, arguments: functionCall.arguments }
          : undefined,
      };
    case 'function':
      return { type: 'function', content: m.content || '', name: m.name };
  }
};

const parseResponse = (response: string): ReturnType => {
  try {
    const json = JSON.parse(fixPartialJson(response));
    if (_.has(json, ['function_call'])) {
      return {
        type: 'success',
        data: {
          role: ChatCompletionResponseMessageRoleEnum.Assistant,
          function_call: json.function_call,
          content: '',
        },
      };
    } else {
      return { type: 'no-fn-call' };
    }
  } catch (e) {
    return { type: 'no-fn-call' };
  }
};

export const OpenAIError = z.object({
  code: z
    .union([
      z.literal('context_length_exceeded'),
      z.literal('rate_limit_exceeded'),
    ])
    .optional(),
  message: z.string().optional(),
});

export type OpenAIError = z.infer<typeof OpenAIError>;

type ReturnType =
  | {
      type: 'success';
      data: ChatCompletionResponseMessage;
    }
  | {
      type: 'no-fn-call';
    };

export const streamToPromise = async (
  stream: ReadableStream<any>,
  onFunctionCallUpdate?: (functionCall: {
    name?: string;
    arguments?: unknown;
  }) => void
): Promise<ReturnType> => {
  const reader = stream.getReader();
  let stringResponse = '';
  return reader
    .read()
    .then(function pump({ done, value }): ReturnType {
      if (done) {
        // Do something with last chunk of data then exit reader
        return parseResponse(stringResponse);
      }
      // Otherwise do something here to process current chunk
      let stringToken = new TextDecoder().decode(value);

      stringResponse += stringToken;

      const r = parseResponse(stringResponse);
      if (r.type === 'no-fn-call') {
        return r;
      }
      try {
        if (r.data.function_call?.arguments) {
          const partialArgs = JSON.parse(
            fixPartialJson(r.data.function_call?.arguments)
          );
          onFunctionCallUpdate?.({
            name: r.data.function_call.name,
            arguments: partialArgs,
          });
        } else {
        }
      } catch (_) {
        // Do nothing here. The partial json is only there to show progress to the end user. It's okay if sometimes the parsing fails.
        // It fixes itself when more tokens come in
      }
      //@ts-ignore
      return reader.read().then(pump);
    })
    .catch((e) => {
      //TODO: FIX THIS HACK. Have to do this because ai sdk returns a stringified error message
      const openAIErrorJSON = JSON.parse(
        e.message.replace('Response error:', '')
      ).error;

      const openAiError = OpenAIError.safeParse(openAIErrorJSON);
      if (openAiError.success) {
        throw new Error(openAiError.data.code);
      } else {
        throw e;
      }
    });
};
