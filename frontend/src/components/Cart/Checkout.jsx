import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import { mergeCart, fetchCart } from "../../redux/slices/cartSlice";
import { fetchUserOrders } from "../../redux/slices/orderSlice";
import axios from "axios";
import checkoutSchema from "./checkout-schema";
import { toast } from "sonner";
// import { use } from "../../../../backend/utils/email";

const CheckOut = () => {
  const dispatch = useDispatch();

  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
console.log(user);

  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "INDIA",
    phone: "",
  });

  //  Reset cart loaded state when user changes (login/logout)
  useEffect(() => {
    if (user && user._id) {
      setIsCartLoaded(false);
    }
  }, [user?._id]);

  //  Merge guest cart with user cart after login
  useEffect(() => {
    if (user && user._id && !isCartLoaded) {
      const guestId = localStorage.getItem("guestId");
      
      // First try to merge guest cart if it exists
      if (guestId) {
        dispatch(mergeCart({ guestId, user }))
          .then((result) => {
            console.log("Cart merged successfully", result);
            setIsCartLoaded(true);
          })
          .catch((err) => {
            console.log("Cart merge failed, fetching user cart from server", err);
            // If merge fails, fetch from server instead
            dispatch(fetchCart({ userId: user._id }))
              .then(() => {
                console.log("User cart fetched from server");
                setIsCartLoaded(true);
              })
              .catch((fetchErr) => {
                console.log("Failed to fetch user cart", fetchErr);
                setIsCartLoaded(true);
              });
          });
      } else {
        // No guest cart, just fetch user cart from server
        dispatch(fetchCart({ userId: user._id }))
          .then(() => {
            console.log("User cart fetched from server");
            setIsCartLoaded(true);
          })
          .catch((err) => {
            console.log("Failed to fetch user cart", err);
            setIsCartLoaded(true);
          });
      }
    } else if (!user && !isCartLoaded) {
      // Guest user, mark as loaded
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
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
  }, [loadScript]);

  const handlePaymentSuccess = async (details, checkoutId) => {
    // console.log("co146", details);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/pay`,
        { paymentStatus: "paid", paymentDetails: details },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      console.log("cho60", response);
      if (response.status === 201) {
        const handleFinalizeCheckout = async (checkoutId) => {
          try {
            const response = await axios.post(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/checkout/${checkoutId}/finalize`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
              }
            );
            
            console.log("✓ Checkout finalized successfully");
            
            // Refresh orders after successful payment
            dispatch(fetchUserOrders()).catch(err => {
              console.error("Failed to fetch orders:", err);
            });
            
            // Clear cart after successful order
            dispatch({ type: 'Cart/clearCart' });
            
            // Clear guestId from localStorage so a new one is generated on next add to cart
            localStorage.removeItem("guestId");
            
            // Wait a moment and then navigate to confirmation page
            setTimeout(() => {
              console.log("✓ Navigating to order-confirmation page");
              navigate("/order-confirmation");
            }, 500);
            // return response
          } catch (error) {
            console.log(error);
          }
          // console.log("Payment Successful", details);
        }; // Finalize checkout if payment is successful
        handleFinalizeCheckout(checkoutId);
      } else {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
    // console.log("Payment Successful", details);
    // navigate("/order-confirmation");
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
        amount: price, //
      };
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/createOrder`,
        option
      );

      const data = res.data;
      // console.log("cheout130", data);

      if (typeof window.Razorpay === "undefined") {
        alert("Razorpay SDK not available.");
        return;
      }

      const paymentObject = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: data.id,
        ...data,

        handler: async function (response) {
          // console.log("cho127", response);

          const option2 = {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            email: user.email,
            products: cart.products,
            totalAmount: cart.totalPrice,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            paymentMethod: "Razorpay",
          };
          console.log("cho139:option2", option2.firstName);
          console.log("cho139:option2", option2.address);
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/api/verifyPayment`,
              option2
            );

            console.log("cho139:verifyRes", verifyRes);

            if (verifyRes.data.success) {
              handlePaymentSuccess(
                {
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                },
                checkoutId
              );
            } else {
              toast.error("Payment verification failed: " + (verifyRes.data.message || "Unknown error"));
            }
          } catch (verifyError) {
            console.error("Verification error:", verifyError);
            toast.error("Payment verification failed. Please contact support.");
          }
          },
        modal: {
          ondismiss: function() {
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

    const formData = {
      email: user ? user.email : "",
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
       localStorage.setItem(
    `shippingAddress_${user.email}`,
    JSON.stringify(shippingAddress)
    );

       // Send to backend - backend will calculate delivery charge
       const res = await dispatch(
         createCheckout({
           checkoutItems: cart.products,
           shippingAddress,
           paymentMethod: "Razorpay",
           totalPrice: cart.totalPrice,
         })
       );
       // console.log("chekout165", res);
       if (res.payload && res.payload._id) {
         // console.log("cho20", res.payload);
         setCheckoutId(res.payload._id); //Set checkout ID if checkout was successful

         handleRazorpayPayment(res.payload.totalPrice, res.payload._id);
       }
     }
    // setCheckoutId(123); //Set checkout ID if checkout was successful
  };

  useEffect(() => {
    if (!user?.email) return;

    const savedAddress = localStorage.getItem(
      `shippingAddress_${user.email}`
    );

    if (savedAddress) {
      setShippingAddress(JSON.parse(savedAddress));
    }
  }, [user]);

  // Show loading state while cart is being synced from server
  if (loading || !isCartLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) return <p> Error: {error}</p>;
  if (!cart || !cart.products || cart.products.length === 0) {
    return <p>Your cart is empty</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-19 tracking-tighter ">
      {/* left section */}
      <div className="bg-white rounded-lg p-6 ">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={user ? user.email : ""}
              className="w-full p-2 border rounded"
            />
          </div>
          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
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
                className="w-60 p-2 border rounded"
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
                className="w-60 p-2 border rounded"
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
          <div className="mb-4 grid grid-cols-2 gap-4">
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
                className="w-60 p-2 border rounded"
                required
              />
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
                className="w-60 p-2 border rounded"
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
              className="w-80 p-2 border rounded"
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
              className="w-80 p-2 border rounded"
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
                  const saved = localStorage.getItem(`shippingAddress_${user.email}`);
                if (saved) setShippingAddress(JSON.parse(saved));
                }}
             className="text-sm text-blue-600 underline mb-4"
          >
              Use saved address
          </button>
        </form>
      </div>

      {/* right section */}
      <div className="bg-gray-50 p-6">
        <h3 className="text-lg mb-4">Order Summary</h3>
        <div className="border-t py-4 mb-4">
          {cart.products.map((product, index) => (
            <div
              key={index}
              className="flex items-start justify-between py-2 border-b"
            >
              <div className="flex  items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24  object-cover mr-4"
                />
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <p className="text-gray-500">Size: {product.size}</p>
                  <p className="text-gray-500">Color: {product.color}</p>
                </div>
              </div>
              <p className="text-xl">Rs {product.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Sub Total</p>
          <p>Rs {cart.totalPrice.toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Rs 30</p>
        </div>
        <div className="flex justify-between items-center text-lg mb-4 border-t pt-4">
          <p>Total</p>
          <p>Rs {(cart.totalPrice + 30)?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">(calculated by server)</p>
        </div>
      </div>
    </div>
  );
};

export default CheckOut;
