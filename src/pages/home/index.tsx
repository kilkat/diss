import {
  Container,
  Typography,
  Box,
  Paper,
  IconButton,
  InputBase,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import React, { FormEventHandler, useState } from 'react';

import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsIcon from '@mui/icons-material/Directions';
import useScan from '../../hooks/useSearch';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../../utils';

type Http = 'http' | 'https';

const Home = () => {
  const [http, setHttp] = useState<Http>('https');
  const [url, setUrl] = useState<string>('');

  const { search } = useScan();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    // console.log({ http, url });
    if (url.length > 0) {
      const res = await search(`${http}://${url}`);
      if (res.status > 400) {
        toast.error(getErrorMessage(res.data));
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography sx={{ md: 1, fontFamily: 'Poppins', fontWeight: 900, fontSize: 36 }}>Xss Online</Typography>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: 400,
            boxShadow: '0px 8px 20px rgba(0,0,0,0.18)',
            border: '1px solid #f4f4f4',
          }}
          onSubmit={(e) => handleSubmit(e)}
        >
          <FormControl>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              // value={age}
              label="Age"
              // onChange={handleChange}
              size="small"
              sx={{
                boxShadow: 'none',
                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                minWidth: 100,
                fontSize: 14,
                fontWeight: 700,
              }}
              onChange={(e) => setHttp(e.target.value as Http)}
              value={http}
            >
              <MenuItem value={'http'}>HTTP</MenuItem>
              <MenuItem value={'https'}>HTTPS</MenuItem>
            </Select>
          </FormControl>
          <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
          <InputBase
            sx={{ ml: 1, flex: 1, fontFamily: 'Poppins', fontSize: 14, fontWeight: 700 }}
            placeholder="www.example.com/"
            inputProps={{ 'aria-label': 'www.example.com/' }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home;
