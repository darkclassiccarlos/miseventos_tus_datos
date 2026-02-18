'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Box,
    Alert,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { api } from '@/lib/api/client';

interface EventFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Space {
    id: string;
    name: string;
    capacity: number;
}

interface EventSummary {
    id: string;
    title: string;
}

export default function EventFormModal({ open, onClose, onSuccess }: EventFormModalProps) {
    const [type, setType] = useState<'event' | 'session'>('event');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [spaceId, setSpaceId] = useState('');
    const [eventId, setEventId] = useState(''); // For parent event
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [status, setStatus] = useState('draft');

    const [spaces, setSpaces] = useState<Space[]>([]);
    const [parentEvents, setParentEvents] = useState<EventSummary[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSpaces();
            fetchParentEvents();
            // Reset form
            setType('event');
            setTitle('');
            setDescription('');
            setSpaceId('');
            setEventId('');
            setStartTime('');
            setEndTime('');
            setCapacity('');
            setStatus('draft');
            setError(null);
        }
    }, [open]);

    const fetchSpaces = async () => {
        try {
            const response = await api.get('/spaces/');
            setSpaces(response.data);
        } catch (err) {
            console.error('Failed to fetch spaces', err);
        }
    };

    const fetchParentEvents = async () => {
        try {
            const response = await api.get('/events/');
            // Assuming response.data is the list or pagination object
            const items = Array.isArray(response.data) ? response.data : response.data.items || [];
            setParentEvents(items.map((e: any) => ({ id: e.id, title: e.title })));
        } catch (err) {
            console.error('Failed to fetch events', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Basic client-validation
            if (!spaceId || !startTime || !endTime || !title) {
                throw new Error("Por favor completa los campos requeridos");
            }
            if (type === 'session' && !eventId) {
                throw new Error("Una sesión debe pertenecer a un evento padre");
            }

            const payload: any = {
                title,
                description,
                space_id: spaceId,
                time_range: [new Date(startTime).toISOString(), new Date(endTime).toISOString()],
                capacity: capacity === '' ? null : Number(capacity),
                status
            };

            if (type === 'event') {
                await api.post('/events/', payload);
            } else {
                payload.event_id = eventId;
                await api.post('/sessions/', payload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || err.message || 'Error al crear');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {type === 'event' ? 'Crear Nuevo Evento' : 'Crear Nueva Sesión'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                            <ToggleButtonGroup
                                color="primary"
                                value={type}
                                exclusive
                                onChange={(e, newType) => {
                                    if (newType) setType(newType);
                                }}
                            >
                                <ToggleButton value="event">Evento</ToggleButton>
                                <ToggleButton value="session">Sesión</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {type === 'session' && (
                            <FormControl fullWidth required>
                                <InputLabel>Evento Padre</InputLabel>
                                <Select
                                    value={eventId}
                                    label="Evento Padre"
                                    onChange={(e) => setEventId(e.target.value)}
                                >
                                    {parentEvents.map((evt) => (
                                        <MenuItem key={evt.id} value={evt.id}>
                                            {evt.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <TextField
                            label="Título"
                            fullWidth
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <TextField
                            label="Descripción"
                            fullWidth
                            multiline
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Espacio</InputLabel>
                            <Select
                                value={spaceId}
                                label="Espacio"
                                onChange={(e) => setSpaceId(e.target.value)}
                            >
                                {spaces.map((space) => (
                                    <MenuItem key={space.id} value={space.id}>
                                        {space.name} (Cap: {space.capacity})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Inicio"
                            type="datetime-local"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />

                        <TextField
                            label="Fin"
                            type="datetime-local"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />

                        <TextField
                            label="Capacidad (Opcional)"
                            type="number"
                            fullWidth
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={status}
                                label="Estado"
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <MenuItem value="draft">Borrador</MenuItem>
                                <MenuItem value="published">Publicado</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Guardando...' : `Crear ${type === 'event' ? 'Evento' : 'Sesión'}`}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
