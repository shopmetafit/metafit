import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  removeFromCompare,
  clearCompare,
  openCompareModal,
} from "../../redux/slices/compareSlice";
import { ArrowLeftRight, X, Plus } from "lucide-react";

const CompareFloatingBar = () => {
  const dispatch = useDispatch();

  const { items, isCompareModalOpen } = useSelector(
    (state) =>
      state.compare || {
        items: [],
        isCompareModalOpen: false,
      }
  );

  // =========================================================
  // SHOW ONLY WHEN 2 OR MORE PRODUCTS ARE SELECTED
  // =========================================================

  if (!items || items.length < 2 || isCompareModalOpen) {
    return null;
  }

  const maxSlots = 4;

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0, y: 25, scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 25,
          scale: 0.96,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 25,
        }}
        className="
          fixed
          z-[9999]

          bottom-[76px]

          left-1/2
          -translate-x-1/2

          w-max
          max-w-[calc(100vw-16px)]

          md:bottom-6

          md:max-w-xl

          bg-[#111714]/98
          backdrop-blur-xl

          border
          border-white/10

          shadow-[0_10px_35px_rgba(0,0,0,0.35)]

          rounded-xl
          md:rounded-2xl

          p-1.5
          md:p-2

          text-white

          box-border
        "
      >
        {/* =====================================================
            MAIN BAR
        ====================================================== */}

        <div
          className="
            flex
            items-center
            justify-center

            gap-2
            md:gap-3

            w-max
            max-w-full

            min-w-0
          "
        >
          {/* ===================================================
              DESKTOP COMPARE INFO
          =================================================== */}

          <div
            className="
              hidden
              sm:flex

              items-center
              gap-2

              flex-shrink-0
            "
          >
            <div
              className="
                w-8
                h-8

                rounded-lg

                bg-[#1e4620]

                flex
                items-center
                justify-center

                flex-shrink-0
              "
            >
              <ArrowLeftRight
                className="
                  w-4
                  h-4

                  text-emerald-300

                  stroke-[2.5]
                "
              />
            </div>

            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-white
                  "
                >
                  Compare
                </span>

                <span
                  className="
                    text-[9px]
                    font-bold

                    px-1.5
                    py-0.5

                    rounded-full

                    bg-emerald-500/15
                    text-emerald-300

                    border
                    border-emerald-400/20
                  "
                >
                  {items.length}/{maxSlots}
                </span>
              </div>

              <span className="text-[10px] text-stone-400">
                Side-by-Side Matrix
              </span>
            </div>
          </div>

          {/* ===================================================
              PRODUCT THUMBNAILS
          =================================================== */}

          <div
            className="
              flex
              items-center

              gap-1.5

              flex-shrink-0

              min-w-0
            "
          >
            {items.slice(0, 2).map((prod) => {
              const imageSrc =
                prod.thumbnail ||
                (prod.images && prod.images[0]?.url) ||
                (typeof prod.images?.[0] === "string"
                  ? prod.images[0]
                  : null) ||
                "https://via.placeholder.com/60";

              return (
                <div
                  key={prod._id}
                  className="
                    relative

                    w-9
                    h-9

                    md:w-10
                    md:h-10

                    rounded-lg

                    bg-white

                    border
                    border-white/15

                    p-0.5

                    flex-shrink-0

                    flex
                    items-center
                    justify-center

                    shadow-sm
                  "
                  title={prod.name}
                >
                  <img
                    src={imageSrc}
                    alt={prod.name}
                    className="
                      w-full
                      h-full

                      object-contain

                      rounded-md
                    "
                  />

                  {/* Remove */}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      dispatch(
                        removeFromCompare(prod._id)
                      );
                    }}
                    className="
                      absolute

                      -top-1.5
                      -right-1.5

                      w-4
                      h-4

                      rounded-full

                      bg-rose-500
                      hover:bg-rose-600

                      text-white

                      flex
                      items-center
                      justify-center

                      shadow-md

                      cursor-pointer

                      z-20

                      transition
                      hover:scale-110
                    "
                    title="Remove product"
                    aria-label={`Remove ${prod.name} from compare`}
                  >
                    <X
                      className="
                        w-2.5
                        h-2.5

                        stroke-[3]
                      "
                    />
                  </button>
                </div>
              );
            })}

            {/* =================================================
                EXTRA PRODUCTS
            ================================================= */}

            {items.length > 2 && (
              <div
                className="
                  w-9
                  h-9

                  md:w-10
                  md:h-10

                  rounded-lg

                  bg-[#1e4620]

                  border
                  border-emerald-500/30

                  flex
                  items-center
                  justify-center

                  flex-shrink-0

                  text-[10px]
                  md:text-xs

                  font-extrabold

                  text-emerald-200
                "
              >
                +{items.length - 2}
              </div>
            )}

            {/* Desktop Empty Slots */}

            <div className="hidden md:flex items-center gap-1.5">
              {Array.from({
                length: Math.max(
                  0,
                  maxSlots - items.length
                ),
              }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="
                    w-10
                    h-10

                    rounded-lg

                    border
                    border-dashed
                    border-white/10

                    bg-white/5

                    flex
                    items-center
                    justify-center

                    text-stone-600

                    flex-shrink-0
                  "
                >
                  <Plus className="w-3 h-3" />
                </div>
              ))}
            </div>
          </div>

          {/* ===================================================
              MOBILE / DESKTOP ACTIONS
          =================================================== */}

          <div
            className="
              flex
              items-center

              gap-1.5

              flex-shrink-0
            "
          >
            {/* Desktop Clear */}

            <button
              type="button"
              onClick={() =>
                dispatch(clearCompare())
              }
              className="
                hidden
                md:block

                text-[11px]

                text-stone-400
                hover:text-black

                font-semibold

                px-1.5
                py-1

                transition-colors

                cursor-pointer

                whitespace-nowrap
              "
              title="Clear all products"
            >
              Clear
            </button>

            {/* =================================================
                COMPARE BUTTON
            ================================================= */}
            <button
              type="button"
              onClick={() => dispatch(openCompareModal())}
              className="
               h-7
               md:h-8

                  px-2
                  md:px-2.5

                  min-w-[58px]
                  md:min-w-[78px]

                  rounded-md
                  md:rounded-lg

                  bg-[#1e4620]
                  hover:bg-[#285c2a]

                  border
                  border-emerald-400/20

                  text-white

                  font-bold

                  text-[9px]
                  md:text-[11px]

                  shadow-[0_3px_8px_rgba(30,70,32,0.30)]

                  inline-flex
                  items-center
                  justify-center

                  gap-0.5
                  md:gap-1

                  whitespace-nowrap

                  flex-shrink-0

                  cursor-pointer

                  active:scale-[0.97]

                  transition-all
                "
              aria-label={`Open comparison with ${items.length} products`}
            >
              <ArrowLeftRight
                className="
                    w-2.5
                    h-2.5

                    md:w-3
                    md:h-3

                    text-emerald-300

                    stroke-[2.5]

                    flex-shrink-0
                  "
              />

              <span>
                ({items.length})
              </span>
            </button>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareFloatingBar;