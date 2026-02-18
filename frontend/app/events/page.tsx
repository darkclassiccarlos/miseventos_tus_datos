'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Alert,
    TextField,
    MenuItem,
    Pagination,
    Skeleton,
    Paper,
    Divider,
    IconButton,
    InputAdornment,
    Tabs,
    Tab,
    Stack
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { eventsApi, EventFilters, EventPagination } from '@/lib/api/events';
import EventDetailDrawer from '@/components/events/EventDetailDrawer';
import EventDetailContent from '@/components/events/EventDetailContent';
import EventListSidebar from '@/components/events/EventListSidebar';
import { Navbar } from '@/components/Navbar';
import { useAuthStore } from '@/lib/store/authStore';
import { ArrowForwardIos, ArrowBackIos, Close, List as ListIcon, Add as AddIcon } from '@mui/icons-material';
import EventFormModal from '@/components/organizer/EventFormModal';
import { useMediaQuery, useTheme } from '@mui/material';

export default function EventsManagementPage() {
    const { isAuthenticated, user } = useAuthStore();
    const [eventsData, setEventsData] = useState<EventPagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Check if user is an organizer
    const isOrganizer = user?.roles?.some(role => role.name === 'organizer') || false;

    // Filters state
    const [filters, setFilters] = useState<EventFilters>({
        page: 1,
        size: 9,
        q: '',
        status: ''
    });

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Mobile drawer
    const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Desktop sidebar
    const [isModalOpen, setIsModalOpen] = useState(false); // Event creation modal

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await eventsApi.getEvents(filters);
            setEventsData(data);
            setError(null);
        } catch (err: any) {
            setError('Error al cargar los eventos. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchUserRegistrations = useCallback(async () => {
        if (!isAuthenticated) {
            setUserRegistrations([]);
            return;
        }
        try {
            const data = await eventsApi.getMyRegistrations();
            setUserRegistrations(data);
        } catch (err) {
            console.error('Error fetching registrations', err);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchEvents();
        fetchUserRegistrations();
    }, [fetchEvents, fetchUserRegistrations]);

    const handleFilterChange = (field: keyof EventFilters, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setFilters(prev => ({ ...prev, page: value }));
    };

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        if (isMobile) {
            setIsDrawerOpen(true);
        } else {
            setIsSidebarVisible(true);
        }
    };

    const handleCloseDetail = () => {
        setSelectedEvent(null);
        if (isMobile) {
            setIsDrawerOpen(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    const handleRegister = async (eventId: string) => {
        setIsRegistering(true);
        try {
            await eventsApi.registerForEvent(eventId);
            await fetchUserRegistrations();
            await fetchEvents();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Error al inscribirse. Intenta de nuevo.';
            alert(msg);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleUnregister = async (eventId: string) => {
        if (!confirm('¿Estás seguro de que quieres anular tu inscripción?')) return;
        setIsRegistering(true);
        try {
            await eventsApi.unregisterFromEvent(eventId);
            await fetchUserRegistrations();
            await fetchEvents();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Error al anular la inscripción.';
            alert(msg);
        } finally {
            setIsRegistering(false);
        }
    };

    const isUserRegistered = (eventId: string) => {
        return userRegistrations.some(reg => reg.event_id === eventId);
    };

    // Format events for calendar
    const formattedEvents = eventsData?.items.map(event => ({
        id: event.id,
        title: event.title,
        start: event.time_range ? event.time_range[0] : new Date(),
        end: event.time_range ? event.time_range[1] : new Date(),
        extendedProps: { ...event, type: 'event' },
        backgroundColor: isUserRegistered(event.id) ? '#4caf50' : '#ff9800',
        borderColor: isUserRegistered(event.id) ? '#2e7d32' : '#f57c00',
    })) || [];

    // Format sessions for calendar
    const formattedSessions = eventsData?.items.flatMap(event =>
        (event.sessions || []).map((session: any) => ({
            id: `session-${session.id}`,
            title: `[S] ${session.title}`,
            start: session.time_range ? session.time_range[0] : new Date(),
            end: session.time_range ? session.time_range[1] : new Date(),
            extendedProps: {
                ...session,
                type: 'session',
                parentEventId: event.id,
                parentEventTitle: event.title
            },
            backgroundColor: '#1976d2', // Blue for sessions
            borderColor: '#0d47a1',
        }))
    ) || [];

    // Combine events and sessions
    const calendarEvents = [...formattedEvents, ...formattedSessions];

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Navbar />

            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
                            Dashboard de Eventos
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Vista de calendario y gestión de actividades.
                        </Typography>
                    </Box>
                    {isMounted && isOrganizer && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setIsModalOpen(true)}
                            sx={{
                                fontWeight: 'bold',
                                textTransform: 'none'
                            }}
                        >
                            Crear Evento
                        </Button>
                    )}
                </Box>

                {/* Filters Section with High Contrast */}
                <Paper
                    sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 2,
                        backgroundColor: 'primary.main',
                        color: 'white'
                    }}
                    elevation={3}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por título o descripción..."
                                value={filters.q}
                                onChange={(e) => handleFilterChange('q', e.target.value)}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                        '&:hover fieldset': { borderColor: 'white' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.7)', opacity: 1 },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'white' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                select
                                fullWidth
                                label="Estado"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                        '&:hover fieldset': { borderColor: 'white' },
                                        '&.Mui-focused fieldset': { borderColor: 'white' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
                                    '& .MuiSelect-icon': { color: 'white' },
                                }}
                                SelectProps={{
                                    MenuProps: {
                                        PaperProps: {
                                            sx: {
                                                backgroundColor: 'primary.main',
                                                color: 'white',
                                                '& .MuiMenuItem-root': {
                                                    '&.Mui-selected': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="">Todos los estados</MenuItem>
                                <MenuItem value="draft">Borrador</MenuItem>
                                <MenuItem value="published">Publicado</MenuItem>
                                <MenuItem value="cancelled">Cancelado</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                border-radius="8px"
                                fullWidth
                                onClick={fetchEvents}
                                size="large"
                                sx={{
                                    height: '56px',
                                    fontWeight: 'bold',
                                    backgroundColor: 'white',
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    }
                                }}
                            >
                                Aplicar Filtros
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

                <Grid container spacing={4} sx={{ position: 'relative' }}>
                    {/* Calendar View */}
                    <Grid size={{ xs: 12, md: isSidebarVisible ? 8 : 12 }} sx={{ transition: 'all 0.3s ease' }}>
                        <Box sx={{ position: 'relative' }}>
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    height: 'auto',
                                    minHeight: '700px',
                                    backgroundColor: '#0D1B2A', // Very Dark Navy
                                    color: 'white',
                                    '& .fc': {
                                        '--fc-border-color': 'rgba(255, 255, 255, 0.1)',
                                        '--fc-daygrid-event-dot-width': '8px',
                                    },
                                    '& .fc-toolbar-title, & .fc-col-header-cell-cushion, & .fc-daygrid-day-number': {
                                        color: 'white !important',
                                        fontWeight: 'bold'
                                    },
                                    '& .fc-button-primary': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&.fc-button-active': {
                                            backgroundColor: 'white',
                                            color: '#0D1B2A',
                                        }
                                    },
                                    '& .fc-theme-standard td, & .fc-theme-standard th': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                                elevation={3}
                            >
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'white' }}>
                                    <CalendarMonthIcon sx={{ color: 'white' }} /> Próximos Eventos
                                </Typography>
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek'
                                    }}
                                    events={calendarEvents}
                                    locale="es"
                                    buttonText={{
                                        today: 'Hoy',
                                        month: 'Mes',
                                        week: 'Semana'
                                    }}
                                    eventClick={(info) => handleEventClick(info.event.extendedProps)}
                                    height="auto"
                                    eventColor="#ff9800"
                                    eventTextColor="#000000"
                                />
                            </Paper>

                            {/* Sidebar Toggle Button (Floating or Integrated) */}
                            {!isMobile && (
                                <IconButton
                                    onClick={toggleSidebar}
                                    sx={{
                                        position: 'absolute',
                                        top: 20,
                                        right: isSidebarVisible ? -20 : 0,
                                        zIndex: 10,
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'primary.dark' },
                                        boxShadow: 3
                                    }}
                                >
                                    {isSidebarVisible ? <ArrowForwardIos fontSize="small" /> : <ListIcon />}
                                </IconButton>
                            )}
                        </Box>
                    </Grid>

                    {/* Sidebar Area (Desktop) */}
                    {!isMobile && isSidebarVisible && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    maxHeight: '800px',
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'background.paper'
                                }}
                            >
                                {selectedEvent ? (
                                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-start' }}>
                                            <Button
                                                startIcon={<ArrowBackIos />}
                                                onClick={() => setSelectedEvent(null)}
                                                size="small"
                                            >
                                                Volver al listado
                                            </Button>
                                        </Box>
                                        <Divider />
                                        <EventDetailContent
                                            event={selectedEvent}
                                            isRegistered={isUserRegistered(selectedEvent.id)}
                                            isRegistering={isRegistering}
                                            onRegister={handleRegister}
                                            onUnregister={handleUnregister}
                                            isLoggedIn={isAuthenticated}
                                        />
                                    </Box>
                                ) : (
                                    <EventListSidebar
                                        events={eventsData?.items || []}
                                        onEventClick={handleEventClick}
                                        selectedEventId={selectedEvent?.id}
                                        userRegistrations={userRegistrations}
                                    />
                                )}
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Container>

            <EventDetailDrawer
                open={isDrawerOpen}
                event={selectedEvent}
                onClose={handleCloseDetail}
                isRegistered={selectedEvent ? isUserRegistered(selectedEvent.id) : false}
                isRegistering={isRegistering}
                onRegister={handleRegister}
                onUnregister={handleUnregister}
                isLoggedIn={isAuthenticated}
            />

            <EventFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchEvents();
                }}
            />
        </Box>
    );
}
