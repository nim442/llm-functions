import { ZodAny, z } from 'zod';
import { Simplify } from './utils';
import { zodToJsonSchema } from 'zod-to-json-schema';

export type FunctionDef<P extends z.ZodSchema = z.ZodUnknown> = {
  name: string;
  description: string;
  parameters: P;
  implements: (fn: z.infer<P>) => Promise<string>;
};

type PartialDef = Partial<FunctionDef>;

export interface FunctionProcedureBuilder<TDef extends PartialDef> {
  def: TDef;

  /**
   * Name of the function. Helps openAI to decide if this function is a good fit for the task.
   */
  name: (arg: string) => FunctionProcedureBuilder<TDef & { name: string }>;

  /**
   * Description of the function. Helps openAI to decide if this function is a good fit for the task.
   */
  description: (
    arg: string
  ) => FunctionProcedureBuilder<TDef & { description: string }>;

  /**
   * Parameters of the function. opeanAI will call the function with these parameters.
   * @example
   * ```
   *  parameters(z.object({ websiteUrl: z.string() }))
   * ```
   *
   */
  parameters: <Z extends z.ZodSchema | z.ZodUnknown>(
    arg: Z
  ) => FunctionProcedureBuilder<TDef & { parameters: Z }>;

  /**
   * Function body. The body is run and the results passd back to openAi.
   */
  implement: <P extends Exclude<TDef['parameters'], undefined>>(
    arg: (fn: z.infer<P>) => Promise<string>
  ) => FunctionProcedureBuilder<
    TDef & { implements: (arg: unknown) => Promise<string> }
  >;
}

export type FunctionBuilder<TDef extends PartialDef> = (
  initDef?: TDef
) => FunctionProcedureBuilder<TDef>;

//@ts-ignore
const createFunction: FunctionBuilder<PartialDef> = (def) => {
  return {
    def: def,
    name: (arg: string) => createFunction({ ...def, name: arg }),
    description: (arg) => createFunction({ ...def, description: arg }),
    parameters: (arg) => createFunction({ ...def, parameters: arg as any }),
    implement: (arg: any) =>
      createFunction({
        ...def,
        implements: arg,
      }),
  };
};

export const toOpenAiFunction = <T extends FunctionDef>(fn: T) => {
  return {
    name: fn.name,
    description: fn.description,
    parameters: zodToJsonSchema(fn.parameters),
  };
};

export const openAifunctionCalling = createFunction();
