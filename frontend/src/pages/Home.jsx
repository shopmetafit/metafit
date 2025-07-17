import Hero from "../components/Layout/Hero";
import FeaturesSection from "../components/Products/FeaturesSection";
import GenderCollectionSection from "../components/Products/GenderCollectionSection";
import NewArrivals from "../components/Products/NewArrivals";
import ProductDetails from "../components/Products/ProductDetails";
import ProductGrid from "../components/Products/ProductGrid";
import CategoryGrid from "../components/Products/categoryGrid";
import FeaturedCollection from "../components/Products/featuredCollection";
import { useDispatch, useSelector } from "react-redux"; 
import { fetchProductsByFilters } from "../redux/slices/productSlice";                       
import axios from "axios";
import {useState, useEffect} from "react";

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [bestSellerProduct, setBestSellerProduct] = useState(null);

  useEffect(() => {
    //fetch product from specific collection
    dispatch(
      fetchProductsByFilters({
        gender: "Men",
        category: "Top Wear",
        limit: 8,
      })
    );
    // fetch best seller product
    const fetchBestSeller = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`
        );
        // console.log("hm",response.data)

        setBestSellerProduct(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchBestSeller();
  }, [dispatch]);

  return (
    <div>
      <Hero />
      <CategoryGrid/>
      <GenderCollectionSection />
      <NewArrivals />
      {/* best seller */}
      <h2 className="text-3xl text-center font-bold mb-4">Best Seller</h2>
      {bestSellerProduct ? (<ProductDetails productId={bestSellerProduct._id}/>):
      (
      <p className="text-center"> Loading best seller product...</p>)}
      
      <div>
        <h2 className="text-3xl text-center font-bold mb-4">
          Top wears of Men
        </h2>
        <ProductGrid products={products} loading={loading}  error={error} />
      </div>
      <FeaturedCollection />
      <FeaturesSection />
    </div>
  );
};

export default Home;
