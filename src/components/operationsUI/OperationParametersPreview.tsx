"use client";

import {
  Video,
  Image as ImageIcon,
  Music,
  FileQuestion,
  FileInput,
  FileOutput,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, Badge, Button } from "../UI";
import type { OperationDefinition, ParameterSchema, MediaType } from "@/types";
import { getOperationDisplayName } from "@/lib/api/operations";

function MediaTypeIcon({
  mediaType,
  className,
}: {
  mediaType: MediaType;
  className?: string;
}) {
  switch (mediaType) {
    case "video":
      return <Video className={className} aria-hidden="true" />;
    case "image":
      return <ImageIcon className={className} aria-hidden="true" />;
    case "audio":
      return <Music className={className} aria-hidden="true" />;
    default:
      return <FileQuestion className={className} aria-hidden="true" />;
  }
}

// function getParameterTypeLabel(param: ParameterSchema): string {
//   switch (param.type) {
//     case "integer":
//       if (param.min !== null && param.max !== null) {
//         return `Integer (${param.min} - ${param.max})`;
//       }
//       if (param.min !== null) {
//         return `Integer (min: ${param.min})`;
//       }
//       if (param.max !== null) {
//         return `Integer (max: ${param.max})`;
//       }
//       return "Integer";
//     case "float":
//       if (param.min !== null && param.max !== null) {
//         return `Number (${param.min} - ${param.max})`;
//       }
//       return "Number";
//     case "boolean":
//       return "Yes/No";
//     case "choice":
//       return `Choice (${param.choices?.length || 0} options)`;
//     case "string":
//       return "Text";
//   }
//   const _exhaustiveCheck: never = param;
//   return String(_exhaustiveCheck);
// };


function formatDefaultValue(param: ParameterSchema): string {
  if (param.default === undefined || param.default === null) {
    return "None";
  }
  if (typeof param.default === "boolean") {
    return param.default ? "Yes" : "No";
  }
  return String(param.default);
};


export interface OperationParametersPreviewProps {
  operation: OperationDefinition;
  onConfirm?: () => void;
  onClear?: () => void;
  confirmLabel?: string;
  showActions?: boolean;
  showFullParameters?: boolean;
  className?: string;
}

export function OperationParametersPreview({
  operation,
  onConfirm,
  onClear,
  confirmLabel = "Continue with operation",
  showActions = true,
  showFullParameters = true,
  className = "",
}: OperationParametersPreviewProps) {
  const displayName = getOperationDisplayName(operation.operation_name);
  const hasParameters = operation.parameters && operation.parameters.length > 0;
  const requiredParams = operation.parameters?.filter((p) => p.required) || [];
  const optionalParams = operation.parameters?.filter((p) => !p.required) || [];

  return (
    <Card
      padding="none"
      className={`overflow-hidden bg-[#0a0a0b]  ${className}`}
    >
      {/* Header */}
      <div className="p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MediaTypeIcon
                mediaType={operation.media_type}
                className="w-5 h-5 text-blue-600"
              />
            </div>

            {/* Title and description */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-[#FFFFFFDE]">
                  {displayName}
                </h3>
                <Badge variant="primary" size="sm">
                  {operation.media_type}
                </Badge>
              </div>
              <p className="text-sm text-[#FFFFFFDE]">
                {operation.description}
              </p>
            </div>
          </div>

          {/* Clear button */}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="p-4 bg-[#121214] mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input formats */}
          <div className="flex items-start gap-2">
            <FileInput className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[0.8rem] font-medium text-gray-400 uppercase tracking-wide mb-1">
                Input Formats
              </p>
              <p className="text-sm text-[#FFFFFFDE]">
                {operation.input_formats?.length > 0
                  ? operation.input_formats.join(", ")
                  : "Any supported format"}
              </p>
            </div>
          </div>

          {/* Output formats */}
          <div className="flex items-start gap-2">
            <FileOutput className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[0.8rem] font-medium text-gray-400 uppercase tracking-wide mb-1">
                Output Formats
              </p>
              <p className="text-sm text-[#FFFFFFDE]">
                {operation.output_formats?.length > 0
                  ? operation.output_formats.join(", ")
                  : "Same as input"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      {hasParameters && showFullParameters && (
        <div className="p-4 border-b border-gray-400">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-6 h-6 text-gray-400" />
            <h4 className="text-[0.9rem] font-medium text-gray-400">
              Parameters ({operation.parameters.length})
            </h4>
          </div>

          <div className="space-y-3">
            {/* Required parameters */}
            {requiredParams.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">
                  Required ({requiredParams.length})
                </p>
                <div className="space-y-2">
                  {requiredParams.map((param) => (
                    <ParameterRow key={param.param_name} param={param} />
                  ))}
                </div>
              </div>
            )}

            {/* Optional parameters */}
            {optionalParams.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3">
                  Optional ({optionalParams.length})
                </p>
                <div className="space-y-3">
                  {optionalParams.map((param) => (
                    <ParameterRow key={param.param_name} param={param} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact parameter summary when not showing full details */}
      {hasParameters && !showFullParameters && (
        <div className="p-4 border-b border-gray-400">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings className="w-4 h-4" />
            <span>
              {operation.parameters.length} parameter
              {operation.parameters.length !== 1 ? "s" : ""}
              {requiredParams.length > 0 && (
                <span className="text-red-600 ml-1">
                  ({requiredParams.length} required)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="p-4">
          <Button
            variant="primary"
            className="cursor-pointer"
            size="lg"
            fullWidth
            onClick={onConfirm}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            {confirmLabel}
          </Button>
        </div>
      )}
    </Card>
  );
};


// Individual parameter row in the preview
function ParameterRow({ param }: { param: ParameterSchema }) {
  return (
    <div className="flex items-start justify-between gap-4 p-2 bg-[#121214] rounded-lg border border-[#121214]">
      <div className="flex-1 pb-2 min-w-0">
        <div className="flex items-center">
          <span className="text-sm  font-medium text-gray-400">
            {param.param_name.replace(/_/g, " ")}
          </span>
          {param.required && <span className="text-xs text-red-500">*</span>}
        </div>
        {param.description && (
          <p className="text-xs text-[#FFFFFFDE] mt-1 line-clamp-1">
            {param.description}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {/* <span className="text-xs text-gray-500 block">
          {getParameterTypeLabel(param)}
        </span> */}
        {param.default !== undefined && param.default !== null && (
          <span className="text-xs text-gray-500 block">
            Default: {formatDefaultValue(param)}
          </span>
        )}
      </div>
    </div>
  );
};


// Compact version for smaller spaces or inline display
export function OperationParametersPreviewCompact({
  operation,
  onConfirm,
  className = "",
}: Pick<
  OperationParametersPreviewProps,
  "operation" | "onConfirm" | "className"
>) {
  const displayName = getOperationDisplayName(operation.operation_name);
  const paramCount = operation.parameters?.length || 0;
  const requiredCount =
    operation.parameters?.filter((p) => p.required).length || 0;

  return (
    <div
      className={`
                flex items-center justify-between gap-4 p-3 
                bg-blue-50 border border-blue-200 rounded-lg
                ${className}
            `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
          <MediaTypeIcon
            mediaType={operation.media_type}
            className="w-4 h-4 text-blue-600"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-500">
            {paramCount > 0 ? (
              <>
                {paramCount} param{paramCount !== 1 ? "s" : ""}
                {requiredCount > 0 && ` (${requiredCount} required)`}
              </>
            ) : (
              "No configuration needed"
            )}
          </p>
        </div>
      </div>

      {onConfirm && (
        <Button variant="primary" size="sm" onClick={onConfirm}>
          Continue
        </Button>
      )}
    </div>
  );
};
