import type { Product, ProductVariant } from "./types";

const generateHistoricalData = (baseStock: number, days: number) => {
  const data = [];
  let currentStock = baseStock;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    currentStock -= Math.floor(Math.random() * 5); // Simulate sales
    if (i % 7 === 0) {
      currentStock += Math.floor(Math.random() * 20); // Simulate restocking
    }
    data.push({ date: date.toISOString().split('T')[0], stock: Math.max(0, currentStock) });
  }
  return JSON.stringify(data, null, 2);
};

const createDefaultVariant = (product: Omit<Product, 'variants' | 'isVariable' | 'historicalData'> & { price: number }): ProductVariant => ({
  id: `${product.id}-default`,
  name: "Default",
  stock: product.stock || 0,
  lowStockThreshold: product.lowStockThreshold || 10,
  price: product.price,
});

const mockProductsRaw = [
  {
    id: "prod_001",
    name: "Classic T-Shirt",
    stock: 85,
    price: 15.99,
    lowStockThreshold: 20,
    historicalData: generateHistoricalData(100, 30),
  },
  {
    id: "prod_002",
    name: "Denim Jeans",
    stock: 42,
    price: 49.99,
    lowStockThreshold: 15,
    historicalData: generateHistoricalData(50, 30),
  },
  {
    id: "prod_003",
    name: "Leather Jacket",
    stock: 12,
    price: 129.99,
    lowStockThreshold: 10,
    historicalData: generateHistoricalData(20, 30),
  },
  {
    id: "prod_004",
    name: "Running Sneakers",
    stock: 55,
    price: 89.99,
    lowStockThreshold: 25,
    historicalData: generateHistoricalData(70, 30),
  },
  {
    id: "prod_005",
    name: "Wool Scarf",
    stock: 30,
    price: 24.99,
    lowStockThreshold: 15,
    historicalData: generateHistoricalData(40, 30),
  },
];


export const initialProducts: Product[] = mockProductsRaw.map(p => {
  const { stock, price, lowStockThreshold, ...rest } = p;
  return {
    ...rest,
    isVariable: false,
    variants: [
      {
        id: `${p.id}-default`,
        name: "Default",
        stock: stock,
        price: price,
        lowStockThreshold: lowStockThreshold
      }
    ]
  }
});