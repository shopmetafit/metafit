import { useSearchParams } from "react-router-dom";

const SortOptions = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSortChange = (e) => {
    const sortBy = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (sortBy) {
      params.set("sortBy", sortBy);
    } else {
      params.delete("sortBy");
    }
    setSearchParams(params);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:block">Sort by:</label>
      <select
        value={searchParams.get("sortBy") || ""}
        onChange={handleSortChange}
        className="text-sm border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:border-[#047ca8] bg-white text-gray-800 cursor-pointer"
      >
        <option value="">Featured</option>
        <option value="priceAsc">Price: Low to High</option>
        <option value="priceDesc">Price: High to Low</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>
  );
};

export default SortOptions;
