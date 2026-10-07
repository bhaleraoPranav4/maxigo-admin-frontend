import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDQg8HwxXTvxDdadwdfbyuhsUmrRI8UbLE",
  authDomain: "maxigo-98598.firebaseapp.com",
  projectId: "maxigo-98598",
  storageBucket: "maxigo-98598.firebasestorage.app",
  messagingSenderId: "237028561931",
  appId: "1:237028561931:web:84f162dd73c1c90e00e30e",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

export const VAPID_KEY = "BAasyDuqi97lLFTfi8wyt8rsvJGA17xtBTmqc9HpzbHxZDNdUDuxhLxavStRoL5JHsr7DKnTIcJId2ogLSUF2q0";