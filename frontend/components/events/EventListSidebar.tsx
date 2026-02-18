'use client';

import React from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Typography,
    Chip,
    Divider,
    Paper
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

interface EventListSidebarProps {
    events: any[];
    onEventClick: (event: any) => void;
    selectedEventId?: string;
    userRegistrations?: any[];
}

export default function EventListSidebar({ events, onEventClick, selectedEventId, userRegistrations = [] }: EventListSidebarProps) {

    const isUserRegistered = (eventId: string) => {
        return userRegistrations.some(reg => reg.event_id === eventId);
    };

    if (!events || events.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body1">No hay eventos para mostrar.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ p: 2, pb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" /> Próximos Eventos
            </Typography>
            <Divider />
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                {events.map((event) => {
                    const isRegistered = isUserRegistered(event.id);
                    return (
                        <React.Fragment key={event.id}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => onEventClick(event)}
                                    selected={selectedEventId === event.id}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        py: 2,
                                        px: 2,
                                        borderLeft: selectedEventId === event.id ? '4px solid' : '4px solid transparent',
                                        borderColor: 'primary.main',
                                        '&.Mui-selected': {
                                            backgroundColor: 'action.selected',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            }
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                                            {event.title}
                                        </Typography>
                                        {isRegistered && (
                                            <Chip label="Inscrito" color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        )}
                                    </Box>
                                    <Typography variant="body2" color="white" noWrap sx={{ width: '100%', mb: 1 }}>
                                        {new Date(event.time_range?.[0]).toLocaleDateString()} • {event.space?.name || 'Ubicación pendiente'}
                                    </Typography>
                                    <Typography variant="caption" color="white" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.8 }}>
                                        {event.description}
                                    </Typography>
                                </ListItemButton>
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    );
                })}
            </List>
        </Box>
    );
}
