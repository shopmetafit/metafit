import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated before fetching orders
    const token = localStorage.getItem("userToken");
    if (!token || !user) {
      navigate("/login");
      return;
    }
    
    dispatch(fetchUserOrders());
  }, [user?._id]); // Only depend on user ID to prevent infinite loops

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  console.log("Orders data:", orders);
  console.log("Loading:", loading);
  console.log("Error:", error);

  if (loading) return (
    <div className="p-4 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    </div>
  );
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error loading orders</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => dispatch(fetchUserOrders())}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h2>
        <p className="text-gray-600 mt-2">Track and manage all your orders</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              onClick={() => handleRowClick(order._id)}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div className="flex-1 mb-4 sm:mb-0">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Order ID</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">#MWB-{order._id.slice(-8)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Placed On</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Total Amount</p>
                  <p className="text-lg sm:text-xl font-bold text-teal-600">₹{order.totalPrice?.toLocaleString()}</p>
                </div>
                <div className="flex-1">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold inline-block ${
                      order.isPaid
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                    }`}
                  >
                    {order.isPaid ? "✓ Paid" : "⏳ Pending"}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 sm:p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Items ({order.orderItems.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className="mb-2 rounded-lg overflow-hidden bg-gray-100 h-24">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">₹{item.price?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Shipping Address</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {order.shippingAddress ? (
                        <>
                          <span className="block">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
                          <span className="block text-xs text-gray-600">{order.shippingAddress.address}</span>
                          <span className="block text-xs text-gray-600">
                            {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                          </span>
                          <span className="block text-xs text-gray-600">{order.shippingAddress.country}</span>
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Method</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{order.paymentMethod || "Credit/Debit Card"}</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(order._id);
                      }}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to create your first order!</p>
          <a
            href="/collections/all"
            className="inline-block px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;


// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { fetchUserOrders } from "../redux/slices/orderSlice";

// const MyOrdersPage = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const { orders, loading, error } = useSelector((state) => state.orders);
//   // console.log("Myo11", orders);

//   useEffect(() => {
//     dispatch(fetchUserOrders());
//   },[dispatch]);

//   const handleRowClick = (orderId) => {
//     navigate(`/order/${orderId}`);
//   };

//   if (loading) return <p> Loading cart...</p>;
//   if (error) return <p> Error: {error}</p>;

//   return (
//     <div className="max-w-7xl mx-auto p-4 sm:p-6">
//       <h2 className="text-xl sm:text-2xl font-bold mb-6">My Orders</h2>
//       <div className="relative shadow-md sm:rounded-lg overflow-hidden">
//         <table className="min-w-full text-left text-gray-500">
//           <thead className="bg-gray-100 text-xs uppercase text-gray-700">
//             <tr>
//               <th className="py-3 px-4 sm:py-3">Image</th>
//               <th className="py-3 px-4 sm:py-3">Order</th>
//               <th className="py-3 px-4 sm:py-3">Created</th>
//               <th className="py-3 px-4 sm:py-3">Shipping Address</th>
//               <th className="py-3 px-4 sm:py-3">Items</th>
//               <th className="py-3 px-4 sm:py-3">Price</th>
//               <th className="py-3 px-4 sm:py-3">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {orders.length > 0 ? (
//               orders.map((order) => (
//                 <tr
//                   key={order._id}
//                   onClick={() => {
//                     handleRowClick(order._id);
//                   }}
//                   className="border-b hover:border-gray-50 cursor-pointer"
//                 >
//                   <td className="py-2 px-2 sm:py-4 sm:px-4">
//                     <img
//                       src={order.orderItems[0]?.image}
//                       alt={order.orderItems[0]?.name}
//                       className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
//                     />
//                   </td>
//                   <td className="py-2 px-2 sm:px-4 sm:py-4 font-medium text-gray-900 whitespace-nowrap">
//                     #{order._id}
//                   </td>
//                   <td className="py-2 px-2 sm:px-4 sm:py-4 ">
//                     {new Date(order.createdAt).toLocaleDateString()}
//                     <br></br>
//                     {new Date(order.createdAt).toLocaleTimeString()}
//                   </td>
//                   <td className="py-2 px-2 sm:px-4 sm:py-4">
//                     {order.shippingAddress
//                       ? `${order.shippingAddress.city},${order.shippingAddress.country}`
//                       : "N/A"}
//                   </td>
//                   <td className="py-2 px-2 sm:px-4 sm:py-4 ">
//                     {order.orderItems.length}
//                   </td>
//                   <td className="py-2 px-2 sm:px-4 sm:py-4 ">
//                     {order.totalPrice}
//                   </td>
//                   <td className="py-2 px-2 sm:px-4 sm:py-4 ">
//                     <span
//                       className={`${
//                         order.isPaid
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-700"
//                       }  px-2 py-1 rounded-full text-sm font-medium`}
//                     >
//                       {order.isPaid ? "Paid" : "Pending"}
//                     </span>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
//                   You have no orders
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default MyOrdersPage;

// // useEffect(() => {
// //   //simulate fetching orders
// //   setTimeout(() => {
// //     const mockOrders = [
// //       {
// //         _id: "12345",
// //         createdAt: new Date(),
// //         shippingAddress: { city: "New York", country: "USA" },
// //         orderItems: [
// //           {
// //             name: "Product 1",
// //             image: "https://picsum.photos/500/500?random=1",
// //           },
// //         ],
// //         totalPrice: 100,
// //         isPaid: true,
// //       },
// //       {
// //         _id: "34567",
// //         createdAt: new Date(),
// //         shippingAddress: { city: "New York", country: "USA" },
// //         orderItems: [
// //           {
// //             name: "Product 2",
// //             image: "https://picsum.photos/500/500?random=2",
// //           },
// //         ],
// //         totalPrice: 100,
// //         isPaid: true,
// //       },
// //     ];
// //     setOrders(mockOrders);
// //   }, 1000);
// // }, []);
