import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser, googleLoginUserThunk } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId } = useSelector((state) => state.auth || {});
  const { cart } = useSelector((state) => state.cart || {});

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  useEffect(() => {
    if (user) {
      const guestIdFromStorage = localStorage.getItem("guestId");
      const hasGuestCart = cart?.products && cart.products.length > 0;
      if (hasGuestCart && guestIdFromStorage) {
        dispatch(mergeCart({ guestId: guestIdFromStorage, user }))
          .then(() => navigate(isCheckoutRedirect ? "/checkout" : "/"))
          .catch(() => navigate(isCheckoutRedirect ? "/checkout" : "/"));
      } else {
        navigate(isCheckoutRedirect ? "/checkout" : "/");
      }
    }
  }, [user, navigate, isCheckoutRedirect, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.rejected.match(result)) {
      const error = result.payload;
      if (error?.errors) error.errors.forEach((err) => toast.error(err.message));
      else if (error?.msg) toast.error(error.msg);
      else toast.error("Login failed. Please try again.");
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const resAction = await dispatch(googleLoginUserThunk(credentialResponse));
    if (googleLoginUserThunk.fulfilled.match(resAction)) {
      navigate(isCheckoutRedirect ? "/checkout" : "/");
    } else {
      toast.error("Google login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f2] flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-xl">M</span>
        </div>
        <div className="leading-tight">
          <div className="text-lg font-black text-gray-900">M Wellness</div>
          <div className="text-xs text-teal-600 font-semibold -mt-0.5">Bazaar</div>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-300 shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sign in</h1>
        {isCheckoutRedirect && (
          <p className="text-sm text-gray-600 mb-4">Sign in to complete your purchase</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#047ca8] focus:ring-2 focus:ring-[#047ca8]/20 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#047ca8] focus:ring-2 focus:ring-[#047ca8]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0FB7A3] hover:bg-[#0DA28E] text-white font-semibold py-2.5 rounded-full text-sm transition-colors shadow-md"
          >
            Sign in
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => toast.error("Google login failed.")}
            />
          </GoogleOAuthProvider>
        </div>

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          <span>Your information is safe and secure</span>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-sm my-5">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-gray-400">New to M Wellness Bazaar?</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Create account */}
      <Link
        to={`/register?redirect=${encodeURIComponent(redirect)}`}
        className="w-full max-w-sm block text-center border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2.5 rounded-full text-sm transition-colors shadow-sm"
      >
        Create your account
      </Link>

      <p className="text-xs text-gray-500 mt-6 text-center max-w-xs">
        By signing in, you agree to our{" "}
        <Link to="/terms-and-conditions" className="text-[#047ca8] hover:underline">Terms</Link>{" "}
        and{" "}
        <Link to="/privacy-policy" className="text-[#047ca8] hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
};

console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default Login;
