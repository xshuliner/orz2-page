import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Orz2LandingPage from "./components/Orz2LandingPage";
import MemberDetailPage from "./components/MemberDetailPage";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Orz2LandingPage />} />
          <Route path="/member" element={<MemberDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
