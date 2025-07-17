import { Link } from "react-router-dom";
import menCollectionImage from "../../assets/mens-collection.webp";
import womenCollectionImage from "../../assets/womens-collection.webp";

const GenderCollectionSection = () => {
  return (
    <section className="py-16 px-4 lg:px-0">
      <div className="container ms-auto flex flex-col md:flex-row gap-8">
        {/* women collection */}
        <div className="relative flex-1">
          <Link
            to="/collections/all?gender=Women"
            className="text-gray-900 underline"
          >
            <img
              src={womenCollectionImage}
              alt="Women-collection"
              className="w-full h-[700px] object-cover"
            />
          </Link>
          <div className="absolute bottom-0 left-8 bg-white bg-opacity-90 py-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Women's Collection
            </h2>
            <Link
              to="/collections/all?gender=Women"
              className="text-gray-900 underline"
            >
              Shop now
            </Link>
          </div>
        </div>
        {/* men's collection */}
        <div className="relative flex-1">
          <Link to="/collections/all?gender=Men">
            <img
              src={menCollectionImage}
              alt="Men-collection"
              className="w-full h-[700px] object-cover"
            />
          </Link>
          <div className="absolute bottom-0 left-8 bg-white bg-opacity-90 py-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Men's Collection
            </h2>
            <Link
              to="/collections/all?gender=Men"
              className="text-gray-900 underline"
            >
              Shop now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenderCollectionSection;
