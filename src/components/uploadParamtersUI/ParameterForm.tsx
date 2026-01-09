/**
 * Parameter Form Component
 *
 * Renders a dynamic form for configuring operation parameters.
 * Features:
 * - Dynamic input rendering based on parameter types
 * - Real-time validation with error display
 * - Default value initialization
 * - Reset to defaults functionality
 * - Form state management
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { clsx } from "clsx";
import {
  RotateCcw,
  Settings2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ParameterInput } from "./ParameterInput";
import type {
  OperationDefinition,
  ParameterSchema,
} from "@/types/operation-types";
import {
  buildDefaultParameters,
  validateParameters,
  validateParameter,
} from "@/types/operation-types";


export type ParameterValues = Record<string, unknown>;


export type ValidationErrors = Record<string, string>;


export interface ParameterFormState {
  values: ParameterValues;
  errors: ValidationErrors;
  isValid: boolean;
  isDirty: boolean;
  touchedFields: Set<string>;
};


export interface ParameterFormProps {
  operation: OperationDefinition;
  initialValues?: ParameterValues;
  onChange?: (values: ParameterValues, isValid: boolean) => void;
  onValidationChange?: (errors: ValidationErrors, isValid: boolean) => void;
  disabled?: boolean;
  showResetButton?: boolean;
  showValidationSummary?: boolean;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  className?: string;
};


export interface UseParameterFormReturn {
  values: ParameterValues;
  errors: ValidationErrors;
  isValid: boolean;
  isDirty: boolean;
  touchedFields: Set<string>;
  setValue: (paramName: string, value: unknown) => void;
  setValues: (values: ParameterValues) => void;
  reset: () => void;
  validate: () => boolean;
  touchField: (paramName: string) => void;
  getFieldError: (paramName: string) => string | undefined;
}

/**
 * Custom hook for managing parameter form state
 * Provides form values, validation, and state management
 */
export function useParameterForm(
  operation: OperationDefinition,
  options: {
    initialValues?: ParameterValues;
    validateOnMount?: boolean;
    validateOnChange?: boolean;
    onChange?: (values: ParameterValues, isValid: boolean) => void;
    onValidationChange?: (errors: ValidationErrors, isValid: boolean) => void;
  } = {}
): UseParameterFormReturn {
  const {
    initialValues,
    validateOnMount = false,
    validateOnChange = true,
    onChange,
    onValidationChange,
  } = options;

  // Create a stable key from operation name to detect operation changes
  const operationKey = operation.operation_name;

  // Calculate default values from operation
  const defaultValues = useMemo(
    () => buildDefaultParameters(operation),
    [operation]
  );

  // Merge initial values with defaults
  const mergedInitialValues = useMemo(
    () => ({ ...defaultValues, ...initialValues }),
    [defaultValues, initialValues]
  );

  // Calculate initial errors if validateOnMount is true
  const initialErrors = useMemo(() => {
    if (validateOnMount) {
      const result = validateParameters(operation, mergedInitialValues);
      return result.errors;
    }
    return {};
  }, [validateOnMount, operation, mergedInitialValues]);

  const [values, setValuesState] = useState<ParameterValues>(mergedInitialValues);
  const [errors, setErrors] = useState<ValidationErrors>(initialErrors);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Track the previous operation key to detect changes
  const prevOperationKeyRef = useRef(operationKey);
  
  // Track if this is the initial mount to avoid triggering onChange on mount
  const isInitialMountRef = useRef(true);

  // Reset form when operation changes
  useEffect(() => {
    if (prevOperationKeyRef.current !== operationKey) {
      prevOperationKeyRef.current = operationKey;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValuesState(mergedInitialValues);
      setErrors(validateOnMount ? initialErrors : {});
      setTouchedFields(new Set());
      setIsDirty(false);
    }
  }, [operationKey, mergedInitialValues, validateOnMount, initialErrors]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Notify parent of value changes via useEffect - this is the key fix!
  // This runs AFTER the render is complete, avoiding the "setState during render" issue
  useEffect(() => {
    // Skip the initial mount to avoid unnecessary calls
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    
    onChange?.(values, isValid);
  }, [values, isValid, onChange]);

  // Notify parent of validation changes
  useEffect(() => {
    if (!isInitialMountRef.current) {
      onValidationChange?.(errors, isValid);
    }
  }, [errors, isValid, onValidationChange]);

  // Validate all parameters
  const validate = useCallback((): boolean => {
    const result = validateParameters(operation, values);
    setErrors(result.errors);
    return result.valid;
  }, [operation, values]);

  // Validate a single parameter
  const validateField = useCallback(
    (paramName: string, value: unknown): string | undefined => {
      const param = operation.parameters.find(
        (p) => p.param_name === paramName
      );
      if (!param) return undefined;

      const result = validateParameter(param, value);
      return result.valid ? undefined : result.error;
    },
    [operation.parameters]
  );

  // Set a single value - no longer calls onChange directly
  const setValue = useCallback(
    (paramName: string, value: unknown) => {
      setValuesState((prev) => ({ ...prev, [paramName]: value }));
      
      // Validate if enabled
      if (validateOnChange) {
        const fieldError = validateField(paramName, value);
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          if (fieldError) {
            newErrors[paramName] = fieldError;
          } else {
            delete newErrors[paramName];
          }
          return newErrors;
        });
      }

      // Mark as dirty
      setIsDirty(true);
    },
    [validateOnChange, validateField]
  );

  // Set multiple values at once - no longer calls onChange directly
  const setValues = useCallback(
    (newValuesToSet: ParameterValues) => {
      setValuesState((prev) => ({ ...prev, ...newValuesToSet }));

      if (validateOnChange) {
        // We need to validate with the merged values
        setValuesState((currentValues) => {
          const result = validateParameters(operation, currentValues);
          setErrors(result.errors);
          return currentValues; // Return unchanged, we just needed to read the value
        });
      }

      setIsDirty(true);
    },
    [validateOnChange, operation]
  );

  // Reset to defaults - no longer calls onChange directly
  const reset = useCallback(() => {
    setValuesState(mergedInitialValues);
    setErrors({});
    setTouchedFields(new Set());
    setIsDirty(false);
  }, [mergedInitialValues]);

  // Mark field as touched
  const touchField = useCallback((paramName: string) => {
    setTouchedFields((prev) => new Set([...prev, paramName]));
  }, []);

  const getFieldError = useCallback(
    (paramName: string): string | undefined => {
      if (!validateOnChange && !touchedFields.has(paramName)) {
        return undefined;
      }
      return errors[paramName];
    },
    [errors, touchedFields, validateOnChange]
  );

  return {
    values,
    errors,
    isValid,
    isDirty,
    touchedFields,
    setValue,
    setValues,
    reset,
    validate,
    touchField,
    getFieldError,
  };
}

/**
 * Group parameters by category for better organization
 * Currently groups by required vs optional
 */
function groupParameters(parameters: ParameterSchema[]): {
  required: ParameterSchema[];
  optional: ParameterSchema[];
} {
  const required: ParameterSchema[] = [];
  const optional: ParameterSchema[] = [];

  for (const param of parameters) {
    if (param.required) {
      required.push(param);
    } else {
      optional.push(param);
    }
  }

  return { required, optional };
};

/**
 * Parameter Form Component
 * Renders a complete form for configuring operation parameters
 */
export function ParameterForm({
  operation,
  initialValues,
  onChange,
  onValidationChange,
  disabled = false,
  showResetButton = true,
  showValidationSummary = true,
  validateOnMount = false,
  validateOnChange = true,
  className,
}: ParameterFormProps) {
  // Use the parameter form hook
  const { values, errors, isValid, isDirty, setValue, reset, getFieldError } =
    useParameterForm(operation, {
      initialValues,
      validateOnMount,
      validateOnChange,
      onChange,
      onValidationChange,
    });

  
  const { required, optional } = useMemo(
    () => groupParameters(operation.parameters),
    [operation.parameters]
  );

  
  const handleChange = useCallback(
    (paramName: string, value: unknown) => {
      setValue(paramName, value);
    },
    [setValue]
  );

  
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // No parameters message
  if (operation.parameters.length === 0) {
    return (
      <div className={clsx("rounded-lg border border-gray-200 p-6", className)}>
        <div className="flex items-center gap-3 text-gray-300">
          <Settings2 className="h-5 w-5" />
          <p className="text-sm">
            This operation has no configurable parameters.
          </p>
        </div>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Header with validation status and reset button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-gray-300" />
          <h3 className="text-sm font-medium text-gray-300">Configuration</h3>
          {showValidationSummary && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isValid
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {isValid ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Valid
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  {errorCount} {errorCount === 1 ? "issue" : "issues"}
                </>
              )}
            </span>
          )}
        </div>

        {showResetButton && isDirty && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium",
              "text-gray-300 cursor-pointer hover:text-gray-900 hover:bg-gray-100",
              "rounded-md transition-colors duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      {/* Required parameters section */}
      {required.length > 0 && (
        <div className="space-y-4">
          {optional.length > 0 && (
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Required
            </h4>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {required.map((param) => (
              <ParameterInput
                key={param.param_name}
                parameter={param}
                value={values[param.param_name]}
                onChange={handleChange}
                error={getFieldError(param.param_name)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional parameters section */}
      {optional.length > 0 && (
        <div className="space-y-4">
          {required.length > 0 && (
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Optional
            </h4>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {optional.map((param) => (
              <ParameterInput
                key={param.param_name}
                parameter={param}
                value={values[param.param_name]}
                onChange={handleChange}
                error={getFieldError(param.param_name)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Validation summary (errors list) */}
      {showValidationSummary && !isValid && errorCount > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">
                Please fix the following issues:
              </h4>
              <ul className="mt-2 text-sm text-amber-700 list-disc pl-5 space-y-1">
                {Object.entries(errors).map(([paramName, error]) => (
                  <li key={paramName}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Parameter Form
 * A simpler version for inline use or smaller spaces
 */
export interface CompactParameterFormProps {
  operation: OperationDefinition;
  values: ParameterValues;
  onChange: (paramName: string, value: unknown) => void;
  errors?: ValidationErrors;
  disabled?: boolean;
  className?: string;
}

export function CompactParameterForm({
  operation,
  values,
  onChange,
  errors = {},
  disabled = false,
  className,
}: CompactParameterFormProps) {
  if (operation.parameters.length === 0) {
    return <p className="text-sm text-gray-500">No configurable parameters.</p>;
  }

  return (
    <div className={clsx("space-y-3", className)}>
      {operation.parameters.map((param) => (
        <ParameterInput
          key={param.param_name}
          parameter={param}
          value={values[param.param_name]}
          onChange={onChange}
          error={errors[param.param_name]}
          disabled={disabled}
        />
      ))}
    </div>
  );
};