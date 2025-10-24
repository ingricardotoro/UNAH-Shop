const express = require('express');
const ordersController = require('../controllers/ordersController');

const router = express.Router();

// Buscar órdenes (debe ir antes de /:id para evitar conflictos)
router.get('/search', ordersController.searchOrders);

// Obtener estadísticas
router.get('/stats', ordersController.getOrderStats);

// Crear nueva orden
router.post('/', ordersController.createOrder);

// Obtener órdenes del usuario
router.get('/', ordersController.getOrders);

// Obtener orden específica
router.get('/:id', ordersController.getOrder);

// Actualizar estado de orden
router.put('/:id/status', ordersController.updateOrderStatus);

module.exports = router;