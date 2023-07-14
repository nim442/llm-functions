'use client';
import './index.css';

import { CommandLineIcon } from '@heroicons/react/24/outline';
import { ProcedureBuilderDef, Registry } from 'llm-functions-ts';

import classNames from 'classnames';
import * as Tabs from '@radix-ui/react-tabs';

import { Store, TABS, tabsLabels, useStore } from './store';
import { LogsTable } from './LogsTable';

import * as Switch from '@radix-ui/react-switch';
import { useInternalStore } from './internalStore';
import { Playground } from './Playground';
import { DatasetTable } from './DatasetTable';
import { useQuery } from 'react-query';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'sm' | 'md' }
> = ({ className, size = 'md', ...props }) => {
  return (
    <div className={classNames(className, 'relative w-full group')}>
      <div
        className={classNames(
          'absolute  w-full h-full top-0  rounded-full transition-all duration-300 blur-md group-hover:opacity-100 opacity-0',
          'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-100 via-sky-300 to-sky-500'
        )}
      ></div>
      <button
        className={classNames(
          'button bg-white text-black font-semibold py-2 px-4 rounded w-full cursor-pointer z-10 relative',
          size === 'sm' && '!text-xs'
        )}
        {...props}
      />
    </div>
  );
};

export type FunctionProps = {
  functionDef: ProcedureBuilderDef;
  registry: Registry;
} & Partial<Store>;

export const Function: React.FC<FunctionProps> = ({
  functionDef,
  registry,
  ...props
}) => {
  const id = functionDef.id;
  const { data: logs } = useQuery(
    ['logs', id],
    () => registry.logsProvider?.getLogsByFunctionId(id || '')
  );
  if (!id) return <>'Missing id'</>;

  const selectedTab = useStore((s) => props.selectedTab || s.selectedTab);
  const setSelectedTab = useStore(
    (s) => props.setSelectedTab || s.setSelectedTab
  );

  const enableTableView = useInternalStore((s) => s.enableTableView);
  const toggleEnableTableView = useInternalStore(
    (s) => s.toggleEnableTableView
  );

  return (
    <Tabs.Root
      value={selectedTab}
      onValueChange={(v) => setSelectedTab(v as Store['selectedTab'])}
      className="flex flex-col flex-1 h-full overflow-hidden"
      defaultValue="tab1"
    >
      <div className="px-4 border-b border-neutral-800">
        <div className="py-4 w-full justify-center flex flex-col">
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 items-center">
                <CommandLineIcon className="w-6 h-6 text-white" />
                <div className="text-white text-lg">
                  {functionDef.name || 'AI function'}
                </div>
              </div>
              <div className="text-neutral-500 text-sm">
                {functionDef.description}
              </div>
            </div>
            <div className="flex gap-2">
              <label className="text-sm text-neutral-500" htmlFor="table-view">
                JSON view
              </label>
              <Switch.Root
                checked={enableTableView}
                onCheckedChange={toggleEnableTableView}
                className="w-8 h-5 bg-neutral-800 rounded-full"
                id="table-view"
              >
                <Switch.Thumb className="data-[state='checked']:translate-x-[14px] translate-x-[2px] block w-4 h-4 bg-white rounded-full transition-all" />
              </Switch.Root>
              <label className="text-sm text-neutral-500" htmlFor="table-view">
                Table view
              </label>
            </div>
          </div>
        </div>
        <Tabs.List className="gap-4 flex text-sm">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab}
              className="data-[state=active]:text-white data-[state=active]:border-b text-neutral-500 py-2"
              value={tab}
            >
              {tabsLabels[tab]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>

      <Tabs.Content
        className="flex overflow-auto h-full data-[state='inactive']:hidden"
        value={'PLAYGROUND' satisfies Store['selectedTab']}
      >
        <Playground
          functionDef={functionDef}
          evaluateFn={registry.evaluateFn}
        />
      </Tabs.Content>
      <Tabs.Content
        className="flex overflow-auto h-full data-[state='inactive']:hidden"
        value={'DATASET' satisfies Store['selectedTab']}
      >
        {functionDef.dataset ? (
          <div className="w-full">
            <DatasetTable
              evaluateFn={registry.evaluateFn}
              functionDef={functionDef}
              getLogs={registry.logsProvider?.getLogs}
            />
          </div>
        ) : (
          <div className=" text-white font-semibold flex items-center justify-center h-full w-full">
            No dataset
          </div>
        )}
      </Tabs.Content>
      <Tabs.Content
        className="flex overflow-auto h-full data-[state='inactive']:hidden"
        value={'LOGS' satisfies Store['selectedTab']}
      >
        <LogsTable data={logs} />
      </Tabs.Content>
    </Tabs.Root>
  );
};
