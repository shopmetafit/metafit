import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { createCheckout, setCheckoutData } from "../../redux/slices/checkoutSlice";
import { mergeCart, fetchCart, updateLocalCartItemQuantity, removeLocalCartItem } from "../../redux/slices/cartSlice";
import { Minus, Plus, Trash2, MapPin } from "lucide-react";
import { fetchUserOrders } from "../../redux/slices/orderSlice";
import { fetchAddresses, addAddress } from "../../redux/slices/addressSlice";
import AddressCard from "../Profile/AddressCard";
import AddEditAddressModal from "../Profile/AddEditAddressModal";
import axios from "axios";
import checkoutSchema from "./checkout-schema";
import { toast } from "sonner";
import { trackMetaEvent } from "../../lib/meta-pixel";
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
  const { addresses, saving: addressSaving } = useSelector((state) => state.address || { addresses: [], saving: false });
  
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState(() => {
    const nameParts = (user?.name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const currentEmail = user?.email || "";
    const saved = currentEmail ? localStorage.getItem(`shippingAddress_${currentEmail}`) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          firstName: parsed.firstName || firstName,
          lastName: parsed.lastName || lastName,
          fullName: parsed.fullName || `${firstName} ${lastName}`.trim(),
          address: parsed.address || "",
          house: parsed.house || "",
          area: parsed.area || "",
          landmark: parsed.landmark || "",
          city: parsed.city || "",
          district: parsed.district || "",
          state: parsed.state || "",
          postalCode: parsed.postalCode || "",
          country: parsed.country || "INDIA",
          phone: parsed.phone || user?.phone || "",
          addressType: parsed.addressType || "Home",
        };
      } catch (e) {
        console.warn("Saved address parse error:", e);
      }
    }
    return {
      firstName,
      lastName,
      fullName: user?.name || "",
      address: "",
      house: "",
      area: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      postalCode: "",
      country: "INDIA",
      phone: user?.phone || "",
      addressType: "Home",
    };
  });

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (user) {
      dispatch(fetchAddresses());
    }
  }, [user, dispatch]);

  const selectAddress = useCallback((addr) => {
    if (!addr) return;
    setSelectedAddressId(addr._id);
    const nameParts = (addr.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const formattedAddr = [addr.house, addr.area, addr.landmark].filter(Boolean).join(", ");

    setShippingAddress({
      firstName,
      lastName,
      fullName: addr.fullName,
      phone: addr.phone,
      house: addr.house,
      area: addr.area,
      landmark: addr.landmark || "",
      address: formattedAddr || addr.house || addr.area || "",
      city: addr.city,
      district: addr.district || "",
      state: addr.state,
      postalCode: addr.pincode,
      country: addr.country || "INDIA",
      addressType: addr.addressType || "Home",
    });
  }, []);

  // Pre-select default address when loaded
  useEffect(() => {
    if (user && addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        selectAddress(defaultAddr);
      }
    }
  }, [user, addresses, selectedAddressId, selectAddress]);

  // Pre-fill user data (phone, name, email) whenever user object loads
  useEffect(() => {
    if (user && !selectedAddressId) {
      const currentEmail = user.email || email;
      const saved = localStorage.getItem(`shippingAddress_${currentEmail}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setShippingAddress((prev) => ({
            ...prev,
            ...parsed,
            phone: prev.phone || parsed.phone || user.phone || "",
          }));
          return;
        } catch (e) {
          console.warn("Saved address parse error:", e);
        }
      }

      const nameParts = (user.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setShippingAddress((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user, email, selectedAddressId]);

  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const fetchLocationFromPincode = async (pincodeVal) => {
    const cleanPin = pincodeVal.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) return;

    setIsPincodeLoading(true);
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${cleanPin}`);
      if (response.data && response.data[0]?.Status === "Success" && response.data[0]?.PostOffice?.length > 0) {
        const postOffice = response.data[0].PostOffice[0];
        const detectedCity = postOffice.District || postOffice.Division || postOffice.Block || postOffice.Name || "";
        const detectedState = postOffice.State || "";

        setShippingAddress((prev) => ({
          ...prev,
          city: detectedCity || prev.city,
          state: detectedState || prev.state,
          country: "INDIA",
        }));
        toast.success(`📍 ${detectedCity}${detectedState ? `, ${detectedState}` : ""} auto-filled!`);
        return;
      }
      throw new Error("Pincode not found");
    } catch (err) {
      try {
        const fallbackRes = await axios.get(`https://api.zippopotam.us/in/${cleanPin}`);
        if (fallbackRes.data && fallbackRes.data.places?.length > 0) {
          const place = fallbackRes.data.places[0];
          const fallbackCity = place["place name"] || "";
          const fallbackState = place["state"] || "";
          setShippingAddress((prev) => ({
            ...prev,
            city: fallbackCity || prev.city,
            state: fallbackState || prev.state,
            country: "INDIA",
          }));
          toast.success(`📍 ${fallbackCity}${fallbackState ? `, ${fallbackState}` : ""} auto-filled!`);
        }
      } catch (fallbackErr) {
        console.warn("Location lookup error:", fallbackErr);
      }
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    setShippingAddress((prev) => ({
      ...prev,
      postalCode: val,
    }));
    const cleanPin = val.trim().replace(/\D/g, "");
    if (cleanPin.length === 6) {
      fetchLocationFromPincode(cleanPin);
    }
  };

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
  const serviceCharge = Math.round(subtotal * 0.03);
  const totalWithDelivery = subtotal + serviceCharge + deliveryCharge;
  const finalTotal = Math.round(Math.max(totalWithDelivery - couponDiscount, 0));

  const localShippingItems = cart?.products?.filter((item) => {
    return shippingAddress.city && item.freeShippingCities && item.freeShippingCities.some(
      c => c.trim().toLowerCase() === shippingAddress.city.trim().toLowerCase()
    );
  }) || [];

  const hasFreeShippingItem = localShippingItems.some(item => Number(item.localShippingCharge ?? 0) === 0);
  const hasLocalShippingItem = localShippingItems.length > 0;

  const countryClean = shippingAddress.country?.trim().toLowerCase() || "";
  const phoneClean = shippingAddress.phone?.replace(/\D/g, "") || "";
  const isIndia = Boolean(
    !countryClean ||
    countryClean === "india" ||
    countryClean === "in" ||
    shippingAddress.phone?.trim().startsWith("+91") ||
    (countryClean === "india" && /^[6-9]\d{9}$/.test(phoneClean)) ||
    (phoneClean.length === 10 && /^[6-9]\d{9}$/.test(phoneClean) && countryClean !== "usa" && countryClean !== "us")
  );

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

  useEffect(() => {
    if (user && user._id) {
      setIsCartLoaded(false);
    }
  }, [user?._id]);

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
        dispatch(fetchCart({ userId: user._id })).finally(() => {
          setIsCartLoaded(true);
        });
      }
    } else if (!user && !isCartLoaded) {
      setIsCartLoaded(true);
    }
  }, [user, dispatch, isCartLoaded, cart?.products]);

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

  useEffect(() => {
    return () => {
      const script = document.getElementById("razorpay-checkout-js");
      if (script) {
        script.remove();
      }
      const iframes = document.querySelectorAll('iframe[src*="razorpay"]');
      iframes.forEach(iframe => iframe.remove());

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
            state: shippingAddress.state,
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
    if (!result.success) {
      const errors = result.error.format();

      const firstError =
        errors.email?._errors[0] ||
        errors.shippingAddress?.firstName?._errors[0] ||
        errors.shippingAddress?.lastName?._errors[0] ||
        errors.shippingAddress?.address?._errors[0] ||
        errors.shippingAddress?.city?._errors[0] ||
        errors.shippingAddress?.state?._errors[0] ||
        errors.shippingAddress?.postalCode?._errors[0] ||
        errors.shippingAddress?.country?._errors[0] ||
        errors.shippingAddress?.phone?._errors[0];

      if (firstError) toast.error(firstError);
      return;
    }

    if (cart && cart.products.length > 0) {
      const currentEmail = user ? user.email : email;
      localStorage.setItem(
        `shippingAddress_${currentEmail}`,
        JSON.stringify(shippingAddress)
      );

      trackMetaEvent("AddPaymentInfo", {
        content_ids: cart.products.map((p) => p.productId || p._id),
        content_type: "product",
        num_items: cart.products.reduce((acc, item) => acc + Number(item.quantity || 1), 0),
        value: finalTotal,
        currency: "INR",
      });

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
  };

  const handleCheckoutAddressAdd = async (formData) => {
    const res = await dispatch(addAddress(formData));
    if (!res.error && res.payload) {
      toast.success("New address added and selected!");
      selectAddress(res.payload);
      setIsAddressModalOpen(false);
    } else {
      toast.error(res.payload?.message || "Failed to add address");
    }
  };

  if (!isCartLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#047ca8] mx-auto mb-4"></div>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center shadow-2xl max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#047ca8] mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600 text-sm">Please don't close this window or press back while we confirm your order.</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-12 px-4 font-sans">
        {/* Left Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-xs">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight mb-6 text-gray-900">Checkout</h2>
          <form onSubmit={handleCreateCheckout}>
            <h3 className="text-lg font-bold mb-4 text-gray-800">Contact Details</h3>
            {referralContext ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Vendor Referral Applied (ID: {(() => {
                  if (referralContext.shareCode && referralContext.shareCode !== "STORE-LINK") {
                    return referralContext.shareCode;
                  }
                  const vId = String(referralContext.vendorId || "");
                  const shortVId = vId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-4);
                  return `MWREF-STORE-${shortVId}`;
                })()})
              </div>
            ) : null}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={user ? user.email : email}
                onChange={(e) => !user && setEmail(e.target.value)}
                readOnly={!!user}
                placeholder="Enter your email"
                className={`w-full p-2.5 text-sm border rounded-xl outline-none ${user
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
                  : "bg-white text-gray-900 border-gray-300 focus:border-[#047ca8]"
                  }`}
              />
            </div>

            {/* Saved Delivery Addresses Section for Logged-In Users */}
            {user && (
              <div className="mb-6 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#047ca8]" /> Select Delivery Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs font-bold text-[#047ca8] hover:underline cursor-pointer"
                  >
                    + Add New Address
                  </button>
                </div>

                {addresses && addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {addresses.map((addr) => (
                      <AddressCard
                        key={addr._id}
                        address={addr}
                        selectable
                        isSelected={selectedAddressId === addr._id}
                        onSelect={(selected) => selectAddress(selected)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/50 border border-dashed border-blue-200 rounded-xl mb-4 text-center">
                    <p className="text-xs text-gray-600 mb-2 font-medium">No saved addresses found in your account.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#047ca8] text-white text-xs font-bold rounded-xl hover:bg-[#036e96] transition-all cursor-pointer"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}
              </div>
            )}

            <h3 className="text-lg font-bold mb-4 text-gray-800">Shipping Details</h3>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name *</label>
                <input
                  type="text"
                  value={shippingAddress.firstName}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      firstName: e.target.value,
                    });
                  }}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#047ca8]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name *</label>
                <input
                  type="text"
                  value={shippingAddress.lastName}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      lastName: e.target.value,
                    });
                  }}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#047ca8]"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Address *</label>
              <input
                type="text"
                placeholder="House No, Flat, Building, Street, Area"
                value={shippingAddress.address}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    address: e.target.value,
                  });
                }}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#047ca8]"
                required
              />
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {isIndia ? "PIN Code *" : "Postal Code *"}
                  </label>
                  {isPincodeLoading && (
                    <span className="text-xs text-teal-600 font-medium animate-pulse flex items-center">
                      Auto-filling...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder={isIndia ? "Enter 6-digit PIN code" : "Enter postal code"}
                    value={shippingAddress.postalCode}
                    onChange={handlePincodeChange}
                    className={`w-full p-2.5 text-sm border rounded-xl outline-none ${isPincodeLoading ? 'bg-teal-50/50 border-teal-400' : 'border-gray-300 focus:border-[#047ca8]'}`}
                    required
                  />
                  {shippingAddress.postalCode?.replace(/\D/g, '').length === 6 && !isPincodeLoading && shippingAddress.city && (
                    <span className="absolute right-3 top-2.5 text-xs text-green-600 font-medium">
                      ✓ Auto-filled
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City *</label>
                <input
                  type="text"
                  placeholder="City / District"
                  value={shippingAddress.city}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      city: e.target.value,
                    });
                  }}
                  className={`w-full p-2.5 text-sm border rounded-xl outline-none ${hasLocalShippingItem ? (hasFreeShippingItem ? 'border-green-500 bg-green-50' : 'border-teal-500 bg-teal-50') : 'border-gray-300 focus:border-[#047ca8]'}`}
                  required
                />
                {hasLocalShippingItem && (
                  <p className={`${hasFreeShippingItem ? 'text-green-600' : 'text-teal-600'} text-xs font-medium mt-1 flex items-center`}>
                    {hasFreeShippingItem ? 'Eligible for free shipping!' : 'Eligible for local shipping rates!'}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State *</label>
                <input
                  type="text"
                  placeholder="State (e.g. Rajasthan)"
                  value={shippingAddress.state}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      state: e.target.value,
                    });
                  }}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#047ca8]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Country *</label>
                <input
                  type="text"
                  placeholder="Country"
                  value={shippingAddress.country}
                  onChange={(e) => {
                    setShippingAddress({
                      ...shippingAddress,
                      country: e.target.value,
                    });
                  }}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#047ca8]"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={shippingAddress.phone}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    phone: e.target.value,
                  });
                }}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#047ca8]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md cursor-pointer text-sm"
            >
              Continue to Payment
            </button>
          </form>
        </div>

        {/* Right Section - Cart Order Summary */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-fit space-y-6">
          <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">Order Summary</h3>

          {/* Cart items list */}
          <div className="space-y-3 divide-y divide-gray-200">
            {cart.products.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white p-1" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Coupon Code Box */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Apply Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 p-2 text-xs border border-gray-300 rounded-xl uppercase font-semibold outline-none bg-white"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon}
                className="px-4 py-2 bg-[#047ca8] hover:bg-[#036d94] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <p className="text-xs text-emerald-600 font-bold mt-1.5">
                ✓ Coupon '{appliedCoupon}' applied! Discount: ₹{couponDiscount.toLocaleString()}
              </p>
            )}
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Handling Fee (3%)</span>
              <span className="font-semibold text-gray-900">₹{serviceCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping Charge</span>
              <span className={`font-semibold ${deliveryCharge === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                {deliveryCharge > 0 ? `₹${deliveryCharge.toLocaleString()}` : "FREE"}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">- ₹{couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-3 flex justify-between items-center text-base font-extrabold text-gray-900">
              <span>Total Payable</span>
              <span className="text-[#047ca8] text-lg">₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Address Modal inside Checkout */}
      <AddEditAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSubmit={handleCheckoutAddressAdd}
        isSaving={addressSaving}
      />
    </>
  );
};

export default CheckOut;
