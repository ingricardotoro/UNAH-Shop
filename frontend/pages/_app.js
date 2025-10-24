import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import { CartProvider, useCart } from '../context/CartContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import createEmotionCache from '../styles/createEmotionCache';
import theme from '../styles/theme';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

/**
 * Componente de navegación superior
 */
const AppNavigation = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const { cartItemsCount } = useCart(); // Usar el contexto del carrito

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const navigateTo = (path) => {
    router.push(path);
    handleProfileMenuClose();
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo y título */}
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigateTo('/')}
          sx={{ mr: 2 }}
        >
          <StoreIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          onClick={() => navigateTo('/')}
        >
          UNAH Shop
        </Typography>

        {/* Navegación principal */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigateTo('/')}
            sx={{ mr: 1 }}
          >
            Inicio
          </Button>

          <Button
            color="inherit"
            onClick={() => navigateTo('/products')}
            sx={{ mr: 1 }}
          >
            Productos
          </Button>

          <Button
            color="inherit"
            onClick={() => navigateTo('/customers')}
            sx={{ mr: 1 }}
          >
            Customers
          </Button>
        </Box>

        {/* Carrito */}
        <IconButton
          color="inherit"
          onClick={() => navigateTo('/cart')}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={cartItemsCount} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        {/* Menú de usuario */}
        <IconButton edge="end" color="inherit" onClick={handleProfileMenuOpen}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
            <PersonIcon />
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => navigateTo('/profile')}>Mi perfil</MenuItem>
          <MenuItem onClick={() => navigateTo('/cart')}>Mi carrito</MenuItem>
          <MenuItem onClick={handleProfileMenuClose}>Cerrar sesión</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>UNAH Shop - Tienda Universitaria</title>
        <meta
          name="description"
          content="Tienda en línea de la Universidad Nacional Autónoma de Honduras"
        />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        
        <CartProvider>
          {/* Navegación global */}
          <AppNavigation />

          {/* Contenido de la página */}
          <Component {...pageProps} />
        </CartProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
