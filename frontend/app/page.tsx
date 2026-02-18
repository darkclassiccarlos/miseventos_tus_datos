'use client';

import { Typography, Button, Container, Box, Paper, Grid } from '@mui/material';
import Link from 'next/link';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useAuthStore } from '@/lib/store/authStore';
import { Navbar } from '@/components/Navbar';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If we are on Home and not authenticated, ensure the cookie is cleared
    // to prevent middleware from blocking access to /login
    if (!isAuthenticated) {
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }, [isAuthenticated]);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ mt: 8, color: 'text.primary' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Bienvenido a MisEventos
            </Typography>
            <Typography variant="h5" component="p" gutterBottom sx={{ mb: 4, color: 'text.secondary' }}>
              La plataforma definitiva para gestionar y asistir a eventos corporativos.
            </Typography>
            <Button variant="contained" color="primary" size="large" component={Link} href="/events" sx={{ mr: 2, textDecoration: 'none' }}>
              Explorar Eventos
            </Button>
            {!isAuthenticated && (
              <Button variant="outlined" color="secondary" size="large" component={Link} href="/login" sx={{ textDecoration: 'none' }}>
                <LockOpenIcon sx={{ mr: 1 }} />
                Iniciar Sesión
              </Button>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 4, backgroundColor: 'background.paper', borderRadius: '16px', color: 'background.default' }}>
              <Typography variant="h5" gutterBottom>Próximos Eventos</Typography>
              <Typography>Aquí se mostrará un carrusel o lista de eventos destacados.</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
