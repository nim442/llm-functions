import { Execution } from 'llm-functions-ts';
import { Inspector } from './Inspector';
import { useInternalStore } from './internalStore';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const LogsTable: React.FC<{
  data?: Execution<any>[];
}> = ({ data = [] }) => {
  const enableTableView = useInternalStore((s) => s.enableTableView);
  return (
    <div className="w-full">
      <div className="divide-y divide-neutral-800">
        {data.map((d, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">Evaluation</div>
              <div className="text-neutral-500 text-sm">{d.id}</div>
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
                  <Inspector table={enableTableView} data={d.finalResponse} />
                ) : (
                  <ArrowPathIcon className="animate-spin text-white w-4 h-4"></ArrowPathIcon>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
