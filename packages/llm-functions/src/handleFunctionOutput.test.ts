import { z } from 'zod';
import { test, expect } from 'vitest';
import { stringToSchema } from './jsonSchema';

test('handleFunctionOutput should parse function call correctly', async () => {
  const functionCall = { name: 'test', arguments: '{"test":"a"}' };
  const outputSchema = z.object({ test: z.string() });

  const result = await z
    .object({
      name: z.string().optional(),
      arguments: stringToSchema(outputSchema),
    })
    .parseAsync(functionCall);

  expect(result).toStrictEqual({ name: 'test', arguments: { test: 'a' } });
});

test('handleFunctionOutput should handle error correctly', async () => {
  const functionCall = { name: 'test', arguments: '{"test":123}' };
  const outputSchema = z.object({ test: z.string() });

  try {
    await z
      .object({
        name: z.string().optional(),
        arguments: stringToSchema(outputSchema),
      })
      .parseAsync(functionCall);
  } catch (error) {
    expect(error).toBeInstanceOf(z.ZodError);
  }
});

test('handleFunctionOutput should throw error for malformed JSON', async () => {
  const functionCall = { name: 'test', arguments: '{malformed json}' };
  const outputSchema = z.object({ test: z.string() });

  try {
    await z
      .object({
        name: z.string().optional(),
        arguments: stringToSchema(outputSchema),
      })
      .parseAsync(functionCall);
  } catch (error) {
    expect(error).toBeInstanceOf(z.ZodError);
  }
});
