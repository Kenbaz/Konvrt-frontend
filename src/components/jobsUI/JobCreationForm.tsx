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
import { getMaxFileSize } from "@/lib/utils/fileValidations";
import type { OperationDefinition } from "@/types/operation-types";
import type { Job } from "@/types/job-types";
import type { JsonObject } from "@/types/common-types";
import { JobProgressTracker } from "./JobProgressTracker";
import {
  ImageResizeConfigurator,
  type ImageResizeValues,
} from "../uploadParamtersUI/ImageResizeConfigurator";


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
                "ml-2 text-sm  font-medium hidden sm:inline",
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
    uploadStatus,
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
    // Use centralized file size limits that match the backend
    return getMaxFileSize(mediaType);
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

  const handleImageResizeChange = useCallback(
    (values: ImageResizeValues, isValid: boolean) => {
      setFormState((prev) => ({
        ...prev,
        parameters: values as unknown as ParameterValues,
        parametersValid: isValid,
      }));
    },
    []
  );

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
    <div className={clsx("space-y-6 h-full rounded-lg", className)}>
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <Card className="bg-[#2a2a2e] pb-[15%] md:pb-10">
        {/* Step 1: Operation Selection */}
        {currentStep === "operation" && (
          <div className="space-y-4 ">
            <div className="mb-4">
              <h2 className="text-lg md:text-xl md:mb-1 font-semibold text-[#f4f4f5]">
                Select an Operation
              </h2>
              <p className="text-sm md:text-base text-[#a1a1aa]">
                Choose the type of media processing you want to perform
              </p>
            </div>

            <OperationSelectorWithSearch
              selectedOperation={formState.selectedOperation}
              onSelectOperation={handleOperationSelect}
              onConfirmSelection={handleOperationConfirm}
              showParameterPreview={true}
              className=""
            />
          </div>
        )}

        {/* Step 2: File Upload */}
        {currentStep === "upload" && formState.selectedOperation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#FFFFFFDE]">
                  Upload Your File
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Select a {formState.selectedOperation.media_type} file to
                  process with{" "}
                  <span className="font-medium">
                    {formState.selectedOperation.operation_name.replace(
                      /_/g,
                      " "
                    )}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                className="text-gray-400 hover:text-gray-800 cursor-pointer"
              >
                Back
              </Button>
            </div>

            <FileUploadZone
              onFileSelect={handleFileSelect}
              onFileClear={handleFileRemove}
              selectedFile={formState.selectedFile}
              acceptedMediaTypes={
                formState.selectedOperation
                  ? [formState.selectedOperation.media_type]
                  : undefined
              }
              maxFileSize={maxFileSize}
            />

            {formState.selectedFile && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep("parameters")}
                  leftIcon={<ArrowRight className="h-4 w-4" />}
                  className="cursor-pointer"
                >
                  Continue
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
                <h2 className="text-lg font-semibold text-[#FFFFFFDE]">
                  Configure Parameters
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Adjust the settings for your{" "}
                  {formState.selectedOperation.operation_name.replace(
                    /_/g,
                    " "
                  )}{" "}
                  operation
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                className="cursor-pointer text-white hover:text-gray-800"
              >
                Back
              </Button>
            </div>

            {formState.selectedOperation.operation_name === "image_resize" &&
            formState.selectedFile ? (
              <ImageResizeConfigurator
                file={formState.selectedFile}
                operation={formState.selectedOperation}
                onChange={handleImageResizeChange}
              />
            ) : (
              <>
                {formState.selectedFile && (
                  <div className="bg-[#1a1a1e] rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          {formState.selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(
                            formState.selectedFile.size /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileRemove}
                      className="cursor-pointer hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Generic Parameter Form */}
                <ParameterForm
                  operation={formState.selectedOperation}
                  onChange={handleParametersChange}
                  validateOnMount={false}
                  validateOnChange={true}
                />
              </>
            )}

            {/* Submit Button */}
            <div className="items-center justify-between pt-4 border-t border-gray-400 hidden md:flex">
              <Button
                variant="outline"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-4 w-4" />}
                className="text-gray-400 cursor-pointer hover:text-gray-800"
              >
                Start Over
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                size="lg"
                leftIcon={<Play className="h-5 w-5" />}
                className="cursor-pointer"
              >
                Start Processing
              </Button>
            </div>

            <div className="flex md:hidden items-center justify-between pt-4 border-t border-gray-400">
              <Button
                variant="outline"
                onClick={handleReset}
                leftIcon={<RotateCcw className="h-4 w-4" />}
                className="text-gray-400 cursor-pointer hover:text-gray-800"
              >
                Start Over
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                size="md"
                leftIcon={<Play className="h-4 w-4" />}
                className="cursor-pointer"
              >
                Start Processing
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submitting/Processing */}
        {currentStep === "submitting" && (
          <div className="space-y-6">
            {/* Header - Only show during upload/creation phase */}
            {(isUploading || isCreating) && (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-300">
                  {isUploading ? "Uploading File..." : "Creating Job..."}
                </h2>
              </div>
            )}

            {/* Upload Progress */}
            {(isUploading || isCreating) && progress && (
              <UploadProgress
                status={uploadStatus}
                progress={progress}
                fileName={formState.selectedFile?.name || ""}
                onCancel={cancelUpload}
              />
            )}

            {/* Creating spinner (after upload) */}
            {isCreating && !isUploading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-gray-400">
                  Setting up your processing job...
                </p>
              </div>
            )}

            {/* Job Progress Tracker - Shows after job is created */}
            {createdJob && !isCreating && (
              <JobProgressTracker job={createdJob} onReset={handleReset} />
            )}

            {/* Error State - Job creation failed */}
            {createError && !isCreating && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center max-w-md">
                  <p className="text-gray-900 font-medium">
                    Failed to create job
                  </p>
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 text-left">
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    className="cursor-pointer"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    className="cursor-pointer"
                  >
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