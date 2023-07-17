'use client';

import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Execution, FunctionArgs } from 'llm-functions';
import { Inspector } from '../Inspector';
import {
  ArrowSmallDownIcon,
  ArrowSmallUpIcon,
} from '@heroicons/react/24/outline';
import { Checkbox } from '../components/checkbox';
import * as Dialog from '@radix-ui/react-dialog';

export type ExecutionColumn = {
  execution?: Execution;
  dataset: FunctionArgs;
  evaluate: () => void;
  viewExecution: (execution: Execution) => void;
};
let lastSelectedId = '';
const columnHelper = createColumnHelper<ExecutionColumn>();
//@ts-ignore
export const columns: ColumnDef<ExecutionColumn, any>[] = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row, table }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => {
          if (e.shiftKey) {
            const { rows, rowsById } = table.getRowModel();
            const rowsToToggle = getRowRange(rows, row.id, lastSelectedId);
            const isLastSelected = rowsById[lastSelectedId].getIsSelected();
            rowsToToggle.forEach((row) => row.toggleSelected(isLastSelected));
          }

          lastSelectedId = row.id;
        }}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor('execution.id', {
    header: 'Execution ID',
    cell: (props) => {
      const execution = props.row.original.execution;

      return (
        <div className="flex flex-col gap-2">
          {execution ? (
            <div>
              <Dialog.Trigger asChild>
                <button
                  className="text-xs text-neutral-500 underline"
                  onClick={() => props.row.original.viewExecution(execution)}
                >
                  {execution.id.slice(0, 6)}
                </button>
              </Dialog.Trigger>
            </div>
          ) : (
            <div className="text-white">-</div>
          )}
        </div>
      );
    },
  }),
  columnHelper.display({
    header: 'Dataset',
    cell: (props) => {
      return props.row.original.dataset ? (
        <Inspector
          expandLevel={10}
          data={props.row.original.dataset}
          table={false}
        />
      ) : null;
    },
  }),
  columnHelper.accessor('execution.finalResponse', {
    header: 'Response',
    cell: (props) => {
      return props.getValue() ? (
        <div className="flex flex-col gap-2">
          <div className="text-white">
            <Inspector expandLevel={10} data={props.getValue()} table={false} />
          </div>
        </div>
      ) : null;
    },
  }),
  columnHelper.accessor('execution.verified', {
    header: ({ column }) => {
      return (
        <button
          className="flex hover:bg-blue-500/20 rounded p-2 hover:text-white"
          onClick={() => column.toggleSorting()}
        >
          Verified
          {column.getIsSorted() === 'asc' ? (
            <ArrowSmallUpIcon className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowSmallDownIcon className="ml-2 h-4 w-4" />
          ) : null}
        </button>
      );
    },
    cell: (props) => {
      const verified = props.getValue();
      return verified === true ? (
        <div className="text-xs text-green-500">Verified</div>
      ) : verified === false ? (
        <div className="text-xs text-red-400">Failed verification</div>
      ) : (
        ''
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    cell: (props) => {
      return (
        <button
          onClick={() => {
            props.row.original.evaluate();
          }}
          className="border border-neutral-600 rounded py-1 px-3 text-xs bg-neutral-700 "
        >
          Evaluate
        </button>
      );
    },
  }),
];

function getRowRange<T>(rows: Array<Row<T>>, idA: string, idB: string) {
  const range: Array<Row<T>> = [];
  let foundStart = false;
  let foundEnd = false;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.id === idA || row.id === idB) {
      if (foundStart) {
        foundEnd = true;
      }
      if (!foundStart) {
        foundStart = true;
      }
    }

    if (foundStart) {
      range.push(row);
    }

    if (foundEnd) {
      break;
    }
  }

  return range;
}
