import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) return <p className="p-4">Loading your orders...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">My Orders</h2>

      {/* Scroll wrapper for small screens */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full table-auto text-sm sm:text-base text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs sm:text-sm">
            <tr>
              <th className="py-3 px-4">Image</th>
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Shipping</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => handleRowClick(order._id)}
                  className="border-b hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="py-3 px-4">
                    <img
                      src={order.orderItems[0]?.image}
                      alt={order.orderItems[0]?.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium whitespace-nowrap">
                    #{order._id.slice(-6)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}<br />
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {order.shippingAddress
                      ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4">{order.orderItems.length}</td>
                  <td className="py-3 px-4">₹{order.totalPrice}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.isPaid
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-gray-500">
                  You have no orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
