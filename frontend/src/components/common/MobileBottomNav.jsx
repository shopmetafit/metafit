import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Tag, Package, User } from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Categories", icon: LayoutGrid, path: "/?sidebar=true" },
    // { label: "Deals", icon: Tag, path: "/collections/all?category=deals" }, 
    { label: "Orders", icon: Package, path: "/my-orders" },
    { label: "Account", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden pb-safe">
      <div className="flex justify-between items-center px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;

          const isHomeOrCollection = location.pathname === "/" || location.pathname.startsWith("/collections");

          if (item.label === "Home") {
            isActive = isHomeOrCollection && !location.search.includes("sidebar=true");
          } else if (item.label === "Categories") {
            isActive = isHomeOrCollection && location.search.includes("sidebar=true");
          } else {
            isActive = location.pathname === item.path || (item.path !== '/' && !item.path.includes('?') && location.pathname.startsWith(item.path));
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center flex-1 gap-1 ${isActive ? "text-[#0FB7A3]" : "text-gray-500 hover:text-gray-800"
                }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "stroke-[#0FB7A3]" : ""}`} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#0FB7A3]" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
