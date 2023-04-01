import { Button, Container, Grid, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import useAuth, { LoginProps } from '../../hooks/useAuth';
import * as Yup from 'yup';
import { getYupErrorMessages } from '../../utils';
import { toast } from 'react-hot-toast';
import useConvenience from '../../hooks/useConvenience';
import { useNavigate } from 'react-router-dom';

const schema = Yup.object().shape({
  username: Yup.string().required(),
  password: Yup.string().required(),
});

const Login = () => {
  const navigate = useNavigate();

  const { login } = useAuth();
  const simpler = useConvenience();

  const [form, setForm] = useState<LoginProps>({ username: '', password: '' });
  const [error, setError] = useState<LoginProps>({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError({
        username: '',
        password: '',
      });
      schema.validateSync(form, { abortEarly: false });

      const res = await login(form);
      simpler.showToastError(res, () => navigate('/'));
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errorMessages = getYupErrorMessages(err);
        const { username = '', password = '' } = errorMessages;
        const loginProps = { username, password };
        setError(loginProps);
      }
    }
  };

  return (
    <Container>
      <form onSubmit={handleSubmit}>
        <Grid container flexDirection="column" sx={{ mt: 8, '& > *:not(:last-child)': { mb: 2 } }}>
          <Grid item>
            <Typography>Sign in</Typography>
          </Grid>
          {['username', 'password'].map((item, index) => {
            return (
              <Grid key={index} item>
                <TextField
                  fullWidth
                  size="small"
                  type={item === 'password' ? 'password' : 'text'}
                  onChange={(e) => setForm((state) => ({ ...state, [item]: e.target.value }))}
                  error={error[item as keyof LoginProps].length > 0}
                  helperText={error[item as keyof LoginProps]}
                />
              </Grid>
            );
          })}
          <Grid item>
            <Button variant="contained" fullWidth type="submit">
              Log in
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default Login;
