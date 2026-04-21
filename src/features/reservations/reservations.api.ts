import { http } from "../../lib/http";
import { storage } from "../../lib/storage";

export type CommonSpaceSlot = {
    id: string;
    commonSpaceId: string;
    label: string;
    startTime: string;
    endTime: string;
};

export type CommonSpace = {
    id: string;
    condominiumId: string;
    name: string;
    description: string | null;
    price: number;
    advanceHours: number;
    dailyLimit: number;
    weeklyLimit: number;
    cancelBeforeHours: number;
    requiresApproval: boolean;
    seasonStart: string | null;
    seasonEnd: string | null;
    allowedWeekdays: number[];
    createdAt: string;
    updatedAt: string;
    slots: CommonSpaceSlot[];
};

export type CommonSpacesListResponse = {
    items: CommonSpace[];
};

export type ReservationStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export type ReservationItem = {
    id: string;
    condominiumId: string;
    commonSpaceId: string;
    slotId: string;
    date: string;
    startAt: string;
    endAt: string;
    status: ReservationStatus;
    createdById: string;
    decidedById: string | null;
    decidedAt: string | null;
    createdAt: string;
    updatedAt: string;
    commonSpace: CommonSpace;
    slot: CommonSpaceSlot;
};

export type ReservationAdminItem = ReservationItem & {
    createdBy?: {
        id: string;
        name: string;
        email: string;
    };
};

export type MyReservationsResponse = {
    items: ReservationItem[];
};

export type ReservationsAdminResponse = {
    items: ReservationAdminItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type CreateReservationDto = {
    spaceId: string;
    slotId: string;
    date: string;
};

export type CreateReservationResponse = ReservationItem & {
    cancelDeadline?: string | null;
};

export type SlotAvailabilityStatus =
    | "AVAILABLE"
    | "PENDING"
    | "BOOKED";

export type SlotAvailability = {
    slotId: string;
    label: string;
    startTime: string;
    endTime: string;
    status: SlotAvailabilityStatus;
};

export type SpaceAvailabilityResponse = {
    date: string;
    spaceId: string;
    spaceName: string;
    slots: SlotAvailability[];
};

export type ReservationsAdminFilters = {
    status?: ReservationStatus | "";
    spaceId?: string;
    date?: string;
    page?: number;
    pageSize?: number;
};

function getCondoIdOrThrow() {
    const condoId = storage.getCondoId();
    if (!condoId) {
        throw new Error("No condoId set in storage");
    }
    return condoId;
}

export async function listCommonSpaces(): Promise<CommonSpacesListResponse> {
    const condoId = getCondoIdOrThrow();
    const response = await http.get<CommonSpacesListResponse>(
        `/condominiums/${condoId}/spaces`,
    );
    return response.data;
}

export async function getCommonSpaceById(spaceId: string): Promise<CommonSpace> {
    const condoId = getCondoIdOrThrow();
    const response = await http.get<CommonSpace>(
        `/condominiums/${condoId}/spaces/${spaceId}`,
    );
    return response.data;
}

export async function listMyReservations(
    tab: "future" | "past" = "future",
): Promise<MyReservationsResponse> {
    const condoId = getCondoIdOrThrow();
    const response = await http.get<MyReservationsResponse>(
        `/condominiums/${condoId}/reservations/mine`,
        {
            params: { tab },
        },
    );
    return response.data;
}

export async function listAllReservations(
    filters: ReservationsAdminFilters = {},
): Promise<ReservationsAdminResponse> {
    const condoId = getCondoIdOrThrow();

    const response = await http.get<ReservationsAdminResponse>(
        `/condominiums/${condoId}/reservations`,
        {
            params: {
                status: filters.status || undefined,
                spaceId: filters.spaceId || undefined,
                date: filters.date || undefined,
                page: filters.page ?? 1,
                pageSize: filters.pageSize ?? 10,
            },
        },
    );

    return response.data;
}

export async function getSpaceAvailability(
    spaceId: string,
    date: string,
): Promise<SpaceAvailabilityResponse> {
    const condoId = getCondoIdOrThrow();

    const response = await http.get<SpaceAvailabilityResponse>(
        `/condominiums/${condoId}/reservations/spaces/${spaceId}/availability`,
        {
            params: { date },
        },
    );

    return response.data;
}

export async function createReservation(
    dto: CreateReservationDto,
): Promise<CreateReservationResponse> {
    const condoId = getCondoIdOrThrow();
    const response = await http.post<CreateReservationResponse>(
        `/condominiums/${condoId}/reservations`,
        dto,
    );
    return response.data;
}

export async function cancelReservation(
    reservationId: string,
): Promise<ReservationItem> {
    const condoId = getCondoIdOrThrow();
    const response = await http.post<ReservationItem>(
        `/condominiums/${condoId}/reservations/${reservationId}/cancel`,
    );
    return response.data;
}

export async function approveReservation(
    reservationId: string,
): Promise<ReservationItem> {
    const condoId = getCondoIdOrThrow();
    const response = await http.patch<ReservationItem>(
        `/condominiums/${condoId}/reservations/${reservationId}/approve`,
    );
    return response.data;
}

export async function rejectReservation(
    reservationId: string,
): Promise<ReservationItem> {
    const condoId = getCondoIdOrThrow();
    const response = await http.patch<ReservationItem>(
        `/condominiums/${condoId}/reservations/${reservationId}/reject`,
    );
    return response.data;
}