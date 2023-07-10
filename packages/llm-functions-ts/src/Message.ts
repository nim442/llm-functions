import { BaseMessage } from 'langchain/schema';

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

export const fromLangChainMessage = (m: BaseMessage): Message => {
  switch (m._getType()) {
    case 'system':
      return { type: 'system', content: m.content };
    case 'generic':
      return { type: 'user', content: m.content };
    case 'human':
      return { type: 'user', content: m.content };
    case 'ai':
      const functionCall = m.additional_kwargs.function_call;
      return {
        type: 'asssistant',
        content: m.content,
        function_call: functionCall
          ? { name: functionCall.name, arguments: functionCall.arguments }
          : undefined,
      };
    case 'function':
      return { type: 'function', content: m.content, name: m.name };
  }
};
