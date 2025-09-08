import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import { toast } from "sonner";

const ProductGrid = ({ products, loading, error }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const guestId = useSelector((state) => state.auth.guestId); 

  const handleAddToCart = (e, product) => {
    e.preventDefault();

    dispatch(
      addToCart({
        productId: product._id,
        quantity: 1,
        size: null,
        color: null,
        guestId,
        userId: user?._id,
      })
    )
      .then(() => toast.success("Product added to cart!", { duration: 1500 }))
      .catch(() => toast.error("Failed to add product!", { duration: 1500 }));
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center text-red-600 py-10">Error: {error}</p>;

 


 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {products && products.length > 0 ? (
      products.map((product) => (
        <Link key={product._id} to={`/product/${product._id}`} className="block">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
            <div className="aspect-[3/4] w-full mb-4 overflow-hidden rounded-lg">
              <img
                src={product.images[0].url}
                alt={product.images[0].altText || product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <h3 className="text-sm mb-2 font-medium">{product.name}</h3>

            {/* Price + Discount */}
            <p className="text-lg text-gray-600 mb-1 line-through">
              {product.price && `Rs ${product.price}`}
            </p>
            <div className="flex items-center justify-between gap-6 mb-3">
              <p className="text-teal-700 font-bold text-lg tracking-wide">
                Rs {product.discountPrice}
              </p>
              {product.price && product.discountPrice && (
                <span className="text-red-600 text-sm font-semibold bg-red-100 px-2 py-0.5 rounded">
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                </span>
              )}
            </div>

            <p className="text-gray-500 text-xs line-clamp-3 mb-3">{product.description}</p>

            <button
              onClick={(e) => handleAddToCart(e, product)}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </Link>
      ))
    ) : (
      // No products found placeholder
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
            <div className="aspect-[3/4] w-full mb-4 overflow-hidden rounded-lg">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4076/4076504.png"
          alt="No products"
          className="w-28 h-28 mb-6 opacity-70"
        />
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No products found
        </h2>
        <p className="text-gray-500 mb-6">
          Try adjusting your filters or search.
        </p>
        <Link
          to="/collections/all"
          className="px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition"
        >
          Browse All Products
        </Link>
      </div>
      </div>
    )}
  </div>
);

};

export default ProductGrid;
