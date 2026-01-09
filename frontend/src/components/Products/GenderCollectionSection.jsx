import { Link } from "react-router-dom";

import respyrDevice from "../../assets/respyrDevice.webp";
import protein from "../../assets/protein.webp";
import acup from "../../assets/acup.webp";
import panch from "../../assets/panch.webp";

const GenderCollectionSection = () => {
  const collections = [
    {
      image: acup,
      title: "Yoga",
      link: "/collections/all",
    },
    {
      image: panch,
      title: "Ayurveda",
      link: "/collections/all",
    },
    {
      image: respyrDevice,
      title: "Respyr Device",
      link: "/collections/all",
    },
    {
      image: protein,
      title: "Protein Bite",
      link: "/collections/all",
    },
  ];

  return (
    <section className="py-16 px-4 lg:px-0">
      <div className="container mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {collections.map((item, index) => (
          <div key={index} className="relative w-full group">
            <Link to={item.link}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover rounded-lg"
              />
            </Link>
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 px-4 py-3 rounded shadow-md">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h2>
              <Link
                to={item.link}
                className="text-blue-600 underline text-sm md:text-base"
              >
                Shop now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GenderCollectionSection;


// import { Link } from "react-router-dom";

// import respyrDevice from "../../assets/respyrDevice.webp"
// import protein from "../../assets/protein.webp"
// import acup from "../../assets/acup.webp"
// import panch from "../../assets/panch.webp"

// const GenderCollectionSection = () => {
//   return (
//     <section className="py-16 px-4 lg:px-0">
//       <div className="container ms-auto flex flex-col md:flex-row gap-8">
//         {/* Yoga collection */}
//         <div className="relative flex-1">
//           <Link
//             to="/collections/all?"
//             className="text-gray-900 underline"
//           >
//             <img
//               src={acup}
//               alt="Yoga"
//               className="w-full h-[700px] object-cover"
//             />
//           </Link>
//           <div className="absolute bottom-0 left-8 bg-white bg-opacity-90 py-4">
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">
//               Yoga
//             </h2>
//             <Link
//               to="/collections/all?"
//               className="text-gray-900 underline"
//             >
//               Shop now
//             </Link>
//           </div>
//         </div>
//         {/* Ayurveda collection */}
//         <div className="relative flex-1">
//           <Link to="/collections/all?">
//             <img
//               src={panch}
//               alt="Ayurveda"
//               className="w-full h-[700px] object-cover"
//             />
//           </Link>
//           <div className="absolute bottom-0 left-8 bg-white bg-opacity-90 py-4">
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">
//               Ayurveda
//             </h2>
//             <Link
//               to="/collections/all?"
//               className="text-gray-900 underline"
//             >
//               Shop now
//             </Link>
//           </div>
//         </div>
//         {/* women collection */}
//         <div className="relative flex-1">
//           <Link
//             to="/collections/all?"
//             className="text-gray-900 underline"
//           >
//             <img
//               src={respyrDevice}
//               alt="Respyr Device"
//               className="w-full h-[700px] object-cover"
//             />
//           </Link>
//           <div className="absolute bottom-0 left-8 bg-white bg-opacity-90 py-4">
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">
//               Respyr Device
//             </h2>
//             <Link
//               to="/collections/all?"
//               className="text-gray-900 underline"
//             >
//               Shop now
//             </Link>
//           </div>
//         </div>
//         {/* men's collection */}
//         <div className="relative flex-1">
//           <Link to="/collections/all?">
//             <img
//               src={protein}
//               alt="Protein Bite"
//               className="w-full h-[700px] object-cover"
//             />
//           </Link>
//           <div className="absolute bottom-0 left-8 bg-white bg-opacity-90 py-4">
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">
//               Protein Bite
//             </h2>
//             <Link
//               to="/collections/all?"
//               className="text-gray-900 underline"
//             >
//               Shop now
//             </Link>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default GenderCollectionSection;
