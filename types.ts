export interface StringResource {
  id: string;
  context: string;
  values: { [langCode: string]: string };
  sourceText: string;
  isArchived?: boolean;
  status?: {
    type: 'new' | 'updated';
    updatedFields?: ('context' | string)[]; // string is langCode
    previousState?: {
      context?: string;
      values?: { [langCode: string]: string };
    };
  };
}

export type Platform = 'android' | 'ios' | null;

export interface Project {
  id:string;
  name: string;
  lastModified: number;
  resources: StringResource[];
  fileName: string | null;
  platform: Platform;
  languages: string[];
}

// New types for merge review
export interface ValueChange {
  langCode: string;
  oldValue: string;
  newValue: string;
}

export interface UpdateDiff {
  id: string;
  valueChanges: ValueChange[];
  contextChange: {
    oldContext: string;
    newContext: string;
  } | null;
  newSourceText?: string; // Only available for native file updates
}


export interface MergeComparison {
  added: StringResource[];
  updated: UpdateDiff[];
  removed: StringResource[];
}

export interface MergeResolutions {
  updates: { [id: string]: 'keep' | 'update' };
  removals: { [id: string]: 'keep' | 'delete' };
}

// For CSV header analysis
export interface LanguageMappingRequest {
  newLanguages: string[]; // Valid new language codes like 'fr'
  unrecognizedColumns: string[]; // Headers like 'French Translation'
  file: File; // Keep the file handle for processing later
  sheetName?: string; // Optional: To pass the selected sheet name through
}

export interface LanguageMappingResolution {
  [unrecognizedColumn: string]: { action: 'map', langCode: string } | { action: 'ignore' };
}

// For sheet selection
export interface SheetSelectionRequest {
  file: File;
  sheetNames: string[];
}