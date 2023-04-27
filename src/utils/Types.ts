import { UserAdapter } from "@/hooks/UserAdapter";
import { Timestamp } from "firebase/firestore";
import { Dispatch } from "react";

// https://lorefnon.tech/2020/02/02/conditionally-making-optional-properties-mandatory-in-typescript/
type MandateProps<T extends {}, K extends keyof T> = Omit<T, K> & {
  [MK in K]-?: NonNullable<T[MK]>;
};

export const MIMETYPES = {
  GLB: "model/gltf-binary",
  JPG: "image/jpeg",
  MP3: "audio/mpeg",
  MP4: "video/mp4",
  PNG: "image/png",
  TIF: "image/tif",
  TIFF: "image/tiff",
} as const;
// "audio/mpeg" ?

export type MimeType = typeof MIMETYPES[keyof typeof MIMETYPES];

export interface File {
  attribution: string;
  cid: string;
  created: Timestamp;
  description: string;
  id?: string;
  license: LicenseURL;
  modified: Timestamp;
  processed: boolean;
  softwareVersion?: string;
  title: string;
  type: MimeType;
  uid: string; // who created it (files are global, not stored in user's collection)
}

export type FileProps = {
  username: string | null;
  slug: string | null;
  file: File;
};

// all of these props are required on save
export type SavedFile = MandateProps<
  File,
  "uid" | "type" | "title" | "license"
>;

// loaded when authoring an file
export interface AuthoringFile extends SavedFile {
  id?: string;
}

export type AuthoringFileState = {
  error: boolean;
  file: AuthoringFile | null;
  id: string;
  initialised: boolean;
  syncing: boolean;
};

export type AuthoringFileContextState = {
  state: AuthoringFileState | null;
  dispatch: Dispatch<AuthoringFileAction> | null;
};

export type AuthoringFileAction =
  | { type: "delete" }
  | { type: "error" }
  | { type: "reset" }
  | { type: "sync"; payload: AuthoringFile };

export interface UseDocumentOptions<T> {
  onData?: (data: T) => void;
  onError?: () => void;
}

export type UseDocument<T, O> = (
  userAdapter: UserAdapter,
  id: string,
  options: O
) => [document: T, modifiers: DocumentModifiers<T>];

export type DocumentModifiers<T> = {
  update?: (userAdapter: UserAdapter, id: string, value: T) => void;
};

export interface UseChildCollectionOptions<T> {
  onData?: (collectionItems: Map<string, T>) => void;
  onError?: () => void;
}

export type UseChildCollection<T, Options> = (
  userAdapter: UserAdapter,
  parentid: string,
  options?: Options
) => [collectionItems: Map<string, T>, modifiers: ChildCollectionModifiers<T>];

export type ChildCollectionModifiers<T> = {
  add?: (
    userAdapter: UserAdapter,
    parentid: string,
    value: Partial<T>,
    cb?: (id: string) => void | undefined
  ) => void;
  addAll?: (userAdapter: UserAdapter, parentid: string, values: T[]) => void;
  update?: (
    userAdapter: UserAdapter,
    parentid: string,
    value: [string, Partial<T>],
    cb?: () => void | undefined
  ) => void;
  updateAll?: (
    userAdapter: UserAdapter,
    parentid: string,
    values: [string, Partial<T>][]
  ) => void;
  remove?: (
    userAdapter: UserAdapter,
    parentid: string,
    collectionItemId: string,
    cb?: () => void | undefined
  ) => void;
  removeAll?: (
    userAdapter: UserAdapter,
    parentid: string,
    type: string | null,
    collectionItemIds: string[]
  ) => void;
};

export type LicenseURL =
  | "https://creativecommons.org/publicdomain/zero/1.0/"
  | "https://creativecommons.org/licenses/by/4.0/"
  | "https://creativecommons.org/licenses/by-sa/4.0/"
  | "https://creativecommons.org/licenses/by-nd/4.0/"
  | "https://creativecommons.org/licenses/by-nc/4.0/"
  | "https://creativecommons.org/licenses/by-nc-sa/4.0/"
  | "https://creativecommons.org/licenses/by-nc-nd/4.0/"
  | "https://unsplash.com/license";

export type FileSystem = "GCS" | "IPFS";
