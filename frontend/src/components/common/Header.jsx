import { useState } from "react";
import Topbar from "../Layout/Topbar";
import Navbar from "./Navbar";
import MobileNavDrawer from "./MobileNavDrawer";

const Header = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 shadow-lg">
      <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
      <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
      <MobileNavDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </header>
  );
};

export default Header;
