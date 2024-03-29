import { Execution, Trace } from 'llm-functions';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 as theme } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { useState } from 'react';
import { jsonSchema } from 'llm-functions';
import { Parameters } from './Parameters';

import { Action } from './Action';
import { Inspector } from './Inspector';

import { ArrowPathIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useInternalStore } from './internalStore';
import { CallingFunctionAction } from './components/CallingFunctionAction';

export type ResponseProps = { response: string };
export const Response: React.FC<ResponseProps> = ({ response }) => {
  const json = jsonSchema.stringToJSONSchema.safeParse(response);
  return (
    <div className="text-sm">
      {json.success ? (
        <Inspector table={false} expandLevel={10} data={json} />
      ) : (
        response
      )}
    </div>
  );
};
export type ExecutionDisplayProps = { data: Execution<any> };
const ErrorState: React.FC<{ message: React.ReactNode }> = ({ message }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
      <strong className="font-bold">Error</strong>
      <span className="block  sm:inline"> {message}</span>
    </div>
  );
};

export const Component: React.FC<ExecutionDisplayProps> = ({ data }) => {
  const { inputs } = data.functionsExecuted[0];
  const trace = data.functionsExecuted.map((d) => d.trace).flat();

  const [selectedAction, setSelectedAction] = useState<number>();
  const enableTableView = useInternalStore((s) => s.enableTableView);
  return (
    <div className=" w-full flex">
      <div className="flex-1">
        <div className="flex flex-col h-full overflow-auto">
          <div className="flex flex-col h-full relative overflow-auto">
            <div className="flex flex-col gap-2 p-4 divide-y divide-neutral-800">
              <div className="py-4">
                <div className="">
                  <div className="text-sm text-white mb-1 font-semibold w-full flex justify-between">
                    <span>
                      Evaluation{' '}
                      <span className="text-neutral-500 text-xs">
                        ({data.id})
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="text-neutral-500 text-xs">Input</div>
                    <div className="text-white text-sm whitespace-break-spaces rounded max-w-md overflow-scroll">
                      <Inspector
                        expandLevel={10}
                        table={enableTableView}
                        data={inputs}
                      />
                    </div>
                  </div>
                  <div className="text-neutral-500 text-xs mb-1">Actions</div>
                  <div className="flex flex-col gap-2">
                    {trace.map((t, tIdx) => {
                      return (
                        <div
                          key={t.id}
                          className={classNames(
                            `flex rounded flex-col bg-neutral-800 roudned-xl p-2 cursor-pointer`,
                            selectedAction === tIdx &&
                              'shadow-xl shadow-blue-400/10 outline outline-blue-400',
                            t.action !== 'executing-function' && 'ml-2'
                          )}
                          onClick={() => setSelectedAction(tIdx)}
                        >
                          <div className="flex gap-1">
                            {((): React.ReactElement => {
                              switch (t.action) {
                                case 'calling-open-ai':
                                  return (
                                    <Action
                                      isLoading={t.response.type === 'loading'}
                                      action="OpenAI call"
                                    />
                                  );
                                case 'executing-function':
                                  return (
                                    <div className="flex flex-col gap-2">
                                      <div className=" text-xs font-semibold  text-neutral-500">
                                        Executing function
                                      </div>
                                      <div className="text-white flex items-center text-sm gap-1">
                                        <CommandLineIcon className="w-4 h-4" />
                                        {t.functionDef.name}
                                        <a className="text-xs text-neutral-500 underline">
                                          ({t.functionDef.id?.slice(0, 6)})
                                        </a>
                                      </div>
                                    </div>
                                  );
                                case 'calling-function':
                                  return (
                                    <div className="flex flex-col gap-2">
                                      <div className=" text-xs font-semibold  text-neutral-500">
                                        Calling external function
                                      </div>
                                      <CallingFunctionAction
                                        functionName={t.input.name}
                                        params={t.input.parameters}
                                      />
                                    </div>
                                  );
                                case 'query':
                                  return (
                                    <Action
                                      isLoading={t.response.type === 'loading'}
                                      action="Querying external source"
                                    />
                                  );
                                case 'log':
                                  return <Action action="log" />;
                                case 'get-document':
                                  return (
                                    <Action
                                      isLoading={t.response.type === 'loading'}
                                      action={`Querying document: ${
                                        t.input.type === 'pdf'
                                          ? t.input.input.name
                                          : t.input.input
                                      }`}
                                    />
                                  );
                              }
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 mb-2 p-4 border-t border-neutral-800 max-h-96">
            <div className="text-neutral-500 text-xs">Output</div>
            <div className="text-white text-sm whitespace-break-spaces rounded">
              {data.verified === true ? (
                <div className="text-xs text-green-500">Verified</div>
              ) : data.verified === false ? (
                <div className="text-xs text-red-400">Failed verification</div>
              ) : (
                ''
              )}
              <Inspector
                expandLevel={10}
                table={enableTableView}
                data={
                  data.finalResponse || data.partialFinalResponse || 'Loading'
                }
              />
              {!data.finalResponse && (
                <ArrowPathIcon className="animate-spin text-white w-4 h-4"></ArrowPathIcon>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 w-fit flex-col gap-2 border-l border-neutral-800 max-w-[500px] p-4 h-full overflow-auto">
        <div className="text-sm text-white">Action state</div>
        {selectedAction !== undefined && renderAction(trace[selectedAction])}
      </div>
    </div>
  );
};
export default Component;
function renderAction(t: Trace[0]): React.ReactElement {
  switch (t.action) {
    case 'calling-open-ai':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-neutral-500 text-sm font-sm mb-1">
                Messages
              </div>
              <div className="flex flex-col gap-2">
                {t.messages.map((message) => {
                  return (
                    <div className="bg-neutral-800 p-4 text-white text-sm whitespace-break-spaces rounded">
                      <div className="text-neutral-500 text-xs font-sm mb-1 font-bold">
                        {message.type}
                      </div>
                      <div className="text-sm whitespace-break-spaces">
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div>
                <div className="text-neutral-500 text-sm font-sm mb-1">
                  Response
                </div>
                <div className=" whitespace-break-spaces">
                  {((): React.ReactElement => {
                    switch (t.response.type) {
                      case 'success': {
                        return (
                          <div className="text-sm">
                            {(function () {
                              switch (t.response.output.type) {
                                case 'functionCall':
                                  return (
                                    <div>
                                      <CallingFunctionAction
                                        functionName={
                                          t.response.output.data.name
                                        }
                                        params={
                                          t.response.output.data.parameters
                                        }
                                      />
                                    </div>
                                  );
                                case 'response':
                                  return (
                                    <Inspector
                                      expandLevel={10}
                                      table={false}
                                      data={t.response.output.data}
                                    />
                                  );
                              }
                            })()}
                          </div>
                        );
                      }
                      case 'zod-error':
                        return (
                          <>
                            <Inspector
                              expandLevel={10}
                              table={false}
                              data={t.response.output}
                            ></Inspector>
                            <ErrorState message={t.response.error} />;
                          </>
                        );
                      case 'timeout-error':
                        return <ErrorState message="Timed out" />;
                      case 'error':
                        return <ErrorState message={t.response.error} />;
                      case 'loading':
                        return (
                          <div className="text-sm text-neutral-700">
                            Loading
                          </div>
                        );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'calling-function':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Parameters defaultOpen={true} heading={'Name'}>
              {t.input.name}
            </Parameters>
            <Parameters defaultOpen={true} heading={'Description'}>
              {t.input.description}
            </Parameters>
            <div>
              <div>
                <Parameters defaultOpen={true} heading={'Input'}>
                  <Inspector
                    expandLevel={10}
                    table={false}
                    data={t.input.parameters}
                  />
                </Parameters>

                <Parameters defaultOpen={true} heading="Output">
                  {((): React.ReactElement => {
                    switch (t.response.type) {
                      case 'success': {
                        return (
                          <div className="text-sm">
                            <Inspector
                              data={t.response.output}
                              table={false}
                            ></Inspector>
                          </div>
                        );
                      }
                      case 'error':
                        return <ErrorState message={t.response.error} />;
                      case 'loading':
                        return (
                          <div className="text-sm text-neutral-700">
                            Loading
                          </div>
                        );
                    }
                  })()}
                </Parameters>
              </div>
            </div>
          </div>
        </div>
      );
    case 'query':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Parameters defaultOpen={true} heading={'Input'}>
              {t.input && JSON.stringify(t.input)}
            </Parameters>
            <Parameters defaultOpen={true} heading={'Response'}>
              {(() => {
                switch (t.response.type) {
                  case 'success': {
                    return (
                      <div className="text-sm">
                        <Inspector table={false} data={t.response.output} />
                      </div>
                    );
                  }
                  case 'loading': {
                    return (
                      <div className="text-sm text-neutral-500">Loading...</div>
                    );
                  }
                  case 'error':
                    return (
                      <>
                        <ErrorState message={t.response.error} />;
                      </>
                    );
                }
              })()}
            </Parameters>
          </div>
        </div>
      );
    case 'executing-function':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 text-white">
            <div className="text-white flex items-center text-sm gap-1">
              <CommandLineIcon className="w-4 h-4" /> {t.functionDef.name}{' '}
              <a className="text-xs text-neutral-500 underline">
                ({t.functionDef.id?.slice(0, 6)})
              </a>
            </div>
            <Parameters defaultOpen={true} heading={'Input'}>
              {
                <Inspector
                  expandLevel={10}
                  name="Input"
                  data={t.input}
                  table={false}
                />
              }
            </Parameters>
            <Parameters defaultOpen={true} heading={'Instructions'}>
              {t.functionDef.instructions && (
                <div className="text-sm whitespace-break-spaces">
                  {t.functionDef.instructions}
                </div>
              )}
            </Parameters>
            <Parameters defaultOpen={true} heading={'Expected output'}>
              {t.functionDef.tsOutputString && (
                <div
                  className={classNames(
                    'whitespace-break-spaces [&>pre]:!bg-transparent text-sm',
                    'bg-neutral-800 rounded'
                  )}
                >
                  <SyntaxHighlighter style={theme} language="typescript">
                    {t.functionDef.tsOutputString}
                  </SyntaxHighlighter>
                </div>
              )}
            </Parameters>
          </div>
        </div>
      );

    case 'get-document':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Parameters defaultOpen={true} heading={'Input'}>
              {(() => {
                switch (t.input.type) {
                  case 'url':
                    return (
                      <div>
                        <div className="text-sm whitespace-break-spaces">
                          Url:{' '}
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={t.input.input}
                          >
                            {t.input.input}
                          </a>
                        </div>
                        <div className="text-sm whitespace-break-spaces">
                          Chunking Query:
                          {t.input?.chunkingStrategy?.options?.chunkingQuery}
                        </div>
                        <div className="text-sm whitespace-break-spaces">
                          Chunking size:
                          {t.input?.chunkingStrategy?.options?.chunkingQuery ||
                            2000}
                        </div>
                      </div>
                    );
                  case 'pdf':
                    return (
                      <div>
                        <div>{t.input.input.name}</div>
                      </div>
                    );
                  case 'text':
                    return (
                      <div>
                        <div>{t.input.input}</div>
                      </div>
                    );
                }
              })()}
            </Parameters>
            <Parameters defaultOpen={true} heading={'Response'}>
              {(() => {
                switch (t.response.type) {
                  case 'success': {
                    return (
                      <div className="text-sm">
                        {t.response.output.map((d) => (
                          <>
                            <Inspector
                              name="chunks"
                              table={false}
                              expandLevel={0}
                              data={d.chunks}
                            ></Inspector>
                            <Inspector
                              name="source"
                              table={false}
                              data={d.source}
                            />
                            <Inspector
                              name="document"
                              table={false}
                              data={d.result}
                            />
                          </>
                        ))}
                      </div>
                    );
                  }
                  case 'loading': {
                    return (
                      <div className="text-sm text-neutral-500">Loading...</div>
                    );
                  }
                  case 'error':
                    return (
                      <>
                        <ErrorState message={t.response.error} />;
                      </>
                    );
                }
              })()}
            </Parameters>
          </div>
        </div>
      );
    case 'log':
      return <div>{t.response.output}</div>;
  }
}
