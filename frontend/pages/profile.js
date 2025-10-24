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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Chip,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  Person as PersonIcon,
  ShoppingBag as ShoppingBagIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import {
  ordersService,
  functionalOrdersService,
  filterOrdersByStatus,
  groupOrdersByDate,
  canCancelOrder,
  calculateOrderStats,
  ORDER_STATUSES,
} from '../services/ordersService';
import userService from '../services/userService';

/**
 * Componente de perfil de usuario
 * Muestra información del usuario y historial de pedidos
 */
const ProfilePage = () => {
  const router = useRouter();
  const { customerId } = useCart(); // Usar el mismo customer ID del carrito

  // Estados del componente
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /**
   * Carga la información del usuario desde la base de datos
   */
  const loadUserInfo = async () => {
    try {
      setUserLoading(true);
      const userData = await userService.getUserInfo(customerId);
      
      // Transformar los datos de la API al formato esperado por el componente
      setUserInfo({
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        phone: userData.phone || '+504 0000-0000',
        avatar: '',
        memberSince: userData.created_at?.split('T')[0] || '2024-01-01',
        customerId: userData.id,
      });
    } catch (err) {
      console.error('Error al cargar información del usuario:', err);
      // Usar datos por defecto en caso de error
      setUserInfo({
        firstName: 'Usuario',
        lastName: 'Demo',
        email: 'usuario@unah.edu.hn',
        phone: '+504 0000-0000',
        avatar: '',
        memberSince: '2024-01-01',
        customerId,
      });
    } finally {
      setUserLoading(false);
    }
  };

  // Calcular estadísticas usando funciones puras
  const orderStats = calculateOrderStats(orders);
  const groupedOrders = groupOrdersByDate(orders);

  /**
   * Carga los datos del usuario y el historial de pedidos al montar el componente
   */
  useEffect(() => {
    loadUserInfo();
    loadOrderHistory();
  }, []);

  /**
   * Carga el historial de pedidos del usuario
   */
  const loadOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar servicio POO para cargar órdenes
      const orderHistory = await ordersService.getOrderHistory(customerId);
      setOrders(orderHistory || []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError('Error al cargar el historial de pedidos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cambio de pestañas
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Abre el diálogo de detalles de una orden
   */
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  /**
   * Abre el diálogo de cancelación
   */
  const handleCancelOrderDialog = (order) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  /**
   * Cancela una orden usando el servicio funcional
   */
  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      showSnackbar('Por favor proporciona una razón para la cancelación');
      return;
    }

    try {
      // Usar servicio funcional con validación
      await functionalOrdersService.cancelOrder(selectedOrder.id, cancelReason);

      // Actualizar el estado local
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: ORDER_STATUSES.CANCELLED }
            : order
        )
      );

      setCancelDialogOpen(false);
      setCancelReason('');
      showSnackbar('Pedido cancelado exitosamente');
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
      showSnackbar('Error al cancelar el pedido');
    }
  };

  /**
   * Función auxiliar para mostrar notificaciones
   */
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  /**
   * Obtiene el color del chip según el estado
   */
  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      shipped: 'secondary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  /**
   * Formatea la fecha para mostrar
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Componente de información del usuario
   */
  const UserInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            {!userInfo ? (
              <>
                <Skeleton
                  variant="circular"
                  width={120}
                  height={120}
                  sx={{ margin: 'auto', mb: 2 }}
                />
                <Skeleton variant="text" width="60%" height={40} sx={{ margin: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="40%" height={24} sx={{ margin: 'auto', mb: 2 }} />
              </>
            ) : (
              <>
                <Avatar
                  src={userInfo.avatar}
                  sx={{
                    width: 120,
                    height: 120,
                    margin: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: 48,
                  }}
                >
                  {userInfo.firstName[0]}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {userInfo.firstName} {userInfo.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cliente desde {formatDate(userInfo.memberSince)}
                </Typography>
              </>
            )}
            <Button variant="outlined" startIcon={<EditIcon />} sx={{ mt: 2 }}>
              Editar perfil
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información personal
            </Typography>
            <List>
              {!userInfo ? (
                <>
                  <ListItem>
                    <ListItemText
                      primary="Nombre completo"
                      secondary={<Skeleton variant="text" width="60%" />}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={<Skeleton variant="text" width="70%" />}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Teléfono"
                      secondary={<Skeleton variant="text" width="50%" />}
                    />
                  </ListItem>
                </>
              ) : (
                <>
                  <ListItem>
                    <ListItemText
                      primary="Nombre completo"
                      secondary={`${userInfo.firstName} ${userInfo.lastName}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Email" secondary={userInfo.email} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Teléfono" secondary={userInfo.phone} />
                  </ListItem>
                </>
              )}
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estadísticas de compras
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {orderStats.total}
                  </Typography>
                  <Typography variant="body2">Pedidos totales</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    ${orderStats.totalAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">Total gastado</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    ${orderStats.averageOrderValue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">Promedio por pedido</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    <StarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />5
                  </Typography>
                  <Typography variant="body2">Calificación</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  /**
   * Componente del historial de pedidos
   */
  const OrderHistoryTab = () => (
    <Box>
      {orders.length === 0 ? (
        <Box textAlign="center" py={8}>
          <ShoppingBagIcon
            sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            No tienes pedidos aún
          </Typography>
          <Button variant="contained" onClick={() => router.push('/products')}>
            Explorar productos
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Historial de pedidos ({orders.length})
          </Typography>

          {orders.map((order) => (
            <Card key={order.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2">
                      Pedido #{order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Typography variant="body2">
                      {order.items?.length || 0} productos
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Typography variant="h6" color="primary">
                      ${order.total?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewOrderDetails(order)}
                      >
                        Ver detalles
                      </Button>

                      {canCancelOrder(order) && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelOrderDialog(order)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          <PersonIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Mi perfil
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Información personal" />
          <Tab label="Historial de pedidos" />
        </Tabs>
      </Box>

      {/* Contenido de las pestañas */}
      {activeTab === 0 && <UserInfoTab />}
      {activeTab === 1 && <OrderHistoryTab />}

      {/* Diálogo de detalles del pedido */}
      <Dialog
        open={orderDetailsOpen}
        onClose={() => setOrderDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Detalles del pedido #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Estado:
                <Chip
                  label={selectedOrder.status}
                  color={getStatusColor(selectedOrder.status)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                Creado: {formatDate(selectedOrder.createdAt)}
              </Typography>

              {selectedOrder.shippingAddress && (
                <Box mb={2}>
                  <Typography variant="subtitle2">
                    Dirección de envío:
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress.street}
                    <br />
                    {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.state}
                    <br />
                    {selectedOrder.shippingAddress.zipCode},{' '}
                    {selectedOrder.shippingAddress.country}
                  </Typography>
                </Box>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Productos:
              </Typography>
              <List>
                {selectedOrder.items?.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>{item.title?.[0] || 'P'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.title || 'Producto'}
                      secondary={`Cantidad: ${item.quantity} × $${item.price?.toFixed(2) || '0.00'}`}
                    />
                    <Typography variant="body2">
                      ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" textAlign="right">
                Total: ${selectedOrder.total?.toFixed(2) || '0.00'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de cancelación */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancelar pedido</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            ¿Estás seguro de que quieres cancelar el pedido #{selectedOrder?.id}
            ?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Razón de cancelación"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={!cancelReason.trim()}
          >
            Confirmar cancelación
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

export default ProfilePage;
