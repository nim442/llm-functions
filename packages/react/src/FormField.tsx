'use client';
import { VariableIcon } from '@heroicons/react/24/outline';
import * as Form from '@radix-ui/react-form';
import classNames from 'classnames';

export const Input: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => (
  <textarea
    autoComplete="on"
    className={classNames(
      'resize p-2 bg-neutral-900 border rounded-md border-neutral-600 text-sm focus:outline-sky-400 focus-visible:outline-sky-400 focus-visible:outline-double max-w-full',
      'disabled:bg-neutral-800 disabled:border-none disabled:resize-none'
    )}
    {...props}
  ></textarea>
);
export const FormField: React.FC<{
  label: React.ReactNode;
  control: React.ReactNode;
}> = ({ control, label }) => (
  <Form.Field className="flex flex-col gap-0.5" name="question">
    <div className="flex gap-1 items-center pb-1">
      <VariableIcon className="w-4 h-4 text-neutral-500" />
      <Form.Label className="text-sm text-neutral-500">{label}</Form.Label>
    </div>
    <Form.Control asChild>{control}</Form.Control>
  </Form.Field>
);
