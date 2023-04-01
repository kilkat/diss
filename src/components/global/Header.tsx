import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import zIndex from '@mui/material/styles/zIndex';
import React from 'react';

import { Link as RouterLink } from 'react-router-dom';

const Header = () => {
  return (
    <Box
      sx={{ bgcolor: 'white', width: '100%', height: 60, position: 'fixed', top: 0, left: 0, zIndex: zIndex.appBar }}
    >
      <Grid container height="100%" alignItems="center">
        <Grid item>
          <Button component={RouterLink} to="/">
            Home
          </Button>
        </Grid>
        <Grid item>
          <Button component={RouterLink} to="/login">
            Sign in
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Header;
