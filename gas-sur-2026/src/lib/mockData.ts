import type { Order, Cylinder, User } from '@/types'

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'GDS-8291',
    clientName: 'Ana Pérez',
    clientPhone: '+56 9 8765 4321',
    address: 'Av. Alemania 01245, Temuco',
    lat: -38.7359,
    lng: -72.5904,
    product: 'Cilindro 15kg',
    quantity: 1,
    total: 24200,
    status: 'En Ruta',
    driverName: 'Luis González',
    driverPlate: 'AB-12-CD',
    createdAt: '2026-05-15T09:00:00',
    securityToken: '4920',
    paymentMethod: 'cash',
  },
  {
    id: '2',
    orderNumber: 'GDS-8292',
    clientName: 'Marta Pérez',
    clientPhone: '+56 9 1234 5678',
    address: 'Labranza, Temuco',
    lat: -38.772,
    lng: -72.643,
    product: 'Cilindro 30kg',
    quantity: 1,
    total: 42000,
    status: 'En Punto de Entrega',
    driverName: 'Luis González',
    driverPlate: 'AB-12-CD',
    createdAt: '2026-05-15T09:30:00',
    securityToken: '7823',
    paymentMethod: 'cash',
  },
  {
    id: '3',
    orderNumber: 'GDS-8290',
    clientName: 'Ricardo Tapia',
    clientPhone: '+56 9 9876 5432',
    address: 'Calle Los Alerces 1240, Temuco',
    lat: -38.751,
    lng: -72.601,
    product: 'Cilindro 45kg x 2',
    quantity: 2,
    total: 72500,
    status: 'Entregado',
    driverName: 'Roberto Lagos',
    driverPlate: 'CD-34-EF',
    createdAt: '2026-05-14T14:00:00',
    paymentMethod: 'card',
  },
  {
    id: '4',
    orderNumber: 'GDS-7742',
    clientName: 'Carlos Fuentes',
    clientPhone: '+56 9 1111 2222',
    address: 'Padre Las Casas, Temuco',
    lat: -38.8012,
    lng: -72.5876,
    product: 'Cilindro 15kg x 1',
    quantity: 1,
    total: 24900,
    status: 'Finalizado',
    driverName: 'Roberto Lagos',
    driverPlate: 'CD-34-EF',
    createdAt: '2026-05-13T10:00:00',
    paymentMethod: 'cash',
  },
  {
    id: '5',
    orderNumber: 'GDS-6910',
    clientName: 'Julia Morales',
    clientPhone: '+56 9 3333 4444',
    address: 'Villarrica, Araucanía',
    lat: -39.2826,
    lng: -72.2249,
    product: 'Cilindro 15kg x 3',
    quantity: 3,
    total: 68700,
    status: 'Cancelado',
    createdAt: '2026-05-10T08:00:00',
    paymentMethod: 'remote',
  },
]

export const MOCK_CYLINDERS: Cylinder[] = [
  {
    id: '1',
    serialNumber: 'CYL-99231',
    type: '15kg',
    status: 'full',
    driverName: 'Roberto Lagos',
    captureUrl: '',
    needsManualValidation: false,
  },
  {
    id: '2',
    serialNumber: 'E8-ERROR',
    type: '45kg',
    status: 'illegible',
    driverName: 'Marco Antonio Solis',
    captureUrl: '',
    needsManualValidation: true,
  },
  {
    id: '3',
    serialNumber: 'CYL-88122',
    type: '15kg',
    status: 'full',
    driverName: 'Roberto Lagos',
    captureUrl: '',
    needsManualValidation: false,
  },
  {
    id: '4',
    serialNumber: 'CYL-77031',
    type: '45kg',
    status: 'empty',
    driverName: 'Luis González',
    captureUrl: '',
    needsManualValidation: false,
  },
  {
    id: '5',
    serialNumber: 'E8-ERROR',
    type: '15kg',
    status: 'illegible',
    driverName: 'Luis González',
    captureUrl: '',
    needsManualValidation: true,
  },
]

export const MOCK_ADMIN_USER: User = {
  id: 'admin-1',
  name: 'Administración',
  rut: '76.543.210-K',
  email: 'admin@gasdelsur.cl',
  phone: '+56 9 9000 0001',
  role: 'admin',
  password: 'admin123',  // ← nuevo
}

export const MOCK_DRIVER_USER: User = {
  id: 'driver-1',
  name: 'Luis González',
  rut: '12.345.678-9',
  email: 'lgonzalez@gasdelsur.cl',
  phone: '+56 9 8765 0001',
  role: 'driver',
  password: 'driver123',  // ← nuevo
}

export const MOCK_CLIENT_USER: User = {
  id: 'client-1',
  name: 'Ana Pérez',
  rut: '15.234.567-8',
  email: 'ana.perez@gmail.com',
  phone: '+56 9 8765 4321',
  role: 'client',
  password: 'ana123',  // ← nuevo
}

export const MOCK_CLIENT_USER_2: User = {
  id: 'client-2',
  name: 'Marta Pérez',
  rut: '16.111.222-3',
  email: 'marta.perez@gmail.com',
  phone: '+56 9 1234 5678',
  role: 'client',
  password: 'marta123',
}

export const MOCK_CLIENT_USER_3: User = {
  id: 'client-3',
  name: 'Carlos Fuentes',
  rut: '17.333.444-5',
  email: 'carlos.fuentes@gmail.com',
  phone: '+56 9 1111 2222',
  role: 'client',
  password: 'carlos123',
}

export const PRODUCTS = [
  { kg: 5, price: 12500 },
  { kg: 11, price: 18900 },
  { kg: 15, price: 24200 },
  { kg: 45, price: 72000 },
]
