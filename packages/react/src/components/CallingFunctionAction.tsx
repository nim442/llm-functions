import { Inspector } from '../Inspector';
import { CommandLineIcon } from '@heroicons/react/24/outline';

export type CallingFunctionActionProps = {
  functionName: string;
  params: unknown;
};
export const CallingFunctionAction: React.FC<CallingFunctionActionProps> = ({
  functionName,
  params,
}) => {
  return (
    <div className="text-white flex items-center text-sm gap-1">
      <CommandLineIcon className="w-4 h-4" /> {functionName} ({' '}
      <span className="text-neutral-500 italic">args:</span>
      <Inspector table={false} data={params} />)
    </div>
  );
};
