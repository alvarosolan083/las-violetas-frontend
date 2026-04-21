import { useQuery } from "@tanstack/react-query";
import {
    getCommonSpaceById,
    getSpaceAvailability,
    listAllReservations,
    listCommonSpaces,
    listMyReservations,
} from "./reservations.api";
import type {
    CommonSpace,
    CommonSpacesListResponse,
    MyReservationsResponse,
    ReservationsAdminFilters,
    ReservationsAdminResponse,
    SpaceAvailabilityResponse,
} from "./reservations.api";

export const RESERVATIONS_QUERY_KEYS = {
    spaces: ["reservations", "spaces"] as const,
    spaceDetail: (spaceId: string) =>
        ["reservations", "space-detail", spaceId] as const,
    mine: (tab: "future" | "past") =>
        ["reservations", "mine", tab] as const,
    admin: (filters: ReservationsAdminFilters) =>
        [
            "reservations",
            "admin",
            filters.status ?? "",
            filters.spaceId ?? "",
            filters.date ?? "",
            filters.page ?? 1,
            filters.pageSize ?? 10,
        ] as const,
    availability: (spaceId?: string, date?: string) =>
        ["reservations", "availability", spaceId ?? "", date ?? ""] as const,
};

export function useCommonSpaces() {
    return useQuery<CommonSpacesListResponse>({
        queryKey: RESERVATIONS_QUERY_KEYS.spaces,
        queryFn: listCommonSpaces,
        retry: 1,
    });
}

export function useCommonSpaceDetail(spaceId?: string) {
    return useQuery<CommonSpace>({
        queryKey: spaceId
            ? RESERVATIONS_QUERY_KEYS.spaceDetail(spaceId)
            : ["reservations", "space-detail", "missing"],
        queryFn: () => getCommonSpaceById(spaceId as string),
        enabled: !!spaceId,
        retry: 1,
    });
}

export function useMyReservations(tab: "future" | "past" = "future") {
    return useQuery<MyReservationsResponse>({
        queryKey: RESERVATIONS_QUERY_KEYS.mine(tab),
        queryFn: () => listMyReservations(tab),
        retry: 1,
    });
}

export function useReservationsAdmin(filters: ReservationsAdminFilters) {
    return useQuery<ReservationsAdminResponse>({
        queryKey: RESERVATIONS_QUERY_KEYS.admin(filters),
        queryFn: () => listAllReservations(filters),
        retry: 1,
        placeholderData: (previousData) => previousData,
    });
}

export function usePendingReservationsCount() {
    return useQuery<number>({
        queryKey: ["reservations", "admin", "pending-count"],
        queryFn: async () => {
            const data = await listAllReservations({
                status: "PENDING",
                page: 1,
                pageSize: 1,
            });
            return data.total;
        },
        retry: 1,
    });
}

export function useSpaceAvailability(spaceId?: string, date?: string) {
    return useQuery<SpaceAvailabilityResponse>({
        queryKey: RESERVATIONS_QUERY_KEYS.availability(spaceId, date),
        queryFn: () => getSpaceAvailability(spaceId as string, date as string),
        enabled: !!spaceId && !!date,
        retry: 1,
    });
}