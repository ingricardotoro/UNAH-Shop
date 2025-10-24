import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Rating,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  TextField,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { productsService } from '../services/productsService';
import { cartService, validateCartItem } from '../services/cartService';

/**
 * Página de detalle de producto
 * Muestra información completa de un producto específico
 */
const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  // Estados del componente
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { customerId } = useCart(); // Usar el mismo customer ID del carrito

  /**
   * Carga el producto al montar el componente o cambiar el ID
   */
  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  /**
   * Carga la información del producto
   */
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar producto usando servicio POO
      const productData = await productsService.getProductById(parseInt(id));
      setProduct(productData);

      // Cargar productos relacionados de la misma categoría
      if (productData.category) {
        await loadRelatedProducts(productData.category, productData.id);
      }
    } catch (err) {
      console.error('Error al cargar producto:', err);
      if (err.message.includes('404')) {
        setError('Producto no encontrado');
      } else {
        setError('Error al cargar la información del producto');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga productos relacionados
   */
  const loadRelatedProducts = async (category, currentProductId) => {
    try {
      const categoryProducts =
        await productsService.getProductsByCategory(category);
      const filtered = categoryProducts
        .filter((p) => p.id !== currentProductId)
        .slice(0, 4);
      setRelatedProducts(filtered);
    } catch (err) {
      console.error('Error al cargar productos relacionados:', err);
    }
  };

  /**
   * Maneja el cambio de cantidad
   */
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  /**
   * Agrega el producto al carrito
   */
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);

      // Preparar item del carrito
      const cartItem = {
        customerId,
        productId: product.id,
        quantity,
      };

      // Validación funcional
      const validation = validateCartItem(cartItem);
      if (!validation.isValid) {
        showSnackbar(validation.errors.join(', '));
        return;
      }

      // Agregar al carrito usando servicio POO
      await cartService.addToCart(cartItem);

      showSnackbar(`${product.title} agregado al carrito`);
      setQuantity(1); // Reset cantidad
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
      showSnackbar('Error al agregar el producto al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  /**
   * Maneja el favorito (simulado)
   */
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showSnackbar(
      isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos'
    );
  };

  /**
   * Maneja compartir producto
   */
  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback: copiar al portapapeles
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          showSnackbar('Enlace copiado al portapapeles');
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      if (navigator.clipboard && window.location.href) {
        navigator.clipboard.writeText(window.location.href);
        showSnackbar('Enlace copiado al portapapeles');
      }
    }
  };

  /**
   * Navega a otro producto
   */
  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`);
  };

  /**
   * Función auxiliar para mostrar notificaciones
   */
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  /**
   * Componente de productos relacionados
   */
  const RelatedProducts = () => (
    <Box mt={6}>
      <Typography variant="h5" gutterBottom>
        Productos relacionados
      </Typography>
      <Grid container spacing={3}>
        {relatedProducts.map((relatedProduct) => (
          <Grid item xs={12} sm={6} md={3} key={relatedProduct.id}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => handleProductClick(relatedProduct.id)}
            >
              <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                <Box
                  component="img"
                  src={relatedProduct.image}
                  alt={relatedProduct.title}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    p: 2,
                  }}
                />
              </Box>
              <CardContent>
                <Typography variant="subtitle2" noWrap>
                  {relatedProduct.title}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${relatedProduct.price.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          onClick={() => router.push('/products')}
          startIcon={<ArrowBackIcon />}
        >
          Volver a productos
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">Producto no encontrado</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <NextLink href="/" passHref legacyBehavior>
          <Link underline="hover" color="inherit">
            Inicio
          </Link>
        </NextLink>
        <NextLink href="/products" passHref legacyBehavior>
          <Link underline="hover" color="inherit">
            Productos
          </Link>
        </NextLink>
        <Typography color="text.primary">{product.title}</Typography>
      </Breadcrumbs>

      {/* Botón volver */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.back()}
        sx={{ mb: 3 }}
      >
        Volver
      </Button>

      <Grid container spacing={4}>
        {/* Imagen del producto */}
        <Grid item xs={12} md={6}>
          <Card>
            <Box sx={{ position: 'relative', paddingTop: '100%' }}>
              <Box
                component="img"
                src={product.image}
                alt={product.title}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  p: 4,
                }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Información del producto */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Categoría */}
            <Chip
              label={product.category}
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />

            {/* Título */}
            <Typography variant="h4" component="h1" gutterBottom>
              {product.title}
            </Typography>

            {/* Rating */}
            <Box display="flex" alignItems="center" mb={2}>
              <Rating
                value={product.rating?.rate || 0}
                readOnly
                precision={0.1}
                emptyIcon={
                  <StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.rating?.count || 0} reseñas)
              </Typography>
            </Box>

            {/* Precio */}
            <Typography variant="h3" color="primary" gutterBottom>
              ${product.price.toFixed(2)}
            </Typography>

            {/* Descripción */}
            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Controles de cantidad */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Cantidad
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <RemoveIcon />
                </IconButton>

                <TextField
                  size="small"
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityChange(parseInt(e.target.value) || 1)
                  }
                  inputProps={{
                    min: 1,
                    max: 10,
                    style: { textAlign: 'center' },
                  }}
                  sx={{ width: 80 }}
                />

                <IconButton
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 10}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Botones de acción */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={8}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Agregando...
                    </>
                  ) : (
                    'Agregar al carrito'
                  )}
                </Button>
              </Grid>

              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleToggleFavorite}
                  sx={{ minWidth: 'unset', p: 1.5 }}
                >
                  {isFavorite ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </Button>
              </Grid>

              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleShare}
                  sx={{ minWidth: 'unset', p: 1.5 }}
                >
                  <ShareIcon />
                </Button>
              </Grid>
            </Grid>

            {/* Información adicional */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Información del producto
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Envío gratis en pedidos mayores a $50
                  <br />
                  • Garantía de 30 días
                  <br />
                  • Soporte 24/7
                  <br />• Devoluciones gratuitas
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Productos relacionados */}
      {relatedProducts.length > 0 && <RelatedProducts />}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ProductDetailPage;
