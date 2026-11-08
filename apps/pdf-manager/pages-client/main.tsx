import { createRoot } from "react-dom/client";
import { PDFWorkbench } from "../app/workbench";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(<PDFWorkbench />);
