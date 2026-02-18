import { api } from './client';
import { UUID } from 'crypto';

export interface EventPagination {
    items: any[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface EventFilters {
    page?: number;
    size?: number;
    q?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

export const eventsApi = {
    getEvents: async (filters: EventFilters = {}) => {
        // Remove empty strings to avoid 422 errors with Enums in backend
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        );
        const response = await api.get<EventPagination>('/events/', { params: cleanFilters });
        return response.data;
    },
    getEvent: async (id: string) => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },
    createEvent: async (eventData: any) => {
        const response = await api.post('/events/', eventData);
        return response.data;
    },
    updateEvent: async (id: string, eventData: any) => {
        const response = await api.put(`/events/${id}`, eventData);
        return response.data;
    },
    deleteEvent: async (id: string) => {
        const response = await api.delete(`/events/${id}`);
        return response.data;
    },
    registerForEvent: async (id: string) => {
        // Use a random UUID for idempotency
        const requestId = window.crypto?.randomUUID() || Math.random().toString(36).substring(7);
        const response = await api.post(`/events/${id}/register`, {}, {
            headers: { 'X-Request-ID': requestId }
        });
        return response.data;
    },
    unregisterFromEvent: async (id: string) => {
        const response = await api.delete(`/events/${id}/unregister`);
        return response.data;
    },
    getMyRegistrations: async () => {
        const response = await api.get('/events/registrations/me');
        return response.data;
    }
};
