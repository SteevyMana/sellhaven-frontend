import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useIsMobile } from "../hooks/useIsMobile";

function AdminLayout({ children }) {

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // En mobile el sidebar no empuja el contenido — flota encima como drawer.
  const sidebarWidth = isMobile ? "0px" : (collapsed ? "70px" : "250px");

  return (
    <div>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div style={{ marginLeft: sidebarWidth, transition: "margin-left 0.25s ease" }}>

        <Navbar isMobile={isMobile} onOpenMenu={() => setMobileOpen(true)} />

        <div style={{ padding: isMobile ? "16px" : "30px" }}>
          {children}
        </div>

      </div>

    </div>
  );
}

export default AdminLayout;