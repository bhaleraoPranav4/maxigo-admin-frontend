import React, {
  useEffect,
  useState,
} from "react";

import "./App.css";

import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Customers from "./Customers";
import Riders from "./Riders";
import Stores from "./Stores";
import Products from "./Products";
import Offers from "./Offers";
import Categories from "./Categories";
import Payments from "./Payments";
import Patyout from "./Patyout";
import Reports from "./Reports";
import CommissionSettings from "./CommissionSettings";

import Login from "./Login";

import {
  getStoredUser,
  getToken,
  clearAdminAuth,
  isAdminLoggedIn,
} from "./api";

function App() {
  const [
    loggedIn,
    setLoggedIn,
  ] = useState(
    isAdminLoggedIn()
  );

  const [
    active,
    setActive,
  ] = useState(
    "Dashboard"
  );

  const [
    adminUser,
    setAdminUser,
  ] = useState(
    getStoredUser()
  );

  useEffect(() => {
    const handleUnauthorized =
      () => {
        setLoggedIn(false);
        setAdminUser(null);
        setActive(
          "Dashboard"
        );
      };

    window.addEventListener(
      "maxigo-admin-logout",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "maxigo-admin-logout",
        handleUnauthorized
      );
    };
  }, []);

  const handleLogin = (
    response
  ) => {
    setAdminUser({
      userId:
        response?.userId,
      name:
        response?.name,
      mobile:
        response?.mobile,
      role:
        response?.role,
    });

    setLoggedIn(
      true
    );

    setActive(
      "Dashboard"
    );
  };

  const handleLogout = () => {
    clearAdminAuth();

    setAdminUser(
      null
    );

    setLoggedIn(
      false
    );

    setActive(
      "Dashboard"
    );
  };

  const token =
    getToken();

  const role =
    String(
      adminUser?.role || ""
    ).toUpperCase();

  const hasAdminAccess =
    Boolean(token) &&
    (
      role === "ADMIN" ||
      role === "ROLE_ADMIN"
    );

  if (
    !loggedIn ||
    !hasAdminAccess
  ) {
    return (
      <Login
        onLogin={
          handleLogin
        }
      />
    );
  }

  const menuItems = [
    {
      name: "Dashboard",
      icon: "📊",
    },
    {
      name: "Orders",
      icon: "🛒",
    },
    {
      name: "Customers",
      icon: "👤",
    },
    {
      name: "Riders",
      icon: "🛵",
    },
    {
      name: "Stores",
      icon: "🏪",
    },
    {
      name: "Products",
      icon: "📦",
    },

    // =========================
    // OFFERS - NEW
    // =========================
    {
      name: "Offers",
      icon: "🎁",
    },

    {
      name: "Categories",
      icon: "🏷️",
    },
    {
      name: "Payments",
      icon: "💳",
    },
    {
      name: "Payouts",
      icon: "💰",
    },
    {
      name: "Reports",
      icon: "📈",
    },
    {
      name: "Commission",
      icon: "%",
    },
  ];

  const renderPage =
    () => {
      switch (
        active
      ) {
        case "Dashboard":
          return (
            <Dashboard />
          );

        case "Orders":
          return (
            <Orders />
          );

        case "Customers":
          return (
            <Customers />
          );

        case "Riders":
          return (
            <Riders />
          );

        case "Stores":
          return (
            <Stores />
          );

        case "Products":
          return (
            <Products />
          );

        // =========================
        // OFFERS - NEW
        // =========================
        case "Offers":
          return (
            <Offers />
          );

        case "Categories":
          return (
            <Categories />
          );

        case "Payments":
          return (
            <Payments />
          );

        case "Payouts":
          return (
            <Patyout />
          );

        case "Reports":
          return (
            <Reports />
          );

        case "Commission":
          return (
            <CommissionSettings />
          );

        default:
          return (
            <Dashboard />
          );
      }
    };

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        <div className="admin-logo-section">

          <img
            src="/maxigo-admin-logo.png"
            alt="MaxiGo Admin"
            className="admin-logo"
          />

        </div>

        <nav className="admin-menu">

          {menuItems.map(
            (item) => (
              <button
                key={
                  item.name
                }
                type="button"
                className={`admin-menu-item ${
                  active ===
                  item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActive(
                    item.name
                  )
                }
              >

                <span className="menu-icon">
                  {
                    item.icon
                  }
                </span>

                <span className="menu-text">
                  {
                    item.name
                  }
                </span>

              </button>
            )
          )}

        </nav>

        <div className="admin-sidebar-bottom">

          <div
            style={{
              padding:
                "10px 14px",
              marginBottom:
                "8px",
              borderTop:
                "1px solid rgba(255,255,255,0.10)",
            }}
          >

            <div
              style={{
                fontSize:
                  "14px",
                fontWeight:
                  "700",
                color:
                  "#ffffff",
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >
              {
                adminUser?.name ||
                "Admin"
              }
            </div>

            <div
              style={{
                fontSize:
                  "11px",
                color:
                  "rgba(255,255,255,0.60)",
                marginTop:
                  "3px",
              }}
            >
              {
                adminUser?.mobile ||
                ""
              }
            </div>

          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={
              handleLogout
            }
          >

            <span className="menu-icon">
              🚪
            </span>

            <span className="menu-text">
              Logout
            </span>

          </button>

        </div>

      </aside>

      <main className="admin-main">
        {
          renderPage()
        }
      </main>

    </div>
  );
}

export default App;