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
  TextField,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { cartService, calculateCartTotal } from '../services/cartService';
import {
  ordersService,
  functionalOrdersService,
  validateOrderData,
  ORDER_STATUSES,
} from '../services/ordersService';
import { productsService } from '../services/productsService';

/**
 * Página de checkout - Proceso de compra
 * Implementa stepper con validación funcional y servicios POO
 */
const CheckoutPage = () => {
  const router = useRouter();
  const { customerId } = useCart(); // Usar el mismo customer ID del carrito

  // Estados principales
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [orderCreated, setOrderCreated] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Estados del formulario de envío
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Honduras',
  });

  // Estados del formulario de pago
  const [paymentForm, setPaymentForm] = useState({
    method: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  // Configuración del stepper
  const steps = ['Datos de envío', 'Método de pago', 'Confirmar pedido'];

  // Cálculos funcionales
  const cartTotal = calculateCartTotal(cartItems);
  const shippingCost = 0; // Envío gratis
  const tax = cartTotal * 0.15; // 15% de impuestos
  const finalTotal = cartTotal + shippingCost + tax;

  /**
   * Carga los items del carrito al montar el componente
   */
  useEffect(() => {
    loadCartItems();
  }, []);

  /**
   * Carga items del carrito con información de productos
   */
  const loadCartItems = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart(customerId);

      if (!cartData.items || cartData.items.length === 0) {
        router.push('/cart');
        return;
      }

      // Los items ya vienen con toda la información necesaria desde el backend
      const processedItems = cartData.items.map(item => ({
        ...item,
        // Mapear campos para compatibilidad con calculateCartTotal
        price: item.unit_price,
        title: item.product_name,
        image: item.product_image,
        productId: item.product_id,
      }));

      setCartItems(processedItems);
    } catch (err) {
      console.error('Error al cargar carrito:', err);
      setError('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cambio en los campos del formulario de envío
   */
  const handleShippingChange = (field, value) => {
    setShippingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Maneja el cambio en los campos del formulario de pago
   */
  const handlePaymentChange = (field, value) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Valida el formulario de envío
   */
  const validateShippingForm = () => {
    const required = [
      'firstName',
      'lastName',
      'email',
      'street',
      'city',
      'zipCode',
    ];
    return required.every((field) => shippingForm[field].trim() !== '');
  };

  /**
   * Valida el formulario de pago
   */
  const validatePaymentForm = () => {
    if (paymentForm.method === 'credit_card') {
      return ['cardNumber', 'expiryDate', 'cvv', 'cardName'].every(
        (field) => paymentForm[field].trim() !== ''
      );
    }
    return true;
  };

  /**
   * Avanza al siguiente paso
   */
  const handleNext = () => {
    if (activeStep === 0 && !validateShippingForm()) {
      showSnackbar('Por favor completa todos los campos obligatorios');
      return;
    }

    if (activeStep === 1 && !validatePaymentForm()) {
      showSnackbar('Por favor completa la información de pago');
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  /**
   * Retrocede al paso anterior
   */
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  /**
   * Formatea el número de teléfono para incluir código de país si es necesario
   */
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Si el teléfono tiene menos de 10 caracteres y no incluye +504, agregarlo
    const cleanPhone = phone.replace(/\D/g, ''); // Remover caracteres no numéricos
    
    if (cleanPhone.length === 8) {
      // Si tiene 8 dígitos, agregar código de país de Honduras
      return `+504 ${cleanPhone}`;
    } else if (cleanPhone.length >= 10) {
      // Si ya tiene 10 o más dígitos, mantenerlo como está
      return phone;
    }
    
    // Si es muy corto, agregar código de país y rellenar
    return `+504 ${cleanPhone}`;
  };

  /**
   * Procesa la orden final
   * Combina validación funcional con servicios POO
   */
  const handlePlaceOrder = async () => {
    try {
      setProcessing(true);

      // Preparar datos de la orden
      const orderData = {
        customer_id: customerId,
        shippingAddress: {
          street: shippingForm.street,
          city: shippingForm.city,
          state: shippingForm.state,
          zipCode: shippingForm.zipCode,
          country: shippingForm.country,
        },
        paymentMethod: {
          type: paymentForm.method,
          provider: '',
          last4: '',
        },
        customerInfo: {
          name: `${shippingForm.firstName} ${shippingForm.lastName}`,
          email: shippingForm.email,
          phone: formatPhoneNumber(shippingForm.phone),
        },
      };

      // Validación funcional
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
      }

      // Crear orden usando servicio POO
      const newOrder = await ordersService.createOrder(orderData);

      // Limpiar carrito después de crear la orden
      await cartService.clearCart(customerId);

      setOrderCreated(newOrder);
      showSnackbar('¡Orden creada exitosamente!');
    } catch (err) {
      console.error('Error al crear orden:', err);
      setError(err.message || 'Error al procesar la orden');
    } finally {
      setProcessing(false);
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
   * Componente del formulario de envío
   */
  const ShippingForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Información de envío
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nombre"
            value={shippingForm.firstName}
            onChange={(e) => handleShippingChange('firstName', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Apellido"
            value={shippingForm.lastName}
            onChange={(e) => handleShippingChange('lastName', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={shippingForm.email}
            onChange={(e) => handleShippingChange('email', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Teléfono"
            value={shippingForm.phone}
            onChange={(e) => handleShippingChange('phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dirección"
            value={shippingForm.street}
            onChange={(e) => handleShippingChange('street', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Ciudad"
            value={shippingForm.city}
            onChange={(e) => handleShippingChange('city', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Estado/Departamento"
            value={shippingForm.state}
            onChange={(e) => handleShippingChange('state', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Código postal"
            value={shippingForm.zipCode}
            onChange={(e) => handleShippingChange('zipCode', e.target.value)}
            required
          />
        </Grid>
      </Grid>
    </Box>
  );

  /**
   * Componente del formulario de pago
   */
  const PaymentForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Método de pago
      </Typography>
      <FormControl component="fieldset">
        <FormLabel component="legend">Selecciona un método</FormLabel>
        <RadioGroup
          value={paymentForm.method}
          onChange={(e) => handlePaymentChange('method', e.target.value)}
        >
          <FormControlLabel
            value="credit_card"
            control={<Radio />}
            label="Tarjeta de crédito/débito"
          />
          <FormControlLabel value="paypal" control={<Radio />} label="PayPal" />
          <FormControlLabel
            value="bank_transfer"
            control={<Radio />}
            label="Transferencia bancaria"
          />
        </RadioGroup>
      </FormControl>

      {paymentForm.method === 'credit_card' && (
        <Box mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre en la tarjeta"
                value={paymentForm.cardName}
                onChange={(e) =>
                  handlePaymentChange('cardName', e.target.value)
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de tarjeta"
                value={paymentForm.cardNumber}
                onChange={(e) =>
                  handlePaymentChange('cardNumber', e.target.value)
                }
                placeholder="1234 5678 9012 3456"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de vencimiento"
                value={paymentForm.expiryDate}
                onChange={(e) =>
                  handlePaymentChange('expiryDate', e.target.value)
                }
                placeholder="MM/YY"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CVV"
                value={paymentForm.cvv}
                onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                placeholder="123"
                required
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );

  /**
   * Componente de confirmación de pedido
   */
  const OrderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirmar pedido
      </Typography>

      {/* Resumen de envío */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Información de envío
          </Typography>
          <Typography variant="body2">
            {shippingForm.firstName} {shippingForm.lastName}
            <br />
            {shippingForm.street}
            <br />
            {shippingForm.city}, {shippingForm.state} {shippingForm.zipCode}
            <br />
            {shippingForm.country}
          </Typography>
        </CardContent>
      </Card>

      {/* Método de pago */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Método de pago
          </Typography>
          <Typography variant="body2">
            {paymentForm.method === 'credit_card' && 'Tarjeta de crédito'}
            {paymentForm.method === 'paypal' && 'PayPal'}
            {paymentForm.method === 'bank_transfer' && 'Transferencia bancaria'}
          </Typography>
        </CardContent>
      </Card>

      {/* Productos */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Productos ({cartItems.length})
          </Typography>
          <List>
            {cartItems.map((item) => (
              <ListItem key={item.id}>
                <Avatar src={item.image} sx={{ mr: 2 }} />
                <ListItemText
                  primary={item.title}
                  secondary={`Cantidad: ${item.quantity}`}
                />
                <Typography variant="body2">
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
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

  if (orderCreated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box textAlign="center">
          <CheckCircleIcon
            sx={{ fontSize: 100, color: 'success.main', mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            ¡Pedido confirmado!
          </Typography>
          <Typography variant="body1" paragraph>
            Tu pedido #{orderCreated.id} ha sido procesado exitosamente.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Recibirás un email de confirmación en {shippingForm.email}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/profile')}
            sx={{ mr: 2 }}
          >
            Ver mis pedidos
          </Button>
          <Button variant="outlined" onClick={() => router.push('/')}>
            Volver al inicio
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/cart')}
          sx={{ mb: 2 }}
        >
          Volver al carrito
        </Button>

        <Typography variant="h3" component="h1" gutterBottom>
          <CreditCardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Checkout
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Formulario principal */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Contenido del paso */}
              {activeStep === 0 && <ShippingForm />}
              {activeStep === 1 && <PaymentForm />}
              {activeStep === 2 && <OrderConfirmation />}

              {/* Botones de navegación */}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}
              >
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Anterior
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handlePlaceOrder}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Procesando...
                      </>
                    ) : (
                      'Realizar pedido'
                    )}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Siguiente
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen del pedido */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 100 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen del pedido
              </Typography>

              <List>
                <ListItem>
                  <ListItemText primary="Subtotal" />
                  <Typography>${cartTotal.toFixed(2)}</Typography>
                </ListItem>

                <ListItem>
                  <ListItemText primary="Impuestos (15%)" />
                  <Typography>${tax.toFixed(2)}</Typography>
                </ListItem>

                <ListItem>
                  <ListItemText primary="Envío" />
                  <Typography>Gratis</Typography>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary={<Typography variant="h6">Total</Typography>}
                  />
                  <Typography variant="h6" color="primary">
                    ${finalTotal.toFixed(2)}
                  </Typography>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default CheckoutPage;
