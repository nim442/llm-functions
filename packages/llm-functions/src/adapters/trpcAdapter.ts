import { z } from 'zod';

import {
  type AnyRouter,
  createRouterFactory,
} from '@trpc/server/dist/core/router';
import { type CreateTRPCProxyClient } from '@trpc/client';

import { createBuilder } from '@trpc/server/dist/core/internals/procedureBuilder';
import { get } from 'lodash';
import { Registry } from '../llm';

export const createLLmFunctionsPlaygroundRouter = (
  router: ReturnType<typeof createRouterFactory>,
  procedure: ReturnType<typeof createBuilder>,
  registry: Registry
) => {
  return {
    llmFunctionsPlayground: router({
      logsProvider: router({
        getLogsByFunctionId: procedure
          .input(z.object({ id: z.string() }))
          .query(async ({ input: { id } }) => {
            return registry.logsProvider?.getLogsByFunctionId(id);
          }),
        getLogs: procedure.query(async () => {
          return registry.logsProvider?.getLogs();
        }),
      }),
      getFunctionDefs: procedure.query(async () => {
        return registry.getFunctionsDefs();
      }),
      evaluateFn: procedure
        .input(z.object({ id: z.string(), functionArgs: z.any() }))
        .mutation(async ({ input: { id, functionArgs } }) => {
          return registry.evaluateFn(id, functionArgs);
        }),
      evaluateDataset: procedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input: { id } }) => {
          return registry.evaluateDataset(id);
        }),
    }),
  };
};
//TODO fix any
export const createRegistryFromTrpcClient = (
  trpcClient: any
): Registry => {
  const playgroundFunctions = get(
    trpcClient,
    'llmFunctionsPlayground'
  ) as unknown as CreateTRPCProxyClient<
    ReturnType<
      typeof createLLmFunctionsPlaygroundRouter
    >['llmFunctionsPlayground']
  >;

  if (!playgroundFunctions) {
    //TODO add documentation on how to fix this error.
    throw new Error(
      'Could not find llmFunctionsPlayground on trpcClient. Make sure you have the llmFunctionsPlaygroundRouter on the server'
    );
  }

  return {
    getFunctionsDefs: () => playgroundFunctions.getFunctionDefs.query(),
    evaluateDataset: (id) => playgroundFunctions.evaluateDataset.query({ id }),
    evaluateFn: (id, functionArgs) =>
      playgroundFunctions.evaluateFn.mutate({ id, functionArgs }),
    logsProvider: {
      getLogs: () => playgroundFunctions.logsProvider.getLogs.query(),
      getLogsByFunctionId: (id) =>
        playgroundFunctions.logsProvider.getLogsByFunctionId.query({ id }),
      saveLog: () => {},
    },
  } as Registry;
};
