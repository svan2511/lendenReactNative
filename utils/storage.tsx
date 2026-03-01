import { addProductApi, getAllCustomers, getAllProducts, getSingleProduct, updateProductApi } from '@/services/protected';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTS_KEY = 'products';
const CUSTOMERS_KEY = 'customers';

/* ---------------- CUSTOMERS ---------------- */
export const getCustomers = async () => {
  
    // Fetch all customers from API
    const data = await getAllCustomers();
     if (!data?.success) {
      throw new Error(data?.message || 'Failed to load customers from server');
    }
    const customers = data.customers || [];

    //console.log(customers);

    // Optionally, store locally for offline UI use
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));

    return customers;

};

export const addCustomer = async (newCustomer: any) => {
  // Currently only local addition, you can replace with API call if needed
  const customers = await getCustomers();
  const updated = [...customers, { id: Date.now(), ...newCustomer }];
  await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  return updated;
};

/* ---------------- PRODUCTS ---------------- */
// export const getProducts = async () => {
//   try {
//     // Fetch all products from API
//     const data = await getAllProducts();
//     if (!data?.success) {
//       throw new Error(data?.message || 'Failed to load products from server');
//     }
//     const products = (data.products || []).map(p => ({
//       id: p.id,
//       name: p.name,
//       price: p.price,
//       type: p.type,
//       unitType: p.unit_type || 'fixed', // normalize backend field
//     }));

//     // Save locally for UI calculations
//     await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
//     return products;
//   } catch (error) {
//     //console.error('Error fetching products:', error);
//     // Fallback to AsyncStorage
//     const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
//     return stored ? JSON.parse(stored) : [];
//   }
// };

export const getProducts = async () => {
 
    // Fetch all products from API
    const data = await getAllProducts();
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to load products from server');
    }
    const products = (data.products || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      type: p.type,
      quantity:p.quantity,
      unitType: p.unit_type || 'fixed', // normalize backend field
    }));
    // Save locally for UI calculations
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return products;
};

export const addProduct = async (newProduct: {
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  unitType?: 'weight' | 'fixed';
}) => {
  // Convert frontend → backend format
  const payload = {
    name: newProduct.name,
    price: newProduct.price,
    quantity: newProduct.quantity ?? 0,
    type: newProduct.type,
    unit_type:
      newProduct.unitType ||
      (newProduct.type === 'service' ? 'fixed' : 'weight'),
  };

  // Call backend API
  const response = await addProductApi(payload);
  console.log(response);

  if (!response?.product?.id) {
    throw new Error('Invalid add product response');
  }

  // Normalize backend → frontend
  const normalizedProduct = {
    id: response.product.id,
    name: response.product.name,
    price: response.product.price,
    type: response.product.type,
    unitType: response.product.unit_type || 'fixed',
  };

  // Save into AsyncStorage for UI
  const existing = await getProducts();
  const updated = [...existing, normalizedProduct];
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));

  return normalizedProduct.id;
};


export const getProductById = async (id: number) => {
  const data = await getSingleProduct(id);
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to load product from server');
    }
  return data?.product ?? null ;
};

export const updateProduct = async (updated: any) => {
  const data = await updateProductApi(updated , updated.id);
  if (!data?.success) {
      throw new Error(data?.message || 'Failed to update product');
    }
  // const index = products.findIndex(p => p.id === updated.id);
  // if (index === -1) throw new Error('Product not found');
  
  // products[index] = { ...products[index], ...updated, unit_type: updated.unit_type };
  // await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};