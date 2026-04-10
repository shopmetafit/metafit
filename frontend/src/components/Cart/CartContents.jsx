import { Trash2, Minus, Plus } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeFromCart, updateCartItemQuantity } from "../../redux/slices/cartSlice";
import { Link } from "react-router-dom";

const CartContents = ({ cart, userId, guestId }) => {
  const dispatch = useDispatch();

  const handleQtyChange = (productId, delta, quantity, size, color) => {
    const newQty = quantity + delta;
    if (newQty > 0) {
      dispatch(updateCartItemQuantity({ productId, quantity: newQty, guestId, userId, size, color }));
    }
  };

  const handleRemove = (productId, size, color) => {
    dispatch(removeFromCart({ productId, userId, guestId, size, color }));
  };

  return (
    <div className="divide-y divide-gray-100">
      {cart.products.map((product, index) => (
        <div key={index} className="flex gap-3 py-4">
          {/* Image */}
          <Link to={`/product/${product.productId}`} className="flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 object-contain rounded-lg border border-gray-100 bg-gray-50"
            />
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <Link
              to={`/product/${product.productId}`}
              className="text-sm font-semibold text-gray-900 hover:text-[#047ca8] line-clamp-2 leading-snug"
            >
              {product.name}
            </Link>

            {/* Variant / size / color */}
            {(product.size || product.color) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {product.size && <span>Size: {product.size}</span>}
                {product.size && product.color && " | "}
                {product.color && <span>Color: {product.color}</span>}
              </p>
            )}

            {/* Price */}
            <p className="text-sm font-bold text-gray-900 mt-1">
              ₹{(product.price || 0).toLocaleString()}
            </p>

            {/* Qty + Remove row */}
            <div className="flex items-center gap-3 mt-2">
              {/* Qty control */}
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden text-sm">
                <button
                  onClick={() => handleQtyChange(product.productId, -1, product.quantity, product.size, product.color)}
                  className="px-2 py-1 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-3 py-1 font-semibold text-gray-900 border-x border-gray-200 min-w-[32px] text-center">
                  {product.quantity}
                </span>
                <button
                  onClick={() => handleQtyChange(product.productId, 1, product.quantity, product.size, product.color)}
                  className="px-2 py-1 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(product.productId, product.size, product.color)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>

          {/* Line total */}
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-bold text-gray-900">
              ₹{((product.price || 0) * product.quantity).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;
