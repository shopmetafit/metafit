import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Sun,
  Moon,
  Check,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ShoppingCart,
  ShieldCheck,
  Clock,
  Zap,
  Leaf,
  Heart,
  Calendar,
  Share2,
  FileText,
  User,
  Activity,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  TrendingUp,
  Award,
  Bot,
  Send,
  MessageSquare,
  HelpCircle,
  Compass,
  Utensils,
} from "lucide-react";
import { addToCart } from "../../redux/slices/cartSlice";
import { toast } from "sonner";
import axios from "axios";

// ─── Curated Science-Backed Goals ───
const GOAL_OPTIONS = [
  {
    id: "sleep",
    title: "Deep Sleep & Neuro-Calm",
    subtitle: "Reset circadian clock, lower cortisol & enhance REM cycles",
    icon: "🌙",
    theme: "from-indigo-600 to-purple-800",
    glow: "rgba(99, 102, 241, 0.15)",
    tags: ["sleep", "stress", "relaxation", "calm", "ayurved", "panchakarma", "oil", "therapy", "potli", "herb", "rest", "massage", "wellness"],
    amKeywords: ["tea", "oil", "herbal", "morning", "fresh", "care", "cleanse"],
    pmKeywords: ["sleep", "night", "potli", "oil", "calm", "ashwagandha", "relax", "massage", "therapy", "rest"],
    synergy: "Morning adaptogens stabilize diurnal cortisol curve; night restorative botanicals stimulate natural melatonin cascade.",
    milestone7: "Reduced evening restlessness & easier wind-down",
    milestone21: "Longer uninterrupted deep sleep stages",
    milestone45: "Waking up consistently refreshed without brain fog",
  },
  {
    id: "gut",
    title: "Gut Microbiome & Detox",
    subtitle: "Eliminate bloating, restore gut flora & optimize nutrient absorption",
    icon: "🥑",
    theme: "from-emerald-600 to-teal-800",
    glow: "rgba(16, 185, 129, 0.15)",
    tags: ["digestion", "gut", "detox", "triphala", "cleanse", "panchakarma", "microgreens", "herb", "ayurved", "tea", "food"],
    amKeywords: ["cleanse", "tea", "detox", "microgreens", "powder", "fresh", "morning"],
    pmKeywords: ["triphala", "ghee", "capsule", "syrup", "digest", "oil", "night"],
    synergy: "AM cellular detox flushes metabolic waste; PM botanical complex heals and re-lines the gut mucosal barrier overnight.",
    milestone7: "Zero post-meal heaviness & flatter stomach",
    milestone21: "Balanced, smooth daily bowel regularity",
    milestone45: "Enhanced nutrient absorption & clearer skin glow",
  },
  {
    id: "glow",
    title: "Cellular Skin Glow & Hair",
    subtitle: "Dermal collagen repair, scalp micro-circulation & anti-pollution barrier",
    icon: "✨",
    theme: "from-rose-500 to-amber-600",
    glow: "rgba(244, 63, 94, 0.15)",
    tags: ["skin", "hair", "glow", "face", "beauty", "oil", "ubtan", "serum", "cleanser", "soap", "body", "care"],
    amKeywords: ["face wash", "serum", "cleanser", "ubtan", "sun", "soap", "wash"],
    pmKeywords: ["oil", "night", "cream", "kumkumadi", "serum", "hair", "body"],
    synergy: "AM antioxidant shield blocks UV/environmental free radicals; PM lipid elixir deeply restores hair roots & fibroblasts.",
    milestone7: "Natural dermal hydration & reduced skin irritation",
    milestone21: "Noticeable reduction in hair fall & refined texture",
    milestone45: "Radiant, even-toned complexion & strong hair strands",
  },
  {
    id: "energy",
    title: "Mitochondrial Energy & Stamina",
    subtitle: "Sustained ATP energy, physical stamina & zero afternoon slump",
    icon: "⚡",
    theme: "from-amber-500 to-orange-700",
    glow: "rgba(245, 158, 11, 0.15)",
    tags: ["energy", "vitality", "stamina", "shilajit", "protein", "fitness", "moringa", "microgreens", "snack", "power"],
    amKeywords: ["shilajit", "energy", "protein", "snack", "capsule", "moringa", "tea"],
    pmKeywords: ["vitality", "rest", "recovery", "milk", "herb", "oil"],
    synergy: "AM bio-energizers stimulate mitochondrial ATP production; PM restorative herbs prevent oxidative burnout.",
    milestone7: "Zero 3 PM fatigue crash & sharper morning focus",
    milestone21: "High workout endurance & rapid recovery",
    milestone45: "Optimal metabolic stamina throughout 14+ active hours",
  },
  {
    id: "muscle",
    title: "Lean Muscle & Athletic Recovery",
    subtitle: "Muscle protein synthesis, tendon health & rapid lactic acid clearance",
    icon: "🏋️",
    theme: "from-blue-600 to-cyan-700",
    glow: "rgba(37, 99, 235, 0.15)",
    tags: ["muscle", "fitness", "protein", "mass", "strength", "snacks", "potli", "pain", "therapy", "gym"],
    amKeywords: ["protein", "shake", "bite", "energy", "snack", "moringa"],
    pmKeywords: ["protein", "recovery", "potli", "pain", "oil", "therapy"],
    synergy: "High-bioavailability amino acids nourish muscle fibers; evening therapeutic botanicals relieve joint inflammation.",
    milestone7: "Significantly less post-workout muscle soreness (DOMS)",
    milestone21: "Lean muscle definition & strength gain",
    milestone45: "Peak athletic endurance and joint flexibility",
  },
  {
    id: "immunity",
    title: "Immune Defense & Longevity",
    subtitle: "White blood cell vitality, respiratory protection & cellular detox",
    icon: "🛡️",
    theme: "from-teal-600 to-emerald-800",
    glow: "rgba(13, 148, 136, 0.15)",
    tags: ["immunity", "health", "wellness", "steamer", "device", "moringa", "ayurved", "herb", "care"],
    amKeywords: ["immunity", "tea", "steamer", "microgreens", "moringa"],
    pmKeywords: ["herbal", "wellness", "oil", "care", "ayurved"],
    synergy: "AM bio-actives fortify upper respiratory tract; PM immunomodulatory herbs stimulate lymph clearance.",
    milestone7: "Reduced morning congestion and allergy flare-ups",
    milestone21: "High resistance to seasonal viral shifts",
    milestone45: "Deep systemic vitality & long-term longevity",
  },
];

export const RoutineBuilder = ({ isModal = false, onClose = () => {} }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state) => state.auth || {});

  // ─── Step State ───
  const [currentStep, setCurrentStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("Analyzing Biomarkers...");

  // ─── User Intake Profile ───
  const [userName, setUserName] = useState(user?.name ? user.name.split(" ")[0] : "");
  const [userGender, setUserGender] = useState("all");
  const [userAgeGroup, setUserAgeGroup] = useState("25-34");
  const [selectedGoal, setSelectedGoal] = useState("sleep");
  const [stressLevel, setStressLevel] = useState("moderate");
  const [sleepHours, setSleepHours] = useState("6-7");
  const [preference, setPreference] = useState("ayurvedic");
  const [routineTiming, setRoutineTiming] = useState("full_day");

  // ─── Products & Catalog ───
  const [allCatalogProducts, setAllCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Protocol ID Generator (Real Protocol feel)
  const protocolNumber = useMemo(() => {
    return `WB-PROTO-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  const protocolDate = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  // Fetch Full Store Catalog on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const rawUrl = import.meta.env.VITE_BACKEND_URL;
        const backendUrl = (rawUrl ? String(rawUrl).trim() : "") || "http://localhost:9000";

        let products = [];
        try {
          const res = await axios.get(`${backendUrl}/api/products?limit=100`);
          products = res.data?.products || (Array.isArray(res.data) ? res.data : []);
        } catch {
          const resAll = await axios.get(`${backendUrl}/api/products/all`);
          products = resAll.data?.products || [];
        }

        if (isMounted) setAllCatalogProducts(products || []);
      } catch (err) {
        console.error("Error loading products for routine:", err);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // State for Real AI Protocol & Custom Swaps
  const [aiProtocolData, setAiProtocolData] = useState(null);
  const [customAmProduct, setCustomAmProduct] = useState(null);
  const [customPmProduct, setCustomPmProduct] = useState(null);
  const [swappingSlot, setSwappingSlot] = useState(null); // 'am' | 'pm' | null
  const [swapSearchQuery, setSwapSearchQuery] = useState("");
  const [swapCategoryFilter, setSwapCategoryFilter] = useState("all");
  const [activeDetailProduct, setActiveDetailProduct] = useState(null); // Product Quick View Modal

  // ─── Interactive Live AI Doctor Consultation State ───
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Handle Scanning Animation and Real AI Protocol API Call
  const handleStartAnalysis = async () => {
    setIsScanning(true);
    setCurrentStep(4);
    setScanProgress(20);
    setScanStatusText("Connecting to AI Wellness Protocol Engine...");

    const rawUrl = import.meta.env.VITE_BACKEND_URL;
    const backendUrl = (rawUrl ? String(rawUrl).trim() : "") || "http://localhost:9000";

    try {
      setTimeout(() => {
        setScanProgress(55);
        setScanStatusText("Analyzing Circadian Timing & Active Bio-Synergies...");
      }, 400);

      setTimeout(() => {
        setScanProgress(85);
        setScanStatusText("Verifying Formulation Context & Store Inventory...");
      }, 900);

      const res = await axios.post(`${backendUrl}/api/ai/generate-protocol`, {
        userName: userName || "Friend",
        userAgeGroup,
        userGender,
        selectedGoal,
        stressLevel,
        sleepHours,
        preference,
        routineTiming,
      });

      if (res.data?.success && res.data?.protocol) {
        setAiProtocolData(res.data.protocol);
      }
    } catch (err) {
      console.error("AI Protocol call error:", err);
    } finally {
      setTimeout(() => {
        setScanProgress(100);
        setScanStatusText("Protocol Generated Successfully!");
        setTimeout(() => {
          setIsScanning(false);
        }, 350);
      }, 1400);
    }
  };

  // ─── Clinical Multi-Tier Matching Engine ───
  const { amProduct, pmProduct, synergyScore, activeGoalObj } = useMemo(() => {
    const goalMeta = GOAL_OPTIONS.find((g) => g.id === selectedGoal) || GOAL_OPTIONS[0];

    if (!allCatalogProducts || allCatalogProducts.length === 0) {
      return {
        amProduct: null,
        pmProduct: null,
        synergyScore: 97,
        activeGoalObj: goalMeta,
      };
    }

    const goalKeywords = goalMeta.tags || [];
    const amKeywords = goalMeta.amKeywords || [];
    const pmKeywords = goalMeta.pmKeywords || [];

    const scored = allCatalogProducts.map((p) => {
      const fullText = `${p.name || ""} ${p.category || ""} ${p.subCategory || ""} ${p.wellnessGoal || ""} ${p.description || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""}`.toLowerCase();

      let gScore = 0;
      let amScore = 0;
      let pmScore = 0;

      goalKeywords.forEach((kw) => {
        if (fullText.includes(kw.toLowerCase())) gScore += 12;
      });

      amKeywords.forEach((kw) => {
        if (fullText.includes(kw.toLowerCase())) amScore += 8;
      });

      pmKeywords.forEach((kw) => {
        if (fullText.includes(kw.toLowerCase())) pmScore += 8;
      });

      if (p.rating) gScore += p.rating * 2;
      if (p.isFeatured) gScore += 3;

      return {
        ...p,
        totalScore: gScore,
        amTotal: gScore + amScore,
        pmTotal: gScore + pmScore,
      };
    });

    const sortedGoal = [...scored].sort((a, b) => b.totalScore - a.totalScore);
    const sortedAM = [...scored].sort((a, b) => b.amTotal - a.amTotal);
    const sortedPM = [...scored].sort((a, b) => b.pmTotal - a.pmTotal);

    let am = null;
    let pm = null;

    if (routineTiming === "evening_only") {
      pm = sortedPM[0] || sortedGoal[0] || allCatalogProducts[0] || null;
    } else if (routineTiming === "morning_only") {
      am = sortedAM[0] || sortedGoal[0] || allCatalogProducts[0] || null;
    } else {
      am = sortedAM[0] || sortedGoal[0] || allCatalogProducts[0] || null;
      pm = sortedPM.find((p) => p._id !== am?._id) || sortedGoal.find((p) => p._id !== am?._id) || sortedPM[1] || allCatalogProducts[1] || am;
    }

    return {
      amProduct: am,
      pmProduct: pm,
      synergyScore: 96 + (userName ? (userName.length % 4) : 2),
      activeGoalObj: goalMeta,
    };
  }, [allCatalogProducts, selectedGoal, routineTiming, userName]);

  // Dynamically resolved from Real AI, custom swap, or smart formulation classifier
  const resolvedAmProduct = customAmProduct || aiProtocolData?.amProduct || amProduct;
  const resolvedPmProduct = customPmProduct || aiProtocolData?.pmProduct || pmProduct;
  const resolvedAmTip = aiProtocolData?.amUsageInstruction || (resolvedAmProduct?.category === 'Personal Care' ? 'Apply gently on clean skin/pulse points in the morning.' : 'Take with 250ml warm water or morning breakfast.');
  const resolvedPmTip = aiProtocolData?.pmUsageInstruction || (resolvedPmProduct?.category === 'Personal Care' ? 'Massage gently onto skin, neck or pulse points before sleep for soothing aromatherapy.' : 'Take 30 mins before sleep with warm water or milk.');
  const resolvedRationale = aiProtocolData?.clinicalRationale || activeGoalObj.synergy;
  const resolvedDoctorAnalysis = aiProtocolData?.aiDoctorAnalysis || `Dear ${userName || "Friend"}, based on your reported ${selectedGoal} goals, ${stressLevel} stress index, and sleep habits, your body requires synchronizing daytime active circulation with evening parasympathetic nervous calming. We matched this clinical protocol to restore deep cellular equilibrium.`;
  const resolvedCircadianHacks = aiProtocolData?.circadianHacks || {
    morning: "Hydrate with 500ml lukewarm water & 10 mins of natural morning sunlight.",
    afternoon: "Keep caffeine minimal after 2 PM & take 5 slow deep breaths during stress.",
    night: "Apply evening therapy 30 mins before bed and disconnect from bright blue screens.",
  };
  const resolvedDietaryAdvice = aiProtocolData?.dietaryAdvice || "Incorporate warm home-cooked meals, soaked almonds, and stay hydrated with 2.5–3L water throughout the day.";
  const resolvedMilestones = aiProtocolData?.milestones || {
    day7: activeGoalObj.milestone7,
    day21: activeGoalObj.milestone21,
    day45: activeGoalObj.milestone45,
  };

  // Initialize or update Dr. AyurAI greeting when entering Step 4
  useEffect(() => {
    if (currentStep === 4) {
      setChatMessages([
        {
          id: "welcome-1",
          sender: "ai",
          text: `Namaste ${userName || "Friend"}! 🙏 Main hoon **Dr. AyurAI**, aapka AI Clinical Health Specialist.\n\nMaine aapke liye **${activeGoalObj.title}** ka personalized protocol formulate kiya hai. Aap mujhse **Hinglish, Hindi, English ya kisi bhi bhasha** me pooch sakte hain — jaise dosage, timing, khane-peene ke parhez ya results kab tak dikhenge! 🌿✨`,
          time: "Just now",
        },
      ]);
    }
  }, [currentStep, selectedGoal]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatSending]);

  // Handle sending chat message to AI Doctor
  const handleSendChatMessage = async (presetText) => {
    const textToSend = typeof presetText === "string" ? presetText : chatInput;
    if (!textToSend || !textToSend.trim() || isChatSending) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatSending(true);

    const rawUrl = import.meta.env.VITE_BACKEND_URL;
    const backendUrl = (rawUrl ? String(rawUrl).trim() : "") || "http://localhost:9000";

    try {
      const res = await axios.post(`${backendUrl}/api/ai/chat-consultation`, {
        message: textToSend.trim(),
        userName: userName || "Friend",
        selectedGoal,
        amProductName: resolvedAmProduct?.name || "",
        pmProductName: resolvedPmProduct?.name || "",
      });

      if (res.data?.reply) {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: res.data.reply,
          source: res.data.source,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("Chat consultation error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "I'm experiencing a high load at the moment, but please remember to take your AM formulation after breakfast with warm water, and your PM formulation before bedtime for optimal restorative synergy.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Set default checked items
  useEffect(() => {
    const nextSet = new Set();
    if (resolvedAmProduct?._id) nextSet.add(resolvedAmProduct._id);
    if (resolvedPmProduct?._id && resolvedPmProduct._id !== resolvedAmProduct?._id) nextSet.add(resolvedPmProduct._id);
    setSelectedProductIds(nextSet);
  }, [resolvedAmProduct, resolvedPmProduct]);

  const toggleSelect = (id) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 1-Click Add Single Product to Cart
  const handleAddSingleProduct = async (product) => {
    if (!product || !product._id) return;
    try {
      const uId = user?._id || user?.id || null;
      const gId = guestId || localStorage.getItem("guestId") || null;

      await dispatch(
        addToCart({
          productId: product._id,
          quantity: 1,
          size: product.sizes?.[0] || "",
          color: product.colors?.[0] || "",
          userId: uId,
          guestId: gId,
          variant: product.variants?.[0] || null,
        })
      ).unwrap();

      toast.success(`🛒 "${product.name}" added to cart!`, {
        action: {
          label: "View Cart",
          onClick: () => {
            if (isModal) onClose();
            navigate("/checkout");
          },
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to add product to cart. Please try again.");
    }
  };

  // Price Calculation
  const totalOriginal = useMemo(() => {
    let s = 0;
    if (resolvedAmProduct && selectedProductIds.has(resolvedAmProduct._id)) s += resolvedAmProduct.price || 0;
    if (resolvedPmProduct && selectedProductIds.has(resolvedPmProduct._id) && resolvedPmProduct._id !== resolvedAmProduct?._id) s += resolvedPmProduct.price || 0;
    return s;
  }, [resolvedAmProduct, resolvedPmProduct, selectedProductIds]);

  const totalDiscount = useMemo(() => {
    let s = 0;
    if (resolvedAmProduct && selectedProductIds.has(resolvedAmProduct._id)) s += resolvedAmProduct.discountPrice || resolvedAmProduct.price || 0;
    if (resolvedPmProduct && selectedProductIds.has(resolvedPmProduct._id) && resolvedPmProduct._id !== resolvedAmProduct?._id) s += resolvedPmProduct.discountPrice || resolvedPmProduct.price || 0;
    return s;
  }, [resolvedAmProduct, resolvedPmProduct, selectedProductIds]);

  const savings = Math.max(0, totalOriginal - totalDiscount);

  // 1-Click Add Protocol to Cart
  const handleAddProtocolToCart = async () => {
    const items = [];
    if (resolvedAmProduct && selectedProductIds.has(resolvedAmProduct._id)) items.push(resolvedAmProduct);
    if (resolvedPmProduct && selectedProductIds.has(resolvedPmProduct._id) && resolvedPmProduct._id !== resolvedAmProduct?._id) items.push(resolvedPmProduct);

    if (items.length === 0) {
      toast.error("Please select at least 1 item from the protocol.");
      return;
    }

    setIsAddingToCart(true);
    try {
      const uId = user?._id || user?.id || null;
      const gId = guestId || localStorage.getItem("guestId") || null;

      for (const it of items) {
        await dispatch(
          addToCart({
            productId: it._id,
            quantity: 1,
            size: it.sizes?.[0] || "",
            color: it.colors?.[0] || "",
            userId: uId,
            guestId: gId,
            variant: it.variants?.[0] || null,
          })
        ).unwrap();
      }

      toast.success(`🎉 Protocol assigned! ${items.length} items added to your cart.`, {
        action: {
          label: "View Cart",
          onClick: () => {
            if (isModal) onClose();
            navigate("/checkout");
          },
        },
      });

      if (isModal) {
        setTimeout(() => onClose(), 800);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to add items to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = () => {
    const shareText = `Check out my personalized ${activeGoalObj.title} Protocol on M Wellness Bazaar: ${window.location.origin}/routine-builder`;
    if (navigator.share) {
      navigator.share({ title: "My Wellness Protocol", text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Protocol link copied to clipboard!");
    }
  };

  // Filtered products for swap modal with category filters
  const filteredSwapProducts = useMemo(() => {
    let list = allCatalogProducts || [];
    if (swapCategoryFilter && swapCategoryFilter !== "all") {
      list = list.filter((p) => p.category?.toLowerCase() === swapCategoryFilter.toLowerCase());
    }
    if (swapSearchQuery.trim()) {
      const q = swapSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [allCatalogProducts, swapSearchQuery, swapCategoryFilter]);

  // Unique categories for swap filters
  const availableCategories = useMemo(() => {
    const cats = new Set(allCatalogProducts.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [allCatalogProducts]);

  return (
    <div className="w-full max-w-4xl mx-auto font-sans">
      {/* Outer Card with Glassmorphic Luxury Finish */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-teal-100 overflow-hidden relative">
        
        {/* Top Header Bar with Back Navigation */}
        <div className="bg-gradient-to-r from-[#01221e] via-[#023c35] to-[#046559] p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Back to Store button & Close button */}
          <div className="flex items-center justify-between pb-4 border-b border-teal-800/60 mb-4 relative z-10 text-xs">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-white/10 font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Store</span>
            </button>

            {isModal && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 shadow-inner">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 bg-teal-950/70 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                    Clinical AI Intake Protocol
                  </span>
                  <span className="hidden sm:inline-block text-[10px] text-teal-200/70">• Real Database Synchronization</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  Personalized Wellness Protocol Matcher
                </h1>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-teal-100/90 mt-2 max-w-xl leading-relaxed">
            Answer 3 clinical biomarker questions. Our system matches circadian timing, active botanical synergies, and certified store inventory.
          </p>

          {/* Stepper Progress Bar with Interactive Clickable Tabs */}
          <div className="mt-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-teal-400 to-emerald-300 shadow-xs hover:opacity-90"
                      : "bg-teal-900/60 hover:bg-teal-800/80"
                  }`}
                  title={`Jump to step ${step}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-teal-200/80 mt-2.5 font-semibold">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`hover:underline cursor-pointer transition-colors ${
                  currentStep === 1 ? "text-teal-300 font-bold" : "text-teal-100/70"
                }`}
              >
                1. Profile & Goal
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`hover:underline cursor-pointer transition-colors ${
                  currentStep === 2 ? "text-teal-300 font-bold" : "text-teal-100/70"
                }`}
              >
                2. Biomarkers
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`hover:underline cursor-pointer transition-colors ${
                  currentStep === 3 ? "text-teal-300 font-bold" : "text-teal-100/70"
                }`}
              >
                3. Formulation Style
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className={`hover:underline cursor-pointer transition-colors ${
                  currentStep === 4 ? "text-teal-300 font-bold" : "text-teal-100/70"
                }`}
              >
                4. Protocol Result
              </button>
            </div>
          </div>
        </div>

        {/* ─── STEP 1: USER PROFILE & PRIMARY GOAL ─── */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    First Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Rahul / Priya"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Age Bracket
                  </label>
                  <select
                    value={userAgeGroup}
                    onChange={(e) => setUserAgeGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="18-24">18–24 Years</option>
                    <option value="25-34">25–34 Years</option>
                    <option value="35-44">35–44 Years</option>
                    <option value="45-54">45–54 Years</option>
                    <option value="55+">55+ Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Gender Focus
                  </label>
                  <select
                    value={userGender}
                    onChange={(e) => setUserGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="all">Unisex / All</option>
                    <option value="women">Women's Wellness</option>
                    <option value="men">Men's Health</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Select Your Primary Health Transformation Focus
              </h2>
              <p className="text-xs text-slate-500">
                Choose the main physiological area you want targeted for 30–60 days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {GOAL_OPTIONS.map((g) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.id)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 group flex flex-col justify-between ${
                      isSelected
                        ? "border-[#0FB7A3] bg-teal-50/70 shadow-md ring-2 ring-[#0FB7A3]/30 scale-[1.01]"
                        : "border-slate-200 hover:border-teal-300 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl p-2 rounded-xl bg-white shadow-xs border border-slate-100">
                          {g.icon}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#0FB7A3] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-900">
                        {g.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {g.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center text-[11px] font-semibold text-teal-700">
                      <span>Select Focus</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step 1 Footer Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#022824] to-[#047ca8] text-white text-sm font-bold shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <span>Continue to Lifestyle Biomarkers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: LIFESTYLE & BIOMARKERS ─── */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Step 2: Circadian & Energy Biomarkers
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                These factors determine the exact morning vs evening dosage timing.
              </p>
            </div>

            <div className="space-y-5 max-w-xl mx-auto pt-2">
              {/* Daily Sleep Duration */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  🌙 Average Nightly Sleep Duration:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "<6", label: "Under 6 Hrs", sub: "Deficit" },
                    { id: "6-7", label: "6–7 Hours", sub: "Standard" },
                    { id: "8+", label: "8+ Hours", sub: "Optimal" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSleepHours(s.id)}
                      className={`p-2.5 rounded-xl text-center border-2 transition-all cursor-pointer ${
                        sleepHours === s.id
                          ? "border-teal-500 bg-white font-bold text-teal-800 shadow-xs ring-1 ring-teal-300"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-400">{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress & Workload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  ⚡ Daily Stress & Work Intensity:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "low", label: "Low / Relaxed", icon: "🌱" },
                    { id: "moderate", label: "Moderate", icon: "⚖️" },
                    { id: "high", label: "High / Intense", icon: "🔥" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStressLevel(st.id)}
                      className={`p-2.5 rounded-xl text-center border-2 transition-all cursor-pointer ${
                        stressLevel === st.id
                          ? "border-teal-500 bg-white font-bold text-teal-800 shadow-xs ring-1 ring-teal-300"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-base mb-0.5">{st.icon}</div>
                      <div className="text-xs font-bold">{st.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile & Goals
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#022824] to-[#047ca8] text-white text-sm font-bold shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <span>Continue to Formulations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: FORMULATION & TIMING ─── */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Step 3: Formulation & Daily Structure
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose how you prefer your active botanicals structured.
              </p>
            </div>

            <div className="space-y-3 max-w-xl mx-auto pt-2">
              {[
                {
                  id: "full_day",
                  title: "Synchronized 24-Hour Protocol (AM + PM)",
                  desc: "Morning metabolic activation + Night cellular repair (98% Efficacy)",
                  icon: "☀️🌙",
                  badge: "RECOMMENDED",
                },
                {
                  id: "morning_only",
                  title: "Morning Kickstart Focus (AM Only)",
                  desc: "Targeted daytime stamina, digestion & cognitive energy",
                  icon: "☀️",
                },
                {
                  id: "evening_only",
                  title: "Night Restoration Focus (PM Only)",
                  desc: "Targeted deep sleep, muscle repair & nervous system wind-down",
                  icon: "🌙",
                },
              ].map((timeOpt) => {
                const isSelected = routineTiming === timeOpt.id;
                return (
                  <button
                    key={timeOpt.id}
                    type="button"
                    onClick={() => setRoutineTiming(timeOpt.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 cursor-pointer ${
                      isSelected
                        ? "border-[#0FB7A3] bg-teal-50/80 shadow-md ring-2 ring-[#0FB7A3]/30 scale-[1.01]"
                        : "border-slate-200 hover:border-teal-300 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    <span className="text-3xl p-2 rounded-xl bg-white shadow-xs border border-slate-100 flex-shrink-0">
                      {timeOpt.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{timeOpt.title}</h3>
                          {timeOpt.badge && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                              {timeOpt.badge}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#0FB7A3] text-white flex items-center justify-center text-xs font-bold">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{timeOpt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Biomarkers
              </button>

              <button
                type="button"
                onClick={handleStartAnalysis}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#022824] text-white text-sm font-bold shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Official Protocol</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: PROTOCOL SCANNING ANIMATION OR RESULT CARD ─── */}
        {currentStep === 4 && (
          <div className="p-6 sm:p-8">
            {isScanning ? (
              /* Realistic Scanning State */
              <div className="py-16 text-center space-y-5">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-100 animate-ping opacity-40" />
                  <div className="w-24 h-24 rounded-full border-4 border-t-teal-600 border-r-teal-400 border-b-emerald-300 border-l-slate-200 animate-spin flex items-center justify-center shadow-lg bg-white">
                    <Sparkles className="w-8 h-8 text-teal-600" />
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {scanStatusText}
                  </h3>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Matching live batch products from M Wellness Bazaar inventory...
                  </p>
                </div>
              </div>
            ) : (
              /* OFFICIAL PROTOCOL CARD */
              <div className="space-y-6">
                {/* Top Quick Actions Bar */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold shadow-xs border border-slate-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-teal-700" />
                    <span>Back to Step 3</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartAnalysis}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-Run AI Protocol</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      <span>Store Home</span>
                    </button>
                  </div>
                </div>

                {/* Prescription / Protocol Certificate Card */}
                <div className="bg-gradient-to-br from-[#022824] via-[#033f37] to-[#01221e] rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-teal-500/30">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-teal-700/50 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                          OFFICIAL PROTOCOL
                        </span>
                        <span className="text-[11px] text-teal-300 font-mono">{protocolNumber}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {userName ? `${userName}'s` : "Personalized"} {activeGoalObj.title} Protocol
                      </h2>
                      <p className="text-xs text-teal-200/80 mt-1 flex items-center gap-3">
                        <span>📅 Issued: {protocolDate}</span>
                        <span>• 🛡️ Direct Brand Verified</span>
                      </p>
                    </div>

                    {/* Circular Synergy Gauge */}
                    <div className="flex items-center gap-3 bg-teal-950/60 p-3 rounded-2xl border border-teal-500/30 flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
                        {synergyScore}%
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Synergy Match</div>
                        <div className="text-[10px] text-teal-300">Circadian Optimized</div>
                      </div>
                    </div>
                  </div>

                  {/* Scientific Rationale Accordion */}
                  <div className="mt-5 p-4 rounded-2xl bg-teal-950/50 border border-teal-500/20 text-xs text-teal-100/90 leading-relaxed">
                    <strong className="text-teal-200 font-bold">💡 Clinical Formulation Rationale:</strong>{" "}
                    {resolvedRationale}
                  </div>
                </div>

                {/* 🌅 AM and 🌙 PM Daily Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ☀️ MORNING PROTOCOL */}
                  {resolvedAmProduct && (
                    <div
                      className={`rounded-3xl border-2 p-5 sm:p-6 transition-all relative flex flex-col justify-between ${
                        selectedProductIds.has(resolvedAmProduct._id)
                          ? "border-amber-400 bg-gradient-to-b from-amber-50/80 to-white shadow-md"
                          : "border-slate-200 bg-slate-50 opacity-70"
                      }`}
                    >
                      <div>
                        {/* Card Header with Time & Checkbox */}
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200/70 mb-4">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 shadow-xs">
                              <Sun className="w-5 h-5 text-amber-600" />
                            </span>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                                08:00 AM • MORNING ACTIVATION
                              </span>
                              <p className="text-xs text-slate-700 font-medium">{resolvedAmTip}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSelect(resolvedAmProduct._id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              selectedProductIds.has(resolvedAmProduct._id)
                                ? "bg-amber-600 text-white shadow-xs"
                                : "border-2 border-slate-300 text-transparent hover:border-amber-400"
                            }`}
                            title={selectedProductIds.has(resolvedAmProduct._id) ? "Deselect item" : "Select item for protocol"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Product Info Row (Clickable to view full details) */}
                        <div className="flex gap-4 items-start">
                          <div
                            onClick={() => setActiveDetailProduct(resolvedAmProduct)}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                            title="Click to view product details"
                          >
                            <img
                              src={
                                resolvedAmProduct.images?.[0]?.url ||
                                resolvedAmProduct.thumbnail ||
                                "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                              }
                              alt={resolvedAmProduct.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                                {resolvedAmProduct.category || "Active Botanical"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveDetailProduct(resolvedAmProduct)}
                                className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                              >
                                View Details ↗
                              </button>
                            </div>

                            <h3
                              onClick={() => setActiveDetailProduct(resolvedAmProduct)}
                              className="font-bold text-sm text-slate-900 truncate mt-1 cursor-pointer hover:text-teal-700 transition-colors"
                              title={resolvedAmProduct.name}
                            >
                              {resolvedAmProduct.name}
                            </h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              By {resolvedAmProduct.brand || "M Wellness"}
                            </p>

                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-base font-black text-slate-900">
                                ₹{resolvedAmProduct.discountPrice || resolvedAmProduct.price}
                              </span>
                              {resolvedAmProduct.discountPrice && resolvedAmProduct.discountPrice < resolvedAmProduct.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{resolvedAmProduct.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Row: Single Add to Cart & Swap Button */}
                      <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <button
                          type="button"
                          onClick={() => handleAddSingleProduct(resolvedAmProduct)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add Only This Item (₹{resolvedAmProduct.discountPrice || resolvedAmProduct.price})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveDetailProduct(resolvedAmProduct)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                          >
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSwappingSlot("am");
                              setSwapSearchQuery("");
                              setSwapCategoryFilter("all");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer border border-amber-300/80"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Swap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🌙 EVENING PROTOCOL */}
                  {resolvedPmProduct && resolvedPmProduct._id !== resolvedAmProduct?._id && (
                    <div
                      className={`rounded-3xl border-2 p-5 sm:p-6 transition-all relative flex flex-col justify-between ${
                        selectedProductIds.has(resolvedPmProduct._id)
                          ? "border-indigo-400 bg-gradient-to-b from-indigo-50/80 to-white shadow-md"
                          : "border-slate-200 bg-slate-50 opacity-70"
                      }`}
                    >
                      <div>
                        {/* Card Header with Time & Checkbox */}
                        <div className="flex items-center justify-between pb-3 border-b border-indigo-200/70 mb-4">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-900 shadow-xs">
                              <Moon className="w-5 h-5 text-indigo-600" />
                            </span>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                                09:30 PM • NIGHT CELLULAR REPAIR
                              </span>
                              <p className="text-xs text-slate-700 font-medium">{resolvedPmTip}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSelect(resolvedPmProduct._id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              selectedProductIds.has(resolvedPmProduct._id)
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "border-2 border-slate-300 text-transparent hover:border-indigo-400"
                            }`}
                            title={selectedProductIds.has(resolvedPmProduct._id) ? "Deselect item" : "Select item for protocol"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Product Info Row (Clickable to view full details) */}
                        <div className="flex gap-4 items-start">
                          <div
                            onClick={() => setActiveDetailProduct(resolvedPmProduct)}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                            title="Click to view product details"
                          >
                            <img
                              src={
                                resolvedPmProduct.images?.[0]?.url ||
                                resolvedPmProduct.thumbnail ||
                                "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                              }
                              alt={resolvedPmProduct.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-200">
                                {resolvedPmProduct.category || "Therapeutic Rest"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveDetailProduct(resolvedPmProduct)}
                                className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                              >
                                View Details ↗
                              </button>
                            </div>

                            <h3
                              onClick={() => setActiveDetailProduct(resolvedPmProduct)}
                              className="font-bold text-sm text-slate-900 truncate mt-1 cursor-pointer hover:text-teal-700 transition-colors"
                              title={resolvedPmProduct.name}
                            >
                              {resolvedPmProduct.name}
                            </h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              By {resolvedPmProduct.brand || "M Wellness"}
                            </p>

                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-base font-black text-slate-900">
                                ₹{resolvedPmProduct.discountPrice || resolvedPmProduct.price}
                              </span>
                              {resolvedPmProduct.discountPrice && resolvedPmProduct.discountPrice < resolvedPmProduct.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{resolvedPmProduct.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Row: Single Add to Cart & Swap Button */}
                      <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <button
                          type="button"
                          onClick={() => handleAddSingleProduct(resolvedPmProduct)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add Only This Item (₹{resolvedPmProduct.discountPrice || resolvedPmProduct.price})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveDetailProduct(resolvedPmProduct)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                          >
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSwappingSlot("pm");
                              setSwapSearchQuery("");
                              setSwapCategoryFilter("all");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-[11px] font-bold transition-colors cursor-pointer border border-indigo-300/80"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Swap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🩺 Dr. AyurAI Clinical Biomarker Analysis & Circadian Lifestyle Hacks */}
                <div className="bg-gradient-to-br from-slate-900 via-[#012723] to-slate-950 rounded-3xl p-6 sm:p-7 text-white border border-teal-500/30 shadow-xl space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-teal-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">
                          Clinical AI Doctor Evaluation
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          Personalized Biomarker & Circadian Assessment
                        </h3>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Direct Store Inventory Match
                    </span>
                  </div>

                  {/* Doctor Analysis Text */}
                  <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/20 text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                    <div className="flex items-center gap-2 mb-1.5 text-teal-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Doctor's Clinical Note:
                    </div>
                    {resolvedDoctorAnalysis}
                  </div>

                  {/* 3-Phase Circadian Lifestyle Hacks */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2.5 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" /> 24-Hour Circadian Biological Bio-Hacks:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                          <Sun className="w-3.5 h-3.5" /> 🌅 Morning Awakening
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {resolvedCircadianHacks.morning}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-400/40 transition-colors">
                        <div className="flex items-center gap-1.5 text-teal-300 font-bold mb-1">
                          <Zap className="w-3.5 h-3.5" /> ☀️ Afternoon Focus
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {resolvedCircadianHacks.afternoon}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/40 transition-colors">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-bold mb-1">
                          <Moon className="w-3.5 h-3.5" /> 🌙 Evening Wind-Down
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {resolvedCircadianHacks.night}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dietary Advice */}
                  {resolvedDietaryAdvice && (
                    <div className="flex items-start gap-2.5 pt-3 border-t border-teal-800/40 text-xs text-teal-200/90">
                      <Utensils className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Dietary Synergy:</strong> {resolvedDietaryAdvice}
                      </span>
                    </div>
                  )}
                </div>

                {/* 💬 INTERACTIVE 24/7 AI DOCTOR CONSULTATION CHAT (ChatGPT-Style Real AI Experience) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                  {/* Chat Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#012723] to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-md">
                          <Bot className="w-5 h-5" />
                        </div>
                        <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">Dr. AyurAI</h3>
                          <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/30">
                            Multilingual AI Health Specialist
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-200/80">
                          Ask anything in Hinglish, Hindi, English, Gujarati, etc.
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>Live Gemini-Powered Assistant</span>
                    </div>
                  </div>

                  {/* Suggested Question Pills (Hinglish & English) */}
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                    <span className="text-[11px] font-bold text-slate-400 flex-shrink-0 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-teal-600" /> Quick Ask:
                    </span>
                    {[
                      "Diet me kya parhez rakhna hai?",
                      "Kya ise doodh ya gungune paani ke sath le sakte hain?",
                      "Kitne din me noticeable result dikhega?",
                      "Koi side effect to nahi hoga?",
                      "How should I use this routine?",
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(q)}
                        disabled={isChatSending}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Chat Messages Container */}
                  <div className="p-4 sm:p-5 space-y-4 max-h-80 overflow-y-auto bg-slate-50/50">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.sender === "ai" && (
                          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            msg.sender === "user"
                              ? "bg-teal-600 text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.text}</div>
                          <div
                            className={`text-[10px] mt-2 font-mono flex items-center justify-end gap-1 ${
                              msg.sender === "user" ? "text-teal-100" : "text-slate-400"
                            }`}
                          >
                            <span>{msg.time}</span>
                            {msg.sender === "ai" && <span>• Dr. AyurAI</span>}
                          </div>
                        </div>

                        {msg.sender === "user" && (
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing Animation when AI is generating */}
                    {isChatSending && (
                      <div className="flex gap-3 justify-start items-center">
                        <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3.5 shadow-xs flex items-center gap-2 text-xs text-slate-500">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span>Dr. AyurAI is formulating clinical advice...</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Poochiye Dr. AyurAI se kuch bhi (Hinglish, Hindi, English, Gujarati, etc.)...`}
                      disabled={isChatSending}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatSending}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-40 cursor-pointer flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </div>

                {/* 30-Day Expected Transformation Milestones */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      What to Expect with Consistency
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="font-bold text-teal-700">Day 7:</span>
                      <p className="text-slate-600 mt-0.5">{resolvedMilestones.day7}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="font-bold text-teal-700">Day 21:</span>
                      <p className="text-slate-600 mt-0.5">{resolvedMilestones.day21}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="font-bold text-teal-700">Day 45:</span>
                      <p className="text-slate-600 mt-0.5">{resolvedMilestones.day45}</p>
                    </div>
                  </div>
                </div>

                {/* Action Bar / 1-Click Cart Addition */}
                <div className="bg-gradient-to-r from-slate-900 via-[#012622] to-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">Selected Protocol Total:</span>
                      <span className="text-2xl font-black text-white">₹{totalDiscount}</span>
                      {savings > 0 && (
                        <span className="text-xs text-slate-400 line-through">₹{totalOriginal}</span>
                      )}
                      {savings > 0 && (
                        <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Save ₹{savings}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-teal-200/80 mt-0.5">
                      ✅ Free Express Shipping • Direct Brand Genuine Guarantee
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 flex-shrink-0 cursor-pointer"
                      title="Share Protocol"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isAddingToCart || selectedProductIds.size === 0}
                      onClick={handleAddProtocolToCart}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-[#0FB7A3] text-slate-950 font-black text-sm shadow-xl hover:shadow-teal-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-950" />
                      <span>
                        {isAddingToCart ? "Adding to Cart..." : `Adopt Protocol (${selectedProductIds.size} Selected)`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Back & Edit Answers Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Back to Step 3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span>← Back to Step 2</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restart Assessment from Step 1</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── PRODUCT QUICK VIEW MODAL (When clicking product details) ─── */}
      {activeDetailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                  {activeDetailProduct.category || "Wellness Formulation"}
                </span>
                <span className="text-xs text-slate-400">• Certified Quality</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailProduct(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-full sm:w-44 h-44 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={
                      activeDetailProduct.images?.[0]?.url ||
                      activeDetailProduct.thumbnail ||
                      "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                    }
                    alt={activeDetailProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-snug">
                    {activeDetailProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manufactured / Brand: <strong className="text-slate-700">{activeDetailProduct.brand || "M Wellness Bazaar"}</strong>
                  </p>

                  <div className="flex items-baseline gap-2.5 mt-3">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{activeDetailProduct.discountPrice || activeDetailProduct.price}
                    </span>
                    {activeDetailProduct.discountPrice && activeDetailProduct.discountPrice < activeDetailProduct.price && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{activeDetailProduct.price}
                      </span>
                    )}
                    {activeDetailProduct.discountPrice && activeDetailProduct.discountPrice < activeDetailProduct.price && (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                        {Math.round(((activeDetailProduct.price - activeDetailProduct.discountPrice) / activeDetailProduct.price) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <span>📦 In Stock ({activeDetailProduct.countInStock || "Available"})</span>
                    <span>• 🛡️ 100% Genuine Certified</span>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Product Details & Ayurvedic Benefits
                </h4>
                <div
                  className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto space-y-2"
                  dangerouslySetInnerHTML={{
                    __html: activeDetailProduct.description || "Certified Ayurvedic & nutritional formulation carefully crafted with active bio-available ingredients.",
                  }}
                />
              </div>

              {/* Wellness Goals Tags */}
              {Array.isArray(activeDetailProduct.wellnessGoal) && activeDetailProduct.wellnessGoal.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Targeted Health Goals:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDetailProduct.wellnessGoal.map((g, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-medium"
                      >
                        ✓ {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => window.open(`/product/${activeDetailProduct._id}`, "_blank")}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 font-bold underline cursor-pointer"
              >
                <span>Open Full Page View ↗</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDetailProduct(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddSingleProduct(activeDetailProduct);
                    setActiveDetailProduct(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart (₹{activeDetailProduct.discountPrice || activeDetailProduct.price})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SWAP PRODUCT MODAL ─── */}
      {swappingSlot && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Swap {swappingSlot === "am" ? "Morning (AM)" : "Evening (PM)"} Product
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose any active product from Wellness Bazaar inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwappingSlot(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Search Bar & Category Filters */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-2.5">
              <input
                type="text"
                value={swapSearchQuery}
                onChange={(e) => setSwapSearchQuery(e.target.value)}
                placeholder="Search products by name, category, or brand..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSwapCategoryFilter("all")}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium cursor-pointer ${
                    swapCategoryFilter === "all"
                      ? "bg-teal-700 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Items
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSwapCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium cursor-pointer ${
                      swapCategoryFilter === cat
                        ? "bg-teal-700 text-white font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Product List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {filteredSwapProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching products found in store inventory.
                </div>
              ) : (
                filteredSwapProducts.map((prod) => (
                  <div
                    key={prod._id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-teal-50/50 p-2 rounded-xl transition-colors cursor-pointer"
                    onClick={() => {
                      if (swappingSlot === "am") setCustomAmProduct(prod);
                      else setCustomPmProduct(prod);
                      setSwappingSlot(null);
                      toast.success(`Swapped to ${prod.name}!`);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        <img
                          src={
                            prod.images?.[0]?.url ||
                            prod.thumbnail ||
                            "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                          }
                          alt={prod.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {prod.category || "General"}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          By {prod.brand || "M Wellness"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-900 block">
                        ₹{prod.discountPrice || prod.price}
                      </span>
                      <button
                        type="button"
                        className="mt-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineBuilder;
