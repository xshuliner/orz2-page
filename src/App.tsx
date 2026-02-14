import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/src/components/Layout";
import "@/src/index.css";

// 按路由懒加载页面，首屏只加载首页块，其余路由访问时再加载
const Orz2LandingPage = lazy(() => import("@/src/pages/Orz2LandingPage"));
const MemberDetailPage = lazy(() => import("@/src/pages/MemberDetailPage"));
const MemberListPage = lazy(() => import("@/src/pages/MemberListPage"));
const DemoMarqueePage = lazy(() => import("@/src/pages/DemoMarqueePage"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span className="text-stone-400">加载中…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Orz2LandingPage />} />
            <Route path="/member-detail" element={<MemberDetailPage />} />
            <Route path="/member-list" element={<MemberListPage />} />
            <Route path="/demo/marquee" element={<DemoMarqueePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
