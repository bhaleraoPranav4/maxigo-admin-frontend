import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Reports.css";

import {
  getAdminReports,
  getAdminStores,
  getAdminRiders,
  getAdminCustomers,
  toArray,
  formatMoney,
} from "./api";

const money = (
  value
) =>
  formatMoney(
    value
  );

function Reports() {

  const [
    period,
    setPeriod,
  ] = useState(
    "weekly"
  );

  const [
    reportType,
    setReportType,
  ] = useState(
    "overview"
  );

  const [
    report,
    setReport,
  ] = useState(
    null
  );

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
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    toast,
    setToast,
  ] = useState("");

  const load =
    async (
      selectedPeriod =
        period
    ) => {

      setLoading(
        true
      );

      setError("");

      try {

        const [
          reportData,
          storeData,
          riderData,
          customerData,
        ] =
          await Promise.all([
            getAdminReports(
              selectedPeriod
            ),
            getAdminStores(),
            getAdminRiders(),
            getAdminCustomers(),
          ]);

        setReport(
          reportData ||
          {}
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

      } catch (e) {

        setError(
          e?.message ||
          "Unable to load reports."
        );

      } finally {

        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    load(period);
  }, [period]);

  const currentData =
    useMemo(
      () =>
        Array.isArray(
          report?.currentData
        )
          ? report.currentData
          : [],
      [report]
    );

  const summary =
    useMemo(
      () => {

        if (
          report?.summary
        ) {

          return {
            orders:
              Number(
                report.summary
                  .orders ||
                0
              ),

            sales:
              Number(
                report.summary
                  .sales ||
                0
              ),

            commission:
              Number(
                report.summary
                  .commission ||
                0
              ),

            delivery:
              Number(
                report.summary
                  .delivery ||
                0
              ),

            avgOrderValue:
              Number(
                report.summary
                  .avgOrderValue ||
                0
              ),
          };
        }

        const orders =
          currentData.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.orders ||
                0
              ),
            0
          );

        const sales =
          currentData.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.sales ||
                0
              ),
            0
          );

        const commission =
          currentData.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.commission ||
                0
              ),
            0
          );

        const delivery =
          currentData.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.delivery ||
                0
              ),
            0
          );

        return {
          orders,
          sales,
          commission,
          delivery,

          avgOrderValue:
            orders
              ? sales /
                orders
              : 0,
        };
      },
      [
        report,
        currentData,
      ]
    );

  const topStores =
    useMemo(
      () =>
        Array.isArray(
          report?.topStores
        )
          ? report.topStores
          : [],
      [report]
    );

  const topRiders =
    useMemo(
      () =>
        Array.isArray(
          report?.topRiders
        )
          ? report.topRiders
          : [],
      [report]
    );

  const categoryData =
    useMemo(
      () =>
        Array.isArray(
          report?.categoryData
        )
          ? report.categoryData
          : [],
      [report]
    );

  const customerData =
    useMemo(
      () =>
        Array.isArray(
          report?.customerData
        )
          ? report.customerData
          : [],
      [report]
    );

  const partnerSnapshot =
    useMemo(
      () => {

        const verified =
          stores.filter(
            (store) =>
              String(
                store.verificationStatus ||
                ""
              ).toUpperCase() ===
              "VERIFIED"
          ).length;

        const pending =
          stores.filter(
            (store) =>
              String(
                store.verificationStatus ||
                ""
              ).toUpperCase() ===
              "PENDING"
          ).length;

        const suspended =
          stores.filter(
            (store) =>
              String(
                store.storeStatus ||
                ""
              ).toUpperCase() ===
              "SUSPENDED"
          ).length;

        const active =
          stores.filter(
            (store) =>
              String(
                store.storeStatus ||
                ""
              ).toUpperCase() ===
              "ACTIVE"
          ).length;

        const onlineRiders =
          riders.filter(
            (rider) =>
              String(
                rider.availabilityStatus ||
                rider.status ||
                ""
              ).toUpperCase() ===
              "ONLINE"
          ).length;

        return {
          activeStores:
            active,

          pendingStores:
            pending,

          verifiedStores:
            verified,

          suspendedStores:
            suspended,

          totalRiders:
            riders.length,

          totalCustomers:
            customers.length,

          onlineRiders,
        };
      },
      [
        stores,
        riders,
        customers,
      ]
    );

  const showToast =
    (message) => {

      setToast(
        message
      );

      window.clearTimeout(
        window.__maxigoReportsToast
      );

      window.__maxigoReportsToast =
        window.setTimeout(
          () =>
            setToast(""),
          2200
        );
    };

  const exportReport =
    () => {

      const rows =
        currentData.map(
          (item) => [
            item.label,
            item.orders,
            item.sales,
            item.commission,
            item.delivery,
          ]
        );

      const headers = [
        "Period",
        "Orders",
        "Sales",
        "Commission",
        "Delivery Earnings",
      ];

      const csv =
        [
          headers,
          ...rows,
        ]
          .map(
            (row) =>
              row
                .map(
                  (value) =>
                    `"${String(
                      value ??
                      ""
                    ).replaceAll(
                      '"',
                      '""'
                    )}"`
                )
                .join(",")
          )
          .join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        `maxigo-${period}-report.csv`;

      link.click();

      URL.revokeObjectURL(
        url
      );

      showToast(
        "Report CSV exported."
      );
    };

  const maxSales =
    Math.max(
      1,
      ...currentData.map(
        (item) =>
          Number(
            item.sales ||
            0
          )
      )
    );

  if (loading) {
    return (
      <div className="admin-reports-page">

        <div className="report-card">

          <h2>
            Loading reports...
          </h2>

          <p>
            Please wait while real MaxiGo data is loaded.
          </p>

        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-reports-page">

        <div className="report-card">

          <h2>
            Reports error
          </h2>

          <p>
            {
              error
            }
          </p>

          <button
            className="reports-export-btn"
            onClick={() =>
              load(
                period
              )
            }
            style={{
              marginTop:
                14,
            }}
          >
            ↻ Retry
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="admin-reports-page">

      <div className="reports-header">

        <div>

          <h1>
            Reports & Analytics
          </h1>

          <p>
            Track MaxiGo business performance, sales, orders, customers and partners.
          </p>

        </div>

        <div className="reports-header-actions">

          <select
            value={period}
            onChange={(e) =>
              setPeriod(
                e.target.value
              )
            }
          >
            <option value="daily">
              Daily
            </option>

            <option value="weekly">
              Weekly
            </option>

            <option value="monthly">
              Monthly
            </option>
          </select>

          <button
            className="reports-export-btn"
            onClick={
              exportReport
            }
          >
            ⇩ Export Report
          </button>

        </div>

      </div>

      <div className="report-tabs">

        {[
          [
            "overview",
            "Overview",
          ],
          [
            "sales",
            "Sales",
          ],
          [
            "customers",
            "Customers",
          ],
          [
            "partners",
            "Partners",
          ],
        ].map(
          ([key, label]) => (
            <button
              key={key}
              className={
                reportType ===
                key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setReportType(
                  key
                )
              }
            >
              {
                label
              }
            </button>
          )
        )}

      </div>

      <div className="report-stat-grid">

        <div className="report-stat-card">

          <div className="report-stat-icon orders">
            ⌁
          </div>

          <div>

            <span>
              Total Orders
            </span>

            <strong>
              {
                summary.orders.toLocaleString(
                  "en-IN"
                )
              }
            </strong>

            <small>
              Across selected period
            </small>

          </div>

        </div>

        <div className="report-stat-card">

          <div className="report-stat-icon sales">
            ₹
          </div>

          <div>

            <span>
              Total Sales
            </span>

            <strong>
              {
                money(
                  summary.sales
                )
              }
            </strong>

            <small>
              Gross order value
            </small>

          </div>

        </div>

        <div className="report-stat-card">

          <div className="report-stat-icon commission">
            %
          </div>

          <div>

            <span>
              MaxiGo Commission
            </span>

            <strong>
              {
                money(
                  summary.commission
                )
              }
            </strong>

            <small>
              Platform earnings
            </small>

          </div>

        </div>

        <div className="report-stat-card">

          <div className="report-stat-icon delivery">
            ↗
          </div>

          <div>

            <span>
              Delivery Earnings
            </span>

            <strong>
              {
                money(
                  summary.delivery
                )
              }
            </strong>

            <small>
              Rider delivery earnings
            </small>

          </div>

        </div>

        <div className="report-stat-card">

          <div className="report-stat-icon average">
            ◉
          </div>

          <div>

            <span>
              Average Order Value
            </span>

            <strong>
              {
                money(
                  summary.avgOrderValue
                )
              }
            </strong>

            <small>
              Sales ÷ orders
            </small>

          </div>

        </div>

      </div>

      {reportType ===
        "overview" && (
        <>
          <div className="report-main-grid">

            <div className="report-card large">

              <div className="report-card-heading">

                <div>

                  <h2>
                    Sales Trend
                  </h2>

                  <p>
                    {
                      period
                        .charAt(
                          0
                        )
                        .toUpperCase() +
                      period.slice(
                        1
                      )
                    }{" "}
                    performance
                  </p>

                </div>

                <span className="report-heading-badge">
                  Sales
                </span>

              </div>

              <div className="sales-chart">

                {currentData.length >
                0 ? (
                  currentData.map(
                    (
                      item
                    ) => {

                      const value =
                        Number(
                          item.sales ||
                          0
                        );

                      const height =
                        Math.max(
                          12,
                          (
                            value /
                            maxSales
                          ) *
                            100
                        );

                      return (
                        <div
                          className="sales-bar-item"
                          key={
                            item.label
                          }
                        >

                          <div className="sales-bar-value">
                            {
                              money(
                                value
                              )
                            }
                          </div>

                          <div className="sales-bar-track">

                            <div
                              className="sales-bar"
                              style={{
                                height:
                                  `${height}%`,
                              }}
                            />

                          </div>

                          <span>
                            {
                              item.label
                            }
                          </span>

                        </div>
                      );
                    }
                  )
                ) : (
                  <div
                    style={{
                      color:
                        "#8a94a6",
                      fontSize:
                        12,
                    }}
                  >
                    No sales data available for this period.
                  </div>
                )}

              </div>

            </div>

            <div className="report-card">

              <div className="report-card-heading">

                <div>

                  <h2>
                    Category Performance
                  </h2>

                  <p>
                    Sales distribution
                  </p>

                </div>

              </div>

              <div className="category-list">

                {categoryData.length >
                0 ? (
                  categoryData.map(
                    (
                      category
                    ) => (
                      <div
                        className="category-row"
                        key={
                          category.name
                        }
                      >

                        <div className="category-row-top">

                          <strong>
                            {
                              category.name
                            }
                          </strong>

                          <span>
                            {
                              category.share ||
                              0
                            }%
                          </span>

                        </div>

                        <div className="category-progress">

                          <div
                            style={{
                              width:
                                `${category.share || 0}%`,
                            }}
                          />

                        </div>

                        <small>
                          {
                            Number(
                              category.orders ||
                              0
                            ).toLocaleString(
                              "en-IN"
                            )
                          }{" "}
                          orders ·{" "}
                          {
                            money(
                              category.sales
                            )
                          }
                        </small>

                      </div>
                    )
                  )
                ) : (
                  <div
                    style={{
                      color:
                        "#8a94a6",
                      fontSize:
                        12,
                    }}
                  >
                    No category performance data available yet.
                  </div>
                )}

              </div>

            </div>

          </div>

          <div className="report-bottom-grid">

            <div className="report-card">

              <div className="report-card-heading">

                <div>

                  <h2>
                    Top Stores
                  </h2>

                  <p>
                    Highest sales performers
                  </p>

                </div>

              </div>

              <div className="mini-table">

                {topStores.length >
                0 ? (
                  topStores.map(
                    (
                      store,
                      index
                    ) => (
                      <div
                        className="mini-row"
                        key={`${store.storeId || store.name}-${index}`}
                      >

                        <div className="rank">
                          {
                            index +
                            1
                          }
                        </div>

                        <div className="mini-main">

                          <strong>
                            {
                              store.name ||
                              "—"
                            }
                          </strong>

                          <small>
                            {
                              store.category ||
                              "—"
                            }{" "}
                            · ⭐{" "}
                            {
                              store.rating ||
                              "—"
                            }
                          </small>

                        </div>

                        <div className="mini-value">

                          <strong>
                            {
                              money(
                                store.sales
                              )
                            }
                          </strong>

                          <small>
                            {
                              Number(
                                store.orders ||
                                0
                              ).toLocaleString(
                                "en-IN"
                              )
                            }{" "}
                            orders
                          </small>

                        </div>

                      </div>
                    )
                  )
                ) : (
                  <div
                    style={{
                      color:
                        "#8a94a6",
                      fontSize:
                        12,
                    }}
                  >
                    No store performance data available yet.
                  </div>
                )}

              </div>

            </div>

            <div className="report-card">

              <div className="report-card-heading">

                <div>

                  <h2>
                    Top Riders
                  </h2>

                  <p>
                    Highest delivery performance
                  </p>

                </div>

              </div>

              <div className="mini-table">

                {topRiders.length >
                0 ? (
                  topRiders.map(
                    (
                      rider,
                      index
                    ) => (
                      <div
                        className="mini-row"
                        key={`${rider.riderId || rider.name}-${index}`}
                      >

                        <div className="rank">
                          {
                            index +
                            1
                          }
                        </div>

                        <div className="mini-main">

                          <strong>
                            {
                              rider.name ||
                              "—"
                            }
                          </strong>

                          <small>
                            {
                              rider.city ||
                              "—"
                            }{" "}
                            · ⭐{" "}
                            {
                              rider.rating ||
                              "—"
                            }
                          </small>

                        </div>

                        <div className="mini-value">

                          <strong>
                            {
                              Number(
                                rider.deliveries ||
                                0
                              )
                            }{" "}
                            deliveries
                          </strong>

                          <small>
                            {
                              money(
                                rider.earnings
                              )
                            }
                          </small>

                        </div>

                      </div>
                    )
                  )
                ) : (
                  <div
                    style={{
                      color:
                        "#8a94a6",
                      fontSize:
                        12,
                    }}
                  >
                    No rider performance data available yet.
                  </div>
                )}

              </div>

            </div>

          </div>
        </>
      )}

      {reportType ===
        "sales" && (

        <div className="report-section-grid">

          <div className="report-card">

            <div className="report-card-heading">

              <div>

                <h2>
                  Sales Summary
                </h2>

                <p>
                  Period-wise sales performance
                </p>

              </div>

            </div>

            <div className="sales-summary-list">

              {currentData.length >
              0 ? (
                currentData.map(
                  (
                    item
                  ) => (
                    <div
                      className="sales-summary-row"
                      key={
                        item.label
                      }
                    >

                      <strong>
                        {
                          item.label
                        }
                      </strong>

                      <span>
                        {
                          Number(
                            item.orders ||
                            0
                          )
                        }{" "}
                        orders
                      </span>

                      <b>
                        {
                          money(
                            item.sales
                          )
                        }
                      </b>

                    </div>
                  )
                )
              ) : (
                <div
                  style={{
                    color:
                      "#8a94a6",
                    fontSize:
                      12,
                  }}
                >
                  No sales records available for this period.
                </div>
              )}

            </div>

          </div>

          <div className="report-card">

            <div className="report-card-heading">

              <div>

                <h2>
                  Revenue Breakdown
                </h2>

                <p>
                  Selected period
                </p>

              </div>

            </div>

            <div className="revenue-breakdown">

              <div>

                <span>
                  Gross Sales
                </span>

                <strong>
                  {
                    money(
                      summary.sales
                    )
                  }
                </strong>

              </div>

              <div>

                <span>
                  Commission
                </span>

                <strong>
                  {
                    money(
                      summary.commission
                    )
                  }
                </strong>

              </div>

              <div>

                <span>
                  Delivery Earnings
                </span>

                <strong>
                  {
                    money(
                      summary.delivery
                    )
                  }
                </strong>

              </div>

              <div className="highlight">

                <span>
                  Orders
                </span>

                <strong>
                  {
                    summary.orders.toLocaleString(
                      "en-IN"
                    )
                  }
                </strong>

              </div>

            </div>

          </div>

        </div>
      )}

      {reportType ===
        "customers" && (

        <div className="report-card">

          <div className="report-card-heading">

            <div>

              <h2>
                Customer Report
              </h2>

              <p>
                Customer growth and activity overview
              </p>

            </div>

          </div>

          <div className="customer-report-grid">

            {customerData.length >
            0 ? (
              customerData.map(
                (
                  item
                ) => (
                  <div
                    className="customer-report-card"
                    key={
                      item.label
                    }
                  >

                    <span>
                      {
                        item.label
                      }
                    </span>

                    <strong>
                      {
                        Number(
                          item.value ||
                          0
                        ).toLocaleString(
                          "en-IN"
                        )
                      }
                    </strong>

                    <small>
                      {
                        item.note ||
                        ""
                      }{" "}
                      {
                        item.note
                          ? "vs previous period"
                          : ""
                      }
                    </small>

                  </div>
                )
              )
            ) : (
              <div
                style={{
                  color:
                    "#8a94a6",
                  fontSize:
                    12,
                }}
              >
                No customer report data available yet.
              </div>
            )}

          </div>

        </div>
      )}

      {reportType ===
        "partners" && (

        <div className="report-main-grid">

          <div className="report-card large">

            <div className="report-card-heading">

              <div>

                <h2>
                  Top Store Performance
                </h2>

                <p>
                  Store-wise sales and order report
                </p>

              </div>

            </div>

            <div className="partner-report-table">

              <div className="partner-head">

                <span>
                  Store
                </span>

                <span>
                  Category
                </span>

                <span>
                  Orders
                </span>

                <span>
                  Sales
                </span>

                <span>
                  Rating
                </span>

              </div>

              {topStores.length >
              0 ? (
                topStores.map(
                  (
                    store,
                    index
                  ) => (
                    <div
                      className="partner-row"
                      key={`${store.storeId || store.name}-${index}`}
                    >

                      <strong>
                        {
                          store.name ||
                          "—"
                        }
                      </strong>

                      <span>
                        {
                          store.category ||
                          "—"
                        }
                      </span>

                      <span>
                        {
                          Number(
                            store.orders ||
                            0
                          )
                        }
                      </span>

                      <b>
                        {
                          money(
                            store.sales
                          )
                        }
                      </b>

                      <span>
                        ⭐{" "}
                        {
                          store.rating ||
                          "—"
                        }
                      </span>

                    </div>
                  )
                )
              ) : (
                <div
                  style={{
                    color:
                      "#8a94a6",
                    fontSize:
                      12,
                    padding:
                      "16px 0",
                  }}
                >
                  No partner performance data available yet.
                </div>
              )}

            </div>

          </div>

          <div className="report-card">

            <div className="report-card-heading">

              <div>

                <h2>
                  Partner Snapshot
                </h2>

                <p>
                  Quick marketplace metrics
                </p>

              </div>

            </div>

            <div className="partner-snapshot">

              <div>
                <span>
                  Active Stores
                </span>

                <strong>
                  {
                    partnerSnapshot.activeStores
                  }
                </strong>
              </div>

              <div>
                <span>
                  Pending Stores
                </span>

                <strong>
                  {
                    partnerSnapshot.pendingStores
                  }
                </strong>
              </div>

              <div>
                <span>
                  Verified Stores
                </span>

                <strong>
                  {
                    partnerSnapshot.verifiedStores
                  }
                </strong>
              </div>

              <div>
                <span>
                  Suspended Stores
                </span>

                <strong>
                  {
                    partnerSnapshot.suspendedStores
                  }
                </strong>
              </div>

              <div>
                <span>
                  Total Riders
                </span>

                <strong>
                  {
                    partnerSnapshot.totalRiders
                  }
                </strong>
              </div>

              <div>
                <span>
                  Online Riders
                </span>

                <strong>
                  {
                    partnerSnapshot.onlineRiders
                  }
                </strong>
              </div>

            </div>

          </div>

        </div>
      )}

      {toast && (
        <div className="reports-toast">
          {
            toast
          }
        </div>
      )}

    </div>
  );
}

export default Reports;