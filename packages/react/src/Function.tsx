'use client';
import './index.css';

import { CommandLineIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  FunctionArgs,
  ProcedureBuilderDef,
  Execution,
  createFn,
  Registry,
} from 'llm-functions-ts';
import { parseFString } from 'llm-functions-ts';
import { useState } from 'react';

import classNames from 'classnames';
import * as Tabs from '@radix-ui/react-tabs';

import { Store, TABS, tabsLabels, useStore } from './store';
import { LogsTable } from './LogsTable';

import * as Switch from '@radix-ui/react-switch';
import { useInternalStore } from './internalStore';
import { Playground } from './Playground';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ className, ...props }) => {
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
          'button bg-white text-black font-semibold py-2 px-4 rounded w-full cursor-pointer z-10 relative'
        )}
        {...props}
      />
    </div>
  );
};

export type FunctionProps = {
  logs?: Execution<any>[];
  aiFunction: ProcedureBuilderDef;
  evaluateDataset?: Registry['evaluateDataset'];
  evaluateFn?: Registry['evaluateFn'];
} & Partial<Store>;

export const Function: React.FC<FunctionProps> = ({
  aiFunction,
  evaluateDataset,
  evaluateFn,
  ...props
}) => {
  const id = aiFunction.id;
  if (!id) return <>'Missing id'</>;
  const input = parseFString(aiFunction.instructions || '');
  const inputVariables = input.filter((d) => d.type == 'variable') as {
    type: 'variable';
    name: string;
  }[];

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<Execution<any>>();
  const [dataset, setDataset] = useState<Execution<any>[]>();

  const [runtimeArgs, setRuntimeArgs] = useState<FunctionArgs>({});
  const [applyDataSet] = useState(false);
  const selectedTab = useStore((s) => props.selectedTab || s.selectedTab);
  const setSelectedTab = useStore(
    (s) => props.setSelectedTab || s.setSelectedTab
  );
  const generateResponse = async (
    e: React.MouseEvent<HTMLButtonElement>,
    i: string
  ) => {
    e.preventDefault();
    const response = await (evaluateFn
      ? evaluateFn(i, runtimeArgs, (t) => {
          setResponse(t);
        })
      : createFn(aiFunction, [], (t) => {
          setResponse(t);
        }).run(runtimeArgs));

    setLoading(false);
    setResponse(response);
  };
  const enableTableView = useInternalStore((s) => s.enableTableView);
  const toggleEnableTableView = useInternalStore(
    (s) => s.toggleEnableTableView
  );
  const handleEvaluateDatasetClick = async () => {
    if (evaluateDataset) {
      const response = await evaluateDataset(id);
      setDataset(response);
    } else {
      setLoading(true);
      const response = await createFn(aiFunction, [], (t) => {
        setDataset((resp) => {
          const r = resp?.find((d) => d.id === t.id);
          if (r) {
            return resp?.map((d) => (d.id === t.id ? t : d));
          }
          return [...(resp || []), t];
        });
      }).runDataset();

      setDataset(response);
      setLoading(false);
    }
  };

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
                  {aiFunction.name || 'AI function'}
                </div>
              </div>
              <div className="text-neutral-500 text-sm">
                {aiFunction.description}
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
        <Playground aiFunction={aiFunction} evaluateFn={evaluateFn} />
      </Tabs.Content>
      <Tabs.Content
        className="flex overflow-auto h-full data-[state='inactive']:hidden"
        value={'DATASET' satisfies Store['selectedTab']}
      >
        {aiFunction.dataset ? (
          <div className="w-full">
            <div className="flex justify-between p-4 border-b border-neutral-800">
              <div className="text-white">
                <div className="text-white">Dataset</div>
                <div className="text-neutral-500 text-sm">
                  Last ran: yesterday
                </div>
              </div>
              <Button
                className="!w-fit"
                type="button"
                onClick={handleEvaluateDatasetClick}
              >
                <span className="flex relative justify-center items-center">
                  Evaluate dataset
                  {loading && (
                    <ArrowPathIcon className="w-4 h-4 animate-spin absolute right-0" />
                  )}
                </span>
              </Button>
            </div>
            {dataset && <LogsTable data={dataset} />}
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
        <LogsTable data={props.logs} />
      </Tabs.Content>
    </Tabs.Root>
  );
};
