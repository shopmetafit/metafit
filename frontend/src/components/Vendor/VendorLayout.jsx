import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BarChart3,
  Package,
  ShoppingCart,
  DollarSign,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import Topbar from "../Layout/Topbar";
import Footer from "../common/Footer";
import WhatsAppChat from "../common/WhatsAppChat";

const VendorLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Redirect if not a vendor
  if (!user || user.role !== "vendor") {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => location.pathname.includes(path);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/vendor/dashboard",
      icon: BarChart3,
    },
    {
      name: "Products",
      path: "/vendor/products",
      icon: Package,
    },
    {
      name: "Orders",
      path: "/vendor/orders",
      icon: ShoppingCart,
    },
    {
      name: "Earnings",
      path: "/vendor/earnings",
      icon: DollarSign,
    },
  ];

  return (
    <>
      <Topbar />
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-white shadow-lg transition-all duration-300 flex flex-col`}
        >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1
              className={`font-bold text-2xl text-blue-600 ${
                !sidebarOpen && "hidden"
              }`}
            >
              Vendor
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? "bg-blue-100 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-4 py-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700">
                {user?.vendorName || user?.name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          )}
          <button
            onClick={() => {
              // Handle logout
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
      <WhatsAppChat />
    </>
  );
};

export default VendorLayout;
