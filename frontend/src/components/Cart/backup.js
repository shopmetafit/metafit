import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalButton from "./PayPalButton";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import axios from "axios";

const CheckOut = () => {
  const dispatch = useDispatch();

  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  //  ensure cart is not loaded before proceeding
  useEffect(() => {
    if (!cart || !cart.products || cart.products.length === 0) {
      navigate("/");
    }
  }, [cart, navigate]);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // console.log("cho-cart", cart);
  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (cart && cart.products.length > 0) {
      const res = await dispatch(
        createCheckout({
          checkoutItems: cart.products,
          shippingAddress,
          paymentMethod: "Paypal",
          totalPrice: cart.totalPrice,
        })
      );
      if (res.payload && res.payload._id) {
        // console.log("cho20", res.payload);
        setCheckoutId(res.payload._id); //Set checkout ID if checkout was successful
        handleRazorpayPayment(cart.totalPrice, res.payload._id);
      }
    }
    // setCheckoutId(123); //Set checkout ID if checkout was successful
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
      console.log("cheout89", data);

      if (typeof window.Razorpay === "undefined") {
        alert("Razorpay SDK not available.");
        return;
      }

      const paymentObject = new window.Razorpay({
        key: "rzp_test_qxOgCtHLBiUsEh",
        order_id: data.id,
        ...data,

        handler: function (response) {
          console.log("cho102", response);

          const option2 = {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          };
          axios
            .post(
              `${import.meta.env.VITE_BACKEND_URL}/api/verifyPayment`,
              option2
            )
            .then((res) => {
              console.log(res.data);
              if (res.data.success) {
                handlePaymentSuccess("abc");
              } else {
                alert("payment failed");
              }
            })
            .catch((err) => {
              console.log(err);
            });
        },
      });
      paymentObject.open();

      const handlePaymentSuccess = async (details) => {
        console.log("co146", details);
        try {
          const response = await axios.put(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/checkout/${checkoutId}/pay`,
            { paymentStatus: "paid", paymentDetails: details },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("userToken")}`,
              },
            }
          );
          
          console.log("cho143", response);
          if (response.status === 200) {
            const handleFinalizeCheckout = async (checkoutId) => {
              try {
                const response = await axios.post(
                  `${
                    import.meta.env.VITE_BACKEND_URL
                  }/api/checkout/${checkoutId}/finalize`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem(
                        "userToken"
                      )}`,
                    },
                  }
                );
                navigate("/order-confirmation");
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
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
  }, []);

  if (loading) return <p> Loading cart...</p>;
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
              <label className="block text-gray-700">First Name</label>
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
              <label className="block text-gray-700">Last Name</label>
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
            <label className="block text-gray-700">Address</label>
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
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  });
                }}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Postal Code</label>
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
            <label className="block text-gray-700">Country</label>
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
            <label className="block text-gray-700">Phone</label>
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
          <button className="w-full bg-black text-white py-3 rounded">
            Continue to Payment
          </button>

          {/* 
          <div className="mt-6">
            {!checkoutId ? (
              <button className="w-full bg-black text-white py-3 rounded"  
              // onClick={() => {
              //     onPayment();
              //   }}
              >
                Continue to Payment
              </button>
            ) : (
              <button
                type="button"
                className="w-full bg-black text-white py-3 rounded"
                // onClick={() => {
                //   onPayment();
                // }}
              >
                Razorpay Payment
              </button>
              // <div>
              //   <h3 className="text-lg mb-4">Pay with Paypal</h3>
              //   <PayPalButton
              //     amount={cart.totalPrice}
              //     onSuccess={handlePaymentSuccess}
              //     onError={(err) => {
              //       alert("payent failed. Try again");
              //     }}
              //   />
              // </div>
            )}
          </div> */}
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
                  <p className="text-gray-500">Size:{product.size}</p>
                  <p className="text-gray-500">Color:{product.color}</p>
                </div>
              </div>
              <p className="text-xl">Rs{product.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Sub Total</p>
          <p>{cart.totalPrice.toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mb-4 border-t pt-4">
          <p>Total</p>
          <p>Rs {cart.totalPrice?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};


// const cart = {
//   products: [
//     {
//       name: "Stylish Jacket",
//       size: "M",
//       color: "Black",
//       price: 120,
//       image: "https://picsum.photos/150?random=1",
//     },
//     {
//       name: "Casual Sneakers",
//       size: "42",
//       color: "White",
//       price: 76,
//       image: "https://picsum.photos/150?random=1",
//     },
//   ],
//   totalPrice: 195,
// };
