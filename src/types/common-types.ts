export const OperationStatus = {
    PENDING: 'pending',
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
} as const;

export type OperationStatus = typeof OperationStatus[keyof typeof OperationStatus];

export const FileType = {
    INPUT: 'input',
    OUTPUT: 'output',
} as const;

export type FileType = typeof FileType[keyof typeof FileType];

export const MediaType = {
    VIDEO: 'video',
    IMAGE: 'image',
    AUDIO: 'audio',
} as const;

export type MediaType = typeof MediaType[keyof typeof MediaType];

export const ParameterType = {
    INTEGER: 'integer',
    STRING: 'string',
    BOOLEAN: 'boolean',
    FLOAT: 'float',
    CHOICE: 'choice',
} as const;

export type ParameterType = typeof ParameterType[keyof typeof ParameterType];


// Utility types

export type UUID = string;

export type ISODateString = string;

export type JsonObject = Record<string, unknown>;

export type Nullable<T> = T | null;


// Status helper types
export function isActiveStatus(status: OperationStatus): boolean { 
    return status === OperationStatus.PENDING ||
           status === OperationStatus.QUEUED ||
           status === OperationStatus.PROCESSING;
};

export function isFinalStatus(status: OperationStatus): boolean { 
    return status === OperationStatus.COMPLETED ||
           status === OperationStatus.FAILED;
};

export function isSuccessStatus(status: OperationStatus): boolean { 
    return status === OperationStatus.COMPLETED;
};

export function isFailureStatus(status: OperationStatus): boolean { 
    return status === OperationStatus.FAILED;
};


// Media type helpers
export function getMediaTypeDisplayName(mediaType: MediaType): string { 
    const displayNames: Record<MediaType, string> = {
        [MediaType.VIDEO]: 'Video',
        [MediaType.IMAGE]: 'Image',
        [MediaType.AUDIO]: 'Audio',
    };
    return displayNames[mediaType] ?? mediaType;
};

export function getMediaTypeIcon(mediaType: MediaType): string { 
    const icons: Record<MediaType, string> = {
        [MediaType.VIDEO]: 'Video',
        [MediaType.IMAGE]: 'Image',
        [MediaType.AUDIO]: 'Music',
    };
    return icons[mediaType] ?? 'File';
};