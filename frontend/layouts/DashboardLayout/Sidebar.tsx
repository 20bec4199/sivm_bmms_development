'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { usePathname, useRouter } from 'next/navigation';
import { navigationConfig } from './navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setSidebarOpen } from '../../store/slices/uiSlice';

const drawerWidth = 260;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const user = useSelector((state: RootState) => state.auth.user);

  const userRoles = user?.roles || [];

  const authorizedNavigation = navigationConfig.filter(nav => 
    nav.roles.some(role => userRoles.includes(role))
  );

  const drawerContent = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', height: 64, px: 3 }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          {sidebarOpen ? 'SIVM' : 'S'}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 2, pt: 2 }}>
        {authorizedNavigation.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1, display: 'block' }}>
              <ListItemButton
                onClick={() => {
                  router.push(item.path);
                  if (window.innerWidth < 900) {
                    onMobileClose();
                  }
                }}
                sx={{
                  minHeight: 48,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.50' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.100' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: isActive ? 600 : 400 }}>{item.title}</Typography>}
                  sx={{ 
                    opacity: sidebarOpen ? 1 : 0, 
                    display: sidebarOpen ? 'block' : 'none' 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { md: sidebarOpen ? drawerWidth : 80 }, 
        flexShrink: { sm: 0 },
        transition: 'width 0.3s ease',
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: sidebarOpen ? drawerWidth : 80,
            transition: 'width 0.3s ease',
            borderRight: '1px dashed rgba(145, 158, 171, 0.24)'
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
