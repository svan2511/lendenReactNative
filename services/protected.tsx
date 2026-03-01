import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

/* -------------------------------------------
   Helper: automatically attach auth token
-------------------------------------------- */
const authRequest = async (
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  }
) => {
  const token = await AsyncStorage.getItem('authToken');

  if (!token) {
    throw new Error('Auth token not found');
  }

  return apiRequest(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': "application/json"
    },
  });
};

/* -------------------------------------------
   ONBOARDING (Protected)
-------------------------------------------- */
export const submitOnboarding = (payload: {
  business_type: string;
  has_stock: boolean;
  has_appointments: boolean;
  has_staff: boolean;
}) => {
  return authRequest('/onboarding', {
    method: 'POST',
    body: payload,
  });
};

/* -------------------------------------------
   DASHBOARD (Protected)
-------------------------------------------- */

export const getDashboardData = () => {
  return authRequest('/dashboard-data', {
    method: 'GET',
  });
};


/* -------------------------------------------
   ADD CUSTOMER (Protected)
-------------------------------------------- */
export const addCustomerApi = (payload: {
  name: string;
  phone: string;
  address?: string;
}) => {
  return authRequest('/create-customer', {
    method: 'POST',
    body: payload,
  });
};

/* -------------------------------------------
   GET ALL CUSTOMER (Protected)
-------------------------------------------- */


export const getAllCustomers = () => {
  return authRequest('/customers', {
    method: 'GET',
  });
};


/* -------------------------------------------
   GET SINGLE CUSTOMER (Protected)
-------------------------------------------- */


export const getSingleCustomer = (id:any) => {
  return authRequest(`/customers/${id}`, {
    method: 'GET',
  });
};

/* -------------------------------------------
   GET AUTH USER DETAILS
-------------------------------------------- */

export const getAuthUser = () => {
  return authRequest('/user', {
    method: 'GET',
  });
};

/* -------------------------------------------
   GET ONBOARDING DATA
-------------------------------------------- */

export const getOnboarding = () => {
  return authRequest('/onboarding', {
    method: 'GET',
  });
};

/* -------------------------------------------
   PRODUCTS (Protected) ✅ NEW
-------------------------------------------- */
export const addProductApi = (payload: {
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  unit_type: 'weight' | 'fixed';
}) => {
  return authRequest('/create-product', {
    method: 'POST',
    body: payload,
  });
};


/* -------------------------------------------
   GET ALL PRODUCTS (Protected)
-------------------------------------------- */

export const getAllProducts = () => {
  return authRequest('/products', {
    method: 'GET',
  });
};


/* -------------------------------------------
   GET SINGLE PRODUCT (Protected)
-------------------------------------------- */

export const getSingleProduct = (id:any) => {
  return authRequest(`/products/${id}`, {
    method: 'GET',
  });
};


/* -------------------------------------------
   DELETE A PRODUCT (Protected)
-------------------------------------------- */

export const deleteSingleProduct = (id:number) => {
  return authRequest(`/products/${id}`, {
    method: 'DELETE',
  });
};

/* -------------------------------------------
   UPDATE PRODUCT (Protected) ✅ NEW
-------------------------------------------- */
export const updateProductApi = (payload: {
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  unit_type: 'weight' | 'fixed';
} , id:any) => {
  return authRequest(`/products/${id}`, {
    method: 'PUT',
    body: payload,
  });
};



/* -------------------------------------------
   BILLS / INVOICE (Protected) — NEW
-------------------------------------------- */
export const createBillApi = async (payload: {
  customerId: number;
  totalAmount: number;
  status: 'FULL' | 'PARTIAL';
  paidAmount: number;
  remainingAmount: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    total: number;
    unit_type?: 'weight' | 'fixed' | null;
  }>;
}) => {
  return authRequest('/bills', {
    method: 'POST',
    body: payload,
  });
};

/* -------------------------------------------
   USER LOGOUT (Protected) — NEW
-------------------------------------------- */

export const logoutApi = async () => {
  return authRequest('/logout', {  // change endpoint if different
    method: 'POST',
  });
};


/* -------------------------------------------
   GET PROFILE (Protected)
-------------------------------------------- */

export const getProfileApi = () => {
  return authRequest('/profile', {
    method: 'GET',
  });
};

/* -------------------------------------------
   ADD PROFILE (Protected)
-------------------------------------------- */

export const addProfileApi = (payload: {
  shopName: string;
  shopAddress: string;
}) => {
  return authRequest('/profile', {
    method: 'POST',
    body: payload,
  });
};

/* -------------------------------------------
   UPDATE PROFILE (Protected)
-------------------------------------------- */
export const updateProfileApi = (payload: {
  shopName: string;
  shopAddress: string;
}) => {
  return authRequest('/profile', {
    method: 'PUT',
    body: payload,
  });
};

/* -------------------------------------------
   MARK BILL AS FULLY PAID (Protected) ✅ NEW
-------------------------------------------- */
export const markBillAsPaidApi = (billId: number) => {
  return authRequest(`/bills/${billId}`, {
    method: 'PUT',
  });
};


/* -------------------------------------------
   GET ALL EXPENSES (Protected) ✅ NEW
-------------------------------------------- */
export const getALLExpenses = () => {
  return authRequest(`/expenses`, {
    method: 'GET',
  });
};


/* -------------------------------------------
   GET MONTHLY Summary (Protected) ✅ NEW
-------------------------------------------- */
export const getMonthlySummary = () => {
  return authRequest(`/expenses/summary/monthly`, {
    method: 'GET',
  });
};


/**
 * Create a new expense
 * Used in AddExpenseScreen
 */
export const createExpenseApi = (payload: {
  title: string;
  amount: number;
  expense_date: string;       // YYYY-MM-DD
  category: string;
  payment_mode?: string;
  description?: string;
}) => {
  return authRequest('/expenses', {
    method: 'POST',
    body: payload,
  });
};


/* -------------------------------------------
   GET SINGLE EXPENSE (Protected) — NEW
-------------------------------------------- */
export const getSingleExpense = (id: string | number) => {
  return authRequest(`/expenses/${id}`, {
    method: 'GET',
  });
};


/* -------------------------------------------
   REPORTS — Monthly Profit & Loss (Protected)   ← NEW
-------------------------------------------- */

export const getMonthlyProfitLoss = (month?: number, year?: number) => {
  let url = '/reports/monthly-pl';

  if (month !== undefined || year !== undefined) {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (year !== undefined) params.append('year', String(year));
    url += `?${params.toString()}`;
  }

  return authRequest(url, {
    method: 'GET',
  });
};