import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchWellnessGoals } from "../../redux/slices/productSlice";
import {
  ChevronLeft,
  ChevronRight,
  X,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import { WellnessIcon } from "./WellnessIcons";

const GoalBar = ({ onOpenFilter, activeFilterCount = 0 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollContainerRef = useRef(null);
  const subScrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { wellnessGoals, wellnessGoalsLoading } = useSelector(
    (state) => state.products
  );

  const selectedGoal = searchParams.get("goal") || null;
  const selectedSubGoal = searchParams.get("subGoal") || null;

  useEffect(() => {
    dispatch(fetchWellnessGoals());
  }, [dispatch]);

  // Handle scroll arrow visibility
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [wellnessGoals]);

  const scroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleGoalSelect = (goalIdentifier) => {
    if (!goalIdentifier || goalIdentifier === "all" || selectedGoal?.toLowerCase() === goalIdentifier?.toLowerCase()) {
      // Clear category filter to show all products
      navigate("/collections/all", { replace: true });
      return;
    }

    // Switch to selected category
    navigate(`/collections/all?goal=${encodeURIComponent(goalIdentifier)}`, { replace: true });
  };

  const handleSubGoalSelect = (subGoalIdentifier) => {
    if (!subGoalIdentifier || selectedSubGoal?.toLowerCase() === subGoalIdentifier?.toLowerCase()) {
      // Reset subcategory, keep primary category active
      navigate(`/collections/all?goal=${encodeURIComponent(selectedGoal)}`, { replace: true });
      return;
    }

    navigate(
      `/collections/all?goal=${encodeURIComponent(selectedGoal)}&subGoal=${encodeURIComponent(
        subGoalIdentifier
      )}`,
      { replace: true }
    );
  };

  if (!wellnessGoalsLoading && (!wellnessGoals || wellnessGoals.length === 0)) {
    return null;
  }

  // Find active parent category object
  const activeGoalObj = wellnessGoals?.find(
    (g) =>
      g.id?.toLowerCase() === selectedGoal?.toLowerCase() ||
      g.name?.toLowerCase() === selectedGoal?.toLowerCase()
  );
  const activeLabel = activeGoalObj ? activeGoalObj.name : selectedGoal;
  const activeSubCategories = activeGoalObj?.subCategories || [];

  return (
    <div className="bg-[#FFFDF5] rounded-xl shadow-xs border border-[#D4A017]/30 p-2.5 transition-all mb-2">
      {/* ─── Top Bar: Category Label & Clear Action / Refine Results ─── */}
      <div className="hidden sm:flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-5 w-5 rounded-md bg-[#D4A017]/15 text-[#7A1522]">
            <LayoutGrid className="h-3.5 w-3.5 stroke-[2.2]" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#4A0712] tracking-tight">
            Explore Categories
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedGoal && (
            <button
              onClick={() => handleGoalSelect(null)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A1522] hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              <span>Clear Filter</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {onOpenFilter && (
            <button
              type="button"
              onClick={onOpenFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#3A0610] bg-[#D4A017] border border-[#D4A017] hover:bg-[#F2C94C] hover:text-[#3A0610] rounded-lg shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 group"
              aria-label="Refine Results"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Refine Results</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#3A0610] group-hover:bg-[#4A0712] text-[#F2C94C] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ml-0.5 shadow-2xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ─── Level 1: Primary Category Bar ─── */}
      <div className="relative flex items-center group">
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="hidden md:flex absolute -left-1.5 z-20 items-center justify-center h-7 w-7 rounded-full bg-white shadow-md border border-[#D4A017]/40 text-[#4A0712] hover:text-[#D4A017] hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* "All Products" Button */}
          <button
            type="button"
            onClick={() => handleGoalSelect("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex-shrink-0 cursor-pointer ${
              selectedGoal === null
                ? "bg-[#D4A017] text-[#3A0610] border-[#D4A017] shadow-sm font-bold"
                : "bg-white text-[#4A0712] border-[#D4A017]/30 hover:border-[#D4A017] hover:text-[#3A0610] hover:bg-[#FFF8E7]"
            }`}
          >
            <WellnessIcon id="all" className="w-4 h-4" />
            <span>All Products</span>
          </button>

          {/* Main Categories */}
          {wellnessGoals.map((g) => {
            const isSelected =
              selectedGoal?.toLowerCase() === g.id?.toLowerCase() ||
              selectedGoal?.toLowerCase() === g.name?.toLowerCase();

            return (
              <button
                key={g.id || g.name}
                type="button"
                onClick={() => handleGoalSelect(g.id || g.name)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#D4A017] text-[#3A0610] border-[#D4A017] shadow-sm font-bold"
                    : "bg-white text-[#4A0712] border-[#D4A017]/30 hover:border-[#D4A017] hover:text-[#3A0610] hover:bg-[#FFF8E7]"
                }`}
              >
                <WellnessIcon id={g.id} className="w-4 h-4" />
                <span>{g.name}</span>
              </button>
            );
          })}
        </div>

        {showRightArrow && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="hidden md:flex absolute -right-1.5 z-20 items-center justify-center h-7 w-7 rounded-full bg-white shadow-md border border-[#D4A017]/40 text-[#4A0712] hover:text-[#D4A017] hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ─── Level 2: Subcategories Tray (shown only when category has multiple distinct subcategories) ─── */}
      {selectedGoal && activeSubCategories.length > 1 && (
        <div className="mt-2.5 pt-2 border-t border-[#D4A017]/20 flex items-center gap-2">
          <div
            ref={subScrollContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full p-1 bg-[#FFF8E7] rounded-lg border border-[#D4A017]/30 shadow-2xs"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* "All <Category>" subcategory chip */}
            <button
              type="button"
              onClick={() => handleSubGoalSelect(null)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all flex-shrink-0 cursor-pointer ${
                selectedSubGoal === null
                  ? "bg-white text-[#3A0610] shadow-xs border border-[#D4A017] font-bold"
                  : "text-[#7A1522] hover:text-[#3A0610] hover:bg-white/70"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>All {activeLabel}</span>
            </button>

            {/* Subcategory items */}
            {activeSubCategories.map((sub) => {
              const isSubSelected =
                selectedSubGoal?.toLowerCase() === sub.id?.toLowerCase() ||
                selectedSubGoal?.toLowerCase() === sub.name?.toLowerCase();

              return (
                <button
                  key={sub.id || sub.name}
                  type="button"
                  onClick={() => handleSubGoalSelect(sub.id || sub.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all flex-shrink-0 cursor-pointer ${
                    isSubSelected
                      ? "bg-white text-[#3A0610] shadow-xs border border-[#D4A017] font-bold"
                      : "text-[#7A1522] hover:text-[#3A0610] hover:bg-white/70"
                  }`}
                >
                  <WellnessIcon id={sub.id} className="w-3.5 h-3.5" />
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalBar;
