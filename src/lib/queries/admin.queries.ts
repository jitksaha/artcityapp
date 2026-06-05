import { queryOptions } from "@tanstack/react-query";
import {
  getAdminAnalytics,
  listApplications,
  listCastingRequests,
  listUsersWithRoles,
  getAppSettings,
} from "@/lib/admin.functions";

export const adminAnalyticsQuery = () =>
  queryOptions({
    queryKey: ["admin-analytics"] as const,
    queryFn: () => getAdminAnalytics(),
    staleTime: 30_000,
  });

export const applicationsListQuery = (statusFilter?: string) =>
  queryOptions({
    // Match the existing inline key in superadmin.tsx so prefetches and
    // invalidations land on the same cache slot.
    queryKey: ["admin-applications", statusFilter] as const,
    queryFn: () =>
      (listApplications as any)({ data: statusFilter ? { status: statusFilter } : undefined }),
    staleTime: 15_000,
  });

export const castingListQuery = () =>
  queryOptions({
    queryKey: ["admin-casting"] as const,
    queryFn: () => listCastingRequests(),
    staleTime: 15_000,
  });

export const usersWithRolesQuery = (query = "") =>
  queryOptions({
    queryKey: ["admin-users", query] as const,
    queryFn: () => (listUsersWithRoles as any)({ data: { query } }),
    staleTime: 30_000,
  });

export const appSettingsQuery = () =>
  queryOptions({
    queryKey: ["app-settings"] as const,
    queryFn: () => getAppSettings(),
    staleTime: 60_000,
  });