import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const customerId = '550e8400-e29b-41d4-a716-446655440001'; // En una app real vendría del contexto de autenticación

  // Función para cargar el contador del carrito
  const loadCartCount = async () => {
    try {
      setLoading(true);
      const cartResponse = await cartService.getCart(customerId);
      const cartData = cartResponse.data || cartResponse;
      const totalItems = cartData.summary?.totalItems || 0;
      setCartItemsCount(totalItems);
      console.log('Contador del carrito actualizado:', totalItems);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemsCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar el contador (puede ser llamada desde cualquier componente)
  const refreshCartCount = async () => {
    await loadCartCount();
  };

  // Cargar contador al inicio
  useEffect(() => {
    loadCartCount();
  }, []);

  const value = {
    cartItemsCount,
    loading,
    refreshCartCount,
    customerId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};