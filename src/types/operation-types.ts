// src/types/operation-types.ts

import type { MediaType, ParameterType, Nullable } from "./common-types";

// Parameter schema types
export interface ParameterSchemaBase { 
    param_name: string;
    type: ParameterType;
    required: boolean;
    description: string;
    default?: unknown;
    min?: Nullable<number>;
    max?: Nullable<number>;
    choices?: Nullable<string[]>;
};

export interface IntegerParameterSchema extends ParameterSchemaBase { 
    type: 'integer';
    default?: number;
    min?: Nullable<number>;
    max?: Nullable<number>;
};

export interface FloatParameterSchema extends ParameterSchemaBase {
  type: "float";
  default?: number;
  min?: Nullable<number>;
  max?: Nullable<number>;
};

export interface StringParameterSchema extends ParameterSchemaBase {
  type: "string";
  default?: string;
};

export interface BooleanParameterSchema extends ParameterSchemaBase {
  type: "boolean";
  default?: boolean;
};

export interface ChoiceParameterSchema extends ParameterSchemaBase {
  type: "choice";
  default?: string;
  choices: string[];
};

export type ParameterSchema =
  | IntegerParameterSchema
  | FloatParameterSchema
  | StringParameterSchema
  | BooleanParameterSchema
  | ChoiceParameterSchema;
  

// Operation Definition types

export interface OperationDefinition {
  operation_name: string;
  media_type: MediaType;
  description: string;
  parameters: ParameterSchema[];
  input_formats: string[];
  output_formats: string[];
};

export interface OperationDefinitionListItem {
  operation_name: string;
  media_type: MediaType;
  description: string
};

// Grouped operations

export interface GroupedOperations {
  video: OperationDefinition[];
  image: OperationDefinition[];
  audio: OperationDefinition[];
};

export function groupOperationsByMediaType(
  operations: OperationDefinition[]
): GroupedOperations { 
  return {
    video: operations.filter(op => op.media_type === 'video'),
    image: operations.filter(op => op.media_type === 'image'),
    audio: operations.filter(op => op.media_type === 'audio'),
  };
};

// Parameter helpers

export function getParameterDefault(param: ParameterSchema): unknown { 
  if (param.default !== undefined) { 
    return param.default;
  }

  switch (param.type) {
    case "integer":
      return param.min ?? 0;
    case "float":
      return param.min ?? 0.0;
    case "string":
      return "";
    case "boolean":
      return false;
    case "choice":
      return param.choices?.[0] ?? "";
    default:
      return undefined;
  };
};

export function buildDefaultParameters(
  operation: OperationDefinition
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const param of operation.parameters) {
    const defaultValue = getParameterDefault(param);
    if (defaultValue !== undefined) {
      defaults[param.param_name] = defaultValue;
    }
  }

  return defaults;
};

export function isNumericParameter(
  param: ParameterSchema
): param is IntegerParameterSchema | FloatParameterSchema {
  return param.type === "integer" || param.type === "float";
};

export function hasRangeConstraints(param: ParameterSchema): boolean {
  if (!isNumericParameter(param)) return false;
  return param.min !== null || param.max !== null;
};

export function validateParameter(
  param: ParameterSchema,
  value: unknown
): { valid: boolean; error?: string } { 
  if (param.required && (value === undefined || value === null || value === '')) { 
    return { valid: false, error: `${param.param_name} is required` };
  };

  if (
    !param.required &&
    (value === undefined || value === null || value === "")
  ) {
    return { valid: true };
  };

  switch (param.type) {
    case "integer": {
      const numValue = Number(value);
      if (!Number.isInteger(numValue)) {
        return {
          valid: false,
          error: `${param.param_name} must be an integer`,
        };
      }
      if (
        param.min !== null &&
        param.min !== undefined &&
        numValue < param.min
      ) {
        return {
          valid: false,
          error: `${param.param_name} must be at least ${param.min}`,
        };
      }
      if (
        param.max !== null &&
        param.max !== undefined &&
        numValue > param.max
      ) {
        return {
          valid: false,
          error: `${param.param_name} must be at most ${param.max}`,
        };
      }
      break;
    }

    case "float": {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { valid: false, error: `${param.param_name} must be a number` };
      }
      if (
        param.min !== null &&
        param.min !== undefined &&
        numValue < param.min
      ) {
        return {
          valid: false,
          error: `${param.param_name} must be at least ${param.min}`,
        };
      }
      if (
        param.max !== null &&
        param.max !== undefined &&
        numValue > param.max
      ) {
        return {
          valid: false,
          error: `${param.param_name} must be at most ${param.max}`,
        };
      }
      break;
    }
    
    case 'boolean': {
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${param.param_name} must be true or false` };
      }
      break;
    }
    
    case 'choice': {
      if (param.choices && !param.choices.includes(String(value))) {
        return { valid: false, error: `${param.param_name} must be one of: ${param.choices.join(', ')}` };
      }
      break;
    }
    
    case 'string': {
      if (typeof value !== 'string') {
        return { valid: false, error: `${param.param_name} must be a string` };
      }
      break;
    }
  }
  
  return { valid: true };
};

export function validateParameters(
  operation: OperationDefinition,
  values: Record<string, unknown>
): { valid: boolean; errors: Record<string, string> } { 
  const errors: Record<string, string> = {};

  for (const param of operation.parameters) { 
    const result = validateParameter(param, values[param.param_name]);
    if (!result.valid && result.error) { 
      errors[param.param_name] = result.error;
    }
  };

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};