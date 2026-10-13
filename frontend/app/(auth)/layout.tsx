import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'background.default',
        py: 12
      }}
    >
      <Container maxWidth="sm">
        {children}
      </Container>
    </Box>
  );
}
