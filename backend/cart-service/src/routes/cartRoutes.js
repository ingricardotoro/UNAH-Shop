const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

// Obtener carrito
router.get('/', cartController.getCart);

// Obtener estadísticas del carrito
router.get('/stats', cartController.getCartStats);

// Agregar item al carrito
router.post('/items', cartController.addItem);

// Actualizar cantidad de item
router.put('/items/:id', cartController.updateItem);

// Eliminar item del carrito
router.delete('/items/:id', cartController.removeItem);

// Limpiar carrito completo
router.delete('/', cartController.clearCart);

// Transferir carrito de sesión a usuario
router.post('/transfer', cartController.transferCart);

module.exports = router;