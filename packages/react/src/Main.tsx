'use client';
import './index.css';

import { CommandLineIcon } from '@heroicons/react/24/outline';
import { ProcedureBuilderDef, Registry } from 'llm-functions';

import classNames from 'classnames';

import { Store, useStore } from './store';
import { groupBy, mapValues } from 'lodash';
import { Function } from './Function';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEffect, useState } from 'react';

export type Props = {
  registry: Registry;
} & Partial<Store>;
const queryClient = new QueryClient();

export const Main: React.FC<Props> = ({ registry, ...props }) => {
  const [functionDefs, setFunctionDefs] = useState<
    Record<string, ProcedureBuilderDef> | undefined
  >(undefined);

  useEffect(() => {
    registry.getFunctionsDefs().then((fD) => {
      const fDs = mapValues(
        groupBy(fD, (d) => d.id),
        (d) => d[0]
      );
      setFunctionDefs(fDs);
    });
  }, []);

  const setIndex = useStore(
    (s) => props.setSelectedFunctionId || s.setSelectedFunctionId
  );
  const index = useStore((s) => props.functionId || s.functionId);
  if (!functionDefs) {
    return (
      <div className="flex flex-col items-center justify-center text-white flex-1">
        <div className="text-lg font-semibold">Loading</div>
      </div>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full w-full flex justify-center bg-neutral-900">
        <div className="p-4 border-r border-neutral-800 w-64">
          <div className="flex gap-2 flex-col">
            <div className="text-sm text-white mb-1">Functions</div>
            {Object.values(functionDefs).map((d, i) => (
              <div
                key={i}
                className={classNames(
                  `hover:bg-blue-700 hover:bg-opacity-20 hover:text-white p-2 px-1 rounded text-neutral-500 cursor-pointer text-md font-light`,
                  index === d.id &&
                    'bg-blue-700 !text-sky-400 font-medium bg-opacity-20'
                )}
                onClick={() => setIndex(d.id || '0')}
              >
                <div className=" flex gap-2 items-center px-1 text-sm whitespace-break-spaces">
                  <div>
                    <CommandLineIcon className="w-4 h-4" />
                  </div>
                  <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                    {d.name || 'Function'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {index ? (
          <Function
            key={index}
            functionDef={functionDefs[index]}
            registry={registry}
            {...props}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white flex-1">
            <div className="text-lg font-semibold">No function selected</div>
            <div className="text-sm font-normal text-neutral-500">
              Select a function on the left to begin
            </div>
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
};
