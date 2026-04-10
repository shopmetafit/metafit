import { X, ShoppingCart, ShieldCheck, Truck } from "lucide-react";
import CartContents from "../Cart/CartContents";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const CartDrawer = ({ drawerOpen, togglerCartOpen }) => {
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const userId = user ? user._id : null;

  const itemCount = cart?.products?.reduce((t, p) => t + p.quantity, 0) || 0;
  const subtotal = cart?.totalPrice ?? 0;
  const deliveryCharge = subtotal >= 999 ? 0 : 30;
  const total = subtotal + deliveryCharge;

  const handleCheckout = () => {
    togglerCartOpen();
    if (!user) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={togglerCartOpen}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-[#232f3e] text-white px-4 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-base font-bold">
              Cart{itemCount > 0 && <span className="ml-1 text-teal-300">({itemCount} items)</span>}
            </h2>
          </div>
          <button
            onClick={togglerCartOpen}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free shipping banner */}
        {subtotal > 0 && subtotal < 999 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 font-medium flex items-center gap-2 flex-shrink-0">
            <Truck className="h-3.5 w-3.5 flex-shrink-0" />
            Add ₹{(999 - subtotal).toLocaleString()} more for free delivery!
          </div>
        )}
        {subtotal >= 999 && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-xs text-green-700 font-medium flex items-center gap-2 flex-shrink-0">
            <Truck className="h-3.5 w-3.5 flex-shrink-0" />
            You qualify for free delivery!
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4">
          {cart && cart.products?.length > 0 ? (
            <CartContents cart={cart} userId={userId} guestId={guestId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <ShoppingCart className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-gray-600 font-semibold mb-1">Your cart is empty</p>
              <p className="text-gray-400 text-sm mb-6">Add items to get started</p>
              <button
                onClick={togglerCartOpen}
                className="px-6 py-2.5 bg-[#0FB7A3] hover:bg-[#0DA28E] text-white font-semibold rounded-full text-sm transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* Footer: Summary + Checkout */}
        {cart && cart.products?.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-4 space-y-3">
            {/* Price summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={deliveryCharge === 0 ? "text-green-600 font-medium" : "font-medium"}>
                  {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
                <span>Order Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full bg-[#0FB7A3] hover:bg-[#0DA28E] text-white py-3 rounded-full font-bold text-sm transition-colors shadow-md"
            >
              Proceed to Checkout
            </button>

            {/* Continue shopping */}
            <button
              onClick={togglerCartOpen}
              className="w-full text-center text-sm text-[#047ca8] hover:underline font-medium"
            >
              Continue Shopping
            </button>

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span>Secure & encrypted checkout</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
