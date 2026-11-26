import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Room } from "./pages/Room";
import "./index.css";
import "./styles/lol.css";
import "./styles/themes.css"; // ДО lol.css, если он остался
import "./styles/lol.css"; // оставить для LoadingScreen

// оборачиваем приложение
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>,
);
