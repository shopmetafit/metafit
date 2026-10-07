import { useNavigate } from "react-router-dom";

const NavratriBannerSection = () => {
  const navigate = useNavigate();

  const handle20PercentClick = () => {
    navigate("/collections/all?discount=20");
  };

  const handle40To60PercentClick = () => {
    navigate("/collections/all?discountMin=40&discountMax=60");
  };

  const handleDandiyaClick = () => {
    navigate("/collections/all");
  };

  return (
    <section className="w-full my-1.5 sm:my-2">
      {/* 
        Borderless & Seamless Navratri Banner Strip:
        - Full uncropped artwork preservation (zero cropping of "SHUBH NAVRATRI" or CTAs)
        - Clean responsive grid layout matching native image proportions seamlessly
        - Mobile: Full-width main celebration banner on top, 20% & 40-60% offers side-by-side below
        - Desktop: 20% OFF (col-3), 40-60% OFF (col-3), Dandiya Celebration (col-6) side-by-side
      */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2 lg:gap-2.5 items-stretch w-full">
        {/* 20% OFF BANNER (LEFT) */}
        <div
          onClick={handle20PercentClick}
          className="order-2 lg:order-1 col-span-1 lg:col-span-3 group relative rounded-lg sm:rounded-xl overflow-hidden cursor-pointer border-0 p-0 m-0 w-full flex items-center justify-center bg-transparent"
          title="Navratri 20% OFF Offers"
        >
          <img
            src="/navratri-20-off.png"
            alt="Navratri 20% off wellness offers"
            className="w-full h-auto max-h-full object-contain object-center transition-all duration-300 group-hover:brightness-[1.03]"
            loading="eager"
          />
        </div>

        {/* 40-60% OFF BANNER (MIDDLE) */}
        <div
          onClick={handle40To60PercentClick}
          className="order-3 lg:order-2 col-span-1 lg:col-span-3 group relative rounded-lg sm:rounded-xl overflow-hidden cursor-pointer border-0 p-0 m-0 w-full flex items-center justify-center bg-transparent"
          title="Navratri 40% to 60% OFF Offers"
        >
          <img
            src="/navratri-40-60-off.png"
            alt="Navratri 40 to 60 percent off wellness offers"
            onError={(e) => {
              e.currentTarget.src = "/navratri-40-off.png";
            }}
            className="w-full h-auto max-h-full object-contain object-center transition-all duration-300 group-hover:brightness-[1.03]"
            loading="eager"
          />
        </div>

        {/* NAVRATRI + DANDIYA BANNER (RIGHT) */}
        <div
          onClick={handleDandiyaClick}
          className="order-1 lg:order-3 col-span-2 lg:col-span-6 group relative rounded-lg sm:rounded-xl overflow-hidden cursor-pointer border-0 p-0 m-0 w-full flex items-center justify-center bg-transparent"
          title="Shubh Navratri Dandiya Celebration"
        >
          <img
            src="/navratri-dandiya.png"
            alt="Shubh Navratri Dandiya celebration"
            className="w-full h-auto max-h-full object-contain object-center transition-all duration-300 group-hover:brightness-[1.03]"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};

export default NavratriBannerSection;
