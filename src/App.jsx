import React, { useEffect, useRef, useState } from "react";

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

  registerAdminFcmToken,

  getAdminOrders,

  toArray,

} from "./api";

import {

  getToken as getFirebaseToken,

  onMessage,

} from "firebase/messaging";

import {

  messaging,

  VAPID_KEY,

} from "./firebase";

function App() {

  // =========================================================

  // GLOBAL NOTIFICATION AUDIO

  // =========================================================

  // Web Audio API notification sound state.
  const notificationAudioContextRef = useRef(null);
  const notificationAudioBufferRef = useRef(null);
  const notificationAudioLoadingRef = useRef(false);
  const notificationAudioUnlockedRef = useRef(false);

  const previousAdminOrderIdsRef = useRef(new Set());

  const firstAdminOrderLoadRef = useRef(true);

  // =========================================================

  // AUTH STATE

  // =========================================================

  const [loggedIn, setLoggedIn] = useState(

    isAdminLoggedIn()

  );

  const [active, setActive] = useState(

    "Dashboard"

  );

  const [adminUser, setAdminUser] = useState(

    getStoredUser()

  );

  // =========================================================

  // UNAUTHORIZED HANDLER

  // =========================================================

  useEffect(() => {

    const handleUnauthorized = () => {

      setLoggedIn(false);

      setAdminUser(null);

      setActive("Dashboard");

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

  // =========================================================

  // LOGIN

  // =========================================================

  const handleLogin = (response) => {

    setAdminUser({

      userId: response?.userId,

      name: response?.name,

      mobile: response?.mobile,

      role: response?.role,

    });

    setLoggedIn(true);

    setActive("Dashboard");

  };

  // =========================================================

  // LOGOUT

  // =========================================================

  const handleLogout = () => {

    clearAdminAuth();

    localStorage.removeItem(

      "maxigo_admin_fcm_token"

    );

    setAdminUser(null);

    setLoggedIn(false);

    setActive("Dashboard");

  };

  // =========================================================

  // ADMIN AUTH CHECK

  // =========================================================

  const token = getToken();

  const role = String(

    adminUser?.role || ""

  ).toUpperCase();

  const hasAdminAccess =

    Boolean(token) &&

    (

      role === "ADMIN" ||

      role === "ROLE_ADMIN"

    );

  // =========================================================

  // NOTIFICATION AUDIO UNLOCK
  // =========================================================
  // Chrome can block HTMLAudioElement.play() until user
  // interaction. Web Audio is unlocked from that interaction
  // and then reused for every foreground notification.
  // =========================================================

  const createNotificationAudioContext = () => {
    if (notificationAudioContextRef.current) {
      return notificationAudioContextRef.current;
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      console.log('Web Audio API is not supported.');
      return null;
    }

    const context = new AudioContextClass();
    notificationAudioContextRef.current = context;
    return context;
  };

  const loadNotificationAudio = async () => {
    if (notificationAudioBufferRef.current) {
      notificationAudioUnlockedRef.current = true;
      return true;
    }

    if (notificationAudioLoadingRef.current) {
      return false;
    }

    notificationAudioLoadingRef.current = true;

    try {
      const context = createNotificationAudioContext();
      if (!context) return false;

      if (context.state === 'suspended') {
        await context.resume();
      }

      const response = await fetch('/notification.mp3', { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`Notification audio HTTP ${response.status}`);
      }

      const audioData = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(audioData);

      notificationAudioBufferRef.current = audioBuffer;
      notificationAudioUnlockedRef.current = true;
      console.log('Notification audio unlocked successfully.');
      return true;
    } catch (error) {
      notificationAudioUnlockedRef.current = false;
      console.error('Notification audio unlock failed:', error);
      return false;
    } finally {
      notificationAudioLoadingRef.current = false;
    }
  };

  const playNotificationSound = async () => {
    try {
      let context = notificationAudioContextRef.current;
      let buffer = notificationAudioBufferRef.current;

      if (!context || !buffer) {
        const loaded = await loadNotificationAudio();
        if (!loaded) return;
        context = notificationAudioContextRef.current;
        buffer = notificationAudioBufferRef.current;
      }

      if (!context || !buffer) return;

      if (context.state === 'suspended') {
        await context.resume();
      }

      const source = context.createBufferSource();
      const gainNode = context.createGain();
      source.buffer = buffer;
      gainNode.gain.value = 1.0;
      source.connect(gainNode);
      gainNode.connect(context.destination);
      source.start(0);

      console.log('MaxiGo notification sound played.');
    } catch (error) {
      console.error('Notification sound playback failed:', error);
    }
  };

  useEffect(() => {
    if (!loggedIn || !hasAdminAccess) return;

    let handled = false;

    const unlockNotificationAudio = async () => {
      if (handled) return;
      handled = true;
      await loadNotificationAudio();
    };

    window.addEventListener('pointerdown', unlockNotificationAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockNotificationAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockNotificationAudio);
      window.removeEventListener('keydown', unlockNotificationAudio);
    };
  }, [loggedIn, hasAdminAccess]);

  // GLOBAL NEW ORDER SOUND FALLBACK

  // =========================================================

  // FCM handles browser-closed notifications.

  // This 5-second API check handles foreground pages such as

  // Dashboard, while Orders.jsx keeps its existing notification

  // logic when the Orders page is active.

  // =========================================================

  useEffect(() => {

    if (!loggedIn || !hasAdminAccess || active === "Orders") {

      return;

    }

    let timer = null;

    let cancelled = false;

    // Each time we enter a non-Orders page, establish a fresh

    // baseline so existing orders do not trigger a sound.

    previousAdminOrderIdsRef.current = new Set();

    firstAdminOrderLoadRef.current = true;

    const checkGlobalNewOrders = async () => {

      try {

        const orderData = await getAdminOrders();

        if (cancelled) return;

        const latestOrders = toArray(orderData);

        const currentIds = new Set(

          latestOrders

            .map((order) => order?.id)

            .filter((id) => id != null)

            .map(String)

        );

        if (firstAdminOrderLoadRef.current) {

          previousAdminOrderIdsRef.current = currentIds;

          firstAdminOrderLoadRef.current = false;

          return;

        }

        const newPlacedOrders = latestOrders.filter((order) => {

          const id = order?.id;

          return (

            id != null &&

            !previousAdminOrderIdsRef.current.has(String(id)) &&

            String(order?.orderStatus || "").toUpperCase() === "PLACED"

          );

        });

        if (newPlacedOrders.length > 0) {
          console.log(
            "Global new order detected:",
            newPlacedOrders.map((order) => order?.id)
          );

          await playNotificationSound();
        }

        previousAdminOrderIdsRef.current = currentIds;

      } catch (error) {

        if (!cancelled) {

          console.error(

            "Global new order check failed:",

            error

          );

        }

      }

    };

    // Establish baseline immediately, then check every 5 seconds.

    checkGlobalNewOrders();

    timer = setInterval(checkGlobalNewOrders, 5000);

    return () => {

      cancelled = true;

      if (timer) {

        clearInterval(timer);

      }

    };

  }, [

    loggedIn,

    hasAdminAccess,

    active,

  ]);

  // =========================================================

  // FIREBASE FCM SETUP

  // =========================================================

  //

  // 1. Register service worker

  // 2. Request notification permission

  // 3. Generate FCM token

  // 4. Send token to Spring Boot backend

  // 5. Listen for foreground messages

  //

  // =========================================================

  useEffect(() => {

    if (

      !loggedIn ||

      !hasAdminAccess

    ) {

      return;

    }

    let unsubscribeMessage = null;

    const setupFirebaseNotifications =

      async () => {

        try {

          // -------------------------------------------------

          // CHECK NOTIFICATION SUPPORT

          // -------------------------------------------------

          if (!("Notification" in window)) {

            console.log(

              "Browser notifications are not supported."

            );

            return;

          }

          // -------------------------------------------------

          // CHECK SERVICE WORKER SUPPORT

          // -------------------------------------------------

          if (!("serviceWorker" in navigator)) {

            console.log(

              "Service Worker is not supported."

            );

            return;

          }

          // -------------------------------------------------

          // REGISTER FIREBASE SERVICE WORKER

          // -------------------------------------------------

          const registration =

            await navigator.serviceWorker.register(

              "/firebase-messaging-sw.js"

            );

          console.log(

            "Firebase Service Worker registered:",

            registration.scope

          );

          // -------------------------------------------------

          // NOTIFICATION PERMISSION

          // -------------------------------------------------

          let permission =

            Notification.permission;

          if (permission === "default") {

            permission =

              await Notification.requestPermission();

          }

          if (permission !== "granted") {

            console.log(

              "Notification permission denied."

            );

            return;

          }

          console.log(

            "Notification permission granted."

          );

          // -------------------------------------------------

          // GET FIREBASE FCM TOKEN

          // -------------------------------------------------

          const fcmToken =

            await getFirebaseToken(

              messaging,

              {

                vapidKey: VAPID_KEY,

                serviceWorkerRegistration:

                  registration,

              }

            );

          if (!fcmToken) {

            console.log(

              "FCM token was not generated."

            );

            return;

          }

          console.log(

            "FCM Token generated successfully."

          );

          // -------------------------------------------------

          // SAVE TOKEN LOCALLY

          // -------------------------------------------------

          localStorage.setItem(

            "maxigo_admin_fcm_token",

            fcmToken

          );

          // -------------------------------------------------

          // REGISTER TOKEN WITH BACKEND

          // -------------------------------------------------

          try {

            const response =

              await registerAdminFcmToken(

                fcmToken

              );

            console.log(

              "FCM token registered with backend:",

              response

            );

          } catch (backendError) {

            console.error(

              "FCM token backend registration failed:",

              backendError

            );

          }

          // -------------------------------------------------

          // FOREGROUND FCM MESSAGE

          // -------------------------------------------------

          unsubscribeMessage =

            onMessage(

              messaging,

              async (payload) => {

                console.log(

                  "Foreground FCM message:",

                  payload

                );

                // -------------------------------------------

                // PLAY NOTIFICATION SOUND
                // -------------------------------------------

                await playNotificationSound();

                // SHOW FOREGROUND NOTIFICATION

                // -------------------------------------------

                const title =

                  payload?.data?.title ||

                  payload?.notification?.title ||

                  "MaxiGo - New Order";

                const body =

                  payload?.data?.body ||

                  payload?.notification?.body ||

                  "A new order has been received.";

                if (

                  Notification.permission ===

                  "granted"

                ) {

                  new Notification(

                    title,

                    {

                      body,

                      icon:

                        "/maxigo-admin-logo.png",

                      badge:

                        "/maxigo-admin-logo.png",

                    }

                  );

                }

                // -------------------------------------------

                // OPEN ORDERS PAGE

                // -------------------------------------------

                const orderId =

                  payload?.data?.orderId;

                if (orderId) {

                  console.log(

                    "New order received:",

                    orderId

                  );

                }

              }

            );

        } catch (error) {

          console.error(

            "Firebase notification setup failed:",

            error

          );

        }

      };

    setupFirebaseNotifications();

    // =======================================================

    // CLEANUP

    // =======================================================

    return () => {

      if (unsubscribeMessage) {

        unsubscribeMessage();

      }

    };

  }, [

    loggedIn,

    hasAdminAccess,

  ]);

  // =========================================================

  // LOGIN PAGE

  // =========================================================

  if (

    !loggedIn ||

    !hasAdminAccess

  ) {

    return (

      <Login

        onLogin={handleLogin}

      />

    );

  }

  // =========================================================

  // MENU ITEMS

  // =========================================================

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

  // =========================================================

  // RENDER PAGE

  // =========================================================

  const renderPage = () => {

    switch (active) {

      case "Dashboard":

        return <Dashboard />;

      case "Orders":

        return <Orders />;

      case "Customers":

        return <Customers />;

      case "Riders":

        return <Riders />;

      case "Stores":

        return <Stores />;

      case "Products":

        return <Products />;

      case "Offers":

        return <Offers />;

      case "Categories":

        return <Categories />;

      case "Payments":

        return <Payments />;

      case "Payouts":

        return <Patyout />;

      case "Reports":

        return <Reports />;

      case "Commission":

        return <CommissionSettings />;

      default:

        return <Dashboard />;

    }

  };

  // =========================================================

  // ADMIN UI

  // =========================================================

  return (

    <div className="admin-layout">


      {/* ===================================================

          SIDEBAR

      =================================================== */}

      <aside className="admin-sidebar">

        {/* LOGO */}

        <div className="admin-logo-section">

          <img

            src="/maxigo-admin-logo.png"

            alt="MaxiGo Admin"

            className="admin-logo"

          />

        </div>

        {/* MENU */}

        <nav className="admin-menu">

          {menuItems.map(

            (item) => (

              <button

                key={item.name}

                type="button"

                className={`admin-menu-item ${

                  active === item.name

                    ? "active"

                    : ""

                }`}

                onClick={() =>

                  setActive(item.name)

                }

              >

                <span className="menu-icon">

                  {item.icon}

                </span>

                <span className="menu-text">

                  {item.name}

                </span>

              </button>

            )

          )}

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="admin-sidebar-bottom">

          <div

            style={{

              padding: "10px 14px",

              marginBottom: "8px",

              borderTop:

                "1px solid rgba(255,255,255,0.10)",

            }}

          >

            <div

              style={{

                fontSize: "14px",

                fontWeight: "700",

                color: "#ffffff",

                overflow: "hidden",

                textOverflow: "ellipsis",

                whiteSpace: "nowrap",

              }}

            >

              {adminUser?.name || "Admin"}

            </div>

            <div

              style={{

                fontSize: "11px",

                color:

                  "rgba(255,255,255,0.60)",

                marginTop: "3px",

              }}

            >

              {adminUser?.mobile || ""}

            </div>

          </div>

          {/* LOGOUT */}

          <button

            type="button"

            className="admin-logout"

            onClick={handleLogout}

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

      {/* ===================================================

          MAIN CONTENT

      =================================================== */}

      <main className="admin-main">

        {renderPage()}

      </main>

    </div>

  );

}

export default App;
