import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import MergePage from "./pages/MergePage";
import SplitPage from "./pages/SplitPage";
import CompressPage from "./pages/CompressPage";
import ConvertPage from "./pages/ConvertPage";
import EditPage from "./pages/EditPage";
import PageNumbersPage from "./pages/PageNumbersPage";
import WatermarkPage from "./pages/WatermarkPage";
import ProtectPage from "./pages/ProtectPage";
import UnlockPage from "./pages/UnlockPage";
import NotFoundPage from "./components/NotFoundPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/merge" element={<MergePage />} />
        <Route path="/split" element={<SplitPage />} />
        <Route path="/compress" element={<CompressPage />} />
        <Route path="/convert" element={<ConvertPage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/page-numbers" element={<PageNumbersPage />} />
        <Route path="/watermark" element={<WatermarkPage />} />
        <Route path="/protect" element={<ProtectPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
