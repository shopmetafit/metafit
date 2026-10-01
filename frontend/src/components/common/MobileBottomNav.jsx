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
    <div className="fixed bottom-0 left-0 right-0 bg-[#3A0610] border-t border-[#D4A017]/30 z-50 md:hidden pb-safe shadow-lg">
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
              className={`flex flex-col items-center flex-1 gap-0.5 py-0.5 transition-colors relative ${isActive ? "text-[#F2C94C]" : "text-[#FFF8E7]/80 hover:text-[#FFF8E7]"
                }`}
            >
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#D4A017] rounded-full shadow-[0_0_6px_#D4A017]" />
              )}
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[#F2C94C]" : "stroke-[#FFF8E7]/80"}`} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#F2C94C]" : "text-[#FFF8E7]/80"}`}>
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
