import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import customersService from '../services/customersService';

/**
 * Página de gestión de customers
 */
const CustomersPage = () => {
  // Estados para la tabla
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Estados para paginación y filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');

  // Estados para dialogs
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Estado para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    activeUsers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  /**
   * Carga los customers desde el API
   */
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customersService.getCustomers({
        page: page + 1, // API usa 1-based indexing
        limit: rowsPerPage,
        search,
      });

      // Manejar diferentes formatos de respuesta
      const customersData = response.data || response.customers || response;
      const total = response.total || response.pagination?.total || customersData.length;

      console.log('Datos recibidos en componente:', {
        customersData,
        total,
        rowsPerPage,
        page,
      });

      setCustomers(Array.isArray(customersData) ? customersData : []);
      setTotalCount(total);
    } catch (err) {
      console.error('Error al cargar customers:', err);
      setError('Error al cargar los customers');
      setCustomers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  /**
   * Carga las estadísticas
   */
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await customersService.getCustomersStats();
      console.log('Estadísticas calculadas:', statsData);
      
      // Asegurar que los valores sean números válidos
      setStats({
        total: Number(statsData.total) || 0,
        newThisMonth: Number(statsData.newThisMonth) || 0,
        activeUsers: Number(statsData.activeUsers) || 0,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      // Mantener valores por defecto en caso de error
      setStats({
        total: 0,
        newThisMonth: 0,
        activeUsers: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  /**
   * Efecto para cargar datos cuando cambian los parámetros
   */
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  /**
   * Efecto para cargar estadísticas al montar
   */
  useEffect(() => {
    loadStats();
  }, []);

  /**
   * Maneja el cambio de página
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Maneja el cambio de filas por página
   */
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('Cambiando rowsPerPage de', rowsPerPage, 'a', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  /**
   * Maneja la búsqueda
   */
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0); // Reset a la primera página
  };

  /**
   * Abre el diálogo de visualización
   */
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setViewDialogOpen(true);
  };

  /**
   * Maneja la edición de un customer
   */
  const handleEditCustomer = (customer) => {
    // TODO: Implementar edición
    console.log('Editar customer:', customer);
  };

  /**
   * Abre el diálogo de eliminación
   */
  const handleDeleteCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  /**
   * Confirma la eliminación
   */
  const confirmDelete = async () => {
    try {
      await customersService.deleteCustomer(selectedCustomer.id);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      await loadCustomers(); // Recargar la lista
    } catch (err) {
      console.error('Error al eliminar customer:', err);
    }
  };

  /**
   * Formatea la fecha para mostrar
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Componente de skeleton loader para la tabla
   */
  const TableSkeleton = () => (
    <>
      {[...Array(Math.min(rowsPerPage, 5))].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Box display="flex" alignItems="center">
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box>
                <Skeleton variant="text" width={150} height={20} />
                <Skeleton variant="text" width={100} height={16} />
              </Box>
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={200} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={120} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={100} />
          </TableCell>
          <TableCell>
            <Box display="flex" gap={1}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          <PersonIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Gestión de Customers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra y visualiza la información de todos los customers registrados
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  {statsLoading ? (
                    <Skeleton variant="text" width={60} height={48} />
                  ) : (
                    <Typography variant="h4" color="primary">
                      {(stats.total || 0).toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  {statsLoading ? (
                    <Skeleton variant="text" width={60} height={48} />
                  ) : (
                    <Typography variant="h4" color="success.main">
                      {(stats.newThisMonth || 0).toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Nuevos este mes
                  </Typography>
                </Box>
                <CalendarIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  {statsLoading ? (
                    <Skeleton variant="text" width={60} height={48} />
                  ) : (
                    <Typography variant="h4" color="info.main">
                      {(stats.activeUsers || 0).toLocaleString()}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Usuarios activos (últimos 30 días)
                  </Typography>
                </Box>
                <EmailIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <TextField
              placeholder="Buscar customers..."
              value={search}
              onChange={handleSearchChange}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => console.log('Agregar customer')}
            >
              Nuevo Customer
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Fecha de registro</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box>
                      <PersonIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No se encontraron customers
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {search ? 'Intenta con otros términos de búsqueda' : 'Agrega el primer customer'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {customer.first_name?.[0] || customer.name?.[0] || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {customer.first_name && customer.last_name
                              ? `${customer.first_name} ${customer.last_name}`
                              : customer.name || 'Sin nombre'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {customer.id?.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{customer.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {customer.phone || 'No disponible'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(customer.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 20]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Card>

      {/* Dialog de visualización */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Detalles del Customer
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                  {selectedCustomer.first_name?.[0] || 'C'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {selectedCustomer.id}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedCustomer.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Teléfono:</strong> {selectedCustomer.phone || 'No disponible'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Fecha de registro:</strong> {formatDate(selectedCustomer.created_at)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al customer{' '}
            <strong>
              {selectedCustomer?.first_name} {selectedCustomer?.last_name}
            </strong>
            ? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomersPage;