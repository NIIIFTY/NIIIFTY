export interface NiiiftyMetadata {
  label: string;
  value: string;
}

export interface NiiiftyFile {
  fileId: string;
  type: string;
  cid?: string;
  label?: string;
  dashboardLabel?: string;
  summary?: string;
  tags?: string[];
  metadata?: NiiiftyMetadata[];
  provider?: string;
  rights?: string;
  attribution?: string;
  width?: number;
  height?: number;
  duration?: number;
  [key: string]: any; // Allow for other fields
}
