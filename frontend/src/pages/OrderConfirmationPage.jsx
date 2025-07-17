import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { clearCart } from "../redux/slices/cartSlice";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { checkout } = useSelector((state) => state.checkout);

  // Clear the cart when order is confirm
  useEffect(() => {
    if (checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
    } else {
      navigate("/my-orders");
    }
  }, [checkout, dispatch, navigate]);

  const calculateEstimateDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10); // add 10 days to the order date
    return orderDate.toLocaleDateString();
  };
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold  text-center text-emerald-700 mb-8">
        Thank You For Your Order!
      </h1>

      {checkout && (
        <div className="p-6 rounded-lg border">
          <div className="flex justify-between mb-20">
            {/* order id and date */}
            <div>
              <h2 className="text-lg font-semibold">Order Id:{checkout._id}</h2>
              <p className="text-gray-500">
                Order Date:{new Date(checkout.createdAt).toLocaleDateString()}
              </p>
            </div>
            {/* estimated delivery */}
            <div>
              <p className="text-neutral-700 text-sm">
                Estimated Delivery:
                {calculateEstimateDelivery(checkout.createdAt)}
              </p>
            </div>
          </div>
          {/* Order items */}
          <div className="mb-20">
            {checkout.checkoutItems.map((item) => (
              <div key={item.productId} className="flex items-center mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md mr-4"
                />
                <div>
                  <h4 className="text-md font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.color} | {item.price}
                  </p>
                </div>
                <div className="mx-auto text-right">
                  <p className="text-md ">{item.price}</p>
                  <p className="text-sm text-gray-500">Qty:{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          {/* payment and delivery info */}
          <div className="grid grid-cols-2 gap-8">
            {/* ayment info */}
            <div>
              <h4 className="text-lg font-semibold mb-2">Payment</h4>
              <p className="text-gray-600">RazorPay</p>
            </div>
            {/* delivery info */}
            <div>
              <h4 className="text-lg font-semibold mb-2">Delivery</h4>
              <p className="text-gray-600">
                {checkout.shippingAddress.address}
              </p>
              <p className="text-gray-600">
                {checkout.shippingAddress.city},
                {checkout.shippingAddress.country}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmationPage;

// const checkout = {
//   _id: "12323",
//   createdAt: new Date(),
//   checkoutItems: [
//     {
//       productId: "1",
//       name: "Stylish Jacket",
//       size: "M",
//       color: "Black",
//       price: 120,
//       quantity: 1,
//       image: "https://picsum.photos/150?random=1",
//     },
//     {
//       productId: "2",
//       name: "T-Shirt",
//       size: "L",
//       color: "Green",
//       price: 120,
//       quantity: 23,
//       image: "https://picsum.photos/150?random=1",
//     },
//   ],
//   shippingAddress: {
//     address: "123 fashion Street",
//     city: "Ney York",
//     country: "USA",
//   },
// };
