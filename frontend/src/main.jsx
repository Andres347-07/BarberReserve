import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferenciasProvider } from "./contexts/PreferenciasContext";
import AvisoServidor from "./components/common/AvisoServidor";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PreferenciasProvider>
      <AuthProvider>
        <App />
        <AvisoServidor />
      </AuthProvider>
    </PreferenciasProvider>
  </React.StrictMode>
);
