// src/components/uploadParameterUI/ParameterInput.tsx

/**
 * Parameter Input Component
 *
 * Renders the appropriate input component based on the parameter type.
 * Handles validation feedback and maps parameter schema to UI components.
 *
 * Supported parameter types:
 * - integer: Number input with min/max validation
 * - float: Number input with step for decimals
 * - string: Text input
 * - boolean: Checkbox input
 * - choice: Select dropdown with predefined options
 */
import { useId, useCallback, type ChangeEvent } from "react";
import { clsx } from "clsx";
import { AlertCircle, HelpCircle } from "lucide-react";
import type {
    ParameterSchema,
    IntegerParameterSchema,
    FloatParameterSchema,
    StringParameterSchema,
    BooleanParameterSchema,
    ChoiceParameterSchema,
} from "@/types";

export interface ParameterInputProps {
    parameter: ParameterSchema;
    value: unknown;
    onChange: (paramName: string, value: unknown) => void;
    error?: string;
    disabled?: boolean;
};


// Base styles for inputs
const baseInputStyles = clsx(
  "block w-full rounded-lg border",
  "bg-white text-gray-900",
  "placeholder:text-gray-400",
  "transition-colors duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-0",
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
  "px-3 py-2 text-sm"
);

const inputStateStyles = {
  default: clsx(
    "border-gray-300",
    "hover:border-gray-400",
    "focus:border-blue-500 focus:ring-blue-500"
  ),
  error: clsx(
    "border-red-500",
    "hover:border-red-600",
    "focus:border-red-500 focus:ring-red-500"
  ),
};

interface BaseInputProps {
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  hasError: boolean;
  "aria-describedby"?: string;
};

interface IntegerInputProps extends BaseInputProps {
  parameter: IntegerParameterSchema;
};

interface FloatInputProps extends BaseInputProps {
  parameter: FloatParameterSchema;
};

interface StringInputProps extends BaseInputProps {
  parameter: StringParameterSchema;
};

interface BooleanInputProps extends BaseInputProps {
  parameter: BooleanParameterSchema;
};

interface ChoiceInputProps extends BaseInputProps {
  parameter: ChoiceParameterSchema;
};


/**
 * Integer Input Component
 * Renders a number input with integer-specific validation
 */
function IntegerInput({
  id,
  parameter,
  value,
  onChange,
  disabled,
  hasError,
  "aria-describedby": ariaDescribedBy,
}: IntegerInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Allow empty string for optional fields
      if (rawValue === "") {
        onChange(undefined);
        return;
      }

      const numValue = parseInt(rawValue, 10);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    },
    [onChange]
  );

  // Convert value to display string
  const displayValue =
    value !== undefined && value !== null && value !== "" ? String(value) : "";

  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      step="1"
      min={parameter.min ?? undefined}
      max={parameter.max ?? undefined}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      aria-invalid={hasError}
      aria-describedby={ariaDescribedBy}
      placeholder={getPlaceholderText(parameter)}
      className={clsx(
        baseInputStyles,
        hasError ? inputStateStyles.error : inputStateStyles.default
      )}
    />
  );
};


/**
 * Float Input Component
 * Renders a number input with decimal support
 */
function FloatInput({
  id,
  parameter,
  value,
  onChange,
  disabled,
  hasError,
  "aria-describedby": ariaDescribedBy,
}: FloatInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Allow empty string for optional fields
      if (rawValue === "") {
        onChange(undefined);
        return;
      }

      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    },
    [onChange]
  );

  // Convert value to display string
  const displayValue =
    value !== undefined && value !== null && value !== "" ? String(value) : "";

  // Determine appropriate step based on min/max range
  const step = calculateFloatStep(parameter.min, parameter.max);

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      step={step}
      min={parameter.min ?? undefined}
      max={parameter.max ?? undefined}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      aria-invalid={hasError}
      aria-describedby={ariaDescribedBy}
      placeholder={getPlaceholderText(parameter)}
      className={clsx(
        baseInputStyles,
        hasError ? inputStateStyles.error : inputStateStyles.default
      )}
    />
  );
};

/**
 * String Input Component
 * Renders a text input for string parameters
 */
function StringInput({
  id,
  parameter,
  value,
  onChange,
  disabled,
  hasError,
  "aria-describedby": ariaDescribedBy,
}: StringInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const displayValue = typeof value === "string" ? value : "";

  return (
    <input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      aria-invalid={hasError}
      aria-describedby={ariaDescribedBy}
      placeholder={parameter.default ?? `Enter ${formatParamName(parameter.param_name)}`}
      className={clsx(
        baseInputStyles,
        hasError ? inputStateStyles.error : inputStateStyles.default
      )}
    />
  );
};

/**
 * Boolean Input Component
 * Renders a checkbox for boolean parameters
 */
function BooleanInput({
  id,
  parameter,
  value,
  onChange,
  disabled,
  hasError,
  "aria-describedby": ariaDescribedBy,
}: BooleanInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    },
    [onChange]
  );

  const isChecked = Boolean(value);

  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        className={clsx(
          "h-4 w-4 rounded border-gray-300",
          "text-blue-600 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          hasError && "border-red-500"
        )}
      />
      <span className="text-sm text-gray-600">
        {parameter.description || formatParamName(parameter.param_name)}
      </span>
    </div>
  );
};

/**
 * Choice Input Component
 * Renders a select dropdown for choice parameters
 */
function ChoiceInput({
  id,
  parameter,
  value,
  onChange,
  disabled,
  hasError,
  "aria-describedby": ariaDescribedBy,
}: ChoiceInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const displayValue = typeof value === "string" ? value : "";

  return (
    <div className="relative">
      <select
        id={id}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        className={clsx(
          baseInputStyles,
          "appearance-none cursor-pointer pr-10",
          hasError ? inputStateStyles.error : inputStateStyles.default
        )}
      >
        {/* Placeholder option if no default and not required */}
        {!parameter.required && !parameter.default && (
          <option value="">Select {formatParamName(parameter.param_name)}...</option>
        )}

        {/* Choice options */}
        {parameter.choices.map((choice) => (
          <option key={choice} value={choice}>
            {formatChoiceLabel(choice)}
          </option>
        ))}
      </select>

      {/* Dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className={clsx("h-5 w-5", hasError ? "text-red-500" : "text-gray-400")}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};


/**
 * Main Parameter Input Component
 * Routes to the appropriate input type based on parameter schema
 */
export function ParameterInput({
  parameter,
  value,
  onChange,
  error,
  disabled = false,
}: ParameterInputProps) {
  const generatedId = useId();
  const inputId = `param-${parameter.param_name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(error);

  const ariaDescribedBy = hasError
    ? errorId
    : parameter.description
    ? helperId
    : undefined;

  // Handle value change from child components
  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(parameter.param_name, newValue);
    },
    [onChange, parameter.param_name]
  );

  
  const isBooleanType = parameter.type === "boolean";

  return (
    <div className="space-y-1.5">
      {/* Label - only for non-boolean types */}
      {!isBooleanType && (
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {formatParamName(parameter.param_name)}
            {parameter.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>

          {/* Help tooltip icon */}
          {parameter.description && (
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg -left-1/2 transform -translate-x-1/4">
                {parameter.description}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Route to appropriate input type */}
        {parameter.type === "integer" && (
          <IntegerInput
            id={inputId}
            parameter={parameter}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            hasError={hasError}
            aria-describedby={ariaDescribedBy}
          />
        )}

        {parameter.type === "float" && (
          <FloatInput
            id={inputId}
            parameter={parameter}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            hasError={hasError}
            aria-describedby={ariaDescribedBy}
          />
        )}

        {parameter.type === "string" && (
          <StringInput
            id={inputId}
            parameter={parameter}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            hasError={hasError}
            aria-describedby={ariaDescribedBy}
          />
        )}

        {parameter.type === "boolean" && (
          <BooleanInput
            id={inputId}
            parameter={parameter}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            hasError={hasError}
            aria-describedby={ariaDescribedBy}
          />
        )}

        {parameter.type === "choice" && (
          <ChoiceInput
            id={inputId}
            parameter={parameter}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            hasError={hasError}
            aria-describedby={ariaDescribedBy}
          />
        )}

        {/* Error icon for non-boolean inputs */}
        {hasError && !isBooleanType && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper text - range info for numeric types, description for others */}
      {!hasError && (
        <>
          {(parameter.type === "integer" || parameter.type === "float") &&
            hasRangeInfo(parameter) && (
              <p id={helperId} className="text-xs text-gray-500">
                {getRangeText(parameter)}
              </p>
            )}
          {!isBooleanType &&
            parameter.description &&
            !(parameter.type === "integer" || parameter.type === "float") && (
              <p id={helperId} className="text-xs text-gray-500">
                {parameter.description}
              </p>
            )}
        </>
      )}
    </div>
  );
};


// Helper functions

/**
 * Format parameter name for display (snake_case to Title Case)
 */
function formatParamName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format choice value for display
 */
function formatChoiceLabel(choice: string): string {
  // Handle common format patterns
  if (choice.includes("/")) {
    // Keep formats like "video/mp4" as-is but formatted
    return choice;
  }
  return formatParamName(choice);
};

/**
 * Check if parameter has range information
 */
function hasRangeInfo(
  parameter: IntegerParameterSchema | FloatParameterSchema
): boolean {
  return (
    (parameter.min !== null && parameter.min !== undefined) ||
    (parameter.max !== null && parameter.max !== undefined)
  );
};

/**
 * Get human-readable range text
 */
function getRangeText(
  parameter: IntegerParameterSchema | FloatParameterSchema
): string {
  const parts: string[] = [];

  if (parameter.min !== null && parameter.min !== undefined) {
    parts.push(`Min: ${parameter.min}`);
  }
  if (parameter.max !== null && parameter.max !== undefined) {
    parts.push(`Max: ${parameter.max}`);
  }
  if (parameter.default !== undefined) {
    parts.push(`Default: ${parameter.default}`);
  }

  return parts.join(" • ");
};

/**
 * Get placeholder text for numeric inputs
 */
function getPlaceholderText(
  parameter: IntegerParameterSchema | FloatParameterSchema
): string {
  if (parameter.default !== undefined) {
    return `Default: ${parameter.default}`;
  }

  const parts: string[] = [];
  if (parameter.min !== null && parameter.min !== undefined) {
    parts.push(String(parameter.min));
  }
  if (parameter.max !== null && parameter.max !== undefined) {
    parts.push(String(parameter.max));
  }

  if (parts.length === 2) {
    return `${parts[0]} - ${parts[1]}`;
  }

  return `Enter ${formatParamName(parameter.param_name)}`;
};

/**
 * Calculate appropriate step for float inputs based on range
 */
function calculateFloatStep(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    const range = max - min;
    if (range <= 1) return "0.01";
    if (range <= 10) return "0.1";
    if (range <= 100) return "1";
    return "any";
  }
  return "any";
};


export {
  IntegerInput,
  FloatInput,
  StringInput,
  BooleanInput,
  ChoiceInput,
  formatParamName,
  formatChoiceLabel,
};