'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Container, Box, Typography, TextField, Button, Paper, Alert, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { Navbar } from '@/components/Navbar';

const registerSchema = z.object({
    fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
        message: 'Debes aceptar los términos y condiciones',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerUser, isLoading, error: authError } = useAuthStore();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            terms: false,
        }
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            await registerUser({
                full_name: data.fullName,
                email: data.email,
                password: data.password,
            });
            router.push('/login?registered=true');
        } catch (err) {
            // Error managed by store
        }
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Navbar />

            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: '16px', color: 'white' }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Crear Cuenta
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Únete a MisEventos y empieza a gestionar tus actividades
                    </Typography>

                    {(authError || Object.keys(errors).length > 0) && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {authError ||
                                errors.fullName?.message ||
                                errors.email?.message ||
                                errors.password?.message ||
                                errors.confirmPassword?.message ||
                                errors.terms?.message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            fullWidth
                            label="Nombre Completo"
                            variant="outlined"
                            margin="normal"
                            {...register('fullName')}
                            error={!!errors.fullName}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Correo Electrónico"
                            variant="outlined"
                            margin="normal"
                            {...register('email')}
                            error={!!errors.email}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Contraseña"
                            variant="outlined"
                            margin="normal"
                            type="password"
                            {...register('password')}
                            error={!!errors.password}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Repetir Contraseña"
                            variant="outlined"
                            margin="normal"
                            type="password"
                            {...register('confirmPassword')}
                            error={!!errors.confirmPassword}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                            }}
                        />

                        <Controller
                            name="terms"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            {...field}
                                            checked={field.value}
                                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                            Acepto los términos y condiciones
                                        </Typography>
                                    }
                                    sx={{ mt: 1 }}
                                />
                            )}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 3, mb: 2, height: '56px' }}
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
                        </Button>
                    </form>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" style={{ color: '#FFD60A', fontWeight: 'bold', textDecoration: 'none' }}>
                                Inicia sesión aquí
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
