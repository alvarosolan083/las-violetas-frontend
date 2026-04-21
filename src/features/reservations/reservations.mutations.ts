import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    approveReservation,
    cancelReservation,
    createReservation,
    rejectReservation,
} from "./reservations.api";
import type { CreateReservationDto } from "./reservations.api";
import { RESERVATIONS_QUERY_KEYS } from "./reservations.hooks";

export function useCreateReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateReservationDto) => createReservation(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: RESERVATIONS_QUERY_KEYS.spaces,
            });

            queryClient.invalidateQueries({
                queryKey: ["reservations", "mine"],
            });

            queryClient.invalidateQueries({
                queryKey: ["reservations", "admin"],
            });
        },
    });
}

export function useCancelReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (reservationId: string) => cancelReservation(reservationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reservations", "mine"],
            });

            queryClient.invalidateQueries({
                queryKey: ["reservations", "admin"],
            });

            queryClient.invalidateQueries({
                queryKey: RESERVATIONS_QUERY_KEYS.spaces,
            });
        },
    });
}

export function useApproveReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (reservationId: string) => approveReservation(reservationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reservations", "admin"],
            });

            queryClient.invalidateQueries({
                queryKey: ["reservations", "mine"],
            });

            queryClient.invalidateQueries({
                queryKey: RESERVATIONS_QUERY_KEYS.spaces,
            });
        },
    });
}

export function useRejectReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (reservationId: string) => rejectReservation(reservationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reservations", "admin"],
            });

            queryClient.invalidateQueries({
                queryKey: ["reservations", "mine"],
            });

            queryClient.invalidateQueries({
                queryKey: RESERVATIONS_QUERY_KEYS.spaces,
            });
        },
    });
}