import classNames from 'classnames';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export type ActionProps = {
  action: React.ReactNode;
  className?: string;
  isLoading?: boolean;
};
export const Action: React.FC<ActionProps> = ({
  action,
  className,
  isLoading = false,
}) => {
  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-1 flex-col">
        <div className="text-xs font-semibold whitespace-break-spaces text-neutral-500 ">
          Action
        </div>
        <span
          className={classNames(
            'bg-amber-200 max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-amber-800 px-2 rounded flex items-center text-xs font-semibold over h-6',
            className
          )}
        >
          {action}
        </span>
      </div>
      {isLoading && (
        <ArrowPathIcon className="animate-spin w-4 h-4 text-white"></ArrowPathIcon>
      )}
    </div>
  );
};
