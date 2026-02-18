'use client';

import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';

interface EventDetailContentProps {
    event: any | null;
    isRegistered?: boolean;
    isRegistering?: boolean;
    onRegister?: (id: string) => Promise<void>;
    onUnregister?: (id: string) => Promise<void>;
    isLoggedIn?: boolean;
}

export default function EventDetailContent({
    event,
    isRegistered,
    isRegistering,
    onRegister,
    onUnregister,
    isLoggedIn
}: EventDetailContentProps) {
    if (!event) return null;

    return (
        <Stack spacing={3} sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
            <Box>
                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                    {event.title}
                </Typography>
                <Chip
                    label={event.status === 'published' ? 'Publicado' : event.status}
                    color={event.status === 'published' ? 'success' : 'default'}
                    size="small"
                    sx={{ mb: 2 }}
                />
                <Typography variant="body1" color="text.secondary">
                    {event.description || 'Sin descripción disponible.'}
                </Typography>
            </Box>

            <Divider />

            <List disablePadding>
                <ListItem disableGutters>
                    <ListItemIcon><CalendarMonthIcon color="primary" /></ListItemIcon>
                    <ListItemText
                        primary="Fecha y Hora"
                        secondary={event.time_range ? new Date(event.time_range[0]).toLocaleString() : 'Por confirmar'}
                        primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                    />
                </ListItem>
                <ListItem disableGutters>
                    <ListItemIcon><LocationOnIcon color="secondary" /></ListItemIcon>
                    <ListItemText
                        primary="Ubicación"
                        secondary={event.space?.name || 'Ubicación por confirmar'}
                        primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                    />
                </ListItem>
                <ListItem disableGutters>
                    <ListItemIcon><PeopleIcon color="action" /></ListItemIcon>
                    <ListItemText
                        primary="Capacidad"
                        secondary={event.capacity ? `${event.capacity} personas` : 'Sin límite'}
                        primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                    />
                </ListItem>
                <ListItem disableGutters>
                    <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
                    <ListItemText
                        primary="Organizador"
                        secondary={event.organizer?.full_name || 'Desconocido'}
                        primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                    />
                </ListItem>
            </List>

            <Box sx={{ mt: 'auto', pt: 2 }}>
                {!isLoggedIn && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Inicia sesión para inscribirte.
                    </Alert>
                )}

                <Stack direction="column" spacing={2}>
                    {isRegistered ? (
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            color="error"
                            disabled={isRegistering || !isLoggedIn}
                            onClick={() => onUnregister?.(event.id)}
                            startIcon={isRegistering && <CircularProgress size={20} />}
                        >
                            {isRegistering ? 'Procesando...' : 'Anular Inscripción'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            color="primary"
                            disabled={isRegistering || !isLoggedIn || event.status !== 'published'}
                            onClick={() => onRegister?.(event.id)}
                            startIcon={isRegistering && <CircularProgress size={20} color="inherit" />}
                        >
                            {isRegistering ? 'Procesando...' : 'Inscribirse al Evento'}
                        </Button>
                    )}
                </Stack>
            </Box>
        </Stack>
    );
}
