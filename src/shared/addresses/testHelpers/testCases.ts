import { compileAddressHandlingConfig } from "../helpersForWordReplacements";
import {
  AddressHandlingConfig,
  AddressToken,
  AtomicAddressToken,
  CleanedAddressAst,
} from "../types";

export const testCases: Array<{
  addressHandlingConfig?: AddressHandlingConfig;
  rawAddresses: string[];
  expectedAtomicTokens?: AtomicAddressToken[];
  expectedTokens?: AddressToken[];
  expectedCleanedAddressAst?: CleanedAddressAst;
  expectedCleanedAddress?: string;
  expectedStandardizedAddress?: string | null;
  expectedNormalizedAddress?: string;
  expectedNormalizedAtomicAddresses?: string[];
}> = [
  {
    rawAddresses: [""],
    expectedAtomicTokens: [],
    expectedTokens: [],
  },
  {
    rawAddresses: [
      "(,58,ПЕНЗЕНСКИЙ Р-Н, ,Засечное С.,МАЛ.ШКОЛЬНЫЙ \"ПРОЕЗД'_10А/42,,)",
    ],
    expectedCleanedAddress:
      "58, ПЕНЗЕНСКИЙ РАЙОН, ЗАСЕЧНОЕ СЕЛО, МАЛЫЙ ШКОЛЬНЫЙ ПРОЕЗД 10А/42",
    expectedAtomicTokens: [
      ["bracket", "("],
      ["comma", ","],
      ["numberSequence", "58"],
      ["comma", ","],
      ["letterSequence", "ПЕНЗЕНСКИЙ"],
      ["spacing", " "],
      ["letterSequence", "Р"],
      ["dash", "-"],
      ["letterSequence", "Н"],
      ["comma", ","],
      ["spacing", " "],
      ["comma", ","],
      ["letterSequence", "Засечное"],
      ["spacing", " "],
      ["letterSequence", "С"],
      ["period", "."],
      ["comma", ","],
      ["letterSequence", "МАЛ"],
      ["period", "."],
      ["letterSequence", "ШКОЛЬНЫЙ"],
      ["spacing", " "],
      ["quote", '"'],
      ["letterSequence", "ПРОЕЗД"],
      ["quote", "'"],
      ["spacing", "_"],
      ["numberSequence", "10"],
      ["letterSequence", "А"],
      ["slash", "/"],
      ["numberSequence", "42"],
      ["comma", ","],
      ["comma", ","],
      ["bracket", ")"],
    ],
    expectedCleanedAddressAst: {
      nodeType: "cleanedAddress",
      children: [
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "58",
          number: 58,
          ending: "",
        },
        {
          nodeType: "separator",
          separatorType: "comma",
        },
        {
          nodeType: "word",
          wordType: "unclassified",
          value: "пензенский",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "район",
        },
        {
          nodeType: "separator",
          separatorType: "comma",
        },
        {
          nodeType: "word",
          wordType: "unclassified",
          value: "засечное",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "село",
        },
        {
          nodeType: "separator",
          separatorType: "comma",
        },
        {
          nodeType: "word",
          wordType: "designationAdjective",
          value: "малый",
        },
        {
          nodeType: "word",
          wordType: "unclassified",
          value: "школьный",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "проезд",
        },
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "10а",
          number: 10,
          ending: "а",
        },
        {
          nodeType: "separator",
          separatorType: "slash",
        },
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "42",
          number: 42,
          ending: "",
        },
      ],
    },
    expectedStandardizedAddress:
      "область пензенская, засечное, проезд школьный малый, 10а/42",
    expectedNormalizedAddress:
      "область пензенская, засечное, проезд школьный малый, 10а/42",
  },

  {
    rawAddresses: [",,Пенз обл., 1я  ул.А.С Пушкина-тестова. д.4,корп№5000"],
    expectedCleanedAddress:
      "ПЕНЗ ОБЛАСТЬ, 1-Я УЛИЦА А. С. ПУШКИНА-ТЕСТОВА ДОМ 4, КОРПУС 5000",
    expectedTokens: [
      ["comma", ","],
      ["comma", ","],
      ["letterSequence", "пенз"],
      ["spacing", " "],
      ["protoWord", "обл."],
      ["comma", ","],
      ["spacing", " "],
      ["protoWord", "1я"],
      ["spacing", "  "],
      ["protoWord", "ул."],
      ["protoWord", "а."],
      ["letterSequence", "с"],
      ["spacing", " "],
      ["protoWord", "пушкина-тестова."],
      ["spacing", " "],
      ["protoWord", "д."],
      ["numberSequence", "4"],
      ["comma", ","],
      ["letterSequence", "корп"],
      ["numberSign", "№"],
      ["numberSequence", "5000"],
    ],
    expectedCleanedAddressAst: {
      nodeType: "cleanedAddress",
      children: [
        {
          nodeType: "word",
          wordType: "unclassified",
          value: "пенз",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "область",
        },
        {
          nodeType: "separator",
          separatorType: "comma",
        },
        {
          nodeType: "word",
          wordType: "ordinalNumber",
          value: "1-я",
          number: 1,
          ending: "-я",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "улица",
        },
        {
          nodeType: "word",
          wordType: "initial",
          value: "а.",
        },
        {
          nodeType: "word",
          wordType: "initial",
          value: "с.",
        },
        {
          nodeType: "word",
          wordType: "unclassified",
          value: "пушкина-тестова",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "дом",
        },
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "4",
          number: 4,
          ending: "",
        },
        {
          nodeType: "separator",
          separatorType: "comma",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "корпус",
        },
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "5000",
          number: 5000,
          ending: "",
        },
      ],
    },
    expectedStandardizedAddress: null,
    expectedNormalizedAddress:
      "ПЕНЗ ОБЛАСТЬ, 1-Я УЛИЦА А. С. ПУШКИНА-ТЕСТОВА ДОМ 4, КОРПУС 5000",
  },
  {
    rawAddresses: ["(р-н. 1-ый,10 к10 10корп5 10Ж,1корп"],
    expectedCleanedAddress: "РАЙОН 1-Й, 10 КОРПУС 10 10 КОРПУС 5 10Ж, 1 КОРПУС",
    expectedTokens: [
      ["bracket", "("],
      ["protoWord", "р-н."],
      ["spacing", " "],
      ["protoWord", "1-ый"],
      ["comma", ","],
      ["numberSequence", "10"],
      ["spacing", " "],
      ["letterSequence", "к"],
      ["numberSequence", "10"],
      ["spacing", " "],
      ["numberSequence", "10"],
      ["letterSequence", "корп"],
      ["numberSequence", "5"],
      ["spacing", " "],
      ["protoWord", "10ж"],
      ["comma", ","],
      ["protoWord", "1корп"],
    ],
  },
  {
    rawAddresses: ["Такая-то ул - 10-12"],
    expectedCleanedAddress: "ТАКАЯ-ТО УЛИЦА, 10-12",
    expectedTokens: [
      ["protoWord", "такая-то"],
      ["spacing", " "],
      ["letterSequence", "ул"],
      ["spacing", " "],
      ["dash", "-"],
      ["spacing", " "],
      ["numberSequence", "10"],
      ["dash", "-"],
      ["numberSequence", "12"],
    ],
    expectedCleanedAddressAst: {
      nodeType: "cleanedAddress",
      children: [
        {
          nodeType: "word",
          wordType: "unclassified",
          value: "такая-то",
        },
        {
          nodeType: "word",
          wordType: "designation",
          value: "улица",
        },
        {
          nodeType: "separator",
          separatorType: "comma",
        },
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "10",
          number: 10,
          ending: "",
        },
        {
          nodeType: "separator",
          separatorType: "dash",
        },
        {
          nodeType: "word",
          wordType: "cardinalNumber",
          value: "12",
          number: 12,
          ending: "",
        },
      ],
    },
  },
  {
    rawAddresses: ['г.Пенза, с/т«труД" ,10/12,сарай_10а'],
    expectedCleanedAddress: "ГОРОД ПЕНЗА, СТ ТРУД, 10/12, САРАЙ 10А",
    expectedTokens: [
      ["protoWord", "г."],
      ["letterSequence", "пенза"],
      ["comma", ","],
      ["spacing", " "],
      ["protoWord", "с/т"],
      ["quote", "«"],
      ["letterSequence", "труд"],
      ["quote", '"'],
      ["spacing", " "],
      ["comma", ","],
      ["numberSequence", "10"],
      ["slash", "/"],
      ["numberSequence", "12"],
      ["comma", ","],
      ["letterSequence", "сарай"],
      ["spacing", "_"],
      ["protoWord", "10а"],
    ],
  },
  {
    rawAddresses: [
      "2—й  с\\т Такой—то д42", // m-dashes
      "2–й  с\\т Такой–то д42", // n-dashes
      "2−й  с\\т Такой−то д42", // minuses
    ],
    expectedCleanedAddress: "2-Й СТ ТАКОЙ-ТО ДОМ 42",
    expectedTokens: [
      ["protoWord", "2-й"], // hyphen
      ["spacing", "  "],
      ["protoWord", "с/т"],
      ["spacing", " "],
      ["protoWord", "такой-то"], // hyphen
      ["spacing", " "],
      ["letterSequence", "д"],
      ["numberSequence", "42"],
    ],
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗЕНСКИЙ Р-Н, С. ЗАСЕЧНОЕ, УЛ_ОВРАЖНАЯ, ДОМ_17, БЛОК №2, КВ.N3",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗЕНСКИЙ РАЙОН, СЕЛО ЗАСЕЧНОЕ, УЛИЦА ОВРАЖНАЯ, ДОМ 17, БЛОК 2, КВАРТИРА 3",
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, Р-Н ПЕНЗЕНСКИЙ, С. ЗАСЕЧНОЕ, УЛ. МЕХАНИЗАТОРОВ - 36, ГАРАЖ114",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, РАЙОН ПЕНЗЕНСКИЙ, СЕЛО ЗАСЕЧНОЕ, УЛИЦА МЕХАНИЗАТОРОВ, 36, ГАРАЖ 114",
  },
  {
    rawAddresses: [
      'Пензенская обл., г. Пенза, с/т "Заря" на территории совхоза "Заря", уч. 350.',
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, СТ ЗАРЯ НА ТЕРРИТОРИИ СОВХОЗА ЗАРЯ, УЧАСТОК 350",
  },
  {
    rawAddresses: [
      "Пензенская область, г.Пенза, Октябрьский район, пр. Брусничный 6-Й, строен.57",
      "Пензенская область, г.Пенза, Октябрьский район, пр. Брусничный 6 Й, строен.57",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, проезд брусничный 6-й, 57",
  },
  {
    rawAddresses: [
      "Пензенская обл., Пензенский р-н, с. Засечное, ул. Прибрежная, д..1 Б",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗЕНСКИЙ РАЙОН, СЕЛО ЗАСЕЧНОЕ, УЛИЦА ПРИБРЕЖНАЯ, ДОМ 1Б",
  },
  {
    rawAddresses: ["ул.Московская/ул.К Маркса, сквер 40 лет Октября"],
    expectedCleanedAddress:
      "УЛИЦА МОСКОВСКАЯ/УЛИЦА К. МАРКСА, СКВЕР 40 ЛЕТ ОКТЯБРЯ",
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ПРОСПЕКТ 30-ЛЕТИЯ ПОБЕДЫ, ЗДАНИЕ 43-А",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ПРОСПЕКТ 30 - ЛЕТИЯ ПОБЕДЫ, ЗДАНИЕ 43А",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ПРОСПЕКТ 30  -ЛЕТИЯ ПОБЕДЫ, ЗДАНИЕ 43А",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ПРОСПЕКТ 30-\tЛЕТИЯ ПОБЕДЫ, ЗДАНИЕ 43А",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ПРОСПЕКТ 30-ЛЕТИЯ ПОБЕДЫ, ЗДАНИЕ 43А",
    expectedStandardizedAddress:
      "область пензенская, заречный, проспект 30-летия победы, 43а",
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ВТОРОЕ ТАКОЕ-ТО ШОССЕ ДОМ 10-В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2Е ТАКОЕ-ТО ШОССЕ ДОМ 10-В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10-В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10 - В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10- В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10 -В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10 В",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10В.",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10 В.",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10В",
    expectedStandardizedAddress:
      "область пензенская, заречный, шоссе такое-то 2-е, 10в",
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2Е ТАКОЕ-ТО ШОССЕ ДОМ 10-Е",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10-Е",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2 -Е ТАКОЕ-ТО ШОССЕ ДОМ 10 - Е",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2 - Е ТАКОЕ-ТО ШОССЕ ДОМ 10- Е",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2- Е ТАКОЕ-ТО ШОССЕ ДОМ 10 -Е",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, 2-Е ТАКОЕ-ТО ШОССЕ ДОМ 10Е",
    expectedStandardizedAddress:
      "область пензенская, заречный, шоссе такое-то 2-е, 10е",
    expectedNormalizedAddress:
      "область пензенская, заречный, шоссе такое-то 2-е, 10е",
  },
  {
    rawAddresses: [
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10-Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10-Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10 - Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10- Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10 -Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10 Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10Е., ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10 Е., ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10 Е., ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
    ],
    expectedCleanedAddress:
      "ТАКОЕ-ТО ШОССЕ, ДОМ 10Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
    expectedStandardizedAddress:
      "область пензенская, заречный, шоссе такое-то, 10е",
  },
  {
    rawAddresses: [
      "ТАКОЕ-ТО ШОССЕ, 10-Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10-Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10 - Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10- Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10 -Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10 Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10Е., ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
      "ТАКОЕ-ТО ШОССЕ, 10 Е., ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
    ],
    expectedCleanedAddress:
      "ТАКОЕ-ТО ШОССЕ, 10Е, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ",
    expectedStandardizedAddress:
      "область пензенская, заречный, шоссе такое-то, 10е",
  },
  {
    rawAddresses: ["ул. Максима Горького/ул. Володарского 38/45"],
    expectedCleanedAddress: "УЛИЦА МАКСИМА ГОРЬКОГО/УЛИЦА ВОЛОДАРСКОГО 38/45",
    expectedStandardizedAddress: null,
    expectedNormalizedAddress:
      "УЛИЦА МАКСИМА ГОРЬКОГО/УЛИЦА ВОЛОДАРСКОГО 38/45",
    expectedNormalizedAtomicAddresses: [
      "УЛИЦА МАКСИМА ГОРЬКОГО/УЛИЦА ВОЛОДАРСКОГО 38/45",
    ],
  },
  {
    rawAddresses: [
      "РОССИЙСКАЯ ФЕДЕРАЦИЯ, ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗА ГОРОД, ЖЕЛЕЗНОДОРОЖНЫЙ РАЙОН, ЖИВОПИСНЫЙ ПР-Д, ДОМ 12",
    ],
    expectedNormalizedAddress:
      "область пензенская, пенза, проезд живописный, 12",
  },
  {
    rawAddresses: ["область пензенская, пенза, гск импульс, 2 литер дом"],
  },
  {
    rawAddresses: [
      "ГОРОД ПЕНЗА, СЕЛО ГСК QUOT УРАЛ QUOT, УЛИЦА СТРОИТЕЛЕЙ, ДОМ 17В, 61",
      "г Пенза, п Нефтяник, снт &quot;Гудок&quot; 3 квартал, д. №192а",
    ],
  },
  {
    rawAddresses: ["ГОРОД ЗАРЕЧНЫЙ, УЛИЦА ГАРАЖНЫЙ КООПЕРАТИВ ЭЛЬФ, ГАРАЖ 191"],
  },
  {
    rawAddresses: [
      "УЛИЦА ТЕРНОПОЛЬСКАЯ, ДОМ 7, КОРПУС, ПОДЪЕЗД СЕЛО 3 ПО 8, ПЕНЗА, ПЕНЗЕНСКАЯ ОБЛАСТЬ",
    ],
  },
  {
    rawAddresses: ["УЛИЦА СЕРДОБСКАЯ, ДОМ 2, ЛИТ В, ПЕНЗА, ПЕНЗЕНСКАЯ ОБЛАСТЬ"],
  },
  {
    rawAddresses: [
      "Российская Федерация Пензенская область, Пензенский район, село Засечное, улица Речная, д. 16",
    ],
  },
  {
    rawAddresses: [
      "г Заречный, пересечение ул. Школьной и 2-го Школьного проезда",
    ],
    // expectedNormalizedAddress:
    //   "ГОРОД ЗАРЕЧНЫЙ, ПЕРЕСЕЧЕНИЕ УЛИЦЫ ШКОЛЬНОЙ И 2-ГО ШКОЛЬНОГО ПРОЕЗДА",
  },
  {
    rawAddresses: ["область пензенская, заречный, улица ю. п. любовина, 15"],
    expectedNormalizedAddress:
      "область пензенская, заречный, улица ю. п. любовина, 15",
  },
  {
    rawAddresses: [
      "Пензенская область, г. Пенза, ул. Бугровка Б., ГСК 12, гараж №290",
    ],
    // expectedNormalizedAddress: "г Заречный, пересечение ул. Школьной и 2-го Школьного проезда"
  },
  {
    rawAddresses: ['Пензенская обл., г. Пенза, СНТ "Засека", участок 34/Ш'],
    // expectedNormalizedAddress: "г Заречный, пересечение ул. Школьной и 2-го Школьного проезда"
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА КУЙБЫШЕВА/КРАСНАЯ, 33А/23",
    ],
    // expectedNormalizedAddress: "г Заречный, пересечение ул. Школьной и 2-го Школьного проезда"
  },
  {
    rawAddresses: ["область пензенская, пенза, улица 8 марта дом 90"],
    expectedNormalizedAddress: "область пензенская, пенза, улица 8 марта, 90",
  },
  {
    rawAddresses: [
      "область тестовая, город тестовск, улица 50 лет октября, 1",
      "область тестовая, тестовск, ул. 50 лет октября 1",
    ],
    expectedNormalizedAddress:
      "область тестовая, тестовск, улица 50 лет октября, 1",
  },
  {
    rawAddresses: ["область тестовая, город тестовск, проезд, 10"],
    expectedStandardizedAddress: null,
    expectedNormalizedAddress: "ОБЛАСТЬ ТЕСТОВАЯ, ГОРОД ТЕСТОВСК, ПРОЕЗД, 10",
  },
  {
    rawAddresses: [
      "область тестовая, тестовск, территория снт «6 соток», участок 42",
      "область тестовая, тестовск, тер. снт 6 соток, уч. 42",
      "область тестовая, тестовск, снт 6 соток, уч. 42",
      "область тестовая, тестовск, cнт 6 соток, уч. 42", // latin c
      "область тестовая, тестовск, Cнт 6 соток, уч. 42", // latin c
    ],
    expectedNormalizedAddress: "область тестовая, тестовск, снт 6 соток, 42",
  },
  {
    rawAddresses: ["область пензенская, пенза, проезд второй санитарный, 9а"],
    expectedNormalizedAddress:
      "область пензенская, пенза, проезд санитарный 2-й, 9а",
  },
  {
    rawAddresses: [
      "Российская Федерация, Курганская обл, Шумихинский р-н, Шумиха г. Ленина ул, д. 108",
    ],
    // expectedNormalizedAddress: "область курганская, шумиха, улица ленина, 108"
  },
  {
    rawAddresses: [
      "УЛИЦА НАБЕРЕЖНАЯ РЕКИ МОЙКИ, ДОМ 2, ПЕНЗА, ПЕНЗЕНСКАЯ ОБЛАСТЬ",
    ],
    expectedNormalizedAddress:
      "область пензенская, пенза, улица набережная реки мойки, 2",
  },
  {
    rawAddresses: [
      "РОССИЙСКАЯ ФЕДЕРАЦИЯ, ПЕНЗЕНСКАЯ ОБЛАСТЬ, РАЙОН ПЕНЗЕНСКИЙ, СЕЛО ЗАСЕЧНОЕ, УЛИЦА НАБЕРЕЖНАЯ, ДОМ 19",
      "РОССИЙСКАЯ ФЕДЕРАЦИЯ, ПЕНЗЕНСКАЯ ОБЛАСТЬ, РАЙОН ПЕНЗЕНСКИЙ, СЕЛО ЗАСЕЧНОЕ, НАБЕРЕЖНАЯ УЛИЦА , ДОМ 19",
    ],
    expectedNormalizedAddress:
      "область пензенская, засечное, улица набережная, 19",
  },
  {
    rawAddresses: [
      "РОССИЙСКАЯ ФЕДЕРАЦИЯ, ПЕНЗЕНСКАЯ ОБЛАСТЬ, РАЙОН ПЕНЗЕНСКИЙ, СЕЛО ЗАСЕЧНОЕ, УЛИЦА НОВАЯ НАБЕРЕЖНАЯ, ДОМ 19",
      "РОССИЙСКАЯ ФЕДЕРАЦИЯ, ПЕНЗЕНСКАЯ ОБЛАСТЬ, РАЙОН ПЕНЗЕНСКИЙ, СЕЛО ЗАСЕЧНОЕ, НОВАЯ НАБЕРЕЖНАЯ УЛИЦА , ДОМ 19",
    ],
    expectedNormalizedAddress:
      "область пензенская, засечное, улица новая набережная, 19",
  },
  {
    rawAddresses: [
      "Пензенская область, г. Пенза, ул. Сиреневая малая, д. 257 к 1",
      "Пензенская область, г. Пенза, ул. мал Сиреневая , 257 к 1",
    ],
    expectedNormalizedAddress:
      "область пензенская, пенза, улица сиреневая малая, 257 корпус 1",
  },
  {
    rawAddresses: [
      "Пензенская область, г. Пенза, ул. Сиреневая, д. 257стр",
      "Пензенская область, г. Пенза, ул. Сиреневая, 257стр",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица сиреневая, 257",
  },
  {
    rawAddresses: [
      "Пензенская область, г. Пенза, ул. Строящаяся, д. 257е",
      "Пензенская область, г. Пенза, ул. Строящаяся, д. 257-е",
      "Пензенская область, г. Пенза, ул. Строящаяся, д. 257е стр",
      "Пензенская область, г. Пенза, ул. Строящаяся, 257-е стр",
      "Пензенская область, г. Пенза, ул. Строящаяся, 257-е строение",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица строящаяся, 257е",
  },
  {
    rawAddresses: [
      "область пензенская, пенза, улица симферопольская, 55 стр79",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица симферопольская, 55 строение 79",
  },
  {
    rawAddresses: [
      "область пензенская, пенза, в районе ул. тестовая 10",
      "область пензенская, пенза, в р-не ул. тестовая 10",
    ],
    expectedNormalizedAddress:
      "ОБЛАСТЬ ПЕНЗЕНСКАЯ, ПЕНЗА, В РАЙОНЕ УЛИЦА ТЕСТОВАЯ 10",
  },
  {
    rawAddresses: [
      "пензенская область, г Заречный, пр-кт 30-летия Победы, д. 1,3,5,7,7а",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ЗАРЕЧНЫЙ, ПРОСПЕКТ 30-ЛЕТИЯ ПОБЕДЫ, ДОМ 1, 3, 5, 7, 7А",
    expectedStandardizedAddress: null,
  },
  {
    rawAddresses: ["г Пенза, ул Гагарина, д. 11Г (248)"],
    expectedCleanedAddress: "ГОРОД ПЕНЗА, УЛИЦА ГАГАРИНА, ДОМ 11Г, 248",
    expectedStandardizedAddress: null,
  },
  {
    rawAddresses: ["г Пенза, ул Гагарина, д. 11Г (248)"],
    expectedCleanedAddress: "ГОРОД ПЕНЗА, УЛИЦА ГАГАРИНА, ДОМ 11Г, 248",
    expectedStandardizedAddress: null,
  },
  {
    rawAddresses: [
      "пензенская область, г Пенза, ул Ю. Гагарина, д. 11",
      "пензенская область, г Пенза, ул Ю.Гагарина, д. 11",
      // TODO
      // "пензенская область, г Пенза, ул им Ю.Гагарина, д. 11",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица ю. гагарина, 11",
  },
  {
    rawAddresses: [
      "пензенская область, г Пенза, ул Ю.А.Гагарина, д. 11",
      "пензенская область, г Пенза, ул Ю.А. Гагарина, д. 11",
      "пензенская область, г Пенза, ул Ю. А. Гагарина, д. 11",
      "пензенская область, г Пенза, ул им Ю. А. Гагарина, д. 11",
      "пензенская область, г Пенза, ул им. Ю. А. Гагарина, д. 11",
      "пензенская область, г Пенза, ул имени Ю. А. Гагарина, д. 11",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица ю. а. гагарина, 11",
  },
  {
    rawAddresses: [
      "пензенская область, поселок им Тестова, ул Именная, 1",
      "пензенская область, пос. им. Тестова, ул Именная, 1",
      "пензенская область, пос. имени Тестова, ул Именная, 1",
      "пензенская область, п. им Тестова, ул Именная, 1",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПОСЕЛОК ИМЕНИ ТЕСТОВА, УЛИЦА ИМЕННАЯ, 1",
    expectedStandardizedAddress:
      "область пензенская, поселок имени тестова, улица именная, 1",
  },
  {
    rawAddresses: ["г.Пенза, ст.Пенза-3, Заречный парк 263 км."],
    expectedCleanedAddress:
      "ГОРОД ПЕНЗА, СТ ПЕНЗА, 3, ЗАРЕЧНЫЙ ПАРК 263 КИЛОМЕТР", // TODO: ПЕНЗА-3
    expectedStandardizedAddress: null,
  },
  {
    rawAddresses: [
      "Пензенская область, г Пенза, р-н Первомайский,  ул. Волгоградская/Первый Кубанский проезд д. 16/1",
      "Пензенская область, г Пенза, р-н Первомайский,  ул. Волгоградская/Первый Кубанский проезд д. 16 дробь 1",
      "Пензенская область, г Пенза, р-н Первомайский,  ул. Волгоградская/Первый Кубанский проезд д. 16 дубль 1",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, РАЙОН ПЕРВОМАЙСКИЙ, УЛИЦА ВОЛГОГРАДСКАЯ/1-Й КУБАНСКИЙ ПРОЕЗД ДОМ 16/1",
    expectedStandardizedAddress:
      "область пензенская, пенза, улица волгоградская / проезд кубанский 1-й, 16/1",
    expectedNormalizedAtomicAddresses: [
      "область пензенская, пенза, улица волгоградская, 16",
      "область пензенская, пенза, проезд кубанский 1-й, 1",
    ],
  },
  {
    rawAddresses: [
      "Пензенская область, г Пенза, р-н Первомайский,  ул. Волгоградская/Первый Кубанский проезд д. 16",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, РАЙОН ПЕРВОМАЙСКИЙ, УЛИЦА ВОЛГОГРАДСКАЯ/1-Й КУБАНСКИЙ ПРОЕЗД ДОМ 16",
    expectedStandardizedAddress:
      "область пензенская, пенза, улица волгоградская / проезд кубанский 1-й, 16",
    expectedNormalizedAtomicAddresses: [
      "область пензенская, пенза, улица волгоградская, 16",
      "область пензенская, пенза, проезд кубанский 1-й, 16",
    ],
  },
  {
    rawAddresses: [
      "Пензенская область, г Пенза, р-н Первомайский,  ул. Волгоградская д. 16/1",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, РАЙОН ПЕРВОМАЙСКИЙ, УЛИЦА ВОЛГОГРАДСКАЯ ДОМ 16/1",
    expectedStandardizedAddress:
      "область пензенская, пенза, улица волгоградская, 16/1",
    expectedNormalizedAtomicAddresses: [
      "область пензенская, пенза, улица волгоградская, 16",
    ],
  },
  {
    rawAddresses: [
      "Пензенская область, г. Пенза, ул. Лермонтова, 2 / улица К. Маркса, 30",
      "Пензенская область, г. Пенза, ул. Лермонтова 2 / улица К. Маркса, 30",
    ],
    expectedNormalizedAddress:
      "область пензенская, пенза, улица лермонтова / улица к. маркса, 2/30",
    expectedNormalizedAtomicAddresses: [
      "область пензенская, пенза, улица лермонтова, 2",
      "область пензенская, пенза, улица к. маркса, 30",
    ],
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА КУРСКАЯ, ДОМ 61, ЛИТЕР Г 5",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА КУРСКАЯ, ДОМ 61, ЛИТЕРА Г 5",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, Г ПЕНЗА, УЛИЦА КУРСКАЯ, Д 61, ЛИТ Г 5",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА КУРСКАЯ, ДОМ 61, ЛИТЕР Г 5",
    expectedStandardizedAddress:
      "область пензенская, пенза, улица курская, 61 литер г 5",
  },
  {
    rawAddresses: [
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА Б КУРСКАЯ, ДОМ 61, ЛИТЕР Б 5",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА БОЛЬШ КУРСКАЯ, ДОМ 61, ЛИТЕРА Б 5",
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, Г ПЕНЗА, УЛИЦА БОЛЬШАЯ КУРСКАЯ, Д 61, ЛИТ Б 5",
    ],
    expectedCleanedAddress:
      "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ГОРОД ПЕНЗА, УЛИЦА БОЛЬШАЯ КУРСКАЯ, ДОМ 61, ЛИТЕР Б 5",
    expectedStandardizedAddress:
      "область пензенская, пенза, улица курская большая, 61 литер б 5",
  },
  {
    rawAddresses: ["Пензенская область, г. Пенза, ул. Рябова, д. 4Б, лит. Н"],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица рябова, 4б литер н",
  },
  {
    rawAddresses: [
      "Пензенская область, г. Пенза, ул. Рябова, д. 4Б, лит. Н,Н1",
    ],
    expectedStandardizedAddress: null,
  },
  {
    rawAddresses: ["Пензенская, г. Пенза, что-то НЕПОНЯТНОЕ, у. Рбова, д. 4Б"],
    addressHandlingConfig: compileAddressHandlingConfig({
      wordReplacements: [
        {
          from: "у. рбова",
          to: "ул. рябова",
        },
        {
          from: "что-то НЕПОНЯТНОЕ",
          to: "",
        },
      ],
    }),
    expectedStandardizedAddress: "область пензенская, пенза, улица рябова, 4б",
  },
  {
    rawAddresses: [
      "440600 Пензенская область, г. Пенза, Тестовая ул., д. 10",
      "440600, Пензенская обл., г. Пенза, тестовая Улица, д. 10",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица тестовая, 10",
  },
  {
    rawAddresses: [
      "Тестовая ул., д. 10, 440600 Пензенская область, г. Пенза",
      "тестовая Улица, д. 10, 440600, Пензенская обл., г. Пенза, ",
      "тестовая Улица, д. 10 440600 Пензенская обл., г. Пенза, ",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица тестовая, 10",
  },
  {
    rawAddresses: [
      "Тестовая ул., д. 10, г. Пенза, Пензенская область, 440600",
      "тестовая Улица, д. 10, г. Пенза, Пензенская обл., 440600",
    ],
    expectedStandardizedAddress:
      "область пензенская, пенза, улица тестовая, 10",
  },
];
