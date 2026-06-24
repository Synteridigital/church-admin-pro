import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";

type Props = {
  label: string;
  description?: string;
  error?: FieldError;
  children: ReactNode;
  htmlFor?: string;
};

export function FormField({ label, description, error, children, htmlFor }: Props) {
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-1">{description}</p>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
