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
    <section className="w-full my-1">
      {/* 
        Borderless & Seamless Navratri Banner Strip:
        - ZERO card borders, frames, or shadows
        - ZERO inner padding / dark container margins (p-0, bg-transparent)
        - Full-bleed edge-to-edge image scaling (scale-[1.08] object-cover)
        - Clean grid layout matching image proportions seamlessly
      */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-1.5 sm:gap-2 items-stretch w-full lg:h-[340px] xl:h-[380px] 2xl:h-[410px]">
        {/* 20% OFF BANNER (LEFT) */}
        <div
          onClick={handle20PercentClick}
          className="order-2 lg:order-1 col-span-1 lg:col-span-3 group relative rounded-none overflow-hidden cursor-pointer border-0 p-0 m-0 w-full h-[160px] sm:h-[220px] lg:h-full flex items-center justify-center bg-transparent"
          title="Navratri 20% OFF Offers"
        >
          <img
            src="/navratri-20-off.png"
            alt="Navratri 20% off wellness offers"
            className="w-full h-full object-cover scale-[1.08] transition-all duration-300 group-hover:scale-[1.10] group-hover:brightness-[1.03]"
            loading="eager"
          />
        </div>

        {/* 40-60% OFF BANNER (MIDDLE) */}
        <div
          onClick={handle40To60PercentClick}
          className="order-3 lg:order-2 col-span-1 lg:col-span-3 group relative rounded-none overflow-hidden cursor-pointer border-0 p-0 m-0 w-full h-[160px] sm:h-[220px] lg:h-full flex items-center justify-center bg-transparent"
          title="Navratri 40% to 60% OFF Offers"
        >
          <img
            src="/navratri-40-60-off.png"
            alt="Navratri 40 to 60 percent off wellness offers"
            onError={(e) => {
              e.currentTarget.src = "/navratri-40-off.png";
            }}
            className="w-full h-full object-cover scale-[1.08] transition-all duration-300 group-hover:scale-[1.10] group-hover:brightness-[1.03]"
            loading="eager"
          />
        </div>

        {/* NAVRATRI + DANDIYA BANNER (RIGHT) */}
        <div
          onClick={handleDandiyaClick}
          className="order-1 lg:order-3 col-span-2 lg:col-span-6 group relative rounded-none overflow-hidden cursor-pointer border-0 p-0 m-0 w-full h-[200px] sm:h-[280px] lg:h-full flex items-center justify-center bg-transparent"
          title="Shubh Navratri Dandiya Celebration"
        >
          <img
            src="/navratri-dandiya.png"
            alt="Shubh Navratri Dandiya celebration"
            className="w-full h-full object-cover scale-[1.08] transition-all duration-300 group-hover:scale-[1.10] group-hover:brightness-[1.03]"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};

export default NavratriBannerSection;
