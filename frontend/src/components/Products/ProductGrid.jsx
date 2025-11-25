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
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {products && products.length > 0 ? (
      products.map((product) => (
        <Link key={product._id} to={`/product/${product._id}`} className="block">
          <div className="bg-white p-3 rounded-lg shadow hover:shadow-md transition relative"> {/* Added relative positioning */}
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
                <span
                  className={`text-white text-xs font-semibold px-2 py-1 rounded-full ${
                    product.tags.includes('NEW') ? 'bg-blue-500' :
                    product.tags.includes('BESTSELLER') ? 'bg-yellow-500' :
                    product.tags.includes('SALE') ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}
                >
                  {product.tags.join(' / ')}
                </span>
              </div>
            )}
            <div className="aspect-[4/3] w-full mb-3 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
              <img
                src={product.images && product.images.length > 0 ? product.images[0].url : "https://cdn-icons-png.flaticon.com/512/4076/4076504.png"}
                alt={product.images && product.images.length > 0 ? product.images[0].altText || product.name : product.name}
                className="w-[92%] h-[92%] object-contain"
              />
            </div>

            <h3 className="text-sm mb-1 font-medium">{product.name}</h3>

            {/* Price + Discount */}
            <p className="text-base text-gray-600 mb-0.5 line-through">
              {product.price && `Rs ${product.price}`}
            </p>
            <div className="flex items-center justify-between gap-4 mb-2">
              <p className="text-teal-700 font-bold text-base tracking-wide">
                Rs {product.discountPrice}
              </p>
              {product.price && product.discountPrice && (
                <span className="text-red-600 text-xs font-semibold bg-red-100 px-1.5 py-0.5 rounded">
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                </span>
              )}
            </div>

            <p className="text-gray-500 text-xs line-clamp-2 mb-2">{product.description}</p>

            <button
              onClick={(e) => handleAddToCart(e, product)}
              className="w-full bg-teal-600 text-white py-1.5 px-3 rounded-lg hover:bg-teal-700 transition text-sm"
            >
              Add to Cart
            </button>
          </div>
        </Link>
      ))
    ) : (
      // No products found placeholder
      <div className="bg-white p-3 rounded-lg shadow hover:shadow-md transition">
            <div className="aspect-[4/3] w-full mb-3 overflow-hidden rounded-lg">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4076/4076504.png"
          alt="No products"
          className="w-28 h-28 mb-6 opacity-70"
        />
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          No products found
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Try adjusting your filters or search.
        </p>
        <Link
          to="/collections/all"
          className="px-4 py-1.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition text-sm"
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