import {
  Execution,
  FunctionArgs,
  LogsProvider,
  ProcedureBuilderDef,
} from 'llm-functions-ts';
import { Inspector } from './Inspector';
import { useInternalStore } from './internalStore';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Playground } from './Playground';
import { useEffect, useState } from 'react';

export const LogsTable: React.FC<{
  data?: Execution<any>[];
  getLogs?: LogsProvider['getLogs'];
}> = ({ data = [], getLogs }) => {
  const [logs, setLogs] = useState(data);
  const enableTableView = useInternalStore((s) => s.enableTableView);
  const [fn, setFn] = useState<{
    functionDef: ProcedureBuilderDef;
    inputs: FunctionArgs;
    execution: Execution<any>;
  }>();
  useEffect(() => {
    getLogs?.().then((l) => setLogs(l));
  }, []);
  return (
    <Dialog.Root
      open={Boolean(fn)}
      onOpenChange={(open) => open === false && setFn(undefined)}
    >
      <div className="w-full">
        <div className="divide-y divide-neutral-800">
          {logs.map((_d, i) => {
            const d = _d.functionsExecuted[0];
            return (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">
                    Evaluation
                  </div>
                  <div className="text-neutral-500 text-sm">
                    {_d.id}
                  </div>
                  <Dialog.Trigger asChild>
                    <button
                      onClick={() => {
                        setFn({
                          functionDef: d.functionDef,
                          inputs: d.inputs,
                          execution: _d,
                        });
                      }}
                      className="text-neutral-300 text-sm underline"
                    >
                      View
                    </button>
                  </Dialog.Trigger>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Input</div>
                  <div className="text-white">
                    {<Inspector table={enableTableView} data={d.inputs} />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Output</div>
                  <div className="text-white">
                    {d.finalResponse ? (
                      <Inspector
                        table={enableTableView}
                        data={d.finalResponse}
                      />
                    ) : (
                      <ArrowPathIcon className="animate-spin text-white w-4 h-4"></ArrowPathIcon>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/70 fixed inset-0" />
        <Dialog.Content className="fixed flex top-[50%] left-[50%] h-[95vh] w-[95vw]  translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-neutral-900 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
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
  );
};
