import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import RoutineBuilder from "../components/Products/RoutineBuilder";
import SEO from "../components/SEO/SEO";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Compass,
  ArrowLeft,
} from "lucide-react";

const RoutineBuilderPage = () => {
  const navigate = useNavigate();
  const backHandlerRef = useRef(null);

  const handleTopBackClick = () => {
    if (backHandlerRef.current) {
      backHandlerRef.current();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b
        from-[#f7fbf9]
        via-[#f4f8f6]
        to-[#eef6f3]

        py-0

        px-4
        sm:px-6
        lg:px-8
        xl:px-10

        font-sans
        text-slate-800
      "
    >
      <SEO
        title="Personalized Wellness Routine & Stack Matcher | M Wellness Bazaar"
        description="Take our 30-second wellness quiz to discover your synchronized Morning & Evening daily routine stack with certified Ayurvedic and nutritional products."
        keywords="wellness routine, supplement stack, daily routine quiz, personalized wellness, morning evening routine, ayurveda routine"
      />

      <div
        className="
          max-w-[1180px]
          mx-auto

          space-y-2
          sm:space-y-2.5
          lg:space-y-3

          relative
        "
      >
        {/* =====================================================
            TOP LEFT BACK ARROW
        ====================================================== */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={handleTopBackClick}
            className="
              text-slate-700
              hover:text-teal-800
              transition-colors
              cursor-pointer
              p-0
              focus:outline-none
              flex
              items-center
              justify-center
            "
            aria-label="Go Back"
            title="Go Back 1 Step"
          >
            <ArrowLeft
              className="
                w-6
                h-6
                sm:w-7
                sm:h-7
                stroke-[2.2]
              "
            />
          </button>
        </div>

        {/* =====================================================
            1. HERO SECTION
        ====================================================== */}
        <div
          className="
            max-w-[760px]
            mx-auto
            text-center

            space-y-3
            sm:space-y-3.5

            pt-0
            pb-2
            sm:pb-2.5
          "
        >
          {/* Eyebrow Pill */}
          <div className="flex justify-center">
            <div
              className="
                inline-flex
                items-center
                gap-1.5

                px-3
                py-1

                rounded-full

                bg-teal-100/80
                border
                border-teal-200/90

                text-[#022824]

                text-[10px]
                sm:text-xs

                font-bold
                uppercase
                tracking-widest

                shadow-2xs
              "
            >
              <Sparkles
                className="
                  w-3.5
                  h-3.5
                  text-teal-600
                  animate-pulse
                "
              />

              <span>
                PERSONALIZED WELLNESS EXPERIENCE
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className="
              text-[30px]
              sm:text-[38px]
              md:text-[44px]
              lg:text-[48px]

              font-black
              text-slate-900

              tracking-tight
              leading-[1.12]
            "
          >
            Build Your
            <br />

            <span
              className="
                bg-gradient-to-r
                from-[#022824]
                via-[#046559]
                to-[#0FB7A3]

                text-transparent
                bg-clip-text
              "
            >
              Personalized Wellness Routine
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            className="
              text-sm
              sm:text-base
              lg:text-[15px]

              text-slate-600

              max-w-[720px]
              mx-auto

              leading-relaxed
              font-normal
            "
          >
            Answer a few simple questions and discover products aligned with
            your wellness goals, preferences, and daily routine.
          </p>

          {/* Trust / Info Row */}
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-center

              gap-2.5
              sm:gap-3.5

              pt-1

              text-xs
              sm:text-sm

              font-semibold
              text-slate-700
            "
          >
            {/* Personalized Recommendations */}
            <div
              className="
                inline-flex
                items-center
                gap-1.5

                bg-white/90

                px-3
                py-1.5

                rounded-lg

                border
                border-teal-100/90

                shadow-2xs
              "
            >
              <CheckCircle2
                className="
                  w-4
                  h-4
                  text-emerald-600
                  flex-shrink-0
                "
              />

              <span>
                Personalized recommendations
              </span>
            </div>

            {/* Real Store Inventory */}
            <div
              className="
                inline-flex
                items-center
                gap-1.5

                bg-white/90

                px-3
                py-1.5

                rounded-lg

                border
                border-teal-100/90

                shadow-2xs
              "
            >
              <CheckCircle2
                className="
                  w-4
                  h-4
                  text-emerald-600
                  flex-shrink-0
                "
              />

              <span>
                Real store inventory
              </span>
            </div>

            {/* Privacy */}
            <div
              className="
                inline-flex
                items-center
                gap-1.5

                bg-white/90

                px-3
                py-1.5

                rounded-lg

                border
                border-teal-100/90

                shadow-2xs
              "
            >
              <CheckCircle2
                className="
                  w-4
                  h-4
                  text-emerald-600
                  flex-shrink-0
                "
              />

              <span>
                Your answers stay private
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            2. QUESTIONNAIRE MAIN APP
        ====================================================== */}
        <div id="quiz-container">
          <RoutineBuilder
            backHandlerRef={backHandlerRef}
          />
        </div>

        {/* =====================================================
            3. HOW IT WORKS SECTION
        ====================================================== */}
        <div
          className="
            bg-white/80
            backdrop-blur-md

            rounded-2xl
            lg:rounded-3xl

            p-4
            sm:p-5
            lg:p-6

            border
            border-teal-100/90

            shadow-xs

            space-y-4
            lg:space-y-5
          "
        >
          {/* Section Header */}
          <div
            className="
              text-center
              max-w-xl
              mx-auto
              space-y-1
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-1

                text-[10px]
                sm:text-xs

                font-bold
                text-teal-700

                bg-teal-50

                px-2.5
                py-0.5

                rounded-full

                border
                border-teal-200

                uppercase
                tracking-wider
              "
            >
              <Compass
                className="
                  w-3.5
                  h-3.5
                  text-teal-600
                "
              />

              <span>
                Simple 3-Step Journey
              </span>
            </div>

            <h2
              className="
                text-lg
                sm:text-xl
                lg:text-2xl

                font-black
                text-slate-900

                tracking-tight
              "
            >
              How Your Personalized Routine Works
            </h2>

            <p className="text-xs text-slate-500">
              Designed by health practitioners to eliminate supplement
              confusion and maximize daily absorption.
            </p>
          </div>

          {/* Steps */}
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3

              gap-3.5
              lg:gap-4

              relative
            "
          >
            {/* Step 1 */}
            <div
              className="
                bg-gradient-to-b
                from-[#f9fbfb]
                to-white

                p-3.5
                lg:p-4

                rounded-xl

                border
                border-teal-100/80

                relative

                flex
                flex-col
                items-start

                space-y-1.5

                group

                hover:border-teal-300

                transition-all
                duration-300
              "
            >
              <div
                className="
                  w-7
                  h-7

                  rounded-lg

                  bg-teal-600
                  text-white

                  font-black

                  flex
                  items-center
                  justify-center

                  text-xs

                  shadow-2xs
                "
              >
                01
              </div>

              <h3
                className="
                  font-bold
                  text-slate-900

                  text-xs
                  sm:text-sm

                  group-hover:text-teal-900
                "
              >
                Tell us about your goals
              </h3>

              <p
                className="
                  text-[11px]
                  lg:text-xs

                  text-slate-500

                  leading-relaxed
                "
              >
                Select your primary wellness target — sleep, gut microbiome,
                skin glow, stamina, recovery, or immune defense.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className="
                bg-gradient-to-b
                from-[#f9fbfb]
                to-white

                p-3.5
                lg:p-4

                rounded-xl

                border
                border-teal-100/80

                relative

                flex
                flex-col
                items-start

                space-y-1.5

                group

                hover:border-teal-300

                transition-all
                duration-300
              "
            >
              <div
                className="
                  w-7
                  h-7

                  rounded-lg

                  bg-teal-600
                  text-white

                  font-black

                  flex
                  items-center
                  justify-center

                  text-xs

                  shadow-2xs
                "
              >
                02
              </div>

              <h3
                className="
                  font-bold
                  text-slate-900

                  text-xs
                  sm:text-sm

                  group-hover:text-teal-900
                "
              >
                Answer personalized questions
              </h3>

              <p
                className="
                  text-[11px]
                  lg:text-xs

                  text-slate-500

                  leading-relaxed
                "
              >
                Provide basic age, gender, sleep, and stress biomarkers to
                calculate your optimal circadian intake timing.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className="
                bg-gradient-to-b
                from-[#f9fbfb]
                to-white

                p-3.5
                lg:p-4

                rounded-xl

                border
                border-teal-100/80

                relative

                flex
                flex-col
                items-start

                space-y-1.5

                group

                hover:border-teal-300

                transition-all
                duration-300
              "
            >
              <div
                className="
                  w-7
                  h-7

                  rounded-lg

                  bg-teal-600
                  text-white

                  font-black

                  flex
                  items-center
                  justify-center

                  text-xs

                  shadow-2xs
                "
              >
                03
              </div>

              <h3
                className="
                  font-bold
                  text-slate-900

                  text-xs
                  sm:text-sm

                  group-hover:text-teal-900
                "
              >
                Get your personalized routine
              </h3>

              <p
                className="
                  text-[11px]
                  lg:text-xs

                  text-slate-500

                  leading-relaxed
                "
              >
                Receive your custom AM/PM product stack matched directly with
                certified store inventory and dosage guidance.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            4. TRUST PILLARS SECTION
        ====================================================== */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3

            gap-3.5
            lg:gap-4
          "
        >
          {/* Trust Pillar 1 */}
          <div
            className="
              bg-white

              rounded-2xl

              p-3.5
              lg:p-4

              border
              border-teal-100

              shadow-xs

              flex
              flex-col
              items-center
              text-center

              space-y-1.5

              hover:-translate-y-0.5

              transition-all
              duration-300
            "
          >
            <div
              className="
                p-2

                rounded-xl

                bg-teal-50
                text-teal-700

                shadow-2xs
              "
            >
              <Zap
                className="
                  w-4.5
                  h-4.5
                  text-teal-600
                "
              />
            </div>

            <h3
              className="
                font-bold
                text-slate-900

                text-xs
                lg:text-sm
              "
            >
              Synergistic Bio-Availability
            </h3>

            <p
              className="
                text-[11px]
                lg:text-xs

                text-slate-500

                leading-relaxed
              "
            >
              We pair compatible ingredients that enhance absorption rather
              than clashing with each other.
            </p>
          </div>

          {/* Trust Pillar 2 */}
          <div
            className="
              bg-white

              rounded-2xl

              p-3.5
              lg:p-4

              border
              border-teal-100

              shadow-xs

              flex
              flex-col
              items-center
              text-center

              space-y-1.5

              hover:-translate-y-0.5

              transition-all
              duration-300
            "
          >
            <div
              className="
                p-2

                rounded-xl

                bg-amber-50
                text-amber-700

                shadow-2xs
              "
            >
              <Clock
                className="
                  w-4.5
                  h-4.5
                  text-amber-600
                "
              />
            </div>

            <h3
              className="
                font-bold
                text-slate-900

                text-xs
                lg:text-sm
              "
            >
              Circadian Timing Optimization
            </h3>

            <p
              className="
                text-[11px]
                lg:text-xs

                text-slate-500

                leading-relaxed
              "
            >
              Morning activation for peak cognitive performance; evening
              replenishment for deep tissue recovery.
            </p>
          </div>

          {/* Trust Pillar 3 */}
          <div
            className="
              bg-white

              rounded-2xl

              p-3.5
              lg:p-4

              border
              border-teal-100

              shadow-xs

              flex
              flex-col
              items-center
              text-center

              space-y-1.5

              hover:-translate-y-0.5

              transition-all
              duration-300
            "
          >
            <div
              className="
                p-2

                rounded-xl

                bg-emerald-50
                text-emerald-700

                shadow-2xs
              "
            >
              <ShieldCheck
                className="
                  w-4.5
                  h-4.5
                  text-emerald-600
                "
              />
            </div>

            <h3
              className="
                font-bold
                text-slate-900

                text-xs
                lg:text-sm
              "
            >
              100% Verified Quality
            </h3>

            <p
              className="
                text-[11px]
                lg:text-xs

                text-slate-500

                leading-relaxed
              "
            >
              Directly sourced from trusted manufacturers with batch-tested
              certificates and zero adulteration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineBuilderPage;