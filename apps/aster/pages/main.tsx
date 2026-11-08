import { createRoot } from "react-dom/client";
import { PortfolioApp } from "../components/portfolio-app";
import "../app/globals.css";
import "./pages.css";

createRoot(document.getElementById("root")!).render(
  <PortfolioApp localOnly appBase={import.meta.env.BASE_URL} />,
);
