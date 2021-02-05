# Инструментарий для подготовки данных [how-old-is-this.house](https://how-old-is-this.house)

## Шаги по сборке данных

1.  Создать и заполнить файл `/path/to/hoith/var/regions/${MY_REGION}/region-config.yml`

1.  Скопировать `.env.dist` в `.env` и заполнить новый файл

1.  Запустить команды

    ```sh
    yarn exe src/commands/1-buildRegionExtent.ts
    
    yarn exe src/commands/2-sources/mingkh/1-fetchHouseLists.ts
    yarn exe src/commands/2-sources/mingkh/2-fetchRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/3-parseRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/4-combineHouseInfosIntoGeoJson.ts
    
    yarn exe src/commands/2-sources/rosreestr/1-fetchTilesWithCcos.ts
    yarn exe src/commands/2-sources/rosreestr/2-fetchTilesWithLots.ts
    yarn exe src/commands/2-sources/rosreestr/3-previewTileData.ts ## optional
    yarn exe src/commands/2-sources/rosreestr/4-generateObjectInfoPages.ts
    yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts
    
    yarn exe src/commands/2-sources/wikidata/1-executeQuery.ts ## incomplete
    
    yarn exe src/commands/2-sources/wikimapia/1-fetchTiles.ts
    yarn exe src/commands/2-sources/wikimapia/2-previewTileData.ts ## optional
    yarn exe src/commands/2-sources/wikimapia/3-fetchRawObjectInfos.ts
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

## Источники

| Layer     | Source                                 | Desciption                                                                                              | Comment                                                                                                                                                                                                | Link                                                  |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Домики    | OSM/открытые данынные города/кадастр   | слой домиков и других обьектов что мы хотим показать на карте с адресами                                | детальность геомтерии в кадастре, жуть как хороша и нам симатична                                                                                                                                      |                                                       |
| кадастр   | росреестр                              | точечный и полигональные слои со всей инфой что выдал нам росреестр                                     | номера всех ОКС на 2016 из gpkg и csv (внимание записей в таблице больше чем геометрии), их скармливаем скрипту что запрашивает данные из росреестра, их потом спец скриптом парсим и геокодим адреса. | папочка cadastr                                       |
| OSM       | OSM                                    | полигональный слой - домики с названиями обьектов, адресами и годом, архитектором и ссылокй на викиедию |                                                                                                                                                                                                        |                                                       |
| Wikidata  | Wikidata                               | точечный слой, название, год постройки, ссылка на википедию                                             | волшебным запросом на <https://query.wikidata.org/> по bbox вытачкиваем таблицу со всеми обьектами викидата на заданный район                                                                          | <https://pastebin.com/dcyz2NNs>                       |
| Минкульт  | открытые данные министерствак культуры | точечнвй слой, вся инфа из таблицы минкульта по нашему городу                                           | геокодинг                                                                                                                                                                                              | <https://opendata.mkrf.ru/opendata/7705851331-egrkn/> |
| WIkimapia | WIkimapia                              | точечный слой, ссылка на фото, автор фото                                                               | двумя проходами, двумя разными скриптами. тащим по квадратам 100x100 (вродебы - спросить у леры как резала квадраты) сначала список обьектов, потом запрашиваем и парсим html страницы                 | папочка wikimapia                                     |
| Минжкх    | <https://mingkh.ru>                    | точечный слой, адрес и год                                                                              | качаем табличку, прогоняем через геокодер                                                                                                                                                              | <https://mingkh.ru/penzenskaya-oblast/penza/>         |
