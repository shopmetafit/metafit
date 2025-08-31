import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { addToCart } from "../../redux/slices/cartSlice";
import { toast } from "sonner";

const ProductGrid = ({ products, loading, error }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const guestId = useSelector((state) => state.auth.guestId); // if you store guestId in redux

  const handleAddToCart = (e, product) => {
    e.preventDefault(); // stops Link redirect

    dispatch(
      addToCart({
        productId: product._id,
        quantity: 1,
        size: null, // not selected in grid view
        color: null, // not selected in grid view
        guestId,
        userId: user?._id,
      })
    )
      .then(() => {
        toast.success("Product added to cart!", { duration: 1500 });
      })
      .catch(() => {
        toast.error("Failed to add product!", { duration: 1500 });
      });
  };

  if (loading) return <p>Loading..</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Link
          key={product._id}
          to={`/product/${product._id}`}
          className="block"
        >
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
            <div className="aspect-[3/4] w-full mb-4 overflow-hidden rounded-lg">
              <img
                src={product.images[0].url}
                alt={product.images[0].altText || product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <h3 className="text-sm mb-2 font-medium">{product.name}</h3>
            <p className="text-lg text-gray-600 mb-1 line-through">
              {product.price && `${product.price}`}
            </p>
            <div className="flex items-center justify-between gap-6 mb-3">
              <p className="text-teal-700 font-bold text-lg mb-3 tracking-wide">
                Rs {product.discountPrice}
              </p>
              {product.price && product.discountPrice && (
                <span className="text-red-600 text-sm font-semibold bg-red-100 px-2 py-0.5 rounded">
                  {Math.round(
                    ((product.price - product.discountPrice) / product.price) *
                      100
                  )}
                  % OFF
                </span>
              )}
            </div>
            {/* Description (truncated) */}
            <p className="text-gray-500 text-xs line-clamp-3 mb-3">
              {product.description}
            </p>

            {/* Add to Cart button */}
            <button
              onClick={(e) => handleAddToCart(e, product)}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProductGrid;

// import { Link } from "react-router-dom";
// const ProductGrid = ({ products, loading ,error }) => {
//   // console.log("PG3",products);
//   if(loading){
//     return <p>Loading..</p>
//   }
//   if(error){
//     return <p>Error:{error}</p>
//   }
//   return (
//     <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//       {products.map((product, index) => (
//         <Link key={index} to={`/product/${product._id}`} className="block">
//           <div className="bg-white p-4 rounded-lg">
//             <div className="aspect-[3/4] w-full mb-4 overflow-hidden rounded-lg">
//               <img
//                 src={product.images[0].url}
//                 alt={product.images[0].alText || product.name}
//                 className="w-full h-full object-cover rounded-lg"
//               />
//             </div>
//             <h3 className="text-sm mb-2"> {product.name}</h3>
//             <p className="text-gray-500 font-medium text-sm tracking-tighter">
//               Rs {product.price}
//             </p>
//           </div>
//         </Link>
//       ))}
//     </div>
//   );
// };

// export default ProductGrid;
