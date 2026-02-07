# Guide: Adding CRUD Features to the Platform

This guide explains how to add new CRUD (Create, Read, Update, Delete) functionality following the existing patterns.

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│   API Gateway   │────▶│  Microservice   │
│  (React + TS)   │     │  (Spring Cloud) │     │ (Spring Boot)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                └─────────────────┘
```

---

## Example: Adding a "Product" Feature

We'll create a complete CRUD for managing products.

---

## Step 1: Backend - Create the Entity

**File:** `services/invoice-service/src/main/java/com/plateforme/electronique/invoice/entity/Product.java`

```java
package com.plateforme.electronique.invoice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    @NotBlank
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 15, scale = 4)
    @DecimalMin(value = "0.00")
    private BigDecimal price;

    @Column(name = "tax_rate")
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(19);

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## Step 2: Backend - Create the Repository

**File:** `services/invoice-service/src/main/java/com/plateforme/electronique/invoice/repository/ProductRepository.java`

```java
package com.plateforme.electronique.invoice.repository;

import com.plateforme.electronique.invoice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    // Find all active products
    List<Product> findByActiveTrue();

    // Find products by name (case-insensitive search)
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // Check if product name exists
    boolean existsByNameIgnoreCase(String name);
}
```

---

## Step 3: Backend - Create the DTO (Request Object)

**File:** `services/invoice-service/src/main/java/com/plateforme/electronique/invoice/dto/ProductRequest.java`

```java
package com.plateforme.electronique.invoice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @DecimalMin(value = "0.00", message = "Price must be positive")
    private BigDecimal price;

    private BigDecimal taxRate;
}
```

---

## Step 4: Backend - Create the Service

**File:** `services/invoice-service/src/main/java/com/plateforme/electronique/invoice/service/ProductService.java`

```java
package com.plateforme.electronique.invoice.service;

import com.plateforme.electronique.invoice.dto.ProductRequest;
import com.plateforme.electronique.invoice.entity.Product;
import com.plateforme.electronique.invoice.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // CREATE
    public Product create(ProductRequest request) {
        if (productRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException("Product with this name already exists");
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .taxRate(request.getTaxRate() != null ? request.getTaxRate() : java.math.BigDecimal.valueOf(19))
                .build();

        return productRepository.save(product);
    }

    // READ - Get all with pagination
    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    // READ - Get by ID
    public Product findById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    // UPDATE
    public Product update(UUID id, ProductRequest request) {
        Product product = findById(id);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        if (request.getTaxRate() != null) {
            product.setTaxRate(request.getTaxRate());
        }

        return productRepository.save(product);
    }

    // DELETE (soft delete - set active to false)
    public void delete(UUID id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    // DELETE (hard delete - remove from database)
    public void hardDelete(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new IllegalArgumentException("Product not found");
        }
        productRepository.deleteById(id);
    }
}
```

---

## Step 5: Backend - Create the Controller

**File:** `services/invoice-service/src/main/java/com/plateforme/electronique/invoice/controller/ProductController.java`

```java
package com.plateforme.electronique.invoice.controller;

import com.plateforme.electronique.invoice.dto.ProductRequest;
import com.plateforme.electronique.invoice.entity.Product;
import com.plateforme.electronique.invoice.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // CREATE - POST /api/products
    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.create(request));
    }

    // READ - GET /api/products (with pagination)
    @GetMapping
    public ResponseEntity<Page<Product>> list(Pageable pageable) {
        return ResponseEntity.ok(productService.findAll(pageable));
    }

    // READ - GET /api/products/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    // UPDATE - PUT /api/products/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable UUID id,
                                          @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    // DELETE - DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Step 6: Backend - Add Route to API Gateway

**File:** `services/api-gateway/src/main/resources/application.yml`

Add a new route:

```yaml
spring:
  cloud:
    gateway:
      routes:
        # ... existing routes ...
        - id: product-service
          uri: lb://invoice-service
          predicates:
            - Path=/api/products/**
```

---

## Step 7: Frontend - Add API Functions

**File:** `frontend/src/api/gateway.ts`

Add these types and functions:

```typescript
// Types
export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductPage = {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ProductPayload = {
  name: string;
  description?: string;
  price: number;
  taxRate?: number;
};

// API Functions

// GET /api/products
export const getProducts = async ({
  page = 0,
  size = 10,
}: {
  page?: number;
  size?: number;
} = {}): Promise<ProductPage> => {
  const url = new URL(`${API_BASE}/api/products`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  return parseJson<ProductPage>(
    await fetch(url.toString(), {
      headers: { ...getAuthHeaders() },
    })
  );
};

// GET /api/products/{id}
export const getProduct = async (id: string): Promise<Product> => {
  return parseJson<Product>(
    await fetch(`${API_BASE}/api/products/${id}`, {
      headers: { ...getAuthHeaders() },
    })
  );
};

// POST /api/products
export const createProduct = async (payload: ProductPayload): Promise<Product> => {
  return parseJson<Product>(
    await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
  );
};

// PUT /api/products/{id}
export const updateProduct = async (
  id: string,
  payload: ProductPayload
): Promise<Product> => {
  return parseJson<Product>(
    await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
  );
};

// DELETE /api/products/{id}
export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
};
```

---

## Step 8: Frontend - Create the Page Component

**File:** `frontend/src/pages/admin/Products.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
  ProductPage,
  ProductPayload,
} from '../../api/gateway';

const Products = () => {
  const [productPage, setProductPage] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductPayload>({
    name: '',
    description: '',
    price: 0,
    taxRate: 19,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts({ page: 0, size: 50 });
      setProductPage(response);
      setError('');
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, taxRate: 19 });
      loadProducts();
    } catch (err) {
      setError('Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      taxRate: product.taxRate,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      loadProducts();
    } catch {
      setError('Failed to delete product');
    }
  };

  const products = productPage?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: 0, taxRate: 19 });
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Product
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            {editingProduct ? 'Edit Product' : 'New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Price (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded border p-2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tax Rate</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-6 py-4">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.description}</div>
                </td>
                <td className="px-6 py-4">{product.price.toFixed(2)} TND</td>
                <td className="px-6 py-4">{product.taxRate}%</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="mr-2 text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
```

---

## Step 9: Frontend - Add Route

**File:** `frontend/src/App.tsx` (or your router file)

```tsx
import Products from './pages/admin/Products';

// Add to your routes:
<Route path="/admin/products" element={<Products />} />
```

---

## Step 10: Add Navigation Link

Add a link to your sidebar/navigation:

```tsx
<Link to="/admin/products">Products</Link>
```

---

## Testing the API

Use curl or Postman to test:

```bash
# Create
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Service A", "price": 100.00, "taxRate": 19}'

# Read all
curl http://localhost:8080/api/products

# Read one
curl http://localhost:8080/api/products/{id}

# Update
curl -X PUT http://localhost:8080/api/products/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Service A Updated", "price": 150.00}'

# Delete
curl -X DELETE http://localhost:8080/api/products/{id}
```

---

## Summary Checklist

- [ ] **Backend Entity** - Define the data model with JPA annotations
- [ ] **Backend Repository** - Extend JpaRepository for database operations
- [ ] **Backend DTO** - Create request/response objects with validation
- [ ] **Backend Service** - Implement business logic
- [ ] **Backend Controller** - Expose REST endpoints
- [ ] **API Gateway Route** - Add route to forward requests
- [ ] **Frontend Types** - Define TypeScript interfaces
- [ ] **Frontend API** - Add fetch functions
- [ ] **Frontend Component** - Create the UI page
- [ ] **Frontend Route** - Add to router
- [ ] **Navigation** - Add link to menu
- [ ] **Rebuild & Deploy** - Run build script and redeploy
