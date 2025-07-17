import {
  HiShoppingBag,
  HiOutlineCreditCard,
  HiArrowsExpand,
} from "react-icons/hi";

const FeaturesSection = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {/* feature 1 */}

        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full mb-4">
            <HiShoppingBag className="text-xl" />
          </div>
          <h4 className="tracking-tighter mb-2">Free national shipping</h4>
          <p className="text-gray-600 text-sm tracking-tighter">
            On al orders over Rs100
          </p>
        </div>
        {/* feature 2 */}

        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full mb-4">
            <HiArrowsExpand className="text-xl" />
          </div>
          <h4 className="tracking-tighter mb-2">10 DAYS RETURN</h4>
          <p className="text-gray-600 text-sm tracking-tighter">
            MONEY BACK GUARANTEE
          </p>
        </div>
        {/* feature 3 */}

        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full mb-4">
            <HiOutlineCreditCard className="text-xl" />
          </div>
          <h4 className="tracking-tighter mb-2">SECURE CHECKOUT</h4>
          <p className="text-gray-600 text-sm tracking-tighter">
            100% SECURE CHECK OUT
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
