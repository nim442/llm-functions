import { FunctionArgs } from 'llm-functions-ts';
import { ParsedFStringNode } from 'llm-functions-ts';

export type InstructionsProps = {
  instructions: ParsedFStringNode[];
  runtimeArgs: FunctionArgs;
};
export const Instructions: React.FC<InstructionsProps> = ({
  runtimeArgs,
  instructions,
}) => {
  return (
    <div className="p-4 bg-neutral-800  rounded whitespace-break-spaces text-sm">
      {instructions.map((d, i) => {
        if (d.type == 'variable') {
          return (
            <span className="group/parent relative" key={i}>
              {runtimeArgs?.instructions?.[d.name] ? (
                <span className="font-semibold underline">
                  {runtimeArgs.instructions[d.name]}
                </span>
              ) : (
                <span className="font-semibold underline text-sky-500">
                  {'{' + d.name + '}'}
                </span>
              )}
            </span>
          );
        } else {
          return (
            <span className="" key={i}>
              {d.text}
            </span>
          );
        }
      })}
    </div>
  );
};
