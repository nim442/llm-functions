import {
  Execution,
  FunctionArgs,
  LogsProvider,
  ProcedureBuilderDef,
  Registry,
} from 'llm-functions-ts';

import { useInternalStore } from './internalStore';
import { isEqual } from 'lodash';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Playground } from './Playground';
export type DatasetTableProps = {
  functionDef: ProcedureBuilderDef;
  getLogs?: LogsProvider['getLogs'];
  evaluateFn?: Registry['evaluateFn'];
};

import { ExecutionColumn, columns } from './DatasetTable/columns';
import { DataTable } from './DatasetTable/data-table';

export const DatasetTable: React.FC<DatasetTableProps> = ({
  functionDef,
  getLogs,
  evaluateFn,
}) => {
  const [fn, setFn] = useState<{
    functionDef: ProcedureBuilderDef;
    inputs: FunctionArgs;
    execution: Execution<any>;
  }>();
  const [logs, setLogs] = useState<Execution<any>[]>([]);
  useEffect(() => {
    getLogs?.().then((l) => setLogs(l));
  }, []);
  if (!functionDef.dataset) return <>No dataset</>;
  const enableTableView = useInternalStore((s) => s.enableTableView);
  const getExecutionFromLogs = (dataset: FunctionArgs) => {
    const l = logs.filter((d) => {
      const fn = d.functionsExecuted.find(
        (d) => d.functionDef.name === functionDef.name
      );
      return isEqual(fn?.inputs, dataset);
    });
    return l;
  };

  const data: ExecutionColumn[] = functionDef.dataset
    .map((dataset) => {
      const executions = getExecutionFromLogs(dataset);
      return {
        dataset,
        evaluate: async () => {
          await evaluateFn?.(functionDef.id || '', dataset);
          const logs = await getLogs?.();
          logs && setLogs(logs);
        },
        viewExecution: (execution: Execution) => {
          setFn({
            functionDef: functionDef,
            inputs: dataset,
            execution: execution,
          });
        },
        execution: executions[executions.length - 1],
      };
    })
    .filter(Boolean);
  return (
    <div className="w-full">
      <Dialog.Root>
        <div className="divide-y divide-neutral-800">
          <DataTable
            evaluate={async (dataset: FunctionArgs) => {
              const e = await evaluateFn?.(functionDef.id || '', dataset);
              const logs = await getLogs?.();
              logs && setLogs(logs);
              return e;
            }}
            columns={columns}
            data={data}
          />
          {/* {functionDef.dataset.map((dataset, i) => {
            const executions = getExecutionFromLogs(dataset);
            return <DataTable columns={columns} data={executions} />;
            // return (
            //   <div key={i} className="flex gap-4 px-4 py-4">
            //     <div className="flex-1">
            //       <div className="text-sm font-semibold text-white">Input</div>
            //       <div className="text-white">
            //         {
            //           <Inspector
            //             expandLevel={10}
            //             table={enableTableView}
            //             data={dataset}
            //           />
            //         }
            //       </div>
            //     </div>
            //     <div className="flex-1">
            //       <div className="text-sm font-semibold text-white">
            //         Executions
            //       </div>
            //       <div className="text-white">
            //         {executions ? (
            //           executions.map((execution) => (
            //             <div>
            //               <Dialog.Trigger asChild>
            //                 <button
            //                   onClick={() => {
            //                     setFn({
            //                       functionDef: functionDef,
            //                       inputs: dataset,
            //                       execution: execution,
            //                     });
            //                   }}
            //                   className="text-neutral-500 text-xs underline"
            //                 >
            //                   View
            //                 </button>
            //               </Dialog.Trigger>
            //               {execution.verified === true ? (
            //                 <div className="text-xs text-green-500">
            //                   Verified
            //                 </div>
            //               ) : execution.verified === false ? (
            //                 <div className="text-xs text-red-400">
            //                   Failed verification
            //                 </div>
            //               ) : (
            //                 ''
            //               )}
            //               <Inspector
            //                 expandLevel={10}
            //                 table={enableTableView}
            //                 data={execution.finalResponse}
            //               ></Inspector>
            //             </div>
            //           ))
            //         ) : (
            //           <div className="text-sm text-neutral-500">Never ran</div>
            //         )}
            //       </div>
            //     </div>
            //     <div className="flex-1">
            //       <Button
            //         onClick={async () => {
            //           await evaluateFn?.(functionDef.id || '', dataset);
            //           const logs = await getLogs?.();
            //           logs && setLogs(logs);
            //         }}
            //         className="!w-fit"
            //       >
            //         Evaluate
            //       </Button>
            //     </div>
            //   </div>
            // );
          })} */}
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/70 fixed inset-0" />
          <Dialog.Content className="fixed flex top-[50%] left-[50%] h-[95vh] w-[95vw]  translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-neutral-900 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-10">
            {fn?.functionDef && (
              <Playground
                functionDef={fn.functionDef}
                readonlyProps={{
                  runtimeArgs: fn.inputs,
                  execution: fn.execution,
                }}
              />
            )}
            <Dialog.Close asChild>
              <button
                className="text-white hover:bg-sky-700 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                aria-label="Close"
              >
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
