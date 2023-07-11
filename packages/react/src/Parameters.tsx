'use client';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRightIcon } from '@radix-ui/react-icons';

export const Parameters: React.FC<{
  defaultOpen?: boolean;
  heading: React.ReactNode;
  children: React.ReactNode;
}> = ({ heading, children, defaultOpen = true }) => (
  <Collapsible.Root defaultOpen={defaultOpen} className="">
    <Collapsible.Trigger className="text-sm text-neutral-500 flex gap-1 justify-center items-center group">
      <ChevronRightIcon className="group-data-[state=open]:rotate-90 transition-all" />{' '}
      <div className="text-sm text-neutral-500 mb-1">{heading}</div>
    </Collapsible.Trigger>
    <Collapsible.Content className="bg-neutral-800 text-white rounded text-sm p-4 whitespace-break-spaces">{children}</Collapsible.Content>
  </Collapsible.Root>
);
