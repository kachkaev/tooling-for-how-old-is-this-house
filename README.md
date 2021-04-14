# Tooling for adding new cities to [how-old-is-this.house](https://how-old-is-this.house/saint-p/en)

🚧🚧🚧 **WORK IN PROGRESS** 🚧🚧🚧

This repository contains commands for assembling a dataset with building ages for a specified area.
The commands collect data from various publicly available sources, process it and combine together into a single map layer.

Because [how-old-is-this.house](https://how-old-is-this.house/saint-p/en) focuses on cities in Russia, the instructions below are in Russian.
Although some of the data sources are country-specific, parts of the repo can still be recycled for a global re-use.

👀 [English version on Google Translate](https://translate.google.com/translate?sl=ru&tl=en&u=https://github.com/kachkaev/tooling-for-how-old-is-this-house/blob/main/README.md)

---

## Источники данных

🔢 данные, попадающие в финальный набор (цифра означает приоритет)  
⏳ временно используемые вспомогательные данные  
🗑 данные игнорируются из-за редкости или низкого качества

📍 точка (point)  
🟥 контур (polygon / multipolygon)

<!-- prettier-ignore-start -->

| | адрес | геометрия | год постройки | название | 🔗 Википедия | фотография |
| :- | :-: | :-: | :-: | :-: | :-: | :-: |
| **[МинЖКХ](https://mingkh.ru)**           | 3️⃣ | ⏳ 📍 | 2️⃣ |
| **[Минкульт](https://opendata.mkrf.ru)**  | 1️⃣ | ⏳ 📍 | 1️⃣ | 1️⃣ |   | 1️⃣ |
| **[ОСМ](https://www.openstreetmap.org)**  | 2️⃣ | 1️⃣ 🟥 | 4️⃣ | 2️⃣ | 1️⃣ |
| **[Росреестр](https://rosreestr.gov.ru)** | 4️⃣ | ⏳ 📍 | 3️⃣ |
| **[Викимапия](https://wikimapia.org)**    | 🗑 | ⏳ 🟥 |   | 🗑 | 🗑 | 2️⃣ |

<!-- prettier-ignore-end -->

## Шаги по сборке данных

В названиях папок и файлов часть `/path/to` условно обозначает любую папку, выделенную для проекта.

1.  Убедиться, что на машине установлены [git](https://git-scm.com/), [Node.js](https://nodejs.org) и [Yarn](https://yarnpkg.com):

    ```sh
    git --version
    ## ≥ 2.30
    
    node --version
    ## ≥ 14.16
    
    yarn --version
    ## ≥ 1.22
    ```

1.  Создать и заполнить файл `/path/to/data/territories/TERRITORY_NAME/territory-config.yml` (по аналогии с таким файлом для уже обработанного города).

1.  Скачать список объектов [с сайта Минкультуры](https://opendata.mkrf.ru/opendata/7705851331-egrkn).
    Файл должен быть в формате `jsons` (с `s` на конце) и разарахивирован.
    Рекомендованная папка: `/path/to/data/sources/mkrf` (название файла желательно не менять).

1.  [Клонировать](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) этот репозиторий в папку `/path/to/tooling`.

1.  Скопировать `.env.dist` в `.env` и заполнить новый файл.

1.  Будучи в папке `/path/to/tooling`, установить сторонние библиотеки:

    ```sh
    yarn install
    ```

1.  Будучи в папке `/path/to/tooling`, проверить готовность к запуску команд:

    ```sh
    yarn exe src/commands/probe.ts
    ```

    Если возникает ошибка, повторить предыдущие шаги (видимо, что-то пропустили).

1.  Будучи в папке `/path/to/tooling`, запустить команды:

    ```sh
    yarn exe src/commands/1-buildTerritoryExtent.ts
    ```

    ```sh
    yarn exe src/commands/2-sources/mingkh/1-fetchHouseLists.ts
    yarn exe src/commands/2-sources/mingkh/2-fetchRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/3-parseRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/4-previewHouseInfos.ts ## optional
    
    yarn exe src/commands/2-sources/mkrf/1-extractObjectsFromJsonsDump.ts
    
    yarn exe src/commands/2-sources/osm/1-fetchBuildings.ts
    yarn exe src/commands/2-sources/osm/2-fetchBoundaries.ts
    
    yarn exe src/commands/2-sources/rosreestr/1-fetchTilesWithCcos.ts
    yarn exe src/commands/2-sources/rosreestr/2-fetchTilesWithLots.ts
    yarn exe src/commands/2-sources/rosreestr/3-previewTileData.ts ## optional
    yarn exe src/commands/2-sources/rosreestr/4-generateObjectInfoPages.ts
    yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfosFromFirApi.ts ## supports concurrent launches
    yarn exe src/commands/2-sources/rosreestr/6-fetchObjectInfosFromPkkApi.ts
    
    # yarn exe src/commands/2-sources/wikidata/1-fetchRawRecords.ts
    ## wikidata flow is incomplete due to lack of good harvest for Penza
    
    yarn exe src/commands/2-sources/wikimapia/1-fetchTiles.ts
    yarn exe src/commands/2-sources/wikimapia/2-previewTileData.ts ## optional
    yarn exe src/commands/2-sources/wikimapia/3-fetchRawObjectInfos.ts
    yarn exe src/commands/2-sources/wikimapia/4-parseRawObjectInfos.ts
    ```

    ```sh
    yarn exe src/commands/2-sources/mingkh/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/mkrf/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/osm/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/rosreestr/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/wikimapia/8-reportGeocodes.ts ## practically noop
    ```

    ```sh
    yarn exe src/commands/2-sources/yandex/1-geocodeAddressesWithoutPosition.ts ## todo
    ```

    ```sh
    yarn exe src/commands/2-sources/mingkh/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/mkrf/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/osm/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/rosreestr/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/wikimapia/9-extractOutputLayer.ts
    ```

    ```sh
    yarn exe src/commands/3-mixOutputLayers.ts
    yarn exe src/commands/4-mixPropertyVariants.ts ## MVP
    yarn exe src/commands/5-prepareUpload.ts       ## todo
    ```
