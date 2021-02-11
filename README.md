# Tooling for adding new cities to [how-old-is-this.house](https://how-old-is-this.house/en/)

🚧🚧🚧 **WORK IN PROGRESS** 🚧🚧🚧

This repository contains commands for assembling a dataset with building ages for a specified area.
The commands collect data from various publicly available sources, process it and combine together into a single map layer.

Because [how-old-is-this.house](https://how-old-is-this.house/en/) focuses on cities in Russia, the instructions below are in Russian.
Although some of the data sources are country-specific, parts of the repo can still be recycled for a global re-use.

---

## Шаги по сборке данных

1.  Создать и заполнить файл `/path/to/data/regions/${MY_REGION}/region-config.yml` (по аналогии с таким файлом для уже обработанного города).

1.  Скачать список объектов [с сайта Минкультуры](https://opendata.mkrf.ru/opendata/7705851331-egrkn).
    Файл должен быть в формате `jsons` (с `s` на конце) и разарахивирован.
    Рекомендованная папка: `/path/to/data/sources/mkrf` (название файла желательно не менять).

1.  Скопировать `.env.dist` в `.env` и заполнить новый файл.

1.  Запустить команды:

    ```sh
    yarn exe src/commands/1-buildRegionExtent.ts
    ```

    ```sh
    yarn exe src/commands/2-sources/mingkh/1-fetchHouseLists.ts
    yarn exe src/commands/2-sources/mingkh/2-fetchRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/3-parseRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/4-previewHouseInfos.ts ## optional
    yarn exe src/commands/2-sources/mingkh/5-reportGeocodes.ts
    
    yarn exe src/commands/2-sources/mkrf/1-extractObjectsFromJsonsDump.ts
    yarn exe src/commands/2-sources/mkrf/2-reportGeocodes.ts ## todo
    
    yarn exe src/commands/2-sources/osm/1-fetchRawBuildings.ts
    yarn exe src/commands/2-sources/osm/2-reportGeocodes.ts ## todo
    
    yarn exe src/commands/2-sources/rosreestr/1-fetchTilesWithCcos.ts
    yarn exe src/commands/2-sources/rosreestr/2-fetchTilesWithLots.ts
    yarn exe src/commands/2-sources/rosreestr/3-previewTileData.ts ## optional
    yarn exe src/commands/2-sources/rosreestr/4-generateObjectInfoPages.ts
    yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts ## supports concurrent launches
    yarn exe src/commands/2-sources/rosreestr/6-reportGeocodes.ts   ## todo
    
    yarn exe src/commands/2-sources/wikidata/1-fetchRawRecords.ts
    ## wikidata flow is incomplete due to lack of good harvest for Penza
    
    yarn exe src/commands/2-sources/wikimapia/1-fetchTiles.ts
    yarn exe src/commands/2-sources/wikimapia/2-previewTileData.ts ## optional
    yarn exe src/commands/2-sources/wikimapia/3-fetchRawObjectInfos.ts
    yarn exe src/commands/2-sources/wikimapia/4-parseRawObjectInfos.ts
    yarn exe src/commands/2-sources/wikimapia/5-reportGeocodes.ts ## todo
    ```

    ```sh
    yarn exe src/commands/2-sources/yandex/1-geocodeAddressesWithoutPosition.ts ## todo
    ```

    ```sh
    yarn exe src/commands/2-sources/mingkh/9-extractOutputLayer.ts    ## todo
    yarn exe src/commands/2-sources/mkrf/9-extractOutputLayer.ts      ## todo
    yarn exe src/commands/2-sources/osm/9-extractOutputLayer.ts       ## todo
    yarn exe src/commands/2-sources/rosreestr/9-extractOutputLayer.ts ## todo
    yarn exe src/commands/2-sources/wikimapia/9-extractOutputLayer.ts ## todo
    ```

    ```sh
    yarn exe src/commands/3-combineOutputLayers.ts         ## todo
    yarn exe src/commands/4-distillCombinedOutputLayers.ts ## todo
    ```

## Поля выгружаемой таблицы

| name            | type   | comment                                                                                                                        |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| fid             | int    | уникальный id                                                                                                                  |
| r_years_string  | string | текстовая строка для года, превращается в int по запросу api, используещего регулярное выражение                               |
| r_year_int      | int    | можно не заполнять, см выше                                                                                                    |
| r_name          | string | название обьекта                                                                                                               |
| r_adress        | string | адрес                                                                                                                          |
| r_architect     | string | архитектор,пока пустое                                                                                                         |
| r_style         | string | стиль, пока пустое                                                                                                             |
| r_photo_url     | string | ссылка на фото                                                                                                                 |
| r_wikipedia_url | string | ссылка на страницу в википедии                                                                                                 |
| r_url           | string | ссылка на другие внешние источники                                                                                             |
| r_copyrights    | string | "копирайты относящиеся к обьекту, сейчас даем блок ""фото: открытые данные Министерства культуры""/""фото:name_user wikimapia" |
