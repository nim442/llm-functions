'use client';

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import React from 'react';
import { FunctionArgs } from 'llm-functions';
import { pick, uniq } from 'lodash';
import { flatten } from 'flat';
import { unparse } from 'papaparse';
import PQueue from 'p-queue';
const queue = new PQueue({ concurrency: 10 });
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  evaluate,
}: DataTableProps<TData, TValue> & {
  evaluate: (dataset: FunctionArgs) => Promise<void>;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });
  return (
    <div>
      <div className="flex p-4 w-full border-b border-b-neutral-800 text-white text-sm">
        <div className="flex justify-between w-full gap-2">
          <div>
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex gap-2">
            <button
              className="border border-neutral-600 rounded py-1 px-3 text-xs bg-neutral-700"
              onClick={async () => {
                const items = table.getFilteredSelectedRowModel().rows.map(
                  (row) => () =>
                    evaluate(row.original.dataset as FunctionArgs).then(() => {
                      row.toggleSelected(false);
                    })
                );
                await queue.addAll(items);
              }}
            >
              Evaluate
            </button>
            <button
              onClick={() => {
                const rows =
                  table.getFilteredSelectedRowModel().rows.length > 0
                    ? table.getFilteredSelectedRowModel().rows
                    : table.getRowModel().rows;

                const items = rows.map((r) =>
                  flatten(
                    pick(r.original, [
                      'dataset',
                      'execution.finalResponse',
                      'execution.verified',
                    ])
                  )
                );
                const columns = uniq(
                  items.map((i) => Object.keys(i as object)).flat()
                );
                console.log(columns);
                const csv = unparse(items, { columns: columns });
                const blob = new Blob([csv], {
                  type: 'text/csv;charset=utf-8;',
                });

                const link = document.createElement('a');
                if (link.download !== undefined) {
                  // Browsers that support HTML5 download attribute
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', 'export.csv');
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="border border-neutral-600 rounded py-1 px-3 text-xs bg-neutral-700"
            >
              Download csv
            </button>
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
