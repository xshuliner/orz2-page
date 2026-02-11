import { Outlet } from "react-router-dom";
// import CopyrightFooter from "./CopyrightFooter";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      {/* <CopyrightFooter /> */}
    </div>
  );
}
