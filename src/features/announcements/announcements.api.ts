import { http } from "../../lib/http";
import { storage } from "../../lib/storage";

export type Announcement = {
    id: string;
    condominiumId: string;
    createdById: string;
    title: string;
    body: string;
    createdAt: string;
    createdBy?: {
        id: string;
        email: string;
        name: string | null;
    };
};

export type AnnouncementsListResponse = {
    items: Announcement[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type CreateAnnouncementDto = {
    title: string;
    body: string;
};

export async function listAnnouncements(
    page: number = 1,
    pageSize: number = 10
): Promise<AnnouncementsListResponse> {
    const condoId = storage.getCondoId();
    if (!condoId) throw new Error("No condoId set in storage");

    const res = await http.get<AnnouncementsListResponse>(
        `/condominiums/${condoId}/announcements`,
        { params: { page, pageSize } }
    );
    return res.data;
}

export async function createAnnouncement(
    dto: CreateAnnouncementDto
): Promise<Announcement> {
    const condoId = storage.getCondoId();
    if (!condoId) throw new Error("No condoId set in storage");

    const res = await http.post<Announcement>(
        `/condominiums/${condoId}/announcements`,
        dto
    );
    return res.data;
}

export const announcementsApi = {
    listAnnouncements,
    createAnnouncement,
};