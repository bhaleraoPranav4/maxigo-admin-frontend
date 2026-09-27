const BASE_URL = "https://api.maxigo.in/api";

const TOKEN_KEY = "maxigoAdminToken";
const USER_KEY = "maxigoAdminUser";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Unable to read stored admin user:", error);
    return null;
  }
}

export function saveAdminAuth(response) {
  if (response?.token) {
    localStorage.setItem(TOKEN_KEY, response.token);
  }

  const user = {
    userId: response?.userId ?? null,
    name: response?.name ?? "",
    mobile: response?.mobile ?? "",
    role: response?.role ?? "",
  };

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );

  return user;
}

export function clearAdminAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdminLoggedIn() {
  const token = getToken();
  const user = getStoredUser();

  const role = String(
    user?.role || ""
  ).toUpperCase();

  return (
    Boolean(token) &&
    (
      role === "ADMIN" ||
      role === "ROLE_ADMIN"
    )
  );
}

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      "Backend server is not reachable. Please start MaxiGo backend on port 8080."
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminAuth();

      window.dispatchEvent(
        new Event(
          "maxigo-admin-logout"
        )
      );
    }

    let message =
      "API request failed";

    if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    }

    if (
      data &&
      typeof data === "object"
    ) {
      message =
        data.message ||
        data.error ||
        message;
    }

    throw new Error(message);
  }

  return data;
}

// =====================================================
// LOGIN
// =====================================================

export async function adminLogin(
  mobile,
  password
) {
  const response =
    await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          mobile,
          password,
        }),
      }
    );

  const role = String(
    response?.role || ""
  ).toUpperCase();

  if (
    role !== "ADMIN" &&
    role !== "ROLE_ADMIN"
  ) {
    throw new Error(
      "This account does not have ADMIN access"
    );
  }

  saveAdminAuth(response);

  return response;
}

// =====================================================
// ADMIN PROFILE
// =====================================================

export function getAdminProfile() {
  return apiRequest(
    "/admin/profile"
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export function getAdminDashboard() {
  return apiRequest(
    "/admin/dashboard"
  );
}

// =====================================================
// ORDERS
// =====================================================

export function getAdminOrders() {
  return apiRequest(
    "/admin/orders"
  );
}

export function getAdminOrder(
  orderId
) {
  return apiRequest(
    `/admin/orders/${orderId}`
  );
}

export function getAdminOrderItems(
  orderId
) {
  return apiRequest(
    `/admin/orders/${orderId}/items`
  );
}

export function updateAdminOrderStatus(
  orderId,
  status
) {
  return apiRequest(
    `/admin/orders/${orderId}/status?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

export function updateAdminPaymentStatus(
  orderId,
  status
) {
  return apiRequest(
    `/admin/orders/${orderId}/payment-status?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// DELIVERY ASSIGNMENTS
// =====================================================

export function getAdminAssignments() {
  return apiRequest(
    "/admin/assignments"
  );
}

export function getAdminCompletedAssignments() {
  return apiRequest(
    "/admin/assignments/completed"
  );
}

export function getAdminActiveAssignments() {
  return apiRequest(
    "/admin/assignments/active"
  );
}

// =====================================================
// CUSTOMERS
// =====================================================

export function getAdminCustomers() {
  return apiRequest(
    "/admin/customers"
  );
}

export function getAdminCustomer(
  customerId
) {
  return apiRequest(
    `/admin/customers/${customerId}`
  );
}

// =====================================================
// RIDERS
// =====================================================

export function getAdminRiders() {
  return apiRequest(
    "/admin/riders"
  );
}

export function getAdminOnlineRiders() {
  return apiRequest(
    "/admin/riders/online"
  );
}

export function getAdminVerifiedRiders() {
  return apiRequest(
    "/admin/riders/verified"
  );
}

export function getAdminAvailableRiders() {
  return apiRequest(
    "/admin/riders/available"
  );
}

export function updateRiderVerification(
  riderId,
  status
) {
  return apiRequest(
    `/admin/riders/${riderId}/verification?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// STORES
// =====================================================

export function getAdminStores() {
  return apiRequest(
    "/admin/stores"
  );
}

export function getAdminStore(
  storeId
) {
  return apiRequest(
    `/admin/stores/${storeId}`
  );
}

export function updateStoreVerification(
  storeId,
  status
) {
  return apiRequest(
    `/admin/stores/${storeId}/verification?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

export function updateStoreStatus(
  storeId,
  status
) {
  return apiRequest(
    `/admin/stores/${storeId}/status?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// PRODUCTS
// =====================================================

export function getAdminProducts() {
  return apiRequest(
    "/admin/products"
  );
}

export function getAdminProduct(
  productId
) {
  return apiRequest(
    `/admin/products/${productId}`
  );
}

export function updateAdminProduct(
  productId,
  product
) {
  return apiRequest(
    `/admin/products/${productId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        product
      ),
    }
  );
}

export function deleteAdminProduct(
  productId
) {
  return apiRequest(
    `/admin/products/${productId}`,
    {
      method: "DELETE",
    }
  );
}

export function updateAdminProductStatus(
  productId,
  status
) {
  return apiRequest(
    `/admin/products/${productId}/status?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

export function updateAdminProductActive(
  productId,
  active
) {
  return apiRequest(
    `/admin/products/${productId}/active?active=${active}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// CATEGORIES
// =====================================================

export function getCategories() {
  return apiRequest(
    "/categories"
  );
}

export function getActiveCategories() {
  return apiRequest(
    "/categories/active"
  );
}

export function createCategory(
  body
) {
  return apiRequest(
    "/categories",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function updateCategory(
  categoryId,
  body
) {
  return apiRequest(
    `/categories/${categoryId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );
}

export function updateCategoryStatus(
  categoryId,
  status
) {
  return apiRequest(
    `/categories/${categoryId}/status?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

export function deleteCategory(
  categoryId
) {
  return apiRequest(
    `/categories/${categoryId}`,
    {
      method: "DELETE",
    }
  );
}

// =====================================================
// PAYMENTS
// =====================================================

export function getAdminPayments() {
  return apiRequest(
    "/admin/payments"
  );
}

export function getAdminPayment(
  paymentId
) {
  return apiRequest(
    `/admin/payments/${paymentId}`
  );
}

export function getAdminPaymentsByStatus(
  status
) {
  return apiRequest(
    `/admin/payments/status/${encodeURIComponent(
      status
    )}`
  );
}

export function getAdminPaymentSummary() {
  return apiRequest(
    "/admin/payments/summary"
  );
}

// =====================================================
// REFUNDS
// =====================================================

export function getAdminRefunds() {
  return apiRequest(
    "/admin/refunds"
  );
}

export function getAdminRefund(
  refundId
) {
  return apiRequest(
    `/admin/refunds/${refundId}`
  );
}

export function createAdminRefund(
  body
) {
  return apiRequest(
    "/admin/refunds",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function updateAdminRefundStatus(
  refundId,
  status,
  refundTransactionId
) {
  const query =
    new URLSearchParams({
      status,
    });

  if (refundTransactionId) {
    query.set(
      "refundTransactionId",
      refundTransactionId
    );
  }

  return apiRequest(
    `/admin/refunds/${refundId}/status?${query.toString()}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// PAYOUTS
// =====================================================

export function getAdminPayouts() {
  return apiRequest(
    "/admin/payouts"
  );
}

export function getAdminPayout(
  payoutId
) {
  return apiRequest(
    `/admin/payouts/${payoutId}`
  );
}

export function updateAdminPayoutStatus(
  payoutId,
  status,
  referenceNumber,
  failureReason
) {
  const query =
    new URLSearchParams({
      status,
    });

  if (referenceNumber) {
    query.set(
      "referenceNumber",
      referenceNumber
    );
  }

  if (failureReason) {
    query.set(
      "failureReason",
      failureReason
    );
  }

  return apiRequest(
    `/admin/payouts/${payoutId}/status?${query.toString()}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// SETTLEMENTS
// =====================================================

export function getAdminSettlements() {
  return apiRequest(
    "/admin/settlements"
  );
}

export function getAdminSettlement(
  settlementId
) {
  return apiRequest(
    `/admin/settlements/${settlementId}`
  );
}

export function updateAdminSettlementStatus(
  settlementId,
  status
) {
  return apiRequest(
    `/admin/settlements/${settlementId}/status?status=${encodeURIComponent(
      status
    )}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// REPORTS
// =====================================================

export function getAdminReports(
  period = "weekly"
) {
  return apiRequest(
    `/admin/reports?period=${encodeURIComponent(
      period
    )}`
  );
}

// =====================================================
// COMMISSION
// =====================================================

export function getCurrentCommission() {
  return apiRequest(
    "/admin/commission/current"
  );
}

export function updateCommission(
  commissionPercent
) {
  return apiRequest(
    "/admin/commission/current",
    {
      method: "PUT",
      body: JSON.stringify({
        commissionPercent,
      }),
    }
  );
}

export function getCommissionHistory() {
  return apiRequest(
    "/admin/commission/history"
  );
}

// =====================================================
// OFFERS
// =====================================================

export function getAdminOffers() {
  return apiRequest("/admin/offers");
}

export function getAdminOffer(offerId) {
  return apiRequest(`/admin/offers/${offerId}`);
}

export function createAdminOffer(body) {
  return apiRequest("/admin/offers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminOffer(offerId, body) {
  return apiRequest(`/admin/offers/${offerId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteAdminOffer(offerId) {
  return apiRequest(`/admin/offers/${offerId}`, {
    method: "DELETE",
  });
}

export function updateAdminOfferActive(offerId, active) {
  return apiRequest(
    `/admin/offers/${offerId}/active?active=${active}`,
    {
      method: "PUT",
    }
  );
}

// =====================================================
// HELPERS
// =====================================================

export function toArray(
  value
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    Array.isArray(
      value?.content
    )
  ) {
    return value.content;
  }

  if (
    Array.isArray(
      value?.data
    )
  ) {
    return value.data;
  }

  if (
    Array.isArray(
      value?.items
    )
  ) {
    return value.items;
  }

  return [];
}

export function formatMoney(
  value
) {
  const n = Number(
    value || 0
  );

  return `₹${n.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

export function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const d = new Date(value);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return String(value);
  }

  return d.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export function formatTime(
  value
) {
  if (!value) {
    return "—";
  }

  const d = new Date(value);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "—";
  }

  return d.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export function formatDateTime(
  value
) {
  if (!value) {
    return {
      date: "—",
      time: "—",
    };
  }

  return {
    date: formatDate(value),
    time: formatTime(value),
  };
}

export function humanizeStatus(
  value
) {
  if (!value) {
    return "—";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}