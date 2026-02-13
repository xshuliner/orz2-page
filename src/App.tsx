import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/src/components/Layout";
import Orz2LandingPage from "@/src/pages/Orz2LandingPage";
import MemberDetailPage from "@/src/pages/MemberDetailPage";
import MemberListPage from "@/src/pages/MemberListPage";
import DemoMarqueePage from "@/src/pages/DemoMarqueePage";
import "@/src/index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Orz2LandingPage />} />
          <Route path="/member-detail" element={<MemberDetailPage />} />
          <Route path="/member-list" element={<MemberListPage />} />
          <Route path="/demo/marquee" element={<DemoMarqueePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
