const express = require("express");
const Product = require("../models/Product");
const axios = require("axios");

const router = express.Router();

/**
 * Helper to classify formulation type from product name, category, and description
 */
function classifyFormulation(product) {
  const name = (product.name || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const subCat = (product.subCategory || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const text = `${name} ${cat} ${subCat} ${desc}`;

  // 1. Panchakarma Therapy, Potlis & Physical Wellness Devices
  if (text.match(/\b(potli|steamer|device|yantra|equipment|shuddhi kit|pidanashak|massage table|roller|eye cup|jalneti)\b/i)) {
    return {
      type: "device",
      amTip: "Use for 10-15 minutes in the morning to awaken muscular & lymphatic circulation.",
      pmTip: "Warm gently and apply over neck, shoulders, and tension points for 15 minutes before sleep to relieve fatigue and ease the body into deep rest.",
      badge: "Panchakarma Therapy",
    };
  }

  // 2. Face Oils & Serums (Specifically for face/skin, NOT scalp)
  if (name.match(/\b(face oil|face serum|kumkumadi|facial oil|under arm)\b/i) || (cat.includes("personal care") && subCat.includes("face") && text.match(/\b(oil|serum)\b/i))) {
    return {
      type: "face_oil",
      amTip: "Apply 2-3 drops evenly on clean face & neck in the morning for all-day hydration & natural dermal glow.",
      pmTip: "Gently press 3-4 drops onto cleansed face, neck & temples before sleep for soothing overnight skin renewal and relaxation.",
      badge: "Vedic Face Elixir",
    };
  }

  // 3. Hair & Scalp Oils (For head massage, stress relief, cooling scalp)
  if (name.match(/\b(hair oil|scalp|brahmi|bhringraj|badam methi|kalonji|hair tonic|hair growth oil)\b/i) || subCat.includes("hair")) {
    return {
      type: "hair_oil",
      amTip: "Apply a few drops lightly on hair ends for smoothing and pollution protection.",
      pmTip: "Gently massage 5-10ml into scalp and temples before bed to cool the head, ease mental tension, and induce deep restful sleep.",
      badge: "Therapeutic Scalp Elixir",
    };
  }

  // 4. Lotions & Body Creams
  if (text.match(/\b(lotion|cream|moisturiz|butter)\b/i)) {
    return {
      type: "lotion",
      amTip: "Apply evenly on clean body & face in the morning for all-day dermal barrier protection.",
      pmTip: "Massage gently onto hands, arms, and pulse points before sleep for soothing aromatherapy and skin softening.",
      badge: "Nourishing Body Care",
    };
  }

  // 5. Teas, Arks, Kadhas & Powders (Drinkable)
  if (text.match(/\b(tea|kadha|decoction|drink|juice|beverage|ark|tulsi ark|moringa|mung|wheatgrass)\b/i)) {
    return {
      type: "tea",
      amTip: "Mix 1 teaspoon (or 5-10 drops of Ark) in warm water and drink 20 mins before or after breakfast.",
      pmTip: "Sip 1 warm cup (or warm water with Ark drops) 30-45 minutes before sleep to relax nervous system pathways.",
      badge: "Herbal Wellness Extract",
    };
  }

  // 6. Capsules & Tablets (Strict word boundaries)
  if (text.match(/\b(capsules?|tablets?|vati|guggulu|pills?)\b/i)) {
    return {
      type: "capsule",
      amTip: "Take 1 capsule with warm water after morning breakfast for active energy.",
      pmTip: "Take 1-2 capsules with warm water or milk 30 mins before bedtime for cellular restoration.",
      badge: "Standardized Extract",
    };
  }

  // 7. Cleansers, Scrubs, Ubtan & Soaps
  if (text.match(/cleanser|face wash|soap|ubtan|scrub/i)) {
    return {
      type: "cleanser",
      amTip: "Wash face thoroughly with lukewarm water to remove overnight sebum and refresh skin.",
      pmTip: "Cleanse away daily dust and pollution before night skincare protocol.",
      badge: "Purifying Botanical",
    };
  }

  // Generic fallback
  return {
    type: "general",
    amTip: "Use as directed in the morning for daily wellness activation.",
    pmTip: "Use as directed in the evening for nightly rejuvenation.",
    badge: "Wellness Formulation",
  };
}

/**
 * @route POST /api/ai/generate-protocol
 * @desc Generate real AI or clinical biomarker-backed routine protocol with actual database products
 * @access Public
 */
router.post("/generate-protocol", async (req, res) => {
  try {
    const {
      userName = "Friend",
      userAgeGroup = "25-34",
      userGender = "all",
      selectedGoal = "sleep",
      stressLevel = "moderate",
      sleepHours = "6-7",
      preference = "ayurvedic",
      routineTiming = "full_day",
    } = req.body;

    // Fetch all published products from database
    const products = await Product.find({ isPublished: true }).lean();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No published products found in store inventory." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // ─── OPTION 1: REAL GOOGLE GEMINI AI (If API key exists) ───
    if (geminiApiKey) {
      try {
        const compactCatalog = products.map((p) => ({
          id: String(p._id),
          name: p.name,
          category: p.category,
          price: p.discountPrice || p.price,
          description: p.description?.substring(0, 150),
          tags: p.tags,
        }));

        const prompt = `You are the Chief Ayurvedic Physician & Nutritional Scientist for M Wellness Bazaar.
A user named "${userName}" (Age: ${userAgeGroup}, Gender: ${userGender}) has completed an intake assessment.
Their primary goal is: "${selectedGoal}".
Their lifestyle biomarkers: Sleep: ${sleepHours} hours/night, Daily Stress: ${stressLevel}, Dietary Preference: ${preference}, Routine Timing: ${routineTiming}.

Here is the CURRENT LIVE STORE CATALOG of authentic products available:
${JSON.stringify(compactCatalog)}

TASK:
1. Select the SINGLE BEST AM Product ID and the SINGLE BEST PM Product ID from the catalog that directly addresses their biomarkers and goal "${selectedGoal}".
2. Write accurate, formulation-aware usage instructions for each product (e.g. if face oil/serum, apply on face/temples; if herbal tea/ark, mix in warm water; if potli/device, use as warm compress therapy).
3. Provide an in-depth, conversational AI Doctor Analysis addressing "${userName}" by name, analyzing how their ${sleepHours} sleep and ${stressLevel} stress impact their circadian rhythm and how this stack creates equilibrium.
4. Provide practical Circadian Biohacks (Morning, Afternoon, Night) and Dietary recommendations.
5. Provide realistic Day 7, Day 21, and Day 45 milestones.

Return ONLY a valid JSON object matching this exact schema:
{
  "amProductId": "...",
  "pmProductId": "...",
  "amUsageInstruction": "...",
  "pmUsageInstruction": "...",
  "aiDoctorAnalysis": "Dear ${userName}, based on your clinical intake...",
  "clinicalRationale": "...",
  "circadianHacks": {
    "morning": "...",
    "afternoon": "...",
    "night": "..."
  },
  "dietaryAdvice": "...",
  "synergyScore": 98,
  "milestones": {
    "day7": "...",
    "day21": "...",
    "day45": "..."
  }
}`;

        const candidateModels = [
          "gemini-3.1-flash-lite",
          "gemini-3.5-flash",
          "gemini-3.5-flash-lite",
          "gemini-flash-lite-latest",
          "gemini-3.6-flash",
          "gemini-flash-latest",
        ];
        let aiOutputText = null;

        for (const model of candidateModels) {
          try {
            const geminiRes = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
              {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3,
                },
              },
              { timeout: 9000 }
            );
            aiOutputText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiOutputText) break;
          } catch (modelErr) {
            console.warn(`Gemini model ${model} failed, trying next candidate:`, modelErr.response?.data?.error?.message || modelErr.message);
          }
        }

        if (aiOutputText) {
          const parsed = JSON.parse(aiOutputText);

          const amProd = products.find((p) => String(p._id) === String(parsed.amProductId)) || products[0];
          const pmProd = products.find((p) => String(p._id) === String(parsed.pmProductId)) || products[1] || products[0];

          return res.json({
            success: true,
            source: "google-gemini-ai",
            protocol: {
              amProduct: amProd,
              pmProduct: pmProd,
              amUsageInstruction: parsed.amUsageInstruction,
              pmUsageInstruction: parsed.pmUsageInstruction,
              aiDoctorAnalysis: parsed.aiDoctorAnalysis || `Hello ${userName}, your custom protocol has been formulated to recalibrate your circadian rhythm, relieve ${stressLevel} stress strain, and target ${selectedGoal}.`,
              clinicalRationale: parsed.clinicalRationale,
              circadianHacks: parsed.circadianHacks || {
                morning: "Hydrate with 500ml lukewarm water and get 10 mins of natural sunlight.",
                afternoon: "Maintain hydration and take 5 deep belly breaths during peak work hours.",
                night: "Turn off high-blue-light screens 45 mins before bedtime.",
              },
              dietaryAdvice: parsed.dietaryAdvice || "Incorporate fresh seasonal greens, warm soaked almonds, and limit heavy caffeine after 3:00 PM.",
              synergyScore: parsed.synergyScore || 98,
              milestones: parsed.milestones,
            },
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini API error, falling back to smart formulation classifier:", geminiErr.message);
      }
    }

    // ─── OPTION 2: DYNAMIC BIOMARKER & FORMULATION SYNTHESIS ENGINE (Emergency Offline Safety Net) ───
    const goalKeywordMap = {
      sleep: ["brahmi", "bhringraj", "shuddhi kit", "pidanashak", "potli", "sleep", "stress", "relaxation", "calm", "anxiety", "tulsi ark", "rest", "head massage", "panchakarma"],
      gut: ["triphala", "digestion", "gut", "detox", "cleanse", "panchakarma", "shuddhi kit", "fenugreek", "microgreens", "tea"],
      glow: ["kumkumadi", "silkaura", "face oil", "skin", "glow", "ubtan", "serum", "cleanser", "rose water", "beauty"],
      energy: ["moringa", "shilajit", "protein bite", "vitality", "stamina", "energy", "sunflower microgreens", "fitness"],
      muscle: ["protein bite", "muscle", "fitness", "shilajit", "potli", "strength", "recovery"],
      immunity: ["tulsi ark", "moringa", "immunity", "wellness", "steamer", "ayurved", "shuddhi kit"],
    };

    const targetKeywords = goalKeywordMap[selectedGoal] || goalKeywordMap.sleep;

    // Score products from actual store inventory
    const scoredList = products.map((p) => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const subCat = (p.subCategory || "").toLowerCase();
      const goals = Array.isArray(p.wellnessGoal) ? p.wellnessGoal.join(" ").toLowerCase() : "";
      const desc = (p.description || "").toLowerCase();

      let score = 0;

      targetKeywords.forEach((kw) => {
        const k = kw.toLowerCase();
        if (name.includes(k)) score += 35;
        else if (goals.includes(k)) score += 20;
        else if (cat.includes(k) || subCat.includes(k)) score += 15;
        else if (desc.includes(k)) score += 5;
      });

      // Strict goal-specific filtering
      if (selectedGoal === "sleep") {
        if (name.match(/hair color|dye|shampoo|conditioner|face wash|scrub|lip balm|kajal|pad/i)) score -= 100;
        if (name.match(/brahmi|bhringraj oil|pidanashak|potli|tulsi ark|shuddhi kit/i)) score += 40;
      }
      if (selectedGoal === "energy" && name.match(/moringa|shilajit|protein bite|sunflower microgreens/i)) score += 40;
      if (selectedGoal === "glow" && name.match(/kumkumadi|silkaura|face oil|ubtan|rose water/i)) score += 40;

      if (p.rating) score += p.rating * 2;
      if (p.isFeatured) score += 4;

      return { product: p, score };
    });

    scoredList.sort((a, b) => b.score - a.score);

    const amProd = scoredList[0]?.product || products[0];
    const pmProd = scoredList.find((sp) => String(sp.product._id) !== String(amProd._id) && sp.score > 0)?.product || scoredList[1]?.product || amProd;

    const amFormulation = classifyFormulation(amProd);
    const pmFormulation = classifyFormulation(pmProd);

    // Dynamically calculate biomarkers for ${userName}
    const doctorAnalysis = `Dear ${userName || "Friend"}, reviewing your profile (Age: ${userAgeGroup}, Sleep: ${sleepHours} hrs, Stress: ${stressLevel}), your physiological biomarkers indicate that your body needs synchronized Morning metabolic activation and Night neuromuscular recovery. Pairing ${amProd.name} with ${pmProd.name} addresses your elevated ${stressLevel} cortisol levels and restores natural ${selectedGoal} equilibrium.`;
    const rationale = `Clinically tailored for ${userName || "you"}: ${amProd.name} stimulates morning biological vitality, while ${pmProd.name} triggers evening cellular relaxation and tissue repair.`;

    const dynamicCircadianHacks = {
      morning: `Drink 500ml lukewarm water with ${amProd.name.includes("Ark") ? "5 drops of " + amProd.name : "morning hydration"} within 20 mins of waking and get 10 mins of natural sunlight.`,
      afternoon: `Maintain hydration, pace your ${stressLevel} stress workload, and practice 2 minutes of rhythmic box breathing during the 2–4 PM slump.`,
      night: `Apply/take ${pmProd.name} 30 mins before sleep, reduce high-intensity screens, and keep bedroom temperature cool.`,
    };

    const dynamicDietaryAdvice = `Incorporate warm whole foods tailored to your ${preference} diet, reduce refined sugars, and limit caffeinated beverages after 2:30 PM.`;

    return res.json({
      success: true,
      source: "dynamic-clinical-synthesizer",
      protocol: {
        amProduct: amProd,
        pmProduct: pmProd,
        amUsageInstruction: amFormulation.amTip,
        pmUsageInstruction: pmFormulation.pmTip,
        amBadge: amFormulation.badge,
        pmBadge: pmFormulation.badge,
        aiDoctorAnalysis: doctorAnalysis,
        clinicalRationale: rationale,
        circadianHacks: dynamicCircadianHacks,
        dietaryAdvice: dynamicDietaryAdvice,
        synergyScore: 98,
        milestones: {
          day7: `Initial reduction in ${selectedGoal} strain and improved daytime mental lightness`,
          day21: `Cellular circadian synchronization and sustained adaptation to ${amProd.name} & ${pmProd.name}`,
          day45: `Full biological balance and long-term vitality transformation`,
        },
      },
    });
  } catch (error) {
    console.error("AI Protocol generation error:", error);
    res.status(500).json({ message: "Server error generating protocol", error: error.message });
  }
});

/**
 * @route POST /api/ai/chat-consultation
 * @desc Interactive ChatGPT-style real-time AI consultation on user's protocol & wellness questions
 * @access Public
 */
router.post("/chat-consultation", async (req, res) => {
  try {
    const {
      message = "",
      chatHistory = [],
      userName = "Friend",
      selectedGoal = "wellness",
      amProductName = "",
      pmProductName = "",
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      const systemPrompt = `You are "Dr. AyurAI", Chief Clinical Wellness & Ayurvedic Specialist for M Wellness Bazaar.
You are having an interactive 1-on-1 real clinical health consultation with a customer named "${userName || "Friend"}".

Customer's Active Protocol:
- Morning Item (AM): ${amProductName || "Morning Herbal Activation"}
- Evening Item (PM): ${pmProductName || "Evening Restorative Therapy"}
- Primary Wellness Goal: ${selectedGoal}

Customer's Question: "${message}"

CRITICAL MANDATORY RULES:
1. **MULTILINGUAL & HINGLISH RULE (ABSOLUTE HIGHEST PRIORITY)**:
   - Identify the language and script of the user's question and ALWAYS reply in that EXACT SAME LANGUAGE:
   - If the user asks in **Hinglish** (Hindi written in English alphabet, e.g. "kaise use kare", "doodh ke sath le sakte hai kya", "neend nhi aati", "fayda kab hoga", "yrr", "batao", "bhai", "sir"), you MUST reply in 100% warm, natural, friendly, fluent **HINGLISH**.
   - If the user asks in **Hindi** (Devanagari script, e.g. "नमस्ते डॉक्टर, इसे कैसे लेना है?"), reply in **Hindi**.
   - If the user asks in **English**, reply in **English**.
   - If the user asks in **Gujarati, Punjabi, Marathi, Bengali, Tamil, Telugu, Spanish, etc.**, reply in that specific language.
   - NEVER reply in English if the user asked in Hinglish or Hindi!

2. **CLINICAL & AYURVEDIC FORMULATION ACCURACY**:
   - Face oils / serums (e.g. Silkaura, Kumkumadi): Direct for application onto clean face, neck, and temples (never scalp).
   - Hair / scalp oils (e.g. Brahmi, Bhringraj): Direct for scalp massage to cool the head and soothe mental fatigue.
   - Potlis & devices (e.g. Pidanashak Potli): Direct for gentle warm fomentation on neck, back, or joint pain areas before sleep.
   - Teas, arks, or syrups (e.g. Tulsi Ark): Direct to mix/drink with lukewarm water.
   - Capsules/tablets: Direct to take after meals with warm water or milk.

3. **PERSONA & FORMAT**:
   - Speak like a friendly, world-class Ayurvedic Doctor & integrative wellness coach (like ChatGPT / WHOOP Health).
   - Use helpful emojis (🌿, 🌙, 💧, ⏰, 💡) and clean bullet points.
   - Keep answers clear, reassuring, and practical (2-3 concise paragraphs or bullet points).`;

      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.6-flash",
        "gemini-flash-latest",
      ];

      for (const model of candidateModels) {
        try {
          const geminiRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 1000,
              },
            },
            { timeout: 8000 }
          );

          const replyText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            return res.json({
              success: true,
              source: "gemini-ai",
              model: model,
              reply: replyText.trim(),
            });
          }
        } catch (mErr) {
          console.warn(`Chat model ${model} issue:`, mErr.response?.data?.error?.message || mErr.message);
        }
      }
    }

    // ─── DYNAMIC MULTILINGUAL FALLBACK ENGINE (In case of external API downtime) ───
    const q = message.toLowerCase();
    const isHinglish = /(kya|kaise|kab|kyu|hai|ho|hoga|kare|karna|lena|lein|doodh|paani|fayde|neend|pet|dard|shuru|batao|bataiye|sir|yrr|yaar|khana|nashta|sath|parhez|kitne|fayda|side effect|nuksan|chehra|sir|tel|lagana|potli|bhai)/i.test(message) ||
      !/^[a-zA-Z0-9\s.,?!'"()-]+$/.test(message);

    let fallbackReply = "";

    if (isHinglish) {
      if (q.includes("doodh") || q.includes("milk") || q.includes("paani") || q.includes("water") || q.includes("kaise le")) {
        fallbackReply = `Namaste ${userName}! 🙏\n\n- **Subah ka formulation (${amProductName || "Morning Activation"})**: Ise subah nashte ke 15-20 minute baad 1 glass gungune paani ke sath lein.\n- **Raat ka formulation (${pmProductName || "Night Restorative"})**: Agar yeh ark/capsule hai to raat ko sone se pehle gungune doodh ya gungune paani ke sath le sakte hain. Agar potli ya oil hai, to ise bahar se gently apply ya sek karein.\n\n💡 *Doctor's Tip*: Khali pet lene ke bajay halka khana khane ke baad lena sabse behtar aur effective rehta hai.`;
      } else if (q.includes("diet") || q.includes("khana") || q.includes("parhez") || q.includes("food") || q.includes("kya khaye")) {
        fallbackReply = `Namaste ${userName}! 🙏\n\nAapke **${selectedGoal}** protocol ke sath fast results ke liye yeh 3 zaroori dietary habits follow karein:\n\n1. **Hydration**: Dinbhar me 2.5 se 3 litre gunguna ya normal paani zaroor piyein taaki herbs ka absorption fast ho.\n2. **Shaam ka Dinner**: Raat ka khana sone se kam se kam 2 ghante pehle halka lein (jaise moong daal, soup, ya roti-sabji).\n3. **Caffeine & Junk**: Dopahar 3:00 baje ke baad heavy chai, coffee ya junk food avoid karein taaki circadian sleep rhythm disturb na ho.`;
      } else if (q.includes("kab") || q.includes("time") || q.includes("kaise") || q.includes("routine") || q.includes("follow") || q.includes("potli")) {
        fallbackReply = `Namaste ${userName}! 🙏 Aapka daily routine follow karne ka exact tareeqa yeh hai:\n\n🌅 **Subah (08:00 AM - Morning Activation)**:\n- **${amProductName || "Morning Formulation"}**: Nashte ke 15-20 min baad gungune paani ke sath lein. Yeh dinbhar sustained energy aur vitality banaye rakhega.\n\n🌙 **Raat (09:30 PM - Night Cellular Repair)**:\n- **${pmProductName || "Evening Therapy"}**: Sone se 30 minute pehle use karein. Yeh body aur nervous system ko relax karke deep restorative sleep me madad karega.\n\nRoz regular time par follow karein!`;
      } else if (q.includes("side effect") || q.includes("safe") || q.includes("nuksan") || q.includes("koi problem")) {
        fallbackReply = `Namaste ${userName}! 🙏\n\nAap bilkul nishchint rahiye. Hamare store ke sabhi formulations 100% Certified Ayurvedic, chemical-free aur natural plant-based ingredients se banaye gaye hain. Inka koi adverse side effect nahi hota.\n\nBas daily recommended timing aur dosage follow karein.`;
      } else if (q.includes("result") || q.includes("kitne din") || q.includes("fayda") || q.includes("kab tak")) {
        fallbackReply = `Namaste ${userName}! 🙏\n\n- **Pehle 7 din**: Energy stability, halkapan aur initial stress relief mehsoos hone lagega.\n- **21 din**: Circadian clock aur metabolism poori tarah naturally align ho jayega.\n- **45 din**: Deep cellular transformation aur sustainable health results clearly visible honge.\n\nConsistency sabse zaroori hai!`;
      } else {
        fallbackReply = `Namaste ${userName}! 🙏 Main Dr. AyurAI hoon.\n\nAapke **${selectedGoal.toUpperCase()}** protocol (${amProductName || "Morning Activation"} + ${pmProductName || "Evening Restorative"}) ke baare me:\n\n1. **Daily Routine**: Subah nashte ke baad aur raat ko sone se 30 minute pehle regular follow karein.\n2. **Paani**: Din me 2.5–3L paani piyein taaki herbs efficiently absorb hon.\n3. **Natural & Pure**: Yeh pure botanical formulations hain jo aapke health balance ko naturally restore karte hain.\n\nAap dosage, timing ya diet ke baare me kuch bhi bejhijhak pooch sakte hain!`;
      }
    } else {
      fallbackReply = `Hello ${userName}! Regarding your ${selectedGoal} protocol (${amProductName} + ${pmProductName}):\n\n1. **Timing & Consistency**: Take your morning formulation 15 minutes after breakfast and apply/take your evening formulation 30 minutes before sleep.\n2. **Hydration & Diet**: Drink 2.5–3 liters of lukewarm water daily and keep evening meals light for rapid botanical absorption.\n3. **100% Clean & Safe**: These formulations are certified natural, non-habit forming, and safe for daily use.\n\nFeel free to ask any further clinical or timing questions!`;
    }

    return res.json({
      success: true,
      source: "clinical-assistant-fallback",
      reply: fallbackReply,
    });
  } catch (error) {
    console.error("AI Chat consultation error:", error);
    res.status(500).json({ message: "Server error in consultation", error: error.message });
  }
});

module.exports = router;
