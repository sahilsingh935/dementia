import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./RecognitionGame.css";

import { saveRecognitionResult } from "../../services/recognitionDb";

// --------------------------------
// IMAGE LOADING
// --------------------------------

const imageModules = import.meta.glob(
  "../../assets/recognition/**/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const STATE_FOLDER_MAP = {
  Assam: "assam",
  Manipur: "manipur",
  Meghalaya: "meghalaya",
  Mizoram: "mizoram",
  Nagaland: "nagaland",
  Tripura: "tripura",
  Sikkim: "sikkim",
  "Arunachal Pradesh": "arunachal",
};

function getSelectedState() {
  return (
    localStorage.getItem("manasState") ||
    sessionStorage.getItem("manasState") ||
    "Assam"
  );
}

function getStateFolder(state) {
  return STATE_FOLDER_MAP[state] || "assam";
}

function getImage(fileName, state = "Assam") {
  if (!fileName) return "";

  const target = fileName
    .replace(/^.*[\\/]/, "")
    .replace(/\.(jpg|jpeg|png|webp)$/i, "")
    .toLowerCase()
    .trim();

  const entries = Object.entries(imageModules);

  function findInFolder(folder) {
    return entries.find(([key]) => {
      const normalized = key.replace(/\\/g, "/").toLowerCase();
      const actualFileName = normalized
        .split("/")
        .pop()
        .replace(/\.(jpg|jpeg|png|webp)$/i, "")
        .trim();

      return (
        normalized.includes(`/recognition/${folder}/`) &&
        actualFileName === target
      );
    });
  }

  const stateMatch = findInFolder(getStateFolder(state));
  if (stateMatch) return stateMatch[1];

  const commonMatch = findInFolder("common");
  if (commonMatch) return commonMatch[1];

  const assamMatch = findInFolder("assam");
  return assamMatch ? assamMatch[1] : "";
}

// --------------------------------
// SHUFFLE
// --------------------------------

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// --------------------------------
// QUESTION BANK
// --------------------------------

const questionBank = {
  Assam: [
    {
      category: "Culture",
      question: "Which festival is strongly associated with Assam?",
      hint: "It is celebrated with music and dance.",
      difficulty: "easy",
      options: [
        { label: "Bihu", value: "bihu", image: "bihu" },
        { label: "Onam", value: "onam", image: "onam" },
        { label: "Pongal", value: "pongal", image: "pongal" },
      ],
      answer: "bihu",
    },
    {
      category: "Nature",
      question: "Which famous river is associated with Assam?",
      hint: "It is one of the major rivers flowing through Assam.",
      difficulty: "easy",
      options: [
        { label: "Brahmaputra", value: "brahmaputra", image: "brahmaputra" },
        { label: "Yamuna", value: "yamuna", image: "yamuna" },
        { label: "Narmada", value: "narmada", image: "narmada" },
      ],
      answer: "brahmaputra",
    },
    {
      category: "Food",
      question: "Which traditional Assamese food is often made from rice?",
      hint: "It is a familiar traditional food.",
      difficulty: "easy",
      options: [
        { label: "Pitha", value: "pitha", image: "pitha" },
        { label: "Dosa", value: "dosa", image: "dosa" },
        { label: "Cake", value: "cake", image: "cake" },
      ],
      answer: "pitha",
    },
    {
      category: "Nature",
      question: "Which animal is famous in Kaziranga?",
      hint: "It has one large horn.",
      difficulty: "medium",
      options: [
        {
          label: "One-horned rhinoceros",
          value: "one_horned_rhino",
          image: "one_horned_rhino",
        },
        { label: "Camel", value: "camel", image: "camel" },
        { label: "Penguin", value: "penguin", image: "penguin" },
      ],
      answer: "one_horned_rhino",
    },
    {
      category: "Crafts",
      question: "Which type of silk is exclusive to Assam?",
      hint: "It is naturally golden in color.",
      difficulty: "medium",
      options: [
        { label: "Muga Silk", value: "muga_silk", image: "muga_silk" },
        { label: "Cotton", value: "cotton", image: "cotton" },
        { label: "Polyester", value: "polyester", image: "polyester" },
      ],
      answer: "muga_silk",
    },
    {
      category: "History",
      question: "Which historical dynasty ruled Assam for nearly 600 years?",
      hint: "They built the Rang Ghar.",
      difficulty: "hard",
      options: [
        { label: "Ahom Dynasty", value: "ahom_dynasty", image: "ahom_dynasty" },
        { label: "Mughal Empire", value: "mughal", image: "mughal" },
        { label: "Maurya Empire", value: "maurya", image: "maurya" },
      ],
      answer: "ahom_dynasty",
    },
  ],
  Meghalaya: [
    {
      category: "Food",
      question: "Which traditional food is associated with Meghalaya?",
      hint: "It is a Khasi rice preparation.",
      difficulty: "easy",
      options: [
        { label: "Jadoh", value: "jadoh", image: "jadoh" },
        { label: "Dosa", value: "dosa", image: "dosa" },
        { label: "Idli", value: "idli", image: "idli" },
      ],
      answer: "jadoh",
    },
    {
      category: "Nature",
      question: "Which natural structure is famous in Meghalaya?",
      hint: "It is made using living tree roots.",
      difficulty: "easy",
      options: [
        {
          label: "Living root bridge",
          value: "living_root_bridge",
          image: "living_root_bridge",
        },
        { label: "Stone castle", value: "castle", image: "castle" },
        { label: "Desert", value: "desert", image: "desert" },
      ],
      answer: "living_root_bridge",
    },
    {
      category: "Nature",
      question: "Which place is famous for heavy rainfall?",
      hint: "It is near the Khasi Hills.",
      difficulty: "easy",
      options: [
        { label: "Cherrapunji", value: "cherrapunji", image: "cherrapunji" },
        { label: "Jaisalmer", value: "jaisalmer", image: "jaisalmer" },
        { label: "Jaipur", value: "jaipur", image: "jaipur" },
      ],
      answer: "cherrapunji",
    },
    {
      category: "Landmark",
      question: "Which glass-like clear river is famous in Dawki?",
      hint: "It is located near the Bangladesh border.",
      difficulty: "medium",
      options: [
        { label: "Umngot River", value: "umngot", image: "umngot" },
        { label: "Ganges", value: "ganges", image: "ganges" },
        { label: "Yamuna", value: "yamuna", image: "yamuna" },
      ],
      answer: "umngot",
    },
    {
      category: "Culture",
      question:
        "Which Khasi festival is celebrated with traditional dance in Smit?",
      hint: "It is a festival of thanksgiving.",
      difficulty: "medium",
      options: [
        { label: "Nongkrem Dance", value: "nongkrem", image: "nongkrem" },
        { label: "Garba", value: "garba", image: "garba" },
        { label: "Bhangra", value: "bhangra", image: "bhangra" },
      ],
      answer: "nongkrem",
    },
    {
      category: "Culture",
      question:
        "Which Jaintia festival is celebrated to drive away plague and bad spirits?",
      hint: "It involves colorful wooden towers called Rot.",
      difficulty: "hard",
      options: [
        { label: "Behdienkhlam", value: "behdienkhlam", image: "behdienkhlam" },
        { label: "Chhath Puja", value: "chhath", image: "chhath" },
        { label: "Durga Puja", value: "durga_puja", image: "durga_puja" },
      ],
      answer: "behdienkhlam",
    },
  ],
  Manipur: [
    {
      category: "Nature",
      question: "Which famous lake is in Manipur?",
      hint: "It has floating islands called phumdis.",
      difficulty: "easy",
      options: [
        { label: "Loktak Lake", value: "loktak_lake", image: "loktak_lake" },
        { label: "Dal Lake", value: "dal_lake", image: "dal_lake" },
        { label: "Chilika Lake", value: "chilika_lake", image: "chilika_lake" },
      ],
      answer: "loktak_lake",
    },
    {
      category: "Nature",
      question: "Which deer is famous in Manipur?",
      hint: "It is associated with Keibul Lamjao.",
      difficulty: "easy",
      options: [
        { label: "Sangai", value: "sangai", image: "sangai" },
        { label: "Camel", value: "camel", image: "camel" },
        { label: "Yak", value: "yak", image: "yak" },
      ],
      answer: "sangai",
    },
    {
      category: "Culture",
      question: "Which dance is traditionally associated with Manipur?",
      hint: "It is a classical Indian dance.",
      difficulty: "easy",
      options: [
        {
          label: "Manipuri dance",
          value: "manipuri_dance",
          image: "manipuri_dance",
        },
        { label: "Kathakali", value: "kathakali", image: "kathakali" },
        { label: "Bhangra", value: "bhangra", image: "bhangra" },
      ],
      answer: "manipuri_dance",
    },
    {
      category: "Market",
      question: "Which famous market in Imphal is run mainly by women?",
      hint: "Its name means Mother's Market.",
      difficulty: "medium",
      options: [
        { label: "Ima Keithel", value: "ima_market", image: "ima_market" },
        {
          label: "Chandni Chowk",
          value: "chandni_chowk",
          image: "chandni_chowk",
        },
        { label: "Sunday Market", value: "market", image: "market" },
      ],
      answer: "ima_market",
    },
    {
      category: "Sports",
      question: "Which martial art form originated in Manipur?",
      hint: "It involves sword and spear techniques.",
      difficulty: "medium",
      options: [
        { label: "Thang-Ta", value: "thang_ta", image: "thang_ta" },
        { label: "Karate", value: "karate", image: "karate" },
        { label: "Judo", value: "judo", image: "judo" },
      ],
      answer: "thang_ta",
    },
    {
      category: "Crafts",
      question:
        "Which black pottery technique from Longpi village uses no potter's wheel?",
      hint: "It is made from serpentinite rock and clay.",
      difficulty: "hard",
      options: [
        { label: "Longpi Pottery", value: "longpi", image: "longpi" },
        { label: "Blue Pottery", value: "blue_pottery", image: "blue_pottery" },
        { label: "Terracotta", value: "terracotta", image: "terracotta" },
      ],
      answer: "longpi",
    },
  ],
  Nagaland: [
    {
      category: "Culture",
      question: "Which famous festival is celebrated in Nagaland?",
      hint: "It brings together many Naga tribes.",
      difficulty: "easy",
      options: [
        {
          label: "Hornbill Festival",
          value: "hornbill_dance",
          image: "hornbill_dance",
        },
        { label: "Bihu", value: "bihu", image: "bihu" },
        { label: "Onam", value: "onam", image: "onam" },
      ],
      answer: "hornbill_dance",
    },
    {
      category: "Food",
      question: "Which ingredient is famous in Naga cuisine?",
      hint: "It is fermented soybean.",
      difficulty: "easy",
      options: [
        { label: "Akhuni", value: "akhuni", image: "akhuni" },
        { label: "Curd", value: "curd", image: "curd" },
        { label: "Jam", value: "jam", image: "jam" },
      ],
      answer: "akhuni",
    },
    {
      category: "Clothing",
      question: "What is often part of traditional Naga clothing?",
      hint: "It is worn around the body.",
      difficulty: "easy",
      options: [
        { label: "Naga shawl", value: "naga_shawl", image: "naga_shawl" },
        { label: "Swimsuit", value: "swimsuit", image: "swimsuit" },
        {
          label: "School uniform",
          value: "school_uniform",
          image: "school_uniform",
        },
      ],
      answer: "naga_shawl",
    },
    {
      category: "Nature",
      question:
        "Which high valley in Nagaland is famous for its lily and trekking trails?",
      hint: "It is located at the border of Nagaland and Manipur.",
      difficulty: "medium",
      options: [
        {
          label: "Dzukou Valley",
          value: "dzukou_valley",
          image: "dzukou_valley",
        },
        { label: "Kashmir Valley", value: "kashmir", image: "kashmir" },
        {
          label: "Silent Valley",
          value: "silent_valley",
          image: "silent_valley",
        },
      ],
      answer: "dzukou_valley",
    },
    {
      category: "Food",
      question: "Which extremely spicy chili is native to Nagaland?",
      hint: "It is also known as Ghost Pepper.",
      difficulty: "medium",
      options: [
        { label: "Bhut Jolokia", value: "bhut_jolokia", image: "bhut_jolokia" },
        { label: "Capsicum", value: "capsicum", image: "capsicum" },
        { label: "Black Pepper", value: "black_pepper", image: "black_pepper" },
      ],
      answer: "bhut_jolokia",
    },
    {
      category: "History",
      question:
        "Which WWII memorial in Kohima honors soldiers with a famous epitaph?",
      hint: "It is an important historic memorial.",
      difficulty: "hard",
      options: [
        {
          label: "Kohima War Cemetery",
          value: "war_cemetery",
          image: "war_cemetery",
        },
        { label: "India Gate", value: "india_gate", image: "india_gate" },
        {
          label: "Jallianwala Bagh",
          value: "jallianwala",
          image: "jallianwala",
        },
      ],
      answer: "war_cemetery",
    },
  ],
  Tripura: [
    {
      category: "Food",
      question: "Which ingredient is important in traditional Tripura food?",
      hint: "It is a fermented fish ingredient.",
      difficulty: "easy",
      options: [
        { label: "Berma", value: "berma", image: "berma" },
        { label: "Chocolate", value: "chocolate", image: "chocolate" },
        { label: "Cheese", value: "cheese", image: "cheese" },
      ],
      answer: "berma",
    },
    {
      category: "Culture",
      question: "Which festival is associated with Tripura?",
      hint: "It is an important traditional festival.",
      difficulty: "easy",
      options: [
        { label: "Kharchi Puja", value: "kharchi_puja", image: "kharchi_puja" },
        { label: "Bihu", value: "bihu", image: "bihu" },
        { label: "Onam", value: "onam", image: "onam" },
      ],
      answer: "kharchi_puja",
    },
    {
      category: "Landmark",
      question: "Which famous palace is in Agartala?",
      hint: "It is a well-known landmark.",
      difficulty: "easy",
      options: [
        {
          label: "Ujjayanta Palace",
          value: "ujjayanta_palace",
          image: "ujjayanta_palace",
        },
        { label: "Taj Mahal", value: "taj_mahal", image: "taj_mahal" },
        { label: "Red Fort", value: "red_fort", image: "red_fort" },
      ],
      answer: "ujjayanta_palace",
    },
    {
      category: "Landmark",
      question:
        "Which archaeological site in Tripura features rock-cut carvings of Hindu deities?",
      hint: "It is located in the Unakoti district.",
      difficulty: "medium",
      options: [
        { label: "Unakoti", value: "unakoti", image: "unakoti" },
        { label: "Ajanta", value: "ajanta", image: "ajanta" },
        {
          label: "Mahabalipuram",
          value: "mahabalipuram",
          image: "mahabalipuram",
        },
      ],
      answer: "unakoti",
    },
    {
      category: "Food",
      question:
        "Which traditional Tripura dish is prepared by boiling vegetables without oil?",
      hint: "It is a traditional oil-free stew.",
      difficulty: "medium",
      options: [
        { label: "Mui Borok", value: "mui_borok", image: "mui_borok" },
        { label: "Fried Rice", value: "fried_rice", image: "fried_rice" },
        { label: "French Fries", value: "fries", image: "fries" },
      ],
      answer: "mui_borok",
    },
    {
      category: "History",
      question: "Which royal kingdom dynasty ruled Tripura for centuries?",
      hint: "It was the historic ruling dynasty of Tripura.",
      difficulty: "hard",
      options: [
        {
          label: "Manikya Dynasty",
          value: "manikya_dynasty",
          image: "manikya_dynasty",
        },
        { label: "Chola Dynasty", value: "chola", image: "chola" },
        { label: "Gupta Dynasty", value: "gupta", image: "gupta" },
      ],
      answer: "manikya_dynasty",
    },
  ],
  "Arunachal Pradesh": [
    {
      category: "Food",
      question: "Which noodle soup is popular in Arunachal Pradesh?",
      hint: "It is a warm noodle dish.",
      difficulty: "easy",
      options: [
        { label: "Thukpa", value: "thukpa", image: "thukpa" },
        { label: "Pizza", value: "pizza", image: "pizza" },
        { label: "Dosa", value: "dosa", image: "dosa" },
      ],
      answer: "thukpa",
    },
    {
      category: "Food",
      question: "Which traditional flatbread is associated with Arunachal?",
      hint: "It can be made from buckwheat flour.",
      difficulty: "easy",
      options: [
        { label: "Khura", value: "khura", image: "khura" },
        { label: "Idli", value: "idli", image: "idli" },
        { label: "Appam", value: "appam", image: "appam" },
      ],
      answer: "khura",
    },
    {
      category: "Culture",
      question: "Which famous monastery is in Tawang?",
      hint: "It is one of the best-known monasteries in the region.",
      difficulty: "easy",
      options: [
        {
          label: "Tawang Monastery",
          value: "tawang_monastery",
          image: "tawang_monastery",
        },
        {
          label: "Golden Temple",
          value: "golden_temple",
          image: "golden_temple",
        },
        { label: "Lotus Temple", value: "lotus_temple", image: "lotus_temple" },
      ],
      answer: "tawang_monastery",
    },
    {
      category: "Nature",
      question:
        "Which high mountain pass connects Tawang to the rest of India?",
      hint: "It is a high mountain pass near Tawang.",
      difficulty: "medium",
      options: [
        { label: "Sela Pass", value: "sela_pass", image: "sela_pass" },
        { label: "Rohtang Pass", value: "rohtang", image: "rohtang" },
        { label: "Nathu La", value: "nathula", image: "nathula" },
      ],
      answer: "sela_pass",
    },
    {
      category: "Culture",
      question:
        "Which festival is celebrated by the Apatani tribe in Ziro Valley?",
      hint: "It is celebrated for a good harvest.",
      difficulty: "medium",
      options: [
        {
          label: "Dree Festival",
          value: "dree_festival",
          image: "dree_festival",
        },
        { label: "Baisakhi", value: "baisakhi", image: "baisakhi" },
        { label: "Navratri", value: "navratri", image: "navratri" },
      ],
      answer: "dree_festival",
    },
    {
      category: "History",
      question:
        "Which ancient archaeological fort site near Itanagar dates back to the 14th century?",
      hint: "Its name means Fort of Bricks.",
      difficulty: "hard",
      options: [
        { label: "Ita Fort", value: "ita_fort", image: "ita_fort" },
        { label: "Red Fort", value: "red_fort", image: "red_fort" },
        { label: "Mehrangarh", value: "mehrangarh", image: "mehrangarh" },
      ],
      answer: "ita_fort",
    },
  ],
  Mizoram: [
    {
      category: "Food",
      question: "Which traditional Mizo food is made with vegetables?",
      hint: "It is a well-known Mizo dish.",
      difficulty: "easy",
      options: [
        { label: "Bai", value: "bai", image: "bai" },
        { label: "Dosa", value: "dosa", image: "dosa" },
        { label: "Pizza", value: "pizza", image: "pizza" },
      ],
      answer: "bai",
    },
    {
      category: "Culture",
      question: "Which festival is famous in Mizoram?",
      hint: "It is a traditional spring festival.",
      difficulty: "easy",
      options: [
        { label: "Chapchar Kut", value: "chapchar_kut", image: "chapchar_kut" },
        { label: "Bihu", value: "bihu", image: "bihu" },
        { label: "Onam", value: "onam", image: "onam" },
      ],
      answer: "chapchar_kut",
    },
    {
      category: "Culture",
      question: "Which dance is known as the bamboo dance?",
      hint: "Dancers move between bamboo poles.",
      difficulty: "easy",
      options: [
        { label: "Cheraw", value: "cheraw", image: "cheraw" },
        { label: "Garba", value: "garba", image: "garba" },
        { label: "Bhangra", value: "bhangra", image: "bhangra" },
      ],
      answer: "cheraw",
    },
    {
      category: "Nature",
      question:
        "Which highest peak in Mizoram is also known as the Blue Mountain?",
      hint: "It is also known as the Blue Mountain.",
      difficulty: "medium",
      options: [
        { label: "Phawngpui", value: "phawngpui", image: "phawngpui" },
        { label: "Anamudi", value: "anamudi", image: "anamudi" },
        { label: "Doddabetta", value: "doddabetta", image: "doddabetta" },
      ],
      answer: "phawngpui",
    },
    {
      category: "Landmark",
      question: "Which famous lake in Mizoram is shaped like a heart?",
      hint: "It is a heart-shaped lake.",
      difficulty: "medium",
      options: [
        { label: "Rih Dil", value: "rih_dil", image: "rih_dil" },
        { label: "Dal Lake", value: "dal_lake", image: "dal_lake" },
        { label: "Naini Lake", value: "naini", image: "naini" },
      ],
      answer: "rih_dil",
    },
    {
      category: "Culture",
      question:
        "Which traditional Mizo dance involves gong music and warrior movements?",
      hint: "It is a traditional warrior dance.",
      difficulty: "hard",
      options: [
        { label: "Sarlamkai", value: "sarlamkai", image: "sarlamkai" },
        { label: "Chhau", value: "chhau", image: "chhau" },
        { label: "Koli Dance", value: "koli", image: "koli" },
      ],
      answer: "sarlamkai",
    },
  ],
  Sikkim: [
    {
      category: "Food",
      question: "Which food is very popular in Sikkim?",
      hint: "It is a popular steamed dumpling.",
      difficulty: "easy",
      options: [
        { label: "Momos", value: "momos", image: "momos" },
        { label: "Pizza", value: "pizza", image: "pizza" },
        { label: "Idli", value: "idli", image: "idli" },
      ],
      answer: "momos",
    },
    {
      category: "Food",
      question: "Which noodle soup is popular in Sikkim?",
      hint: "It is warm and contains noodles.",
      difficulty: "easy",
      options: [
        { label: "Thukpa", value: "thukpa", image: "thukpa" },
        { label: "Dosa", value: "dosa", image: "dosa" },
        { label: "Pitha", value: "pitha", image: "pitha" },
      ],
      answer: "thukpa",
    },
    {
      category: "Nature",
      question: "Which famous mountain is associated with Sikkim?",
      hint: "It is one of the world's highest mountains.",
      difficulty: "easy",
      options: [
        { label: "Kanchenjunga", value: "kanchenjunga", image: "kanchenjunga" },
        { label: "Aravalli", value: "aravalli", image: "aravalli" },
        { label: "Nilgiri", value: "nilgiri", image: "nilgiri" },
      ],
      answer: "kanchenjunga",
    },
    {
      category: "Culture",
      question:
        "Which famous monastery in Gangtok is the seat of the Karmapa Lama?",
      hint: "It is a famous Buddhist monastery near Gangtok.",
      difficulty: "medium",
      options: [
        { label: "Rumtek Monastery", value: "rumtek", image: "rumtek" },
        { label: "Tawang Monastery", value: "tawang", image: "tawang" },
        { label: "Diskit Monastery", value: "diskit", image: "diskit" },
      ],
      answer: "rumtek",
    },
    {
      category: "Nature",
      question:
        "Which sacred high-altitude lake in North Sikkim is among the highest in the world?",
      hint: "It is a sacred high-altitude lake in North Sikkim.",
      difficulty: "medium",
      options: [
        {
          label: "Gurudongmar Lake",
          value: "gurudongmar",
          image: "gurudongmar",
        },
        { label: "Wular Lake", value: "wular", image: "wular" },
        { label: "Pangong Lake", value: "pangong", image: "pangong" },
      ],
      answer: "gurudongmar",
    },
    {
      category: "Culture",
      question: "Which Sikkim mask dance festival is performed by monks?",
      hint: "It is a sacred ritual mask dance.",
      difficulty: "hard",
      options: [
        { label: "Chaam Dance", value: "chaam", image: "chaam" },
        { label: "Kathak", value: "kathak", image: "kathak" },
        { label: "Bhangra", value: "bhangra", image: "bhangra" },
      ],
      answer: "chaam",
    },
  ],
};

// --------------------------------
// CREATE GAME QUESTIONS
// --------------------------------

function createGameQuestions(difficulty, state = "Assam") {
  const bank = questionBank[state] || questionBank.Assam;

  let filteredQuestions;

  if (difficulty === "easy") {
    filteredQuestions = bank.filter(
      (question) => question.difficulty === "easy",
    );
  } else {
    filteredQuestions = bank.filter(
      (question) => question.difficulty === "medium",
    );
  }

  if (filteredQuestions.length < 6) {
    filteredQuestions = bank;
  }

  return shuffle(filteredQuestions)
    .slice(0, 6)
    .map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));
}

// --------------------------------
// COMPONENT
// --------------------------------

export default function RecognitionGame() {
  const navigate = useNavigate();

  const selectedState = getSelectedState();

  const [screen, setScreen] = useState("quiz");

  const [questions, setQuestions] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);

  const [showCorrect, setShowCorrect] = useState(false);

  const [wrongQuestions, setWrongQuestions] = useState([]);

  const [showHint, setShowHint] = useState(false);

  // --------------------------------
  // ML STATE
  // --------------------------------

  const [currentLevel, setCurrentLevel] = useState(1);

  const [previousScore, setPreviousScore] = useState(0);

  const [mlLoading, setMlLoading] = useState(false);

  const current = questions[currentQuestion];

  // --------------------------------
  // REFS
  // --------------------------------

  const questionAttemptsRef = useRef({});

  const gameStartTimeRef = useRef(Date.now());

  const hintUsedRef = useRef(false);

  // --------------------------------
  // INITIAL GAME
  // --------------------------------

  useEffect(() => {
    const savedScore =
      Number(localStorage.getItem("recognitionPreviousScore")) || 0;

    setPreviousScore(savedScore);

    setCurrentLevel(1);

    setQuestions(createGameQuestions("easy", selectedState));

    gameStartTimeRef.current = Date.now();

    questionAttemptsRef.current = {};

    hintUsedRef.current = false;
  }, []);

  // --------------------------------
  // EXIT
  // --------------------------------

  function handleExit() {
    navigate("/patient");
  }

  // --------------------------------
  // RECORD ATTEMPT
  // --------------------------------

  function recordAttempt(questionIndex, isCorrect) {
    const existing = questionAttemptsRef.current[questionIndex] || {
      totalAttempts: 0,
      mistakes: 0,
      correctAttempts: 0,
    };

    questionAttemptsRef.current[questionIndex] = {
      totalAttempts: existing.totalAttempts + 1,

      mistakes: existing.mistakes + (isCorrect ? 0 : 1),

      correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
    };
  }

  // --------------------------------
  // CALCULATE STATS
  // --------------------------------

  function calculateGameStats() {
    const attempts = questionAttemptsRef.current;

    let totalAttempts = 0;
    let totalMistakes = 0;
    let totalCorrectAttempts = 0;
    let correctQuestions = 0;

    Object.values(attempts).forEach((attempt) => {
      totalAttempts += attempt.totalAttempts;

      totalMistakes += attempt.mistakes;

      totalCorrectAttempts += attempt.correctAttempts;

      if (attempt.correctAttempts > 0) {
        correctQuestions++;
      }
    });

    const accuracy =
      totalAttempts > 0
        ? Math.round((totalCorrectAttempts / totalAttempts) * 100)
        : 0;

    const score =
      questions.length > 0
        ? Math.round((correctQuestions / questions.length) * 100)
        : 0;

    const responseTime = Math.round(
      (Date.now() - gameStartTimeRef.current) / 1000,
    );

    return {
      totalAttempts,
      totalMistakes,
      totalCorrectAttempts,
      correctQuestions,
      accuracy,
      score,
      responseTime,
    };
  }

  // --------------------------------
  // DIFFICULTY SCORE
  // --------------------------------

  function calculateDifficultyScore(stats) {
    return Number(
      (
        0.4 * currentLevel +
        0.3 * ((100 - stats.accuracy) / 20) +
        0.2 * (stats.responseTime / 30) +
        0.1 * stats.totalMistakes
      ).toFixed(3),
    );
  }

  // --------------------------------
  // ML API
  // --------------------------------

  async function getMLDifficulty(stats) {
    const difficultyScore = calculateDifficultyScore(stats);

    try {
      setMlLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/recognition/difficulty/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            current_level: currentLevel,

            accuracy: stats.accuracy,

            response_time: stats.responseTime,

            total_attempts: stats.totalAttempts,

            mistakes: stats.totalMistakes,

            previous_score: previousScore,

            hint_used: hintUsedRef.current ? 1 : 0,

            difficulty_score: difficultyScore,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }

      const data = await response.json();

      const prediction = data.difficulty_change || "SAME";

      console.log("Recognition ML Prediction:", prediction);

      return {
        difficultyChange: prediction,

        difficultyScore,
      };
    } catch (error) {
      console.error("Recognition ML prediction failed:", error);

      return {
        difficultyChange: "SAME",
        difficultyScore,
      };
    } finally {
      setMlLoading(false);
    }
  }

  // --------------------------------
  // SAVE GAME RESULT
  // --------------------------------

  async function saveGameResult() {
    const stats = calculateGameStats();

    const mlResult = await getMLDifficulty(stats);

    // Save score for next session
    localStorage.setItem("recognitionPreviousScore", String(stats.score));

    // Save ML prediction
    localStorage.setItem(
      "recognitionLastDifficulty",
      mlResult.difficultyChange,
    );

    try {
      await saveRecognitionResult({
        totalQuestions: questions.length,

        totalAttempts: stats.totalAttempts,

        correctAttempts: stats.totalCorrectAttempts,

        mistakes: stats.totalMistakes,

        accuracy: stats.accuracy,

        responseTime: stats.responseTime,

        questionAttempts: questionAttemptsRef.current,

        completed: true,

        previousScore: previousScore,

        currentLevel: currentLevel,

        difficultyScore: mlResult.difficultyScore,

        difficultyChange: mlResult.difficultyChange,
        state: selectedState,
      });

      console.log("Recognition result saved to IndexedDB");
    } catch (error) {
      console.error("Failed to save recognition result:", error);
    }

    return mlResult;
  }

  // --------------------------------
  // OPTION SELECT
  // --------------------------------

  function handleSelectOption(value) {
    if (!current || showCorrect || mlLoading) {
      return;
    }

    const isCorrect = value === current.answer;

    recordAttempt(currentQuestion, isCorrect);

    // --------------------------------
    // CORRECT
    // --------------------------------

    if (isCorrect) {
      setSelectedOption(value);

      setShowCorrect(true);

      setTimeout(async () => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);

          setSelectedOption(null);

          setShowCorrect(false);

          setShowHint(false);

          hintUsedRef.current = false;
        } else {
          // Last question
          await saveGameResult();

          setScreen("result");
        }
      }, 700);

      return;
    }

    // --------------------------------
    // WRONG
    // --------------------------------

    setSelectedOption(value);

    setWrongQuestions((prev) => {
      const alreadyExists = prev.some(
        (item) => item.question === current.question,
      );

      if (alreadyExists) {
        return prev;
      }

      return [...prev, current];
    });
  }

  // --------------------------------
  // HINT
  // --------------------------------

  function handleHint() {
    if (showCorrect || mlLoading) {
      return;
    }

    hintUsedRef.current = true;

    setShowHint((prev) => !prev);
  }

  // --------------------------------
  // RETRY
  // --------------------------------

  function startRetry() {
    if (wrongQuestions.length === 0) {
      return;
    }

    const retryQuestions = shuffle(wrongQuestions).map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));

    setQuestions(retryQuestions);

    setCurrentQuestion(0);

    setSelectedOption(null);

    setShowCorrect(false);

    setShowHint(false);

    setWrongQuestions([]);

    questionAttemptsRef.current = {};

    hintUsedRef.current = false;

    gameStartTimeRef.current = Date.now();

    setScreen("quiz");
  }

  // --------------------------------
  // LOADING
  // --------------------------------

  if (!current && screen === "quiz") {
    return (
      <div className="recognition-container">
        <div className="recognition-loading">Loading...</div>
      </div>
    );
  }

  // --------------------------------
  // RESULT SCREEN
  // --------------------------------

  if (screen === "result") {
    return (
      <div className="recognition-container">
        <div className="recognition-result">
          <button
            type="button"
            className="recognition-exit"
            onClick={handleExit}
          >
            ← Back
          </button>

          {wrongQuestions.length > 0 ? (
            <>
              <h3 className="recognition-retry-heading">
                Let's try these again
              </h3>

              <div className="recognition-retry-list">
                {wrongQuestions.map((item, index) => (
                  <div key={index} className="recognition-retry-item">
                    {item.question}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="recognition-retry-button"
                onClick={startRetry}
              >
                Try Again
              </button>
            </>
          ) : (
            <div className="recognition-result-box">Great work!</div>
          )}

          <button
            type="button"
            className="recognition-games-button"
            onClick={handleExit}
          >
            Back to Patient Home
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------
  // QUIZ SCREEN
  // --------------------------------

  return (
    <div className="recognition-container">
      <div className="recognition-quiz">
        <div className="recognition-topbar">
          <button
            type="button"
            className="recognition-exit"
            onClick={handleExit}
          >
            ← Back
          </button>
        </div>

        <h1>Let's Remember</h1>

        <div className="recognition-state-badge">📍 {selectedState}</div>

        <div className="recognition-progress">
          Question {currentQuestion + 1} of {questions.length}
        </div>

        <div className="recognition-question-box">
          <p>{current.question}</p>
        </div>

        <div className="recognition-options">
          {current.options.map((option) => {
            const image = getImage(option.image, selectedState);

            const isSelected = selectedOption === option.value;

            const isCorrect = showCorrect && option.value === current.answer;

            return (
              <button
                type="button"
                key={option.value}
                className={[
                  "recognition-option",
                  isSelected ? "selected" : "",
                  isCorrect ? "correct" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSelectOption(option.value)}
                disabled={showCorrect || mlLoading}
              >
                {image ? (
                  <img
                    src={image}
                    alt={option.label}
                    className="recognition-option-image"
                  />
                ) : (
                  <div className="recognition-image-missing">
                    Image not found
                  </div>
                )}

                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="recognition-hint-button"
          onClick={handleHint}
          disabled={showCorrect || mlLoading}
        >
          💡 Hint
        </button>

        {showHint && (
          <div className="recognition-hint-text">{current.hint}</div>
        )}

        {showCorrect && (
          <div className="recognition-feedback success">Correct!</div>
        )}
      </div>
    </div>
  );
}
