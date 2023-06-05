import {
  DocumentWithoutInput,
  Execution,
  FunctionArgs,
  ProcedureBuilderDef,
  Registry,
  createFn,
  parseFString,
} from 'llm-functions-ts';
import * as Form from '@radix-ui/react-form';
import {
  CpuChipIcon,
  FireIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { DocumentUploader } from './DocumentUploader';
import ExecutionDisplay from './ExecutionDisplay';
import { FormField, Input } from './FormField';
import { Button } from './Function';
import { Instructions } from './Instructions';

import { useState } from 'react';
import { vs2015 as theme } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
export const Playground: React.FC<{
  aiFunction: ProcedureBuilderDef;
  readonlyProps?: { runtimeArgs: FunctionArgs; execution: Execution<any> };
  evaluateFn?: Registry['evaluateFn'];
}> = ({ aiFunction, evaluateFn, readonlyProps }) => {
  const isReadOnly = Boolean(readonlyProps);

  const id = aiFunction.id;
  if (!id) return <>'Missing id'</>;
  const input = parseFString(aiFunction.instructions || '');
  const inputVariables = input.filter((d) => d.type == 'variable') as {
    type: 'variable';
    name: string;
  }[];

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<Execution<any> | undefined>(
    readonlyProps?.execution
  );

  const [runtimeArgs, setRuntimeArgs] = useState<FunctionArgs>(
    readonlyProps?.runtimeArgs || {}
  );
  const [applyDataSet] = useState(false);

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

  return (
    <>
      <Form.Root className="w-full p-6 flex gap-4 flex-col border-r border-neutral-800 max-w-[400px] justify-between overflow-auto h-full">
        <div className="flex flex-col gap-4 text-neutral-200">
          {/* MODEL INFO */}
          <div className="flex gap-2">
            <div className="text-xs  bg-neutral-800 border-[0.5px] border-neutral-700 rounded flex gap-1 items-center p-2 w-fit">
              <CpuChipIcon className="w-5 h-5"></CpuChipIcon>
              {aiFunction.model?.modelName}
            </div>
            <div className="text-xs  bg-neutral-800 border-[0.5px] border-neutral-700 rounded flex gap-1 items-center p-2 w-fit">
              <FireIcon className="w-5 h-5" />
              {aiFunction.model?.temperature}
            </div>
          </div>
          {/* VARIABLES */}
          {inputVariables.map((d) => (
            <FormField
              label={d.name}
              control={
                <Input
                  disabled={isReadOnly}
                  value={runtimeArgs?.instructions?.[d.name]}
                  onChange={(e) =>
                    setRuntimeArgs({
                      ...runtimeArgs,
                      instructions: {
                        ...runtimeArgs.instructions,
                        [d.name]: e.target.value,
                      },
                    })
                  }
                />
              }
            />
          ))}

          {aiFunction.query?.queryInput && (
            <FormField
              label="query"
              control={
                <Input
                  disabled={applyDataSet}
                  value={runtimeArgs?.query}
                  onChange={(e) =>
                    setRuntimeArgs({
                      ...runtimeArgs,
                      query: e.target.value,
                    })
                  }
                />
              }
            />
          )}
          <div>
            {aiFunction.documents && (
              <DocumentUploader
                runtimeArgs={runtimeArgs}
                setRuntimeArgs={setRuntimeArgs}
                documents={aiFunction.documents as DocumentWithoutInput[]}
              ></DocumentUploader>
            )}
          </div>
          {aiFunction.instructions && (
            <div className="flex gap-1 flex-col">
              <div className="text-sm text-neutral-500">Instructions</div>

              <Instructions
                runtimeArgs={runtimeArgs}
                instructions={input}
              ></Instructions>
            </div>
          )}

          {/* </Parameters> */}
          <div>
            <div className="text-sm text-neutral-500 mb-1">Expected output</div>
            <div
              className={classNames(
                'whitespace-break-spaces [&>pre]:!bg-transparent text-sm',
                'bg-neutral-800 rounded p-2'
              )}
            >
              <SyntaxHighlighter style={theme} language="typescript">
                {aiFunction.tsOutputString || 'string'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
        {!isReadOnly && (
          <Button
            type="button"
            onClick={async (e) => {
              generateResponse(e, id);
              setLoading(true);
            }}
          >
            <span className="flex relative justify-center items-center group-hover:text-sky-600 transition-all">
              Evaluate
              {loading && (
                <ArrowPathIcon className="w-4 h-4 animate-spin absolute right-0" />
              )}
            </span>
          </Button>
        )}
      </Form.Root>
      {response && <ExecutionDisplay key={response.id} data={response} />}
    </>
  );
};
