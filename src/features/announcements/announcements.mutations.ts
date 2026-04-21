import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAnnouncement } from "./announcements.api";
import type { CreateAnnouncementDto } from "./announcements.api";
import { ANNOUNCEMENTS_QUERY_KEYS } from "./announcements.hooks";

export function useCreateAnnouncement() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateAnnouncementDto) => createAnnouncement(dto),

        onSuccess: () => {
            // refresca todas las queries relacionadas a announcements
            qc.invalidateQueries({ queryKey: ["announcements"] });

            // refresca específicamente las listas
            qc.invalidateQueries({
                queryKey: ANNOUNCEMENTS_QUERY_KEYS.list(1, 10),
            });

            // refresca widget dashboard
            qc.invalidateQueries({
                queryKey: ANNOUNCEMENTS_QUERY_KEYS.latest(3),
            });
        },
    });
}