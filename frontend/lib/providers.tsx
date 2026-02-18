'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
