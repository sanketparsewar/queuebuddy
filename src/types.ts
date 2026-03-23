import { User } from "firebase/auth";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  ownerUid: string;
  lastTokenNumber: number;
  createdAt: any;
}

export interface QueueEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  tokenNumber: number;
  status: "waiting" | "called" | "completed";
  createdAt: any;
}
