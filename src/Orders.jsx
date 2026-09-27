import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Orders.css";

import {
  getAdminOrders,
  getAdminAssignments,
  getAdminOrder,
  toArray,
  formatMoney,
  formatDateTime,
  humanizeStatus,
} from "./api";

const statusOptions = [
  "All",
  "Placed",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Rider Assigned",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

function displayStatus(
  raw
) {
  const s =
    String(
      raw || ""
    ).toUpperCase();

  if (
    s === "ASSIGNED"
  ) {
    return "Rider Assigned";
  }

  if (
    s ===
    "READY_FOR_PICKUP"
  ) {
    return "Ready for Pickup";
  }

  if (
    s === "PICKED_UP"
  ) {
    return "Picked Up";
  }

  if (
    s ===
    "OUT_FOR_DELIVERY"
  ) {
    return "Out for Delivery";
  }

  return humanizeStatus(
    s
  );
}

function orderStatusClass(
  status
) {
  const s =
    String(
      status || ""
    )
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );

  if (
    s === "accepted" ||
    s === "preparing" ||
    s ===
      "ready-for-pickup"
  ) {
    return "preparing";
  }

  if (
    s ===
    "rider-assigned"
  ) {
    return "rider-assigned";
  }

  if (
    s === "picked-up" ||
    s ===
      "out-for-delivery"
  ) {
    return "out-for-delivery";
  }

  return s;
}

function Orders() {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState(
    "All"
  );

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const load =
    async () => {
      setLoading(
        true
      );

      try {
        const [
          orderData,
          assignmentData,
        ] =
          await Promise.all(
            [
              getAdminOrders(),
              getAdminAssignments(),
            ]
          );

        setOrders(
          toArray(
            orderData
          )
        );

        setAssignments(
          toArray(
            assignmentData
          )
        );
      } catch (e) {
        setError(
          e.message ||
          "Unable to load orders."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    load();
  }, []);

  const assignmentMap =
    useMemo(() => {
      const map =
        new Map();

      assignments.forEach(
        (a) => {
          if (
            a.orderId !=
            null
          ) {
            map.set(
              String(
                a.orderId
              ),
              a
            );
          }
        }
      );

      return map;
    }, [
      assignments,
    ]);

  const normalized =
    useMemo(
      () =>
        orders.map(
          (o) => {
            const assignment =
              assignmentMap.get(
                String(
                  o.id
                )
              );

            const dt =
              formatDateTime(
                o.placedAt
              );

            const rider =
              assignment?.riderName ||
              "Not Assigned";

            return {
              ...o,

              id:
                o.orderNumber
                  ? `#${o.orderNumber}`
                  : `#${o.id}`,

              rawId:
                o.id,

              customer:
                o.customerName ||
                "Unknown Customer",

              mobile:
                o.customerMobile ||
                "—",

              store:
                o.storeName ||
                "—",

              rider,

              amount:
                Number(
                  o.totalAmount ||
                  0
                ),

              payment:
                humanizeStatus(
                  o.paymentMethod
                ),

              status:
                displayStatus(
                  o.orderStatus
                ),

              statusClass:
                orderStatusClass(
                  displayStatus(
                    o.orderStatus
                  )
                ),

              date:
                dt.date,

              time:
                dt.time,

              delivery: [
                o.deliveryHouseNo,
                o.deliveryArea,
                o.deliveryLandmark,
                o.deliveryCity,
                o.deliveryState,
                o.deliveryPincode,
              ]
                .filter(Boolean)
                .join(", ") ||
                "—",
            };
          }
        ),
      [
        orders,
        assignmentMap,
      ]
    );

  const filteredOrders =
    useMemo(
      () => {
        const q =
          search
            .trim()
            .toLowerCase();

        return normalized.filter(
          (order) => {
            const matchesSearch =
              !q ||
              [
                order.id,
                order.customer,
                order.store,
                order.rider,
                order.mobile,
              ].some(
                (v) =>
                  String(v)
                    .toLowerCase()
                    .includes(
                      q
                    )
              );

            return (
              matchesSearch &&
              (
                status ===
                  "All" ||
                order.status ===
                  status
              )
            );
          }
        );
      },
      [
        normalized,
        search,
        status,
      ]
    );

  const totals =
    useMemo(
      () => ({
        all:
          normalized.length,

        placed:
          normalized.filter(
            (o) =>
              o.status ===
              "Placed"
          ).length,

        preparing:
          normalized.filter(
            (o) =>
              o.status ===
              "Preparing"
          ).length,

        riderAssigned:
          normalized.filter(
            (o) =>
              o.status ===
              "Rider Assigned"
          ).length,

        outForDelivery:
          normalized.filter(
            (o) =>
              o.status ===
              "Out for Delivery"
          ).length,

        delivered:
          normalized.filter(
            (o) =>
              o.status ===
              "Delivered"
          ).length,
      }),
      [normalized]
    );

  const openOrder =
    async (
      order
    ) => {
      try {
        const fresh =
          await getAdminOrder(
            order.rawId
          );

        const match =
          normalized.find(
            (x) =>
              x.rawId ===
              order.rawId
          );

        setSelectedOrder({
          ...(match ||
            order),

          ...order,

          ...fresh,

          id:
            fresh.orderNumber
              ? `#${fresh.orderNumber}`
              : order.id,
        });
      } catch {
        setSelectedOrder(
          order
        );
      }
    };

  if (loading) {
    return (
      <section className="admin-orders-page">
        <div className="orders-table-card">
          Loading orders...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-orders-page">
        <div className="orders-table-card">
          <strong>
            Orders error
          </strong>

          <p
            style={{
              marginTop: 8,
            }}
          >
            {
              error
            }
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-orders-page">

      <div className="orders-title-row">

        <div>
          <span className="orders-breadcrumb">
            Admin / Orders
          </span>

          <h1>
            Orders
          </h1>

          <p>
            Monitor, search and manage all MaxiGo customer orders.
          </p>
        </div>

        <div className="orders-title-actions">

          <button
            type="button"
            className="orders-secondary-btn"
            onClick={load}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="orders-primary-btn"
          >
            + Create Order
          </button>

        </div>

      </div>

      <div className="orders-summary-grid">

        {[
          [
            "All",
            "📦",
            totals.all,
            "Total Orders",
            "purple",
          ],
          [
            "Placed",
            "🛍️",
            totals.placed,
            "Placed",
            "blue",
          ],
          [
            "Preparing",
            "🍳",
            totals.preparing,
            "Preparing",
            "orange",
          ],
          [
            "Rider Assigned",
            "🛵",
            totals.riderAssigned,
            "Rider Assigned",
            "teal",
          ],
          [
            "Out for Delivery",
            "🚚",
            totals.outForDelivery,
            "Out for Delivery",
            "violet",
          ],
          [
            "Delivered",
            "✓",
            totals.delivered,
            "Delivered",
            "green",
          ],
        ].map(
          ([
            key,
            icon,
            value,
            label,
            type,
          ]) => (
            <button
              key={key}
              type="button"
              className={`orders-summary-card ${
                status ===
                key
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setStatus(
                  key
                )
              }
            >
              <span
                className={`summary-icon ${type}`}
              >
                {
                  icon
                }
              </span>

              <div>
                <small>
                  {
                    label
                  }
                </small>

                <strong>
                  {
                    value
                  }
                </strong>
              </div>
            </button>
          )
        )}

      </div>

      <div className="orders-filter-card">

        <div className="orders-search">
          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search order, customer, store or rider..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch(
                  ""
                )
              }
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <select
          className="orders-select"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          {statusOptions.map(
            (s) => (
              <option
                key={s}
              >
                {s}
              </option>
            )
          )}
        </select>

        <select
          className="orders-select"
          defaultValue="alltime"
        >
          <option value="today">
            Today
          </option>

          <option value="7days">
            Last 7 Days
          </option>

          <option value="30days">
            Last 30 Days
          </option>

          <option value="alltime">
            All Time
          </option>
        </select>

      </div>

      <div className="orders-table-card">

        <div className="orders-card-head">

          <div>
            <h2>
              All Orders
            </h2>

            <p>
              Showing{" "}
              {
                filteredOrders.length
              }{" "}
              of{" "}
              {
                normalized.length
              }{" "}
              orders
            </p>
          </div>

          <div className="orders-live-indicator">
            <i />
            Live Orders
          </div>

        </div>

        <div className="orders-table-wrap">

          <table className="orders-table">

            <thead>
              <tr>
                <th>
                  Order
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Store
                </th>

                <th>
                  Rider
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Time
                </th>

                <th />
              </tr>
            </thead>

            <tbody>

              {filteredOrders.map(
                (order) => (
                  <tr
                    key={
                      order.rawId
                    }
                  >

                    <td>
                      <button
                        type="button"
                        className="order-id-btn"
                        onClick={() =>
                          openOrder(
                            order
                          )
                        }
                      >
                        {
                          order.id
                        }
                      </button>
                    </td>

                    <td>
                      <div className="customer-cell">

                        <span>
                          {
                            order.customer.charAt(
                              0
                            )
                          }
                        </span>

                        <div>
                          <strong>
                            {
                              order.customer
                            }
                          </strong>

                          <small>
                            {
                              order.mobile
                            }
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      {
                        order.store
                      }
                    </td>

                    <td>
                      {
                        order.rider ===
                        "Not Assigned"
                          ? (
                            <span className="not-assigned">
                              Not Assigned
                            </span>
                          )
                          : order.rider
                      }
                    </td>

                    <td>
                      <strong>
                        {
                          formatMoney(
                            order.amount
                          )
                        }
                      </strong>
                    </td>

                    <td>
                      <span className="payment-pill">
                        {
                          order.payment
                        }
                      </span>
                    </td>

                    <td>
                      <span
                        className={`order-status ${
                          order.statusClass
                        }`}
                      >
                        {
                          order.status
                        }
                      </span>
                    </td>

                    <td>
                      <div className="time-cell">
                        <strong>
                          {
                            order.time
                          }
                        </strong>

                        <small>
                          {
                            order.date
                          }
                        </small>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="view-order-btn"
                        onClick={() =>
                          openOrder(
                            order
                          )
                        }
                      >
                        View
                      </button>
                    </td>

                  </tr>
                )
              )}

              {filteredOrders.length ===
                0 && (
                <tr>
                  <td colSpan="9">

                    <div className="orders-no-result">
                      <div>
                        🔍
                      </div>

                      <h3>
                        No orders found
                      </h3>

                      <p>
                        Try another search or status filter.
                      </p>
                    </div>

                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selectedOrder && (
        <div
          className="order-modal-backdrop"
          onClick={() =>
            setSelectedOrder(
              null
            )
          }
        >

          <div
            className="order-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="order-modal-head">

              <div>
                <span>
                  Order Details
                </span>

                <h2>
                  {
                    selectedOrder.id
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>

            <div className="order-modal-status">

              <span
                className={`order-status ${orderStatusClass(
                  selectedOrder.orderStatus ||
                  selectedOrder.status
                )}`}
              >
                {
                  displayStatus(
                    selectedOrder.orderStatus ||
                    selectedOrder.status
                  )
                }
              </span>

            </div>

            <div className="order-detail-grid">

              <div>
                <small>
                  Customer
                </small>

                <strong>
                  {
                    selectedOrder.customerName ||
                    selectedOrder.customer ||
                    "—"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Mobile
                </small>

                <strong>
                  {
                    selectedOrder.customerMobile ||
                    selectedOrder.mobile ||
                    "—"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Store
                </small>

                <strong>
                  {
                    selectedOrder.storeName ||
                    selectedOrder.store ||
                    "—"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Rider
                </small>

                <strong>
                  {
                    selectedOrder.rider ||
                    assignmentMap.get(
                      String(
                        selectedOrder.rawId
                      )
                    )?.riderName ||
                    "Not Assigned"
                  }
                </strong>
              </div>

              <div>
                <small>
                  Payment
                </small>

                <strong>
                  {
                    humanizeStatus(
                      selectedOrder.paymentMethod
                    )
                  }
                </strong>
              </div>

              <div>
                <small>
                  Amount
                </small>

                <strong>
                  {
                    formatMoney(
                      selectedOrder.totalAmount ||
                      selectedOrder.amount
                    )
                  }
                </strong>
              </div>

              <div className="full-width-detail">

                <small>
                  Delivery Address
                </small>

                <strong>
                  {[
                    selectedOrder.deliveryHouseNo,
                    selectedOrder.deliveryArea,
                    selectedOrder.deliveryLandmark,
                    selectedOrder.deliveryCity,
                    selectedOrder.deliveryState,
                    selectedOrder.deliveryPincode,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    selectedOrder.delivery ||
                    "—"}
                </strong>

              </div>

            </div>

            <div className="order-modal-actions">

              <button
                type="button"
                className="orders-secondary-btn"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default Orders;