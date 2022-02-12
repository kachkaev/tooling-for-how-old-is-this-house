import { createBeautifyAddress } from "./create-beautify-address";
import { compileAddressHandlingConfig } from "./helpers-for-word-replacements";
import { RawAddressHandlingConfig } from "./types";

interface TestCaseGroup {
  title: string;
  rawAddressHandlingConfig: RawAddressHandlingConfig;
  testCases: Array<{
    rawAddress: string;
    expectedBeautifiedAddress: string;
  }>;
}

const testCaseGroups: TestCaseGroup[] = [
  {
    title: "order of words",
    rawAddressHandlingConfig: {},
    testCases: [
      {
        rawAddress: "область пензенская, Тестовск, наб. реки Мойки, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, набережная реки Мойки, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, ул. Мира 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Мира, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, большая Такая-то улица 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Большая Такая-то, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, большая Луговая улица 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, Большая Луговая улица, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, улица 50-летия Тестов, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица 50-летия Тестов, 1",
      },
      {
        rawAddress:
          "Пензенская обл, Тестовск, 2-ая улица 50-летия Тестов Большая, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, 2-я улица Большая 50-летия Тестов, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, 2-ая Большая улица Тестовая, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, 2-я Большая Тестовая улица, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, улица 2-й порядок, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица 2-й Порядок, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, набережная реки Пензы улица, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Набережная реки Пензы, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, ул. 3-й Зелёный овраг, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица 3-й Зелёный овраг, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, ул. 354-й Стрелковой дивизии, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица 354-й Стрелковой дивизии, 1",
      },
    ],
  },
  {
    title: "interdependency",
    rawAddressHandlingConfig: {},
    testCases: [
      {
        rawAddress: "Пензенская обл, Тестовск, Такая-то улица 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Такая-то, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, такая-то улица 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Такая-то, 1",
      },
    ],
  },
  {
    title: "words with dashes",
    rawAddressHandlingConfig: {},
    testCases: [
      {
        rawAddress: "Пензенская обл, Тестовск, улица Салтыкова-Щедрина 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Салтыкова-Щедрина, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, улица салтыкова-щедрина 2",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Салтыкова-Щедрина, 2",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, улица салтыкова-ЩЕДРИНА 2",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Салтыкова-Щедрина, 2",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, улица Гражданская, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, Гражданская улица, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, улица Ново-гражданская, 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, Ново-гражданская улица, 1",
      },
    ],
  },
  {
    title: "capitalization",
    rawAddressHandlingConfig: {},
    testCases: [
      {
        rawAddress: "Пензенская обл, Тестовск, Улица 10-ЛЕТИЯ ОЛОЛО 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица 10-летия ОЛОЛО, 1",
      },
      {
        rawAddress: "Пензенская обл, Тестовск, Улица 10-Летия ололо, 2",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица 10-летия ОЛОЛО, 2",
      },
      {
        rawAddress: "ПЕНЗЕНСКАЯ ОБЛАСТЬ, ТЕСТОВСК, УЛИЦА ТЕСТОВ 1",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Тестов, 1",
      },
      {
        rawAddress: "пензенская область, тестовск, улица Тестов 2",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Тестов, 2",
      },
      {
        rawAddress: "пензенская область, тестовск, улица тестов 2",
        expectedBeautifiedAddress:
          "Пензенская область, Тестовск, улица Тестов, 2",
      },
      {
        rawAddress: "ГОРОД, Область, БОЛ. УЛИца Тестов, 1",
        expectedBeautifiedAddress: "город, область, Большая улица Тестов, 1",
      },
    ],
  },
  {
    title: "special letters",
    rawAddressHandlingConfig: {},
    testCases: [
      {
        rawAddress: "Пензенская обл, поселок Тестовый, проспект Потёмнкина, 1",
        expectedBeautifiedAddress:
          "Пензенская область, посёлок Тестовый, проспект Потёмнкина, 1",
      },
      {
        rawAddress: "Пензенская обл, Поселок Тестовый, проспект потемнкина, 1",
        expectedBeautifiedAddress:
          "Пензенская область, посёлок Тестовый, проспект Потёмнкина, 1",
      },
    ],
  },
  {
    title: "designation special cases",
    rawAddressHandlingConfig: {},
    testCases: [
      {
        rawAddress: 'Пензенская область, Пенза, с/т "Тестовое", 1',
        expectedBeautifiedAddress: "Пензенская область, Пенза, С/Т Тестовое, 1",
      },
    ],
  },
  {
    title: "address normalization config",
    rawAddressHandlingConfig: {
      canonicalSpellings: ["ОЛОЛО", "Потёмнкина"],
      defaultRegion: "Пензенская область",
    },
    testCases: [
      {
        rawAddress: "Поселок ололо, проспект потемнкина, 1",
        expectedBeautifiedAddress:
          "Пензенская область, посёлок ОЛОЛО, проспект Потёмнкина, 1",
      },
    ],
  },
];

describe("createBeautifyAddress", () => {
  for (const { testCases, title, rawAddressHandlingConfig } of testCaseGroups) {
    const knownAddresses = testCases.map((testCase) => testCase.rawAddress);

    const addressHandlingConfig = compileAddressHandlingConfig(
      rawAddressHandlingConfig,
    );

    const beautifyAddress = createBeautifyAddress(
      knownAddresses,
      addressHandlingConfig,
    );

    describe(`test case group: ${title}`, () => {
      for (const { rawAddress, expectedBeautifiedAddress } of testCases) {
        it(`works for "${rawAddress}"`, () => {
          expect(beautifyAddress(rawAddress)).toEqual(
            expectedBeautifiedAddress,
          );
        });
      }
    });
  }
});
