import { Outlet } from "react-router-dom";
import Footer from "../common/Footer";
import Header from "../common/Header";
import WhatsAppChat from "../common/WhatsAppChat";
import MobileBottomNav from "../common/MobileBottomNav";

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden relative">
      <Header />
      <main className="flex-grow pb-16 md:pb-0 w-full overflow-x-hidden">
        <Outlet/>
      </main>
      <Footer />
      <WhatsAppChat />
      <MobileBottomNav />
    </div>
  );
};

export default UserLayout;
