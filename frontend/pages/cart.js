import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Alert,
  Fab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Clear as ClearIcon,
  ShoppingBag as ShoppingBagIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import {
  cartService,
  functionalCartService,
  calculateCartTotal,
  calculateTotalItems,
  groupItemsByCategory,
  validateCartItem,
} from '../services/cartService';
import { productsService } from '../services/productsService';

/**
 * Componente del carrito de compras
 * Implementa tanto paradigma funcional como POO
 */
const CartPage = () => {
  const router = useRouter();
  const { refreshCartCount } = useCart(); // Usar el contexto del carrito

  // Estados del componente
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [customerId] = useState('550e8400-e29b-41d4-a716-446655440001'); // En una app real vendría del contexto de autenticación

  // Estados calculados (paradigma funcional)
  const cartTotal = calculateCartTotal(cartItems);
  const totalItems = calculateTotalItems(cartItems);
  const groupedItems = groupItemsByCategory(cartItems);
  const isEmpty = cartItems.length === 0;

  /**
   * Carga los items del carrito al montar el componente
   * Usa paradigma POO (cartService)
   */
  useEffect(() => {
    loadCartItems();
  }, []);

  /**
   * Función para cargar items del carrito
   * Demuestra el uso del servicio POO con manejo de errores
   */
  const loadCartItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usando paradigma POO
      const cartResponse = await cartService.getCart(customerId);
      console.log('🛒 Cart Response:', cartResponse);
      console.log('🔍 Customer ID used:', customerId);
      
      // Extraer data del response
      const cartData = cartResponse.data || cartResponse;
      console.log('📦 Cart Data items:', cartData.items?.length || 0, 'items');
      
      // Verificar que existan items
      if (!cartData.items || !Array.isArray(cartData.items)) {
        console.log('❌ No items found');
        setCartItems([]);
        return;
      }

      console.log('✅ Items found:', cartData.items.length);

      // Enriquecer items del carrito con información de productos
      const enrichedItems = await Promise.all(
        cartData.items.map(async (item) => {
          console.log('🔍 Cart item BEFORE enriching:', item);
          console.log('🖼️ Cart item product_image:', item.product_image);
          try {
            const productData = await productsService.getProductById(
              item.product_id
            );
            const enrichedItem = {
              ...item,
              id: item.id,
              productId: item.product_id,
              title: item.product_name || productData.title,
              price: item.unit_price || productData.price,
              image: item.product_image || productData.image, // Usar imagen del carrito primero
              category: productData.category,
            };
            console.log('✨ Enriched item:', enrichedItem);
            console.log('🖼️ Final image URL:', enrichedItem.image);
            return enrichedItem;
          } catch (productError) {
            console.warn(
              `Error al cargar producto ${item.product_id}:`,
              productError
            );
            return {
              ...item,
              id: item.id,
              productId: item.product_id,
              title: item.product_name || 'Producto no disponible',
              price: item.unit_price || 0,
              image: item.product_image || '/placeholder.jpg', // Usar imagen del carrito primero
              category: 'Sin categoría',
            };
          }
        })
      );

      setCartItems(enrichedItems);
    } catch (err) {
      console.error('Error al cargar carrito:', err);
      setError('Error al cargar el carrito. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza la cantidad de un item
   * Demuestra validación funcional y servicio POO
   */
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    // Validación funcional
    const validation = validateCartItem({
      productId: 1,
      quantity: newQuantity,
    });
    if (!validation.isValid) {
      showSnackbar(validation.errors.join(', '));
      return;
    }

    try {
      // Actualización usando paradigma POO
      await cartService.updateCartItem(itemId, newQuantity);

      // Actualización del estado local (paradigma funcional)
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Refrescar el contador del carrito
      await refreshCartCount();

      showSnackbar('Cantidad actualizada');
    } catch (err) {
      console.error('Error al actualizar cantidad:', err);
      showSnackbar('Error al actualizar la cantidad');
    }
  };

  /**
   * Elimina un item del carrito
   * Combina servicio POO con actualización funcional del estado
   */
  const handleRemoveItem = async (itemId) => {
    try {
      // Eliminación usando paradigma POO
      await cartService.removeFromCart(itemId);

      // Actualización funcional del estado
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );

      // Refrescar el contador del carrito
      await refreshCartCount();

      showSnackbar('Producto eliminado del carrito');
    } catch (err) {
      console.error('Error al eliminar item:', err);
      showSnackbar('Error al eliminar el producto');
    }
  };

  /**
   * Limpia todo el carrito
   * Ejemplo de uso de paradigma funcional
   */
  const handleClearCart = async () => {
    try {
      // Usando servicio funcional
      await functionalCartService.clearCart(customerId);

      // Actualización del estado
      setCartItems([]);
      setClearDialogOpen(false);
      
      // Refrescar el contador del carrito
      await refreshCartCount();
      
      showSnackbar('Carrito vaciado');
    } catch (err) {
      console.error('Error al vaciar carrito:', err);
      showSnackbar('Error al vaciar el carrito');
    }
  };

  /**
   * Navega al checkout
   */
  const handleProceedToCheckout = () => {
    if (isEmpty) {
      showSnackbar('El carrito está vacío');
      return;
    }
    router.push('/checkout');
  };

  /**
   * Función auxiliar para mostrar notificaciones
   */
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  /**
   * Componente funcional para mostrar un item del carrito
   */
  const CartItemComponent = ({ item }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Avatar
              src={item.image}
              alt={item.title}
              sx={{ width: 80, height: 80, margin: 'auto' }}
            />
          </Grid>

          <Grid item xs={12} sm={5}>
            <Typography variant="h6" noWrap>
              {item.title}
            </Typography>
            <Chip
              label={item.category}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              ${item.price.toFixed(2)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Box display="flex" alignItems="center" justifyContent="center">
              <IconButton
                size="small"
                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>

              <TextField
                size="small"
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value) || 1;
                  handleUpdateQuantity(item.id, newQuantity);
                }}
                inputProps={{ min: 1, max: 10, style: { textAlign: 'center' } }}
                sx={{ width: 60, mx: 1 }}
              />

              <IconButton
                size="small"
                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= 10}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Box textAlign="center">
              <Typography variant="h6">
                ${(item.price * item.quantity).toFixed(2)}
              </Typography>
              <IconButton
                color="error"
                onClick={() => handleRemoveItem(item.id)}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Skeleton */}
        <Box mb={4}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="text" width={300} height={30} sx={{ mt: 1 }} />
        </Box>

        {/* Cart Items Skeleton */}
        <Box mb={4}>
          {[1, 2, 3].map((item) => (
            <Card key={item} sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                {/* Image Skeleton */}
                <Grid item xs={12} sm={3}>
                  <Skeleton 
                    variant="rectangular" 
                    width={80} 
                    height={80} 
                    sx={{ borderRadius: '50%', margin: 'auto' }}
                  />
                </Grid>

                {/* Product Info Skeleton */}
                <Grid item xs={12} sm={5}>
                  <Skeleton variant="text" width="80%" height={30} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ mt: 1, borderRadius: 1 }} />
                  <Skeleton variant="text" width="60%" height={28} sx={{ mt: 1 }} />
                </Grid>

                {/* Quantity Controls Skeleton */}
                <Grid item xs={12} sm={2}>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="text" width={40} height={24} sx={{ mx: 1 }} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </Grid>

                {/* Actions Skeleton */}
                <Grid item xs={12} sm={2}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
                  </Box>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Box>

        {/* Summary Skeleton */}
        <Card sx={{ p: 3 }}>
          <Skeleton variant="text" width={150} height={32} />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="100%" height={24} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="80%" height={32} sx={{ mt: 2 }} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ mt: 3, borderRadius: 1 }} />
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>

        <Typography variant="h3" component="h1" gutterBottom>
          <ShoppingCartIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Mi Carrito
        </Typography>

        {!isEmpty && (
          <Typography variant="subtitle1" color="text.secondary">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu
            carrito
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isEmpty ? (
        /* Carrito vacío */
        <Box textAlign="center" py={8}>
          <ShoppingBagIcon
            sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h5" gutterBottom>
            Tu carrito está vacío
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            ¡Explora nuestros productos y encuentra algo que te guste!
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/products')}
            sx={{ mt: 2 }}
          >
            Explorar productos
          </Button>
        </Box>
      ) : (
        /* Carrito con items */
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Lista de items */}
            <Box mb={3}>
              <Typography variant="h5" gutterBottom>
                Productos
              </Typography>

              {cartItems.map((item) => (
                <CartItemComponent key={item.id} item={item} />
              ))}
            </Box>

            {/* Botón para vaciar carrito */}
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={() => setClearDialogOpen(true)}
              sx={{ mb: 3 }}
            >
              Vaciar carrito
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Resumen del pedido */}
            <Card sx={{ position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Resumen del pedido
                </Typography>

                <Divider sx={{ my: 2 }} />

                <List>
                  <ListItem>
                    <ListItemText primary="Subtotal" />
                    <Typography variant="h6">
                      ${cartTotal.toFixed(2)}
                    </Typography>
                  </ListItem>

                  <ListItem>
                    <ListItemText primary="Envío" />
                    <Typography variant="h6">Gratis</Typography>
                  </ListItem>

                  <Divider />

                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="h6">Total</Typography>}
                    />
                    <Typography variant="h5" color="primary">
                      ${cartTotal.toFixed(2)}
                    </Typography>
                  </ListItem>
                </List>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleProceedToCheckout}
                  sx={{ mt: 2 }}
                >
                  Proceder al pago
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => router.push('/products')}
                  sx={{ mt: 1 }}
                >
                  Continuar comprando
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* FAB para ir a productos */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => router.push('/products')}
      >
        <ShoppingBagIcon />
      </Fab>

      {/* Diálogo de confirmación para vaciar carrito */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>¿Vaciar carrito?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta acción eliminará todos los productos de tu carrito. ¿Estás
            seguro de que deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleClearCart} color="error" variant="contained">
            Vaciar
          </Button>
        </DialogActions>
      </Dialog>

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

export default CartPage;
