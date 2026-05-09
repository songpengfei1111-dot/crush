import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./shared/styles/base.css";
import "./shared/styles/layout.css";
import "./features/session/session.css";
import "./features/message/message.css";
import "./features/composer/composer.css";
import "./features/permission/permission.css";
import "./features/settings/settings.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
