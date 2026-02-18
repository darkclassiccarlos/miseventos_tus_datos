'use client';

import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Chip, Select, MenuItem, FormControl, InputLabel,
    Alert, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Navbar } from '@/components/Navbar';

export default function AdminUsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<any>(null);
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [editActive, setEditActive] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
            setError(null);
        } catch (err: any) {
            setError('Error al cargar la lista de usuarios. Asegúrate de tener permisos de administrador.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete.id}`);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Error al eliminar el usuario');
        }
    };

    const handleEditClick = (user: any) => {
        setUserToEdit(user);
        setEditRoles(user.roles.map((r: any) => r.name));
        setEditActive(user.is_active);
        setEditDialogOpen(true);
    };

    const saveEdit = async () => {
        if (!userToEdit) return;
        try {
            await api.put(`/users/${userToEdit.id}`, {
                role_names: editRoles,
                is_active: editActive
            });
            await fetchUsers();
            setEditDialogOpen(false);
            setUserToEdit(null);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Error al actualizar el usuario');
        }
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                            Gestión de Usuarios
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Administra los roles y estados de los usuarios en el sistema.
                        </Typography>
                    </Box>
                    <Button variant="outlined" onClick={fetchUsers}>Refrescar</Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <Table sx={{ '& .MuiTableCell-root': { color: 'white' } }}>
                            <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Roles</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {user.roles.map((role: any) => (
                                                    <Chip
                                                        key={role.id}
                                                        label={role.name.toUpperCase()}
                                                        size="small"
                                                        color={role.name === 'admin' ? 'secondary' : 'default'}
                                                        sx={{ color: 'white' }}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.is_active ? 'Activo' : 'Inactivo'}
                                                variant="outlined"
                                                color={user.is_active ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton color="primary" onClick={() => handleEditClick(user)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteClick(user)}
                                                disabled={currentUser?.id === user.id}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>

            {/* Modal de Edición */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Editar Usuario: {userToEdit?.email}</DialogTitle>
                <DialogContent sx={{ minWidth: 400, pt: 2 }}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Roles</InputLabel>
                        <Select
                            multiple
                            value={editRoles}
                            onChange={(e) => setEditRoles(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            label="Roles"
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            <MenuItem value="admin">Administrador</MenuItem>
                            <MenuItem value="organizer">Organizador</MenuItem>
                            <MenuItem value="customer">Cliente</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 3 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select
                            value={editActive ? 'active' : 'inactive'}
                            onChange={(e) => setEditActive(e.target.value === 'active')}
                            label="Estado"
                        >
                            <MenuItem value="active">Activo</MenuItem>
                            <MenuItem value="inactive">Inactivo</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={saveEdit} variant="contained" color="primary">Guardar Cambios</Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de Confirmación de Eliminación */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.email}</strong>? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        Eliminar definitivamente
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
