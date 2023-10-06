import * as prettier from 'prettier/standalone';
import * as prettierBabylon from 'prettier/plugins/babel';
//@ts-ignore
import * as esTree from 'prettier/plugins/estree';

import { z } from 'zod';

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

type Literal = z.infer<typeof literalSchema>;

export type Json = Literal | { [key: string]: Json } | Json[];

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

export const json = (): z.ZodType<Json, z.ZodTypeDef, Json> => jsonSchema;

export const stringToJSONSchema = z
  .string()
  .transform(async (str, ctx): Promise<z.infer<ReturnType<typeof json>>> => {
    try {
      // GPT sometimes returns a slightly malformed JSON (missing commas etc.). Prettier can help fix some of the issues with the JSON
      const prettyJson = await prettier.format(str, {
        parser: 'json',
        plugins: [prettierBabylon, esTree],
      });
      return JSON.parse(prettyJson);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: (e as Error).message });
      return z.NEVER;
    }
  });

export const stringToSchema = <T extends z.ZodTypeAny>(
  finalSchema: T | undefined
): z.ZodType<z.infer<T>> => {
  return stringToJSONSchema.transform((json, ctx) => {
    if (finalSchema === undefined) {
      ctx.addIssue({ code: 'custom', message: 'No schema provided' });
      return z.NEVER;
    }
    return finalSchema.parse(json);
  });
};
