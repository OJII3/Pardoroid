import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";
import { Toaster } from "./components/ui/sonner";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
		<Toaster />
	</React.StrictMode>,
);
