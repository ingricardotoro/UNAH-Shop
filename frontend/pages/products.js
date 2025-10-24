import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Snackbar,
  Skeleton,
} from '@mui/material';
import { Search, FilterList, Add, Home } from '@mui/icons-material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { productsService } from '../services/productsService';
import { cartService } from '../services/cartService';

export default function ProductsPage() {
  const router = useRouter();
  const { refreshCartCount, customerId } = useCart(); // Usar el contexto del carrito
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [addingToCart, setAddingToCart] = useState({});

  // Cargar productos y categorías al inicializar
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar productos y categorías en paralelo
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsService.getAllProducts(),
        productsService.getCategories(),
      ]);

      console.log('Products response:', productsResponse);
      console.log('Categories response:', categoriesResponse);

      const productsData = productsResponse.data || productsResponse;
      const categoriesData = categoriesResponse.data || categoriesResponse;

      // Asegurar que products sea un array
      setProducts(Array.isArray(productsData) ? productsData : []);

      // Asegurar que categories sea un array
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      setError('Error al cargar los productos. Por favor, intenta de nuevo.');
      console.error('Error loading products:', err);
      // Establecer arrays vacíos en caso de error
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar productos
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadInitialData();
      return;
    }

    try {
      setLoading(true);
      const response = await productsService.searchProducts(searchQuery);
      const productsData = response.data || response;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      setError('Error en la búsqueda. Por favor, intenta de nuevo.');
      console.error('Error searching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por categoría
  const handleCategoryChange = async (event) => {
    const category = event.target.value;
    setSelectedCategory(category);

    try {
      setLoading(true);

      if (category === 'all') {
        await loadInitialData();
      } else {
        const response = await productsService.getProductsByCategory(category);
        const productsData = response.data || response;
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (err) {
      setError('Error al filtrar productos. Por favor, intenta de nuevo.');
      console.error('Error filtering products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Agregar al carrito
  const handleAddToCart = async (product) => {
    setAddingToCart((prev) => ({ ...prev, [product.id]: true }));

    try {
      const cartItem = {
        customerId,
        productId: product.id,
        productName: product.title,
        productImage: product.image,
        quantity: 1,
        unitPrice: product.price,
      };

      console.log('Agregando al carrito:', cartItem);
      
      await cartService.addToCart(cartItem);
      
      // Refrescar el contador del carrito
      await refreshCartCount();
      
      setNotification({
        open: true,
        message: `${product.title} agregado al carrito exitosamente`,
        severity: 'success',
      });

    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      setNotification({
        open: true,
        message: `Error al agregar ${product.title} al carrito`,
        severity: 'error',
      });
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <>
      <Head>
        <title>Productos - UNAH Shop</title>
        <meta
          name="description"
          content="Explora nuestro catálogo de productos universitarios"
        />
      </Head>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Search and Filters */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={handleSearch} size="small">
                        Buscar
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Categoría"
                  onChange={handleCategoryChange}
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">Todas las categorías</MenuItem>
                  {categories.map((category) => {
                    // Manejo de diferentes estructuras de datos de la API
                    const categoryValue =
                      typeof category === 'string'
                        ? category
                        : category.name || category.category || category;
                    const categoryDisplay =
                      typeof categoryValue === 'string'
                        ? categoryValue.charAt(0).toUpperCase() +
                          categoryValue.slice(1)
                        : categoryValue;

                    return (
                      <MenuItem key={categoryValue} value={categoryValue}>
                        {categoryDisplay}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Chip
                label={`${products.length} productos`}
                color="primary"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <Grid item key={item} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Product Image Skeleton */}
                  <Skeleton
                    variant="rectangular"
                    height={200}
                    sx={{ borderRadius: '4px 4px 0 0' }}
                  />

                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    {/* Product Title Skeleton */}
                    <Skeleton
                      variant="text"
                      height={28}
                      width="90%"
                      sx={{ mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      height={24}
                      width="70%"
                      sx={{ mb: 2 }}
                    />

                    {/* Category Chip Skeleton */}
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={24}
                      sx={{ borderRadius: 3, mb: 2 }}
                    />

                    {/* Price Skeleton */}
                    <Skeleton
                      variant="text"
                      height={32}
                      width="50%"
                      sx={{ mb: 1 }}
                    />

                    {/* Rating Skeleton */}
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Skeleton
                          key={star}
                          variant="circular"
                          width={16}
                          height={16}
                        />
                      ))}
                      <Skeleton variant="text" width={40} height={20} sx={{ ml: 1 }} />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    {/* Add to Cart Button Skeleton */}
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={36}
                      sx={{ borderRadius: 1 }}
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* Products Grid */
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[8],
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image}
                    alt={product.title}
                    sx={{ objectFit: 'contain', p: 1 }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      component="h3"
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {product.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        mb: 2,
                      }}
                    >
                      {product.description}
                    </Typography>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                      >
                        ${product.price}
                      </Typography>
                      <Chip
                        label={product.category}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      startIcon={addingToCart[product.id] ? <CircularProgress size={16} /> : <Add />}
                      onClick={() => handleAddToCart(product)}
                      fullWidth
                      variant="contained"
                      disabled={addingToCart[product.id]}
                    >
                      {addingToCart[product.id] ? 'Agregando...' : 'Agregar al Carrito'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && !error && (
          <Box textAlign="center" py={8}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No se encontraron productos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Intenta con otros términos de búsqueda o categorías
            </Typography>
          </Box>
        )}
      </Container>

      {/* Floating Action Button to Home */}
      <Fab
        color="primary"
        aria-label="volver al inicio"
        onClick={() => router.push('/')}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <Home />
      </Fab>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
