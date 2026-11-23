import { X, ShoppingCart, ShieldCheck, Heart, Trash2 } from "lucide-react";
import CartContents from "../Cart/CartContents";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchCart } from "../../redux/slices/cartSlice";
import { removeFromWishlist } from "../../redux/slices/wishlistSlice";
import { trackMetaEvent } from "../../lib/meta-pixel";

const CartDrawer = ({ drawerOpen, togglerCartOpen, activeTab = 'cart', setActiveTab }) => {
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const wishlist = useSelector((state) => state.wishlist || { products: [] });
  const userId = user ? user._id : null;
  const dispatch = useDispatch();

  useEffect(() => {
    if (drawerOpen && (userId || guestId)) {
      dispatch(fetchCart({ userId, guestId }));
    }
  }, [drawerOpen, dispatch, userId, guestId]);

  const itemCount = cart?.products?.reduce((t, p) => t + p.quantity, 0) || 0;
  const wishlistCount = wishlist?.products?.length || 0;
  const subtotal = cart?.totalPrice ?? 0;
  const total = subtotal;

  const handleCheckout = () => {
    if (cart?.products?.length > 0) {
      trackMetaEvent("InitiateCheckout", {
        content_ids: cart.products.map((p) => p.productId || p._id),
        content_type: "product",
        num_items: itemCount,
        value: subtotal,
        currency: "INR",
      });
    }
    togglerCartOpen();
    navigate("/checkout");
  };

  const renderWishlist = () => {
    if (!wishlist || wishlist.products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-10">
          <Heart className="h-16 w-16 text-gray-200 mb-4" />
          <p className="text-gray-600 font-semibold mb-1">Your wishlist is empty</p>
          <p className="text-gray-400 text-sm mb-6">Save items you love here</p>
          <button
            onClick={togglerCartOpen}
            className="px-6 py-2.5 bg-[#A5794F] hover:bg-[#6E5136] text-white font-semibold rounded-full text-sm transition-colors"
          >
            Explore Products
          </button>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {wishlist.products.map((product) => (
          <div key={product._id} className="flex gap-3 py-4">
            <Link to={`/product/${product._id}`} className="flex-shrink-0" onClick={togglerCartOpen}>
              <img
                src={product.images && product.images.length > 0 && product.images[0].url ? product.images[0].url : "https://cdn-icons-png.flaticon.com/512/4076/4076504.png"}
                alt={product.name}
                className="w-20 h-20 object-contain rounded-lg border border-gray-100 bg-gray-50"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/product/${product._id}`}
                className="text-sm font-semibold text-gray-900 hover:text-[#A5794F] line-clamp-2 leading-snug"
                onClick={togglerCartOpen}
              >
                {product.name}
              </Link>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-sm font-bold text-gray-900">
                  ₹{(product.price || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => dispatch(removeFromWishlist({ productId: product._id, user }))}
                className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    );
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
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="bg-herb-ink text-[#F7F1E7] px-4 pt-4 pb-0 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-[#F7F1E7]">
              {activeTab === 'cart' ? <ShoppingCart className="h-5 w-5 text-[#E5C79A]" /> : <Heart className="h-5 w-5 text-[#E5C79A]" />}
              {activeTab === 'cart' ? 'Cart' : 'Wishlist'}
            </h2>
            <button
              onClick={togglerCartOpen}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#F7F1E7]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab && setActiveTab('cart')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'cart' ? 'border-[#A5794F] text-[#E5C79A]' : 'border-transparent text-[#F7F1E7]/70 hover:text-[#F7F1E7]'}`}
            >
              Cart {itemCount > 0 && `(${itemCount})`}
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('wishlist')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'wishlist' ? 'border-[#A5794F] text-[#E5C79A]' : 'border-transparent text-[#F7F1E7]/70 hover:text-[#F7F1E7]'}`}
            >
              Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 bg-[#FDFBF6]">
          {activeTab === 'cart' ? (
            cart && cart.products?.length > 0 ? (
              <CartContents cart={cart} userId={userId} guestId={guestId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <ShoppingCart className="h-16 w-16 text-[#A5794F]/40 mb-4" />
                <p className="text-[#292117] font-semibold mb-1">Your cart is empty</p>
                <p className="text-[#8A6743]/70 text-sm mb-6">Add items to get started</p>
                <button
                  onClick={togglerCartOpen}
                  className="px-6 py-2.5 bg-[#A5794F] hover:bg-[#E5C79A] text-[#292117] font-bold rounded-full text-sm transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )
          ) : (
            renderWishlist()
          )}
        </div>

        {/* Footer: Summary + Checkout */}
        {activeTab === 'cart' && cart && cart.products?.length > 0 && (
          <div className="flex-shrink-0 border-t border-[#A5794F]/30 bg-[#F7F1E7] px-4 py-4 space-y-3">
            {/* Price summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#292117]">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-[#6E5136] text-base border-t border-[#A5794F]/20 pt-2 mt-2">
                <span>Order Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#8A6743] italic pt-0.5">
                Shipping calculated at checkout
              </p>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full bg-[#A5794F] hover:bg-[#E5C79A] text-[#292117] py-3 rounded-full font-extrabold text-sm transition-colors shadow-md"
            >
              Proceed to Checkout
            </button>

            {/* Continue shopping */}
            <button
              onClick={() => {
                togglerCartOpen();
                navigate("/collections/all");
              }}
              className="w-full text-center text-sm text-[#8A6743] hover:text-[#292117] hover:underline font-bold"
            >
              Continue Shopping
            </button>

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#8A6743] pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#A5794F]" />
              <span>Secure & encrypted checkout</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
