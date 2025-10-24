import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { ShoppingCart, Store, Person, Receipt } from '@mui/icons-material';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>UNAH Shop - Inicio</title>
        <meta
          name="description"
          content="Bienvenido a UNAH Shop - Tu tienda universitaria en línea"
        />
      </Head>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            borderRadius: 2,
            color: 'white',
            mb: 6,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Bienvenido a UNAH Shop
          </Typography>
          <Typography variant="h5" component="p" gutterBottom>
            Tu tienda universitaria en línea
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Descubre una amplia variedad de productos para estudiantes,
            profesores y personal universitario. Compra de forma fácil y segura
            con nuestro sistema de microservicios.
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="secondary"
            sx={{ mt: 2 }}
            onClick={() => handleNavigation('/products')}
          >
            Ver Productos
          </Button>
        </Box>

        {/* Features Section */}
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 4 }}
        >
          Nuestros Servicios
        </Typography>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Store sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Catálogo de Productos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Explora nuestro amplio catálogo de productos universitarios
                  con filtros y búsqueda avanzada.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleNavigation('/products')}
                >
                  Ver Productos
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <ShoppingCart
                  sx={{ fontSize: 60, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h5" component="h3" gutterBottom>
                  Carrito de Compras
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestiona tus productos de forma intuitiva con nuestro carrito
                  de compras persistente.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleNavigation('/cart')}
                >
                  Ver Carrito
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Receipt sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Gestión de Órdenes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Realiza pedidos y hace seguimiento de tus compras con nuestro
                  sistema de órdenes.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleNavigation('/profile')}
                >
                  Mis Órdenes
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Person sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Perfil de Usuario
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administra tu perfil y preferencias para una experiencia
                  personalizada.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleNavigation('/profile')}
                >
                  Mi Perfil
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Technical Info Section */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Arquitectura de Microservicios
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Esta aplicación está construida con una arquitectura moderna de
            microservicios, demostrando patrones de diseño tanto funcionales
            como orientados a objetos.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button variant="outlined" size="small">
                Next.js + React
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" size="small">
                Material-UI
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" size="small">
                Node.js + Express
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" size="small">
                Supabase
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
