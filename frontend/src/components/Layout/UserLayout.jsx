import { Outlet } from "react-router-dom";
import Footer from "../common/Footer";
import Header from "../common/Header";
import WhatsAppChat from "../common/WhatsAppChat";

const UserLayout = () => {
  return (
    <>
      <Header />
      <main>
        <Outlet/>
      </main>
      <Footer />
      <WhatsAppChat />
    </>
  );
};

export default UserLayout;
