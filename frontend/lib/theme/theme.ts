import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: '#FFD60A', // Amarillo Pastel
        },
        secondary: {
            main: '#3E5C76', // Azul Acero
        },
        background: {
            default: '#FDFFFC', // Crema/Hueso
            paper: '#0D1B2A',   // Azul Espacial
        },
        text: {
            primary: '#0D1B2A', // Azul Espacial sobre fondo Crema
            secondary: '#3E5C76', // Azul Acero
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 700,
        },
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 700,
        }
    },
});

export default theme;
