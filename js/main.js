// TOPPEN AV main.js: Importera Firebase Modular SDK-funktioner
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase-konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyCvrXL_n-YNgtxwXegG0BzkHu9_CJUPiDU",
  authDomain: "training-d1d9d.firebaseapp.com",
  projectId: "training-d1d9d",
  storageBucket: "training-d1d9d.firebasestorage.app",
  messagingSenderId: "813923749374",
  appId: "1:813923749374:web:7e301c4970d77893f7c4af",
  measurementId: "G-KPV09FMJB7"
};

// Initiera Firebase-app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// ==============================================================================
// DOMContentLoaded listener
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const loginSection = document.getElementById("login");
  const contentSection = document.getElementById("content");
  const logoutBtn = document.getElementById("logoutBtn");

  // ==========================
  // LOGIN
  // ==========================
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      loginError.textContent = "";

      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          loginSection.style.display = "none";
          contentSection.style.display = "block";

          // Visa välkomst-sektion
          document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
          document.getElementById("welcome").classList.add("active");

          // Ladda data
          loadPassMenu();
          loadData();
          loadLatestWeight();
          loadMuscleGroups();
        })
        .catch(error => {
          loginError.textContent = error.message;
        });
    });
  }

  // ==========================
  // LOGOUT
  // ==========================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        console.log("Användare utloggad.");
      }).catch((error) => {
        console.error("Fel vid utloggning:", error);
        alert("Ett fel uppstod vid utloggning: " + error.message);
      });
    });
  }

  // ==========================
  // Auth State
  // ==========================
  onAuthStateChanged(auth, user => {
    if (user) {
      // Inloggad
      loginSection.style.display = "none";
      contentSection.style.display = "block";

      // Visa välkomst-sektion
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
      document.getElementById("welcome").classList.add("active");

      loadPassMenu();
      loadData();
      loadLatestWeight();
      loadMuscleGroups();
    } else {
      // Utloggad
      loginSection.style.display = "block";
      contentSection.style.display = "none";
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
    }
  });

  // Resten av din kod (loadData, loadMuscleGroups, loadPassMenu, vilo-timer, etc.)
});
