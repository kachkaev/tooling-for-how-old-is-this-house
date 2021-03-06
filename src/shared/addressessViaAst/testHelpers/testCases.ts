import { AddressToken, AddressTokenOrProtoWord } from "../types";

export const testCases: Array<{
  rawAddress: string;
  expectedTokens?: AddressToken[];
  expectedTokensWithProtoWords?: AddressTokenOrProtoWord[];
}> = [
  {
    rawAddress: "",
    expectedTokens: [],
  },
  {
    rawAddress:
      "(,58,ПЕНЗЕНСКИЙ Р-Н, ,Засечное С.,ШКОЛЬНЫЙ \"ПРОЕЗД'_10А/42,,)",
    expectedTokens: [
      { value: "(", type: "bracket" },
      { value: ",", type: "comma" },
      { value: "58", type: "numberSequence" },
      { value: ",", type: "comma" },
      { value: "пензенский", type: "letterSequence" },
      { value: " ", type: "spacing" },
      { value: "р", type: "letterSequence" },
      { value: "-", type: "dash" },
      { value: "н", type: "letterSequence" },
      { value: ",", type: "comma" },
      { value: " ", type: "spacing" },
      { value: ",", type: "comma" },
      { value: "засечное", type: "letterSequence" },
      { value: " ", type: "spacing" },
      { value: "с", type: "letterSequence" },
      { value: ".", type: "period" },
      { value: ",", type: "comma" },
      { value: "школьный", type: "letterSequence" },
      { value: " ", type: "spacing" },
      { value: '"', type: "quote" },
      { value: "проезд", type: "letterSequence" },
      { value: "'", type: "quote" },
      { value: "_", type: "spacing" },
      { value: "10", type: "numberSequence" },
      { value: "а", type: "letterSequence" },
      { value: "/", type: "slash" },
      { value: "42", type: "numberSequence" },
      { value: ",", type: "comma" },
      { value: ",", type: "comma" },
      { value: ")", type: "bracket" },
    ],
  },

  {
    rawAddress: ",,Пенз область, 1я  ул.А.С Пушкина-тестова. д.4,корп№5000",
    expectedTokensWithProtoWords: [
      { value: ",", type: "comma" },
      { value: ",", type: "comma" },
      { value: "пенз", type: "letterSequence" },
      { value: " ", type: "spacing" },
      { value: "область", type: "letterSequence" },
      { value: ",", type: "comma" },
      { value: " ", type: "spacing" },
      { value: "1я", type: "protoWord" },
      { value: "  ", type: "spacing" },
      { value: "ул.", type: "protoWord" },
      { value: "а.", type: "protoWord" },
      { value: "с", type: "letterSequence" },
      { value: " ", type: "spacing" },
      { value: "пушкина-тестова.", type: "protoWord" },
      { value: " ", type: "spacing" },
      { value: "д.", type: "protoWord" },
      { value: "4", type: "numberSequence" },
      { value: ",", type: "comma" },
      { value: "корп", type: "letterSequence" },
      { value: "№", type: "numberSign" },
      { value: "5000", type: "numberSequence" },
    ],
  },
  {
    rawAddress: "(р-н. 1-й,10 к10 10корп5 10к,1кк",
    expectedTokensWithProtoWords: [
      { value: "(", type: "bracket" },
      { value: "р-н.", type: "protoWord" },
      { value: " ", type: "spacing" },
      { value: "1-й", type: "protoWord" },
      { value: ",", type: "comma" },
      { value: "10", type: "numberSequence" },
      { value: " ", type: "spacing" },
      { value: "к", type: "letterSequence" },
      { value: "10", type: "numberSequence" },
      { value: " ", type: "spacing" },
      { value: "10", type: "numberSequence" },
      { value: "корп", type: "letterSequence" },
      { value: "5", type: "numberSequence" },
      { value: " ", type: "spacing" },
      { value: "10к", type: "protoWord" },
      { value: ",", type: "comma" },
      { value: "1кк", type: "protoWord" },
    ],
  },
  {
    rawAddress: "Такая-то ул - 10-12",
    expectedTokensWithProtoWords: [
      { value: "такая-то", type: "protoWord" },
      { value: " ", type: "spacing" },
      { value: "ул", type: "letterSequence" },
      { value: " ", type: "spacing" },
      { value: "-", type: "dash" },
      { value: " ", type: "spacing" },
      { value: "10", type: "numberSequence" },
      { value: "-", type: "dash" },
      { value: "12", type: "numberSequence" },
    ],
  },
  {
    rawAddress: 'г.Пенза, с/т«Боль" ,10/12,сарай_10а',
    expectedTokensWithProtoWords: [
      { value: "г.", type: "protoWord" },
      { value: "пенза", type: "letterSequence" },
      { value: ",", type: "comma" },
      { value: " ", type: "spacing" },
      { value: "с/т", type: "protoWord" },
      { value: "«", type: "quote" },
      { value: "боль", type: "letterSequence" },
      { value: '"', type: "quote" },
      { value: " ", type: "spacing" },
      { value: ",", type: "comma" },
      { value: "10", type: "numberSequence" },
      { value: "/", type: "slash" },
      { value: "12", type: "numberSequence" },
      { value: ",", type: "comma" },
      { value: "сарай", type: "letterSequence" },
      { value: "_", type: "spacing" },
      { value: "10а", type: "protoWord" },
    ],
  },
  {
    rawAddress: "",
    expectedTokensWithProtoWords: [],
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
