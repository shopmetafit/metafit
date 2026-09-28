import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  removeFromCompare,
  clearCompare,
  openCompareModal,
} from "../../redux/slices/compareSlice";
import { ArrowLeftRight, X, Sparkles, Plus } from "lucide-react";

const CompareFloatingBar = () => {
  const dispatch = useDispatch();
  const { items, isCompareModalOpen } = useSelector(
    (state) => state.compare || { items: [], isCompareModalOpen: false }
  );

  // Hide bar when no items or when modal is open
  if (!items || items.length === 0 || isCompareModalOpen) {
    return null;
  }

  const maxSlots = 4;
  const emptySlotsCount = Math.max(0, maxSlots - items.length);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-[4.2rem] md:bottom-6 left-3 right-16 md:left-1/2 md:right-auto md:-translate-x-1/2 z-45 md:w-auto md:max-w-xl bg-stone-950/95 backdrop-blur-md border border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-2.5 sm:p-3.5 text-white"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Title & Counter */}
          <div className="flex items-center gap-2.5 min-w-max">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-stone-950 shadow-md shadow-emerald-500/20">
              <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wide uppercase text-stone-200">
                  Compare
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  {items.length}/{maxSlots}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Side-by-Side Matrix</p>
            </div>
          </div>

          {/* Center Product Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
            {items.map((prod) => {
              const imageSrc =
                prod.thumbnail ||
                (prod.images && prod.images[0]?.url) ||
                (typeof prod.images?.[0] === "string" ? prod.images[0] : null) ||
                "https://via.placeholder.com/60";

              return (
                <div
                  key={prod._id}
                  className="relative group w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-900 border border-stone-700/80 p-1 flex-shrink-0 flex items-center justify-center shadow-inner"
                  title={prod.name}
                >
                  <img
                    src={imageSrc}
                    alt={prod.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeFromCompare(prod._id));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md transition-transform transform hover:scale-110 active:scale-95"
                    title="Remove item"
                  >
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </button>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-dashed border-stone-700/60 bg-stone-900/40 flex items-center justify-center flex-shrink-0 text-stone-600"
                title="Add more products to compare"
              >
                <Plus className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => dispatch(clearCompare())}
              className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1.5 font-medium transition-colors hidden sm:block"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => dispatch(openCompareModal())}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-stone-950 font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
              <span>Compare ({items.length})</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareFloatingBar;
