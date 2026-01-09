import { apiClient } from "./axios-client";
import {
    OperationDefinition,
    OperationDefinitionListItem,
    GroupedOperations,
    groupOperationsByMediaType,
    ListOperationParams,
    MediaType
} from "@/types";
import { ApiEndpoints } from "@/types/api-types";


interface ApiSuccessResponse<T> { 
    success: true;
    data: T;
    metadata?: {
        total_count?: number;
        media_types?: string[];
    };
};


export async function fetchOperations(
    params?: ListOperationParams
): Promise<OperationDefinition[]> {
    const response = await apiClient.get<ApiSuccessResponse<OperationDefinition[]>>(
        ApiEndpoints.OPERATION_DEFINITIONS,
        { params }
    );

    if (response.data && 'data' in response.data) { 
        return response.data.data;
    };

    return response.data as unknown as OperationDefinition[];
};


export async function fetchOperationsByMediaType(
    mediaType: MediaType
): Promise<OperationDefinition[]> { 
    return fetchOperations({media_type: mediaType});
};


// Fetch single operation by name
export async function fetchOperationDetail(
    operationName: string
): Promise<OperationDefinition> { 
    const response = await apiClient.get<ApiSuccessResponse<OperationDefinition>>(
        ApiEndpoints.OPERATION_DEFINITION_DETAIL(operationName)
    );

    if (response.data && 'data' in response.data) { 
        return response.data.data;
    };

    return response.data as unknown as OperationDefinition;
};


// Fetch and group operations by media type
export async function fetchGroupedOperations(): Promise<GroupedOperations> { 
    const operations = await fetchOperations();
    return groupOperationsByMediaType(operations);
};


export async function fetchOperationList(
    params?: ListOperationParams
): Promise<OperationDefinitionListItem[]> {
    const response = await apiClient.get<ApiSuccessResponse<OperationDefinitionListItem[]>>(
        ApiEndpoints.OPERATION_DEFINITIONS,
        { params }
    );

    if (response.data && 'data' in response.data) { 
        return response.data.data;
    };

    return response.data as unknown as OperationDefinitionListItem[];
};


export async function operationExists(operationName: string): Promise<boolean> { 
    try {
        await fetchOperationDetail(operationName);
        return true;
    } catch {
        return false;
    }
};


export function getOperationDisplayName(operationName: string): string {
  return operationName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};


export function getMediaTypeIconName(mediaType: MediaType): string {
  const icons: Record<MediaType, string> = {
    video: "Video",
    image: "Image",
    audio: "Music",
  };
  return icons[mediaType] ?? "File";
};


export function getMediaTypeColorClasses(mediaType: MediaType): {
  bg: string;
  text: string;
  border: string;
  Hover: string;
  iconBorderColor: string;
} {
  const colors: Record<
    MediaType,
    {
      bg: string;
      text: string;
      border: string;
      Hover: string;
      iconBorderColor: string;
    }
  > = {
    video: {
      bg: "bg-[#1a1a1e]",
      text: "text-purple-700",
      border: "border-purple-200",
      Hover: "hover:ring-2 hover:ring-purple-700",
      iconBorderColor: "ring ring-purple-700",
    },
    image: {
      bg: "bg-[#1a1a1e]",
      text: "text-blue-700",
      border: "border-blue-200",
      Hover: "hover:ring-2 hover:ring-blue-700",
      iconBorderColor: "ring ring-blue-700",
    },
    audio: {
      bg: "bg-[#1a1a1e]",
      text: "text-green-700",
      border: "border-green-200",
      Hover: "hover:ring-2 hover:ring-green-700",
      iconBorderColor: "ring ring-green-700",
    },
  };

  return (
    colors[mediaType] ?? {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      bgHover: "hover:bg-gray-100",
    }
  );
};