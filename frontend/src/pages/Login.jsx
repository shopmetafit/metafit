import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser ,googleLoginUserThunk} from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";

import { mergeCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId } = useSelector((state) => state.auth || {});
  const { cart } = useSelector((state) => state.cart || {});

  // Get redirect parameter and check if it's checkout or something
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");
  // console.log("Login20",user);

  useEffect(() => {
    if (user)
      if (cart?.products.length > 0 && guestId) {
        dispatch(mergeCart({ guestId, user })).then(() => {
          navigate(isCheckoutRedirect ? "/checkout" : "/");
        });
      } else {
        navigate(isCheckoutRedirect ? "/checkout" : "/");
      }
  }, [user, guestId, cart, navigate, isCheckoutRedirect, dispatch]);

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   // console.log("user Login:", { email, password });
  //   dispatch(loginUser({ email, password }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.rejected.match(result)) {
      const error = result.payload;
      if (error?.errors) {
        error.errors.forEach((err) => toast.error(err.message));
      } else if (error?.msg) {
        toast.error(error.msg);
      }
      // else if(undefined){

      // }
      else {
        toast.error("Login failed. Please try again.");
      }
    }
  };



  const handleGoogleLoginSuccess = async (credentialResponse) => {
  try {
    // Dispatch the Google login thunk and wait for it to complete
    const resAction = await dispatch(googleLoginUserThunk(credentialResponse));

    if (googleLoginUserThunk.fulfilled.match(resAction)) {
      // Login successful
      const loggedInUser = resAction.payload;

      // Redirect to checkout or homepage
      navigate(isCheckoutRedirect ? "/checkout" : "/");
    } else {
      // Login failed
      console.error("Google login failed:", resAction.payload);
      alert("Google login failed ❌");
    }
  } catch (err) {
    console.error("Google login error:", err);
    alert("Google login failed ❌");
  }
};

// Google login error
  const handleGoogleLoginError = () => {
    console.error("Google login failed");
    alert("Google login failed ❌");
  };




  return (
    <div className="flex">
      <div className="w-full md:m-1/2 flex flex-col justify-center items-center p-8 md:p-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-8 rounded-lg  border shadow-sm"
        >
          <div className="flex justify-center mb-6">
            <h2 className="text-xl font-medium">M Wellness Bazaar</h2>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Hey There !</h2>
          <p className="text-center mb-6">
            Enter your username and password to login
          </p>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 ">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your email address"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 ">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Sign in
          </button>


          {/* Google Login Button */}
          <div className="mt-4 flex justify-center">
            {/* <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH_KEY || ""}>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
            />
            </GoogleOAuthProvider> */}

                <GoogleOAuthProvider
                   clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                >
                   <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                   />
                </GoogleOAuthProvider>



          </div>


          <p className="mt-6 text-center text-sm">
            Don&apos;t have an account?
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-500"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
{/* 
      <div className="hidden md:block w-1/2  bg-gray-800">
        <div className="h-full flex  flex-col  justify-center items-center">
          <img
            src={skin}
            alt="Login to account"
            className="h-[750px] w-full object-cover object-right"
          />
        </div>
      </div> */}
    </div>
  );
};


console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default Login;
