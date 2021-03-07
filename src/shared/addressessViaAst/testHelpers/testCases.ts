import { AddressToken, AtomicAddressToken, CleanedAddressAst } from "../types";

export const testCases: Array<{
  rawAddress: string;
  expectedAtomicTokens?: AtomicAddressToken[];
  expectedTokens?: AddressToken[];
  expectedCleanedAddressAst?: CleanedAddressAst;
}> = [
  {
    rawAddress: "",
    expectedAtomicTokens: [],
    expectedTokens: [],
  },
  {
    rawAddress:
      "(,58,ПЕНЗЕНСКИЙ Р-Н, ,Засечное С.,МАЛ.ШКОЛЬНЫЙ \"ПРОЕЗД'_10А/42,,)",
    expectedAtomicTokens: [
      ["bracket", "("],
      ["comma", ","],
      ["numberSequence", "58"],
      ["comma", ","],
      ["letterSequence", "пензенский"],
      ["spacing", " "],
      ["letterSequence", "р"],
      ["dash", "-"],
      ["letterSequence", "н"],
      ["comma", ","],
      ["spacing", " "],
      ["comma", ","],
      ["letterSequence", "засечное"],
      ["spacing", " "],
      ["letterSequence", "с"],
      ["period", "."],
      ["comma", ","],
      ["letterSequence", "мал"],
      ["period", "."],
      ["letterSequence", "школьный"],
      ["spacing", " "],
      ["quote", '"'],
      ["letterSequence", "проезд"],
      ["quote", "'"],
      ["spacing", "_"],
      ["numberSequence", "10"],
      ["letterSequence", "а"],
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
  },

  {
    rawAddress: ",,Пенз обл., 1я  ул.А.С Пушкина-тестова. д.4,корп№5000",
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
          value: "1я",
          number: 1,
          ending: "я",
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
          value: "пушкина-тестова.",
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
  },
  {
    rawAddress: "(р-н. 1-й,10 к10 10корп5 10к,1кк",
    expectedTokens: [
      ["bracket", "("],
      ["protoWord", "р-н."],
      ["spacing", " "],
      ["protoWord", "1-й"],
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
      ["protoWord", "10к"],
      ["comma", ","],
      ["protoWord", "1кк"],
    ],
  },
  {
    rawAddress: "Такая-то ул - 10-12",
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
  },
  {
    rawAddress: 'г.Пенза, с/т«Боль" ,10/12,сарай_10а',
    expectedTokens: [
      ["protoWord", "г."],
      ["letterSequence", "пенза"],
      ["comma", ","],
      ["spacing", " "],
      ["protoWord", "с/т"],
      ["quote", "«"],
      ["letterSequence", "боль"],
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
    rawAddress: "2—й  с\\т Такой—то д42", // m-dash
    expectedAtomicTokens: [
      ["numberSequence", "2"],
      ["dash", "—"],
      ["letterSequence", "й"],
      ["spacing", "  "],
      ["letterSequence", "с"],
      ["slash", "\\"],
      ["letterSequence", "т"],
      ["spacing", " "],
      ["letterSequence", "такой"],
      ["dash", "—"],
      ["letterSequence", "то"],
      ["spacing", " "],
      ["letterSequence", "д"],
      ["numberSequence", "42"],
    ],
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
];

/*
ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗЕНСКИЙ РАЙОН, С. ЗАСЕЧНОЕ, УЛИЦА ОВРАЖНАЯ, ДОМ_17
ПЕНЗЕНСКАЯ ОБЛАСТЬ, Р-Н. ПЕНЗЕНСКИЙ, С. ЗАСЕЧНОЕ, ПРОЕЗД. ШКОЛЬНЫЙ, Д. 7
ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗЕНСКИЙ РАЙОН, С. ЗАСЕЧНОЕ, УЛИЦА ШОССЕЙНАЯ, ДОМ_50, КВ. 3


ПЕНЗЕНСКАЯ ОБЛАСТЬ, ПЕНЗЕНСКИЙ Р-Н, С. ЗАСЕЧНОЕ, УЛ. МЕХАНИЗАТОРОВ, Д. 35, БЛОК №2
,58,ПЕНЗЕНСКИЙ Р-Н, ,ЗАСЕЧНОЕ С,ШОССЕЙНАЯ УЛ,121,,,

Пензенская обл., Пензенский р-н, с. Засечное, ул. Прибрежная, д..1
ПЕНЗЕНСКАЯ ОБЛАСТЬ, Р-Н ПЕНЗЕНСКИЙ, С. ЗАСЕЧНОЕ, УЛ. МЕХАНИЗАТОРОВ - 36, БЛОК 2, ГАРАЖ 114
Российская Федерация, Пензенская область, Пензенский муниципальный район, Сельское поселение Засечный сельсовет, Засечное село, Алая улица, дом 10
Пензенская область, г.Пенза, Железнодорожный район, р.Вядь
Пензенская обл., г. Пенза, с/т \"Заря\" на территории совхоза \"Заря\", уч. 350.
Пензенская область, г Пенза, ул Садовая, 40Л
Пензенская область, г.Пенза, Октябрьский район, пр. Брусничный 6-Й, строен.57
*/
