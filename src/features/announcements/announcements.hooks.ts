import { useQuery } from "@tanstack/react-query";
import { listAnnouncements } from "./announcements.api";
import type { AnnouncementsListResponse } from "./announcements.api";

export const ANNOUNCEMENTS_QUERY_KEYS = {
    list: (page: number, pageSize: number) =>
        ["announcements", "list", page, pageSize] as const,
    latest: (take: number) => ["announcements", "latest", take] as const,
};

export function useAnnouncements(page: number, pageSize: number) {
    return useQuery<AnnouncementsListResponse>({
        queryKey: ANNOUNCEMENTS_QUERY_KEYS.list(page, pageSize),
        queryFn: () => listAnnouncements(page, pageSize),
        retry: 1,
    });
}

// “últimos N” sin cambiar backend: pedimos page=1 con pageSize=take
export function useLatestAnnouncements(take: number = 5) {
    return useQuery<AnnouncementsListResponse>({
        queryKey: ANNOUNCEMENTS_QUERY_KEYS.latest(take),
        queryFn: () => listAnnouncements(1, take),
        retry: 1,
    });
}