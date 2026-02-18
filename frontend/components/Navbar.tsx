'use client';

import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';
import EventIcon from '@mui/icons-material/Event';
import { useAuthStore } from '@/lib/store/authStore';

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuthStore();

    // Get the primary role name (prioritizing admin -> organizer -> customer)
    const getRoleLabel = () => {
        if (!user || !user.roles.length) return '';
        const roleNames = user.roles.map(r => r.name.toLowerCase());
        if (roleNames.includes('admin')) return 'Admin';
        if (roleNames.includes('organizer')) return 'Organizador';
        return 'Cliente';
    };

    const isAdmin = user?.roles.some(r => r.name.toLowerCase() === 'admin');
    const isOrganizer = user?.roles.some(r => r.name.toLowerCase() === 'organizer');

    return (
        <AppBar position="static" sx={{ backgroundColor: 'background.paper' }} elevation={0}>
            <Toolbar>
                <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" component={Link} href="/" sx={{ flexGrow: 1, color: 'background.default', textDecoration: 'none', cursor: 'pointer' }}>
                    MisEventos
                </Typography>
                {isAuthenticated ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isAdmin && (
                            <Button sx={{ color: 'background.default' }} component={Link} href="/admin/users">Usuarios</Button>
                        )}
                        {(isAdmin || isOrganizer) && (
                            <Button sx={{ color: 'background.default' }} component={Link} href="/events">Calendario y registro de eventos</Button>
                        )}
                        <Typography sx={{ color: 'background.default', fontWeight: 'bold' }}>
                            Hola, {getRoleLabel()} {user?.name}
                        </Typography>
                        <Button variant="outlined" sx={{ color: 'primary.main', borderColor: 'primary.main' }} onClick={logout}>Cerrar Sesión</Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button sx={{ color: 'background.default' }} component={Link} href="/login">Login</Button>
                        <Button variant="contained" color="primary" component={Link} href="/register">Register</Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}
