/**
 * Esquemas de validación JSON para UNAH-Shop
 * Usados con Joi en los microservicios para validar datos
 */

const Joi = require('joi');

// ================================
// CUSTOMERS SCHEMAS
// ================================

const customerCreateSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'hn', 'edu', 'org', 'net'] } })
    .required()
    .messages({
      'string.email': 'El email debe tener un formato válido',
      'any.required': 'El email es requerido'
    }),
  
  first_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'string.pattern.base': 'El nombre solo puede contener letras y espacios',
      'any.required': 'El nombre es requerido'
    }),
  
  last_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .required()
    .messages({
      'string.min': 'El apellido debe tener al menos 2 caracteres',
      'string.max': 'El apellido no puede exceder 100 caracteres',
      'string.pattern.base': 'El apellido solo puede contener letras y espacios',
      'any.required': 'El apellido es requerido'
    }),
  
  phone: Joi.string()
    .pattern(/^\+504\s?\d{4}-?\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El teléfono debe tener formato hondureño: +504 9999-9999'
    })
});

const customerUpdateSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'hn', 'edu', 'org', 'net'] } })
    .optional(),
  
  first_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .optional(),
  
  last_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .optional(),
  
  phone: Joi.string()
    .pattern(/^\+504\s?\d{4}-?\d{4}$/)
    .optional()
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

// ================================
// CART SCHEMAS
// ================================

const cartItemCreateSchema = Joi.object({
  customer_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El customer_id debe ser un UUID válido',
      'any.required': 'El customer_id es requerido'
    }),
  
  product_id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.integer': 'El product_id debe ser un número entero',
      'number.min': 'El product_id debe ser mayor a 0',
      'any.required': 'El product_id es requerido'
    }),
  
  product_name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'El nombre del producto es requerido',
      'string.max': 'El nombre del producto no puede exceder 255 caracteres',
      'any.required': 'El nombre del producto es requerido'
    }),
  
  product_image: Joi.string()
    .uri()
    .max(500)
    .optional()
    .messages({
      'string.uri': 'La imagen del producto debe ser una URL válida',
      'string.max': 'La URL de la imagen no puede exceder 500 caracteres'
    }),
  
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .default(1)
    .messages({
      'number.integer': 'La cantidad debe ser un número entero',
      'number.min': 'La cantidad debe ser al menos 1',
      'number.max': 'La cantidad no puede exceder 99'
    }),
  
  unit_price: Joi.number()
    .precision(2)
    .min(0.01)
    .max(999999.99)
    .required()
    .messages({
      'number.min': 'El precio debe ser mayor a 0',
      'number.max': 'El precio no puede exceder $999,999.99',
      'any.required': 'El precio unitario es requerido'
    })
});

const cartItemUpdateSchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .required()
    .messages({
      'number.integer': 'La cantidad debe ser un número entero',
      'number.min': 'La cantidad debe ser al menos 1',
      'number.max': 'La cantidad no puede exceder 99',
      'any.required': 'La cantidad es requerida'
    })
});

// ================================
// ORDERS SCHEMAS
// ================================

const addressSchema = Joi.object({
  street: Joi.string().min(5).max(200).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  postal_code: Joi.string().min(5).max(20).required(),
  country: Joi.string().valid('Honduras', 'HN').default('Honduras')
});

const paymentInfoSchema = Joi.object({
  method: Joi.string()
    .valid('credit_card', 'debit_card', 'paypal', 'cash_on_delivery')
    .required(),
  
  card_last_four: Joi.when('method', {
    is: Joi.string().valid('credit_card', 'debit_card'),
    then: Joi.string().pattern(/^\d{4}$/).required(),
    otherwise: Joi.string().optional()
  }),
  
  card_brand: Joi.when('method', {
    is: Joi.string().valid('credit_card', 'debit_card'),
    then: Joi.string().valid('visa', 'mastercard', 'amex').required(),
    otherwise: Joi.string().optional()
  })
});

const orderCreateSchema = Joi.object({
  customer_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El customer_id debe ser un UUID válido',
      'any.required': 'El customer_id es requerido'
    }),
  
  customer_info: Joi.object({
    email: Joi.string().email().required(),
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().optional()
  }).required(),
  
  shipping_address: addressSchema.required(),
  
  billing_address: addressSchema.optional(),
  
  payment_info: paymentInfoSchema.required(),
  
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Las notas no pueden exceder 1000 caracteres'
    })
});

const orderUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only': 'El estado debe ser uno de: pending, processing, shipped, delivered, cancelled',
      'any.required': 'El estado es requerido'
    }),
  
  notes: Joi.string()
    .max(1000)
    .optional()
});

// ================================
// PAGINATION & QUERY SCHEMAS
// ================================

const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'La página debe ser un número entero',
      'number.min': 'La página debe ser mayor a 0'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'El límite debe ser un número entero',
      'number.min': 'El límite debe ser mayor a 0',
      'number.max': 'El límite no puede exceder 100'
    }),
  
  sort_by: Joi.string()
    .valid('created_at', 'updated_at', 'name', 'email', 'price', 'quantity')
    .default('created_at')
    .optional(),
  
  sort_order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

const searchSchema = Joi.object({
  q: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'La búsqueda debe tener al menos 1 caracter',
      'string.max': 'La búsqueda no puede exceder 100 caracteres'
    }),
  
  category: Joi.string()
    .max(100)
    .optional(),
  
  min_price: Joi.number()
    .min(0)
    .optional(),
  
  max_price: Joi.number()
    .min(0)
    .optional()
}).and('min_price', 'max_price');

// ================================
// UUID PARAM SCHEMA
// ================================

const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID debe ser un UUID válido',
      'any.required': 'El ID es requerido'
    })
});

// ================================
// RESPONSE SCHEMAS (para documentación)
// ================================

const successResponseSchema = {
  success: true,
  data: {},
  message: 'string',
  pagination: {
    page: 'number',
    limit: 'number',
    total: 'number',
    total_pages: 'number'
  }
};

const errorResponseSchema = {
  success: false,
  error: {
    code: 'string',
    message: 'string',
    details: 'object'
  },
  timestamp: 'string'
};

// ================================
// EXPORT SCHEMAS
// ================================

module.exports = {
  // Customer schemas
  customerCreateSchema,
  customerUpdateSchema,
  
  // Cart schemas
  cartItemCreateSchema,
  cartItemUpdateSchema,
  
  // Order schemas
  orderCreateSchema,
  orderUpdateSchema,
  addressSchema,
  paymentInfoSchema,
  
  // Utility schemas
  paginationSchema,
  searchSchema,
  uuidParamSchema,
  
  // Response schemas (for documentation)
  successResponseSchema,
  errorResponseSchema,
  
  // Validation helper functions
  validateCustomerCreate: (data) => customerCreateSchema.validate(data),
  validateCustomerUpdate: (data) => customerUpdateSchema.validate(data),
  validateCartItemCreate: (data) => cartItemCreateSchema.validate(data),
  validateCartItemUpdate: (data) => cartItemUpdateSchema.validate(data),
  validateOrderCreate: (data) => orderCreateSchema.validate(data),
  validateOrderUpdate: (data) => orderUpdateSchema.validate(data),
  validatePagination: (data) => paginationSchema.validate(data),
  validateSearch: (data) => searchSchema.validate(data),
  validateUuidParam: (data) => uuidParamSchema.validate(data)
};