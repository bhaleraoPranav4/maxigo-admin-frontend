import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Dashboard.css";

import {
  getAdminDashboard,
  getAdminOrders,
  getAdminStores,
  getAdminRiders,
  getAdminCustomers,
  getAdminSettlements,
  getAdminCompletedAssignments,
  toArray,
  formatMoney,
  formatDateTime,
  humanizeStatus,
} from "./api";

function Dashboard() {
  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    stores,
    setStores,
  ] = useState([]);

  const [
    riders,
    setRiders,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    settlements,
    setSettlements,
  ] = useState([]);

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let mounted =
      true;

    Promise.all([
      getAdminDashboard(),
      getAdminOrders(),
      getAdminStores(),
      getAdminRiders(),
      getAdminCustomers(),
      getAdminSettlements(),
      getAdminCompletedAssignments(),
    ])
      .then(
        ([
          dash,
          orderData,
          storeData,
          riderData,
          customerData,
          settlementData,
          assignmentData,
        ]) => {

          if (!mounted) {
            return;
          }

          setDashboard(
            dash || {}
          );

          setOrders(
            toArray(
              orderData
            )
          );

          setStores(
            toArray(
              storeData
            )
          );

          setRiders(
            toArray(
              riderData
            )
          );

          setCustomers(
            toArray(
              customerData
            )
          );

          setSettlements(
            toArray(
              settlementData
            )
          );

          setAssignments(
            toArray(
              assignmentData
            )
          );
        }
      )
      .catch(
        (err) => {
          if (mounted) {
            setError(
              err.message ||
              "Unable to load dashboard data."
            );
          }
        }
      )
      .finally(() => {
        if (mounted) {
          setLoading(
            false
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const todayKey =
    new Date().toDateString();

  const todayOrders =
    orders.filter(
      (o) => {
        const dt =
          new Date(
            o.placedAt
          );

        return (
          !Number.isNaN(
            dt.getTime()
          ) &&
          dt.toDateString() ===
            todayKey
        );
      }
    );

  const totalSales =
    Number(
      dashboard?.totalRevenue ||
      0
    );

  const commission =
    settlements.reduce(
      (sum, s) =>
        sum +
        Number(
          s.maxigoCommission ||
          0
        ),
      0
    );

  const activeStores =
    stores.filter(
      (s) =>
        String(
          s.storeStatus ||
          ""
        ).toUpperCase() ===
        "ACTIVE"
    ).length;

  const onlineRiders =
    riders.filter(
      (r) =>
        String(
          r.availabilityStatus ||
          r.status ||
          ""
        ).toUpperCase() ===
        "ONLINE"
    ).length;

  const activeCustomers =
    customers.filter(
      (c) =>
        String(
          c.status ||
          c.userStatus ||
          c.user?.status ||
          "ACTIVE"
        ).toUpperCase() ===
        "ACTIVE"
    ).length;

  const avgDeliveryMinutes =
    useMemo(() => {
      const durations =
        assignments
          .map((a) => {
            if (
              !a.assignedAt ||
              !a.deliveredAt
            ) {
              return null;
            }

            const ms =
              new Date(
                a.deliveredAt
              ).getTime() -
              new Date(
                a.assignedAt
              ).getTime();

            return Number.isFinite(
              ms
            ) &&
              ms >= 0
              ? ms / 60000
              : null;
          })
          .filter(Boolean);

      if (
        !durations.length
      ) {
        return null;
      }

      return Math.round(
        durations.reduce(
          (a, b) =>
            a + b,
          0
        ) /
          durations.length
      );
    }, [
      assignments,
    ]);

  const chartData =
    useMemo(() => {
      const result = [];

      for (
        let i = 6;
        i >= 0;
        i -= 1
      ) {
        const d =
          new Date();

        d.setHours(
          0,
          0,
          0,
          0
        );

        d.setDate(
          d.getDate() - i
        );

        const count =
          orders.filter(
            (o) => {
              const dt =
                new Date(
                  o.placedAt
                );

              return (
                !Number.isNaN(
                  dt.getTime()
                ) &&
                dt.toDateString() ===
                  d.toDateString()
              );
            }
          ).length;

        result.push({
          label:
            d.toLocaleDateString(
              "en-IN",
              {
                weekday:
                  "short",
              }
            ),
          value:
            count,
        });
      }

      return result;
    }, [orders]);

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.placedAt ||
              b.updatedAt ||
              0
            ) -
            new Date(
              a.placedAt ||
              a.updatedAt ||
              0
            )
        )
        .slice(0, 5);
    }, [orders]);

  const topStores =
    useMemo(() => {
      const map =
        new Map();

      orders.forEach(
        (o) => {
          if (!o.storeId) {
            return;
          }

          const current =
            map.get(
              o.storeId
            ) || {
              name:
                o.storeName ||
                "Store",
              orders: 0,
              sales: 0,
            };

          current.orders += 1;

          current.sales +=
            Number(
              o.totalAmount ||
              0
            );

          map.set(
            o.storeId,
            current
          );
        }
      );

      return [
        ...map.values(),
      ]
        .sort(
          (a, b) =>
            b.sales -
            a.sales
        )
        .slice(0, 4);
    }, [orders]);

  const activities =
    useMemo(() => {
      const list = [];

      [...stores].forEach(
        (s) =>
          list.push({
            date:
              s.createdAt,
            title:
              "Store data updated",
            detail:
              s.storeName ||
              "Store",
            icon: "🏪",
          })
      );

      [...orders].forEach(
        (o) =>
          list.push({
            date:
              o.placedAt,
            title:
              "New order activity",
            detail:
              o.orderNumber ||
              `Order #${o.id}`,
            icon: "🛒",
          })
      );

      [...customers].forEach(
        (c) =>
          list.push({
            date:
              c.createdAt,
            title:
              "Customer record",
            detail:
              c.name ||
              c.customerName ||
              "Customer",
            icon: "👤",
          })
      );

      return list
        .filter(
          (x) => x.date
        )
        .sort(
          (a, b) =>
            new Date(
              b.date
            ) -
            new Date(
              a.date
            )
        )
        .slice(0, 4);
    }, [
      stores,
      orders,
      customers,
    ]);

  const maxValue =
    Math.max(
      ...chartData.map(
        (item) =>
          item.value
      ),
      1
    );

  if (loading) {
    return (
      <div className="maxigo-dashboard">
        <div className="dashboard-card">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maxigo-dashboard">
        <div className="dashboard-card">
          <strong>
            Dashboard error
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
      </div>
    );
  }

  return (
    <div className="maxigo-dashboard">

      <div className="dashboard-heading">

        <div>
          <h1>
            Admin Dashboard
          </h1>

          <p>
            Welcome back! Here's what's happening across MaxiGo today.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            Today
          </span>

          <strong>
            {
              new Date().toLocaleDateString(
                "en-IN",
                {
                  day:
                    "2-digit",
                  month:
                    "long",
                  year:
                    "numeric",
                }
              )
            }
          </strong>
        </div>

      </div>

      <div className="dashboard-stat-grid">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon purple">
            📦
          </div>

          <div className="dashboard-stat-content">
            <span>
              Total Orders
            </span>

            <strong>
              {
                Number(
                  dashboard?.totalOrders ||
                  0
                ).toLocaleString(
                  "en-IN"
                )
              }
            </strong>

            <small>
              Live from database
            </small>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon blue">
            🛒
          </div>

          <div className="dashboard-stat-content">
            <span>
              Today's Orders
            </span>

            <strong>
              {
                todayOrders.length.toLocaleString(
                  "en-IN"
                )
              }
            </strong>

            <small>
              Based on placed time
            </small>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon green">
            ₹
          </div>

          <div className="dashboard-stat-content">
            <span>
              Total Sales
            </span>

            <strong>
              {
                formatMoney(
                  totalSales
                )
              }
            </strong>

            <small>
              Delivered / paid revenue
            </small>
          </div>

        </div>

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon orange">
            ↗
          </div>

          <div className="dashboard-stat-content">
            <span>
              MaxiGo Earnings
            </span>

            <strong>
              {
                formatMoney(
                  commission
                )
              }
            </strong>

            <small>
              Recorded settlement commission
            </small>
          </div>

        </div>

      </div>

      <div className="dashboard-chart-row">

        <div className="dashboard-card sales-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Orders Overview
              </h2>

              <p>
                Order activity for the last 7 days
              </p>
            </div>

          </div>

          <div className="dashboard-chart">

            {chartData.map(
              (item) => (
                <div
                  className="dashboard-bar-item"
                  key={
                    item.label
                  }
                >

                  <div className="dashboard-bar-value">
                    {
                      item.value
                    }
                  </div>

                  <div className="dashboard-bar-track">

                    <div
                      className="dashboard-bar"
                      style={{
                        height: `${
                          Math.max(
                            12,
                            (
                              item.value /
                              maxValue
                            ) *
                              100
                          )
                        }%`,
                      }}
                    />

                  </div>

                  <span>
                    {
                      item.label
                    }
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Platform Snapshot
              </h2>

              <p>
                Current marketplace status
              </p>
            </div>

          </div>

          <div className="snapshot-list">

            <div className="snapshot-row">
              <div className="snapshot-icon purple">
                🏪
              </div>

              <div>
                <strong>
                  {
                    activeStores
                  }
                </strong>

                <span>
                  Active Stores
                </span>
              </div>
            </div>

            <div className="snapshot-row">
              <div className="snapshot-icon blue">
                🛵
              </div>

              <div>
                <strong>
                  {
                    onlineRiders
                  }
                </strong>

                <span>
                  Online Riders
                </span>
              </div>
            </div>

            <div className="snapshot-row">
              <div className="snapshot-icon green">
                👤
              </div>

              <div>
                <strong>
                  {
                    activeCustomers
                  }
                </strong>

                <span>
                  Active Customers
                </span>
              </div>
            </div>

            <div className="snapshot-row">
              <div className="snapshot-icon orange">
                ⏱
              </div>

              <div>
                <strong>
                  {
                    avgDeliveryMinutes
                      ? `${avgDeliveryMinutes} min`
                      : "—"
                  }
                </strong>

                <span>
                  Avg. Delivery Time
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      <div className="dashboard-content-grid">

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Recent Orders
              </h2>

              <p>
                Latest orders from customers
              </p>
            </div>

            <span className="dashboard-count">
              {
                recentOrders.length
              }{" "}
              orders
            </span>

          </div>

          <div className="dashboard-table-wrap">

            <table className="dashboard-table">

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
                    Amount
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Time
                  </th>
                </tr>
              </thead>

              <tbody>

                {recentOrders.map(
                  (order) => {
                    const dt =
                      formatDateTime(
                        order.placedAt
                      );

                    return (
                      <tr
                        key={
                          order.id
                        }
                      >

                        <td>
                          <strong>
                            #
                            {
                              order.orderNumber ||
                              order.id
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            order.customerName ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            order.storeName ||
                            "—"
                          }
                        </td>

                        <td className="table-amount">
                          {
                            formatMoney(
                              order.totalAmount
                            )
                          }
                        </td>

                        <td>
                          <span
                            className={`order-status ${
                              String(
                                order.orderStatus ||
                                ""
                              ).toLowerCase()
                            }`}
                          >
                            {
                              humanizeStatus(
                                order.orderStatus
                              )
                            }
                          </span>
                        </td>

                        <td className="table-time">
                          {
                            dt.time
                          }
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Top Stores
              </h2>

              <p>
                Highest order value
              </p>
            </div>

          </div>

          <div className="top-store-list">

            {topStores.map(
              (
                store,
                index
              ) => (
                <div
                  className="top-store-row"
                  key={`${store.name}-${index}`}
                >

                  <div className="store-rank">
                    {
                      index + 1
                    }
                  </div>

                  <div className="store-main">

                    <strong>
                      {
                        store.name
                      }
                    </strong>

                    <small>
                      {
                        store.orders
                      }{" "}
                      orders
                    </small>

                  </div>

                  <div className="store-sales">

                    <strong>
                      {
                        formatMoney(
                          store.sales
                        )
                      }
                    </strong>

                  </div>

                </div>
              )
            )}

            {!topStores.length && (
              <div
                style={{
                  color:
                    "#8b94a5",
                  fontSize:
                    12,
                }}
              >
                No store order data yet.
              </div>
            )}

          </div>

        </div>

      </div>

      <div className="dashboard-card activity-card">

        <div className="dashboard-card-header">

          <div>
            <h2>
              Recent Activity
            </h2>

            <p>
              Latest platform events
            </p>
          </div>

        </div>

        <div className="activity-list">

          {activities.map(
            (
              activity,
              index
            ) => (
              <div
                className="activity-row"
                key={`${activity.title}-${activity.date}-${index}`}
              >

                <div className="activity-icon">
                  {
                    activity.icon
                  }
                </div>

                <div className="activity-main">

                  <strong>
                    {
                      activity.title
                    }
                  </strong>

                  <span>
                    {
                      activity.detail
                    }{" "}
                    ·{" "}
                    {
                      formatDateTime(
                        activity.date
                      ).time
                    }
                  </span>

                </div>

                <span className="activity-arrow">
                  ›
                </span>

              </div>
            )
          )}

          {!activities.length && (
            <div
              style={{
                color:
                  "#8a94a6",
                fontSize:
                  12,
              }}
            >
              No recent activity.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;