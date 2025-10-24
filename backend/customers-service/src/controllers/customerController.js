/**
 * Customer Controller - Handle HTTP requests and responses
 * Validates input, calls services, and formats responses
 */

const customerService = require('../services/customerService');
const { asyncHandler } = require('../middleware/errorHandler');
const { logEvent } = require('../middleware/logger');

// Import validation schemas from database folder
const {
  validateCustomerCreate,
  validateCustomerUpdate,
  validatePagination,
  validateUuidParam
} = require('../../../../database/schemas');

class CustomerController {

  /**
   * GET /api/customers
   * Get paginated list of customers with optional search
   */
  getCustomers = asyncHandler(async (req, res) => {
    // Validate query parameters
    const { error: validationError, value: validatedQuery } = validatePagination(req.query);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parámetros de consulta inválidos',
          details: validationError.details
        },
        timestamp: new Date().toISOString()
      });
    }

    // Add search parameter
    const options = {
      ...validatedQuery,
      search: req.query.search || ''
    };

    const result = await customerService.getCustomers(options);

    logEvent('customers_listed', {
      count: result.customers.length,
      page: options.page,
      search: options.search
    });

    res.status(200).json({
      success: true,
      data: result.customers,
      pagination: result.pagination,
      message: 'Clientes obtenidos exitosamente'
    });
  });

  /**
   * GET /api/customers/:id
   * Get customer by ID
   */
  getCustomerById = asyncHandler(async (req, res) => {
    // Validate UUID parameter
    const { error: validationError, value: validatedParams } = validateUuidParam(req.params);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID de cliente inválido',
          details: validationError.details
        },
        timestamp: new Date().toISOString()
      });
    }

    const customer = await customerService.getCustomerById(validatedParams.id);

    logEvent('customer_retrieved', {
      customerId: customer.id,
      email: customer.email
    });

    res.status(200).json({
      success: true,
      data: customer,
      message: 'Cliente obtenido exitosamente'
    });
  });

  /**
   * POST /api/customers
   * Create new customer
   */
  createCustomer = asyncHandler(async (req, res) => {
    // Validate request body
    const { error: validationError, value: validatedData } = validateCustomerCreate(req.body);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de cliente inválidos',
          details: validationError.details
        },
        timestamp: new Date().toISOString()
      });
    }

    const customer = await customerService.createCustomer(validatedData);

    logEvent('customer_created', {
      customerId: customer.id,
      email: customer.email
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Cliente creado exitosamente'
    });
  });

  /**
   * PUT /api/customers/:id
   * Update customer by ID
   */
  updateCustomer = asyncHandler(async (req, res) => {
    // Validate UUID parameter
    const { error: paramError, value: validatedParams } = validateUuidParam(req.params);
    
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID de cliente inválido',
          details: paramError.details
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate request body
    const { error: bodyError, value: validatedData } = validateCustomerUpdate(req.body);
    
    if (bodyError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de actualización inválidos',
          details: bodyError.details
        },
        timestamp: new Date().toISOString()
      });
    }

    const customer = await customerService.updateCustomer(validatedParams.id, validatedData);

    logEvent('customer_updated', {
      customerId: customer.id,
      updatedFields: Object.keys(validatedData)
    });

    res.status(200).json({
      success: true,
      data: customer,
      message: 'Cliente actualizado exitosamente'
    });
  });

  /**
   * DELETE /api/customers/:id
   * Delete customer by ID
   */
  deleteCustomer = asyncHandler(async (req, res) => {
    // Validate UUID parameter
    const { error: validationError, value: validatedParams } = validateUuidParam(req.params);
    
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID de cliente inválido',
          details: validationError.details
        },
        timestamp: new Date().toISOString()
      });
    }

    await customerService.deleteCustomer(validatedParams.id);

    logEvent('customer_deleted', {
      customerId: validatedParams.id
    });

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  });

  /**
   * GET /api/customers/stats
   * Get customer statistics
   */
  getCustomerStats = asyncHandler(async (req, res) => {
    const stats = await customerService.getCustomerStats();

    logEvent('customer_stats_retrieved', stats);

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Estadísticas obtenidas exitosamente'
    });
  });

  /**
   * GET /api/customers/search
   * Advanced search endpoint (for future enhancements)
   */
  searchCustomers = asyncHandler(async (req, res) => {
    const { search = '', limit = 10 } = req.query;

    if (!search || search.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La búsqueda debe tener al menos 2 caracteres'
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await customerService.getCustomers({
      search,
      limit: Math.min(limit, 50), // Max 50 results for search
      page: 1
    });

    logEvent('customers_searched', {
      search,
      resultsCount: result.customers.length
    });

    res.status(200).json({
      success: true,
      data: result.customers,
      message: `${result.customers.length} clientes encontrados`
    });
  });
}

module.exports = new CustomerController();