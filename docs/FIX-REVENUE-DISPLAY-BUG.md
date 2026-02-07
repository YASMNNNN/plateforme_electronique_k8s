# Bug Fix: Revenue Display Issue

**Date:** 2026-02-05
**Issue:** Newly paid invoices not appearing in revenue calculations on the Dashboard

---

## Problem Description

Users reported that the amount of newly paid invoices was not displayed correctly on the platform. Specifically:
- Payments appeared in the **Payments section**
- But the amounts did **not appear** in the **"Revenus des 6 derniers mois"** chart on the Dashboard

---

## Root Cause Analysis

Two issues were identified:

### Issue 1: Jackson Date Serialization (Backend)

**Location:** `services/payment-service` and `services/invoice-service`

Spring Boot 3.2 with Jackson serializes `LocalDate` fields as JSON arrays by default:
```json
// What the backend was sending:
{ "paymentDate": [2026, 1, 8] }

// What the frontend expected:
{ "paymentDate": "2026-01-08" }
```

When the frontend parsed this array with `new Date([2026, 1, 8])`, JavaScript produced `Invalid Date`, causing:
- `date.getFullYear()` → `NaN`
- `date.getMonth()` → `NaN`
- Revenue chart key became `"NaN-NaN"` → no month matched → payment was silently skipped

### Issue 2: Disconnected Invoice/Payment Systems (Architecture)

**Location:** `frontend/src/pages/admin/Dashboard.tsx`

The revenue calculation was based solely on the `payments` table:
```typescript
// Old logic - only counted COMPLETED payments
const revenue = payments
  .filter((payment) => payment.status === 'COMPLETED')
  .reduce((sum, payment) => sum + (payment.amount || 0), 0);
```

However, invoices could be marked as `PAID` without a corresponding payment record (or with a `PENDING` payment). This meant:
- Invoice status: `PAID` ✓
- Payment status: `PENDING` or missing
- Revenue shown: **0** ✗

---

## Solution

### Fix 1: Configure Jackson to Serialize Dates as ISO Strings

**Files Modified:**
- `services/payment-service/src/main/resources/application.yml`
- `services/invoice-service/src/main/resources/application.yml`

**Change Applied:**
```yaml
spring:
  application:
    name: payment-service  # or invoice-service
  jackson:
    serialization:
      write-dates-as-timestamps: false  # Added this configuration
```

**Result:** Dates are now serialized as ISO-8601 strings (`"2026-01-08"`) instead of arrays (`[2026, 1, 8]`).

### Fix 2: Calculate Revenue from PAID Invoices

**File Modified:** `frontend/src/pages/admin/Dashboard.tsx`

**Before (lines 64-66):**
```typescript
const revenue = payments
  .filter((payment) => payment.status === 'COMPLETED')
  .reduce((sum, payment) => sum + (payment.amount || 0), 0);
```

**After:**
```typescript
const revenue = invoices
  .filter((invoice) => invoice.status === 'PAID')
  .reduce((sum, invoice) => sum + (invoice.totalTtc || 0), 0);
```

**Before (revenue chart, lines 96-104):**
```typescript
payments.forEach((payment) => {
  if (payment.status !== 'COMPLETED' || !payment.paymentDate) return;
  const date = new Date(payment.paymentDate);
  const key = `${date.getFullYear()}-${date.getMonth()}`;
  const target = months.find((month) => month.key === key);
  if (target) {
    target.total += payment.amount || 0;
  }
});
```

**After:**
```typescript
invoices.forEach((invoice) => {
  if (invoice.status !== 'PAID' || !invoice.issueDate) return;
  const date = new Date(invoice.issueDate);
  const key = `${date.getFullYear()}-${date.getMonth()}`;
  const target = months.find((month) => month.key === key);
  if (target) {
    target.total += invoice.totalTtc || 0;
  }
});
```

**Result:** Revenue is now calculated from invoices with `status = PAID`, using their `totalTtc` amount and `issueDate` for the chart grouping.

---

## Additional Fixes (Pre-existing Issues)

During the build process, two incomplete services were discovered and fixed:

### notification-service

**Issue:** Missing source code (only `pom.xml` existed)

**Files Created:**
- `src/main/java/com/plateforme/electronique/notification/NotificationServiceApplication.java`
- `src/main/resources/application.yml`

### signature-service

**Issue:** Missing source code (only `pom.xml` existed)

**Files Created:**
- `src/main/java/com/plateforme/electronique/signature/SignatureServiceApplication.java`
- `src/main/resources/application.yml`

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `services/payment-service/src/main/resources/application.yml` | Modified | Added Jackson date serialization config |
| `services/invoice-service/src/main/resources/application.yml` | Modified | Added Jackson date serialization config |
| `frontend/src/pages/admin/Dashboard.tsx` | Modified | Revenue now based on PAID invoices |
| `services/notification-service/src/main/java/.../NotificationServiceApplication.java` | Created | Main class for build |
| `services/notification-service/src/main/resources/application.yml` | Created | Service configuration |
| `services/signature-service/src/main/java/.../SignatureServiceApplication.java` | Created | Main class for build |
| `services/signature-service/src/main/resources/application.yml` | Created | Service configuration |

---

## Deployment Steps

1. **Rebuild all services:**
   ```bash
   ./build-all.sh
   ```

2. **Rebuild Docker images:**
   ```bash
   docker-compose build
   ```

3. **Redeploy:**

   For Docker Compose:
   ```bash
   docker-compose up -d
   ```

   For Kubernetes:
   ```bash
   # Load/push images to your registry, then:
   kubectl rollout restart deployment frontend invoice-service payment-service
   ```

---

## Verification

After deployment, verify the fix by:

1. Navigate to the Dashboard
2. Check that the **"Revenus"** stat card shows the sum of all PAID invoices
3. Check that the **"Revenus des 6 derniers mois"** chart displays revenue grouped by invoice issue date
4. Create a new invoice, mark it as PAID, and confirm it appears in the revenue totals

---

## Technical Notes

- Revenue is now tied to invoice status (`PAID`) rather than payment status (`COMPLETED`)
- The chart uses `issueDate` for grouping invoices into monthly buckets
- This approach ensures revenue is displayed even when invoices are marked PAID without a formal payment record
- The Jackson date fix also improves date handling across the entire API (affects `createdAt`, `issueDate`, `dueDate`, `paymentDate`, etc.)
