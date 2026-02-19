export type Role = 'SUPER_ADMIN' | 'HOD' | 'PD' | 'STAFF';

export type Frequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'PROJECT_COMPLETION';

export type SubmissionStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'OVERDUE';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NotificationType = 'REMINDER' | 'OVERDUE' | 'APPROVAL' | 'INFO';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  departmentName?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
