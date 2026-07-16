import { X, ShoppingCart, ShieldCheck, Heart, Trash2 } from "lucide-react";
import CartContents from "../Cart/CartContents";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchCart } from "../../redux/slices/cartSlice";
import { removeFromWishlist } from "../../redux/slices/wishlistSlice";

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
  const deliveryCharge = cart?.products?.reduce((acc, item) => acc + Number(item.shippingCharge ?? 100), 0) ?? 0;
  const total = subtotal + deliveryCharge;

  const handleCheckout = () => {
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
            className="px-6 py-2.5 bg-[#0FB7A3] hover:bg-[#0DA28E] text-white font-semibold rounded-full text-sm transition-colors"
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
                className="text-sm font-semibold text-gray-900 hover:text-[#047ca8] line-clamp-2 leading-snug"
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
        <div className="bg-[#232f3e] text-white px-4 pt-4 pb-0 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              {activeTab === 'cart' ? <ShoppingCart className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
              {activeTab === 'cart' ? 'Cart' : 'Wishlist'}
            </h2>
            <button
              onClick={togglerCartOpen}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab && setActiveTab('cart')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'cart' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Cart {itemCount > 0 && `(${itemCount})`}
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('wishlist')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'wishlist' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          {activeTab === 'cart' ? (
            cart && cart.products?.length > 0 ? (
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
            )
          ) : (
            renderWishlist()
          )}
        </div>

        {/* Footer: Summary + Checkout */}
        {activeTab === 'cart' && cart && cart.products?.length > 0 && (
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
              onClick={() => {
                togglerCartOpen();
                navigate("/collections/all");
              }}
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
