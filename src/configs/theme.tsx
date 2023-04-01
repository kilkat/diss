import { createTheme } from '@mui/material';
import { grey, orange, red } from '@mui/material/colors';

// A custom theme for this app
const theme = createTheme({
  typography: {
    fontFamily: "'Poppins','Montserrat','Open Sans' sans-serif",
  },
  palette: {
    background: {
      default: '#ffffff',
    },
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    warning: {
      main: orange[400],
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
