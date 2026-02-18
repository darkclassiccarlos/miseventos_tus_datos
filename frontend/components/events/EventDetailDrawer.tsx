'use client';

import React from 'react';
import {
    Drawer,
    Box,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventDetailContent from './EventDetailContent';

interface EventDetailDrawerProps {
    event: any | null;
    open: boolean;
    onClose: () => void;
    isRegistered?: boolean;
    isRegistering?: boolean;
    onRegister?: (id: string) => Promise<void>;
    onUnregister?: (id: string) => Promise<void>;
    isLoggedIn?: boolean;
}

export default function EventDetailDrawer({
    event,
    open,
    onClose,
    isRegistered,
    isRegistering,
    onRegister,
    onUnregister,
    isLoggedIn
}: EventDetailDrawerProps) {
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: '100%', sm: 400 }, p: 2, display: 'flex', flexDirection: 'column' }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <EventDetailContent
                event={event}
                isRegistered={isRegistered}
                isRegistering={isRegistering}
                onRegister={onRegister}
                onUnregister={onUnregister}
                isLoggedIn={isLoggedIn}
            />
        </Drawer>
    );
}
