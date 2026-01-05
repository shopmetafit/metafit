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
import { useState, useEffect } from "react";

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [bestSellerProduct, setBestSellerProduct] = useState(null);

  useEffect(() => {
    //fetch product from specific collection
    dispatch(
      fetchProductsByFilters({
        search: "a",
        limit: 8,
      })
    );
    // fetch best seller product
    const fetchBestSeller = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`
        );
        setBestSellerProduct(response.data);
      } catch (error) {
        
      }
    };
    fetchBestSeller();
  }, [dispatch]);

  return (
    <div>
      <Hero />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <CategoryGrid />
        <GenderCollectionSection />
        <NewArrivals />
        {/* best seller */}
        <div>
          <h2 className="text-2xl md:text-3xl text-center font-bold mb-6">
            Best Seller
          </h2>
          {bestSellerProduct ? (
            <ProductDetails productId={bestSellerProduct._id} />
          ) : (
            <p className="text-center"> Loading best seller product...</p>
          )}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl text-center font-bold mb-6">
            Products of the people choice
          </h2>
          <ProductGrid products={products} loading={loading} error={error} />
        </div>
        <FeaturedCollection />
        <FeaturesSection />
      </div>
    </div>
  );
};

export default Home;
