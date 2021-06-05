import { createBeautifyAddress } from "./createBeautifyAddress";
import { AddressNormalizationConfig } from "./types";

interface TestCaseGroup {
  title: string;
  addressNormalizationConfig: AddressNormalizationConfig;
  testCases: Array<{
    rawAddress: string;
    expectedBeautifiedAddress: string;
  }>;
}

const testCaseGroups: TestCaseGroup[] = [
  {
    title: "order of words",
    addressNormalizationConfig: {},
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
    ],
  },
  {
    title: "interdependency",
    addressNormalizationConfig: {},
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
    addressNormalizationConfig: {},
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
    ],
  },
  {
    title: "capitalization",
    addressNormalizationConfig: {},
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
    addressNormalizationConfig: {},
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
    addressNormalizationConfig: {},
    testCases: [
      {
        rawAddress: 'Пензенская область, Пенза, с/т "Тестовое", 1',
        expectedBeautifiedAddress: "Пензенская область, Пенза, С/Т Тестовое, 1",
      },
    ],
  },
  {
    title: "address normalization config",
    addressNormalizationConfig: {
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
  testCaseGroups.forEach(({ testCases, title, addressNormalizationConfig }) => {
    const knownAddresses = testCases.map((testCase) => testCase.rawAddress);
    const beautifyAddress = createBeautifyAddress(
      knownAddresses,
      addressNormalizationConfig,
    );

    describe(`test case group: ${title}`, () => {
      testCases.forEach(({ rawAddress, expectedBeautifiedAddress }) => {
        it(`works for "${rawAddress}"`, () => {
          expect(beautifyAddress(rawAddress)).toEqual(
            expectedBeautifiedAddress,
          );
        });
      });
    });
  });
});
