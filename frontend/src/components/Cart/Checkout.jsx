import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { createCheckout, setCheckoutData } from "../../redux/slices/checkoutSlice";
import { mergeCart, fetchCart, updateLocalCartItemQuantity, removeLocalCartItem } from "../../redux/slices/cartSlice";
import { Minus, Plus, Trash2 } from "lucide-react";
import { fetchUserOrders } from "../../redux/slices/orderSlice";
import axios from "axios";
import checkoutSchema from "./checkout-schema";
import { toast } from "sonner";
import {
  clearReferralContext,
  getReferralForCartItems,
} from "../../services/referralStorage";

const handleQtyChange = (dispatch, user, productId, delta, quantity, size, color) => {
  const newQty = quantity + delta;
  if (newQty > 0) {
    dispatch(updateLocalCartItemQuantity({ productId, quantity: newQty, size, color }));
  }
};

const handleRemove = (dispatch, user, productId, size, color) => {
  dispatch(removeLocalCartItem({ productId, size, color }));
};

const CheckOut = () => {
  const dispatch = useDispatch();

  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "INDIA",
    phone: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const referralContext = getReferralForCartItems(cart?.products || []);

  const deliveryCharge = cart?.products?.reduce((acc, item) => {
    let itemShipping = Number(item.shippingCharge ?? 100);
    if (shippingAddress.city && item.freeShippingCities && item.freeShippingCities.length > 0) {
      const match = item.freeShippingCities.some(
        city => city.trim().toLowerCase() === shippingAddress.city.trim().toLowerCase()
      );
      if (match) {
        itemShipping = Number(item.localShippingCharge ?? 0);
      }
    }
    return acc + itemShipping;
  }, 0) ?? 0;
  const subtotal = cart?.totalPrice ?? 0;
  const totalWithDelivery = subtotal + deliveryCharge;
  const finalTotal = Math.max(totalWithDelivery - couponDiscount, 0);

  const localShippingItems = cart?.products?.filter((item) => {
    return shippingAddress.city && item.freeShippingCities && item.freeShippingCities.some(
      c => c.trim().toLowerCase() === shippingAddress.city.trim().toLowerCase()
    );
  }) || [];

  const hasFreeShippingItem = localShippingItems.some(item => Number(item.localShippingCharge ?? 0) === 0);
  const hasLocalShippingItem = localShippingItems.length > 0;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (!cart || !cart.totalPrice) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/coupons/apply`,
        {
          code,
          subtotal: cart.totalPrice,
          products: cart.products.map(p => ({
            productId: p.productId,
            price: p.price,
            quantity: p.quantity
          }))
        }
      );

      const discountAmount = Number(data?.discountAmount || 0);
      setCouponDiscount(Number.isFinite(discountAmount) ? discountAmount : 0);
      setAppliedCoupon(code);
      toast.success("Coupon applied");
    } catch (e) {
      setAppliedCoupon("");
      setCouponDiscount(0);
      toast.error(e?.response?.data?.message || "Invalid coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  //  Reset cart loaded state when user changes (login/logout)
  useEffect(() => {
    if (user && user._id) {
      setIsCartLoaded(false);
    }
  }, [user?._id]);

  //  Load cart for logged-in user at checkout
  useEffect(() => {
    if (user && user._id && !isCartLoaded) {
      const guestId = localStorage.getItem("guestId");
      const cartAlreadyLoaded = cart?.products && cart.products.length > 0;

      if (cartAlreadyLoaded) {
        setIsCartLoaded(true);
      } else if (guestId) {
        dispatch(mergeCart({ guestId, user }))
          .then(() => {
            setIsCartLoaded(true);
          })
          .catch(() => {
            dispatch(fetchCart({ userId: user._id })).finally(() => {
              setIsCartLoaded(true);
            });
          });
      } else {
        // No guest cart — just fetch user cart from server
        dispatch(fetchCart({ userId: user._id })).finally(() => {
          setIsCartLoaded(true);
        });
      }
    } else if (!user && !isCartLoaded) {
      setIsCartLoaded(true);
    }
  }, [user, dispatch, isCartLoaded]);

  //  ensure cart is not loaded before proceeding
  useEffect(() => {
    if (isCartLoaded && (!cart || !cart.products || cart.products.length === 0)) {
      navigate("/");
    }
  }, [cart, navigate, isCartLoaded]);

  const loadScript = useCallback((src) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = src;
      script.id = "razorpay-checkout-js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Cleanup Razorpay scripts when component unmounts
  useEffect(() => {
    return () => {
      const script = document.getElementById("razorpay-checkout-js");
      if (script) {
        script.remove();
      }
      const iframes = document.querySelectorAll('iframe[src*="razorpay"]');
      iframes.forEach(iframe => iframe.remove());

      // Also remove any razorpay-container elements
      const container = document.querySelector('.razorpay-container');
      if (container) {
        container.remove();
      }
    };
  }, []);

  const handlePaymentSuccess = async (details, checkoutId) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/store/orders/${checkoutId}/payment-success`,
        {
          paymentStatus: "paid",
          paymentReference: details.payment_id || details.paymentReference || "",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        dispatch(setCheckoutData(response.data?.order || null));
        dispatch(fetchUserOrders()).catch((err) => {
          console.error("Failed to fetch orders:", err);
        });

        dispatch({ type: "Cart/clearCart" });
        localStorage.removeItem("guestId");
        clearReferralContext();

        setTimeout(() => {
          navigate("/order-confirmation");
        }, 300);
      } else {
        setIsVerifying(false);
      }
    } catch (error) {
      console.log(error);
      setIsVerifying(false);
      toast.error(error?.response?.data?.message || "Failed to confirm payment");
    }
  };

  const handleRazorpayPayment = async (price, checkoutId) => {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const option = {
        courseId: checkoutId,
        checkoutId: checkoutId,
        amount: price,
        email: user ? user.email : email,
        phone: shippingAddress.phone,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        shippingAddress,
        products: cart?.products?.map((product) => ({
          productId: product.productId || product._id || product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: product.quantity,
          size: product.size,
          color: product.color,
          createdBy: product.createdBy || "ADMIN",
        })) || [],
      };
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/createOrder`,
        option
      );

      const data = res.data;

      if (typeof window.Razorpay === "undefined") {
        alert("Razorpay SDK not available.");
        return;
      }

      const paymentObject = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: data.id,
        ...data,
        prefill: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
          email: user ? user.email : email,
          contact: shippingAddress.phone,
        },
        handler: async function (response) {
          setIsVerifying(true);
          // console.log("cho127", response);

          const option2 = {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            email: user ? user.email : email,
            products: cart.products.map(product => ({
              ...product,
              createdBy: product.createdBy || "ADMIN"
            })),
            totalAmount: price,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            paymentMethod: "Razorpay",
          };
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/verifyPayment`,
              option2
            );
            if (verifyRes.data.success) {
              await handlePaymentSuccess(
                {
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                },
                checkoutId
              );
            } else {
              toast.error("Payment verification failed: " + (verifyRes.data.message || "Unknown error"));
              setIsVerifying(false);
            }
          } catch (verifyError) {
            console.error("Verification error:", verifyError);
            toast.error("Payment verification failed. Please contact support.");
            setIsVerifying(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled by user");
            toast.error("Payment cancelled");
          }
        }
      });
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment processing failed");
    }
  };

  // console.log("cho-cart", cart);
  const handleCreateCheckout = async (e) => {
    e.preventDefault();

    if (!user && !email) {
      toast.error("Please enter an email address");
      return;
    }

    const formData = {
      email: user ? user.email : email,
      shippingAddress,
    };

    const result = checkoutSchema.safeParse(formData);
    // console.log("chko171",result.error.format());
    if (!result.success) {
      const errors = result.error.format();

      // Show toast for the first available error
      const firstError =
        errors.email?._errors[0] ||
        errors.shippingAddress?.firstName?._errors[0] ||
        errors.shippingAddress?.lastName?._errors[0] ||
        errors.shippingAddress?.address?._errors[0] ||
        errors.shippingAddress?.city?._errors[0] ||
        errors.shippingAddress?.postalCode?._errors[0] ||
        errors.shippingAddress?.country?._errors[0] ||
        errors.shippingAddress?.phone?._errors[0];

      if (firstError) toast.error(firstError);
      return; // 🛑 Stop here if validation fails
    }

    if (cart && cart.products.length > 0) {
      const currentEmail = user ? user.email : email;
      localStorage.setItem(
        `shippingAddress_${currentEmail}`,
        JSON.stringify(shippingAddress)
      );

      // Send to backend - backend will calculate delivery charge
      const res = await dispatch(
        createCheckout({
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
          customerPhone: shippingAddress.phone,
          customerEmail: user?.email || email,
          shippingAddress,
          paymentMethod: "Razorpay",
          totalPrice: cart.totalPrice,
          couponCode: appliedCoupon,
          orderItems: cart.products.map((product) => ({
            productId: product.productId,
            qty: product.quantity,
            price: product.price,
            size: product.size,
            color: product.color,
            variant: product.variant
          })),
          vendorId: referralContext?.vendorId,
          productId: referralContext?.productId,
          assignedProductId: referralContext?.assignedProductId,
          shareCode: referralContext?.shareCode,
        })
      );
      if (res.payload && (res.payload._id || res.payload.id || res.payload.orderId)) {
        const nextCheckoutId = res.payload.id || res.payload.orderId || res.payload._id;
        setCheckoutId(nextCheckoutId);
        handleRazorpayPayment(res.payload.totalPrice, nextCheckoutId);
      }
    }
    // setCheckoutId(123); //Set checkout ID if checkout was successful
  };

  useEffect(() => {
    const currentEmail = user?.email || email;
    if (!currentEmail) return;

    const savedAddress = localStorage.getItem(
      `shippingAddress_${currentEmail}`
    );

    if (savedAddress) {
      setShippingAddress(JSON.parse(savedAddress));
    }
  }, [user]);

  // Show loading state while cart is being synced from server initially
  if (!isCartLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) return <p> Error: {error}</p>;
  if (!cart || !cart.products || cart.products.length === 0) {
    return <p>Your cart is empty</p>;
  }

  return (
    <>
      {isVerifying && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center shadow-2xl max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-teal-600 mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600 text-sm">Please don't close this window or press back while we confirm your order.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-19 tracking-tighter ">
        {/* left section */}
        <div className="bg-white rounded-lg p-6 ">
          <h2 className="text-2xl uppercase mb-6">Checkout</h2>
          <form onSubmit={handleCreateCheckout}>
            <h3 className="text-lg mb-4">Contact Details</h3>
            {referralContext ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Referral applied: {referralContext.shareCode}
              </div>
            ) : null}
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={user ? user.email : email}
                onChange={(e) => !user && setEmail(e.target.value)}
                readOnly={!!user}
                placeholder="Enter your email"
                className={`w-full p-2 border rounded ${user
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : "bg-white text-gray-900"
                  }`}
              />
            </div>
            <h3 className="text-lg mb-4">Delivery</h3>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">First Name *</label>
                <input
                  type="text"
                  value={shippingAddress.firstName}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      firstName: e.target.value,
                    });
                  }}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Last Name *</label>
                <input
                  type="text"
                  value={shippingAddress.lastName}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      lastName: e.target.value,
                    });
                  }}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Address *</label>
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    address: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">City *</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      city: e.target.value,
                    });
                  }}
                  className={`w-full p-2 border rounded ${hasLocalShippingItem ? (hasFreeShippingItem ? 'border-green-500 bg-green-50 focus:ring-green-500' : 'border-teal-500 bg-teal-50 focus:ring-teal-500') : ''}`}
                  required
                />
                {hasLocalShippingItem && (
                  <p className={`${hasFreeShippingItem ? 'text-green-600' : 'text-teal-600'} text-xs font-medium mt-1 flex items-center`}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {hasFreeShippingItem ? 'Eligible for free shipping!' : 'Eligible for local shipping rates!'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-700">Postal Code *</label>
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      postalCode: e.target.value,
                    });
                  }}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Country *</label>
              <input
                type="text"
                value={shippingAddress.country}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    country: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Phone *</label>
              <input
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    phone: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded"
            >
              Continue to Payment
            </button>

            <button
              type="button"
              onClick={() => {
                const currentEmail = user?.email || email;
                const saved = localStorage.getItem(`shippingAddress_${currentEmail}`);
                if (saved) setShippingAddress(JSON.parse(saved));
              }}
              className="text-sm text-blue-600 underline mb-4"
            >
              Use saved address
            </button>
          </form>
        </div>

        {/* right section */}
        <div className="bg-gray-50 p-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
            </div>
          )}
          <h3 className="text-lg mb-4">Order Summary</h3>
          <div className="border-t py-4 mb-4">
            {cart.products.map((product, index) => {
              let itemShipping = Number(product.shippingCharge ?? 100);
              let isLocalShipping = false;
              if (shippingAddress.city && product.freeShippingCities && product.freeShippingCities.length > 0) {
                const match = product.freeShippingCities.some(
                  city => city.trim().toLowerCase() === shippingAddress.city.trim().toLowerCase()
                );
                if (match) {
                  itemShipping = Number(product.localShippingCharge ?? 0);
                  isLocalShipping = true;
                }
              }

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-start justify-between py-4 border-b gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={product.image || "https://via.placeholder.com/150"}
                      alt={product.name}
                      className="w-20 h-24 object-contain rounded border border-gray-100 bg-white shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-md font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.variant && (
                          <span className="text-xs text-gray-700 bg-gray-200 px-1.5 py-0.5 rounded font-medium">
                            {product.variant.label}
                          </span>
                        )}
                        {product.size && <span className="text-gray-500 text-xs border px-1.5 py-0.5 rounded">Size: {product.size.split(":")[0]}</span>}
                        {product.color && <span className="text-gray-500 text-xs border px-1.5 py-0.5 rounded">Color: {product.color}</span>}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div className="flex items-center border border-gray-300 rounded overflow-hidden h-7">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(dispatch, user, product.productId, -1, product.quantity, product.size, product.color)}
                            className="px-2 h-full bg-gray-50 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-semibold text-gray-800 min-w-[28px] text-center border-x border-gray-300">
                            {product.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(dispatch, user, product.productId, 1, product.quantity, product.size, product.color)}
                            className="px-2 h-full bg-gray-50 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(dispatch, user, product.productId, product.size, product.color)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>

                      <div className="mt-2">
                        {isLocalShipping ? (
                          itemShipping === 0 ? (
                            <span className="text-green-600 font-medium text-xs">Free Shipping (Local: {shippingAddress.city})</span>
                          ) : (
                            <span className="text-teal-600 font-medium text-xs">Local Shipping: Rs {itemShipping.toLocaleString()} ({shippingAddress.city})</span>
                          )
                        ) : (
                          itemShipping === 0 ? (
                            <span className="text-green-600 font-medium text-xs">Free Shipping</span>
                          ) : (
                            <span className="text-gray-500 text-xs">Shipping: Rs {itemShipping.toLocaleString()}</span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end w-full sm:w-auto">
                    <span className="text-xs sm:hidden font-medium text-gray-500">Total Price:</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900">Rs {((product.price || 0) * (product.quantity || 1)).toLocaleString()}</p>
                      {(product.quantity || 1) > 1 && (
                        <p className="text-xs text-gray-500 hidden sm:block">Rs {product.price?.toLocaleString()} each</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-lg mb-4">
            <p>Sub Total</p>
            <p>Rs {cart.totalPrice.toLocaleString()}</p>
          </div>
          <div className="flex justify-between items-center text-lg">
            <p>Shipping</p>
            <p>Rs {deliveryCharge.toLocaleString()}</p>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Have a coupon?</p>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon}
                className="px-4 py-2 bg-black text-white rounded disabled:opacity-60"
              >
                {isApplyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
            {appliedCoupon ? (
              <div className="mt-2 flex items-center justify-between text-sm text-green-700">
                <span>Applied: {appliedCoupon}</span>
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setAppliedCoupon("");
                    setCouponDiscount(0);
                    setCouponCode("");
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          {couponDiscount > 0 ? (
            <div className="flex justify-between items-center text-lg mt-4 text-green-700">
              <p>Discount</p>
              <p>- Rs {couponDiscount.toLocaleString()}</p>
            </div>
          ) : null}

          <div className="flex justify-between items-center text-lg mb-4 border-t pt-4">
            <p>Total</p>
            <p>Rs {finalTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-500">(final total calculated by server)</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckOut;
