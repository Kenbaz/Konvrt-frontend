// src/components/jobsUI/JobCreationForm.tsx

/**
 * Job Creation Form Component
 *
 * A multi-step form that guides users through:
 * 1. Selecting an operation
 * 2. Uploading a file
 * 3. Configuring parameters
 * 4. Submitting the job
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { clsx } from "clsx";
import {
  CheckCircle2,
  Upload,
  Settings2,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Play,
  X,
} from "lucide-react";
import { OperationSelectorWithSearch } from "@/components/operationsUI";
import { FileUploadZone, UploadProgress } from "../uploadsUI";
import { ParameterForm, type ParameterValues } from "../uploadParamtersUI";
import { Button } from "../UI/Button";
import { Card } from "../UI/Card";
import { useCreateJob, type CreateJobInput } from "@/lib/hooks/useCreateJob";
import type { OperationDefinition } from "@/types/operation-types";
import type { Job } from "@/types/job-types";
import type { JsonObject, MediaType } from "@/types/common-types";


export type JobCreationStep = "operation" | "upload" | "parameters" | "submitting";


export interface JobCreationFormProps {
  onJobCreated?: (job: Job) => void;
  onCancel?: () => void;
  className?: string;
};


interface FormState {
  selectedOperation: OperationDefinition | null;
  selectedFile: File | null;
  parameters: ParameterValues;
  parametersValid: boolean;
};

const initialFormState: FormState = {
  selectedOperation: null,
  selectedFile: null,
  parameters: {},
  parametersValid: true,
};


function StepIndicator({
  currentStep,
  completedSteps,
}: {
  currentStep: JobCreationStep;
  completedSteps: Set<JobCreationStep>;
}) {
  const steps: Array<{
    key: JobCreationStep;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "operation", label: "Select Operation", icon: <Settings2 className="h-4 w-4" /> },
    { key: "upload", label: "Upload File", icon: <Upload className="h-4 w-4" /> },
    { key: "parameters", label: "Configure", icon: <Settings2 className="h-4 w-4" /> },
    { key: "submitting", label: "Process", icon: <Play className="h-4 w-4" /> },
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.key);
        const isCurrent = currentStep === step.key;
        const isPast = steps.findIndex((s) => s.key === currentStep) > index;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step circle */}
            <div
              className={clsx(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                isCompleted || isPast
                  ? "bg-green-500 border-green-500 text-white"
                  : isCurrent
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              )}
            >
              {isCompleted || isPast ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.icon
              )}
            </div>

            {/* Step label */}
            <span
              className={clsx(
                "ml-2 text-sm font-medium hidden sm:inline",
                isCurrent ? "text-blue-600" : isPast || isCompleted ? "text-green-600" : "text-gray-500"
              )}
            >
              {step.label}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  "w-8 sm:w-16 h-0.5 mx-2 sm:mx-4",
                  isPast || isCompleted ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};


export function JobCreationForm({
  onJobCreated,
  onCancel,
  className,
}: JobCreationFormProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentStep, setCurrentStep] = useState<JobCreationStep>("operation");
  const [completedSteps, setCompletedSteps] = useState<Set<JobCreationStep>>(new Set());

  // Job creation hook
  const {
    createJob,
    isCreating,
    isUploading,
    progress,
    error: createError,
    createdJob,
    cancel: cancelUpload,
    reset: resetUpload,
  } = useCreateJob({
    onSuccess: (result) => {
      setCompletedSteps((prev) => new Set([...prev, "submitting"]));
      onJobCreated?.(result.job);
    },
  });

  
  const maxFileSize = useMemo(() => {
    if (!formState.selectedOperation) return undefined;
    const mediaType = formState.selectedOperation.media_type;
    // Default max sizes: video 2GB, image 50MB, audio 500MB
    const maxSizes: Record<MediaType, number> = {
      video: 2 * 1024 * 1024 * 1024,  // 2GB
      image: 50 * 1024 * 1024,         // 50MB
      audio: 500 * 1024 * 1024,        // 500MB
    };
    return maxSizes[mediaType] ?? 100 * 1024 * 1024; // Default 100MB
  }, [formState.selectedOperation]);

  // Handlers
  const handleOperationSelect = useCallback((operation: OperationDefinition | null) => {
    setFormState((prev) => ({
      ...prev,
      selectedOperation: operation,
      // Reset file if operation media type changes
      selectedFile:
        operation?.media_type !== prev.selectedOperation?.media_type
          ? null
          : prev.selectedFile,
      parameters: {},
      parametersValid: true,
    }));
  }, []);

  const handleOperationConfirm = useCallback((operation: OperationDefinition) => {
    setFormState((prev) => ({ ...prev, selectedOperation: operation }));
    setCompletedSteps((prev) => new Set([...prev, "operation"]));
    setCurrentStep("upload");
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setFormState((prev) => ({ ...prev, selectedFile: file }));
    setCompletedSteps((prev) => new Set([...prev, "upload"]));
    setCurrentStep("parameters");
  }, []);

  const handleFileRemove = useCallback(() => {
    setFormState((prev) => ({ ...prev, selectedFile: null }));
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.delete("upload");
      newSet.delete("parameters");
      return newSet;
    });
  }, []);

  const handleParametersChange = useCallback((values: ParameterValues, isValid: boolean) => {
    setFormState((prev) => ({
      ...prev,
      parameters: values,
      parametersValid: isValid,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formState.selectedOperation || !formState.selectedFile) {
      return;
    }

    setCurrentStep("submitting");

    const input: CreateJobInput = {
      operation: formState.selectedOperation.operation_name,
      parameters: formState.parameters as JsonObject,
      file: formState.selectedFile,
    };

    await createJob(input);
  }, [formState.selectedOperation, formState.selectedFile, formState.parameters, createJob]);

  const handleReset = useCallback(() => {
    setFormState(initialFormState);
    setCurrentStep("operation");
    setCompletedSteps(new Set());
    resetUpload();
    onCancel?.();
  }, [resetUpload, onCancel]);

  const handleBack = useCallback(() => {
    if (currentStep === "upload") {
      setCurrentStep("operation");
    } else if (currentStep === "parameters") {
      setCurrentStep("upload");
    } else if (currentStep === "submitting" && !isCreating) {
      setCurrentStep("parameters");
    }
  }, [currentStep, isCreating]);

  // Check if form is ready to submit
  const canSubmit = useMemo(() => {
    return (
      formState.selectedOperation !== null &&
      formState.selectedFile !== null &&
      formState.parametersValid &&
      !isCreating
    );
  }, [formState.selectedOperation, formState.selectedFile, formState.parametersValid, isCreating]);

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      {/* Step Content */}
      <Card className="p-6">
        {/* Step 1: Operation Selection */}
        {currentStep === "operation" && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Select an Operation
              </h2>
              <p className="text-sm text-gray-600">
                Choose the type of media processing you want to perform
              </p>
            </div>

            <OperationSelectorWithSearch
              selectedOperation={formState.selectedOperation}
              onSelectOperation={handleOperationSelect}
              onConfirmSelection={handleOperationConfirm}
              showParameterPreview={true}
            />
          </div>
        )}

        {/* Step 2: File Upload */}
        {currentStep === "upload" && formState.selectedOperation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Your File
                </h2>
                <p className="text-sm text-gray-600">
                  Select a {formState.selectedOperation.media_type} file to process with{" "}
                  <span className="font-medium">
                    {formState.selectedOperation.operation_name.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>

            <FileUploadZone
              onFileSelect={handleFileSelect}
              onFileClear={handleFileRemove}
              selectedFile={formState.selectedFile}
              acceptedMediaTypes={formState.selectedOperation ? [formState.selectedOperation.media_type] : undefined}
              maxFileSize={maxFileSize}
            />

            {formState.selectedFile && (
              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep("parameters")}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Parameter Configuration */}
        {currentStep === "parameters" && formState.selectedOperation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Configure Parameters
                </h2>
                <p className="text-sm text-gray-600">
                  Adjust the settings for your {formState.selectedOperation.operation_name.replace(/_/g, " ")} operation
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>

            {/* File preview summary */}
            {formState.selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formState.selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formState.selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileRemove}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Parameter Form */}
            <ParameterForm
              operation={formState.selectedOperation}
              onChange={handleParametersChange}
              validateOnMount={false}
              validateOnChange={true}
            />

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleReset}
                className="text-gray-600"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Start Over
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submitting/Processing */}
        {currentStep === "submitting" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {isUploading
                  ? "Uploading File..."
                  : isCreating
                  ? "Creating Job..."
                  : createdJob
                  ? "Job Created!"
                  : createError
                  ? "Job Creation Failed"
                  : "Processing..."}
              </h2>
            </div>

            {/* Upload Progress */}
            {(isUploading || isCreating) && progress && (
              <UploadProgress
                status={isUploading ? "uploading" : "success"}
                progress={progress}
                fileName={formState.selectedFile?.name || ""}
                onCancel={cancelUpload}
              />
            )}

            {/* Creating spinner (after upload) */}
            {isCreating && !isUploading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-gray-600">Setting up your processing job...</p>
              </div>
            )}

            {/* Success State */}
            {createdJob && !isCreating && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-medium">
                    Job created successfully!
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Job ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{createdJob.id}</code>
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline">
                  Create Another Job
                </Button>
              </div>
            )}

            {/* Error State */}
            {createError && !isCreating && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-medium">
                    Failed to create job
                  </p>
                  <p className="text-sm text-red-600 mt-1">{createError}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Go Back
                  </Button>
                  <Button onClick={handleSubmit}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};