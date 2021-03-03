# Scratchpad

```sh
INSTANCE="NAME"

RANGE=100 yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfos.ts || say "Error ${INSTANCE}"
say "Finished ${INSTANCE}"
```

## Поля выгружаемой таблицы

| name            | type   | comment                                                                                                                        |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| fid             | int    | уникальный id                                                                                                                  |
| r_years_string  | string | текстовая строка для года, превращается в int по запросу api, используещего регулярное выражение                               |
| r_year_int      | int    | можно не заполнять, см выше                                                                                                    |
| r_name          | string | название объекта                                                                                                               |
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

## Команды для картовечеринки

Обновление зданий

```sh
COMMIT_MESSAGE="Update fetched OSM buildings ($(date +"%Y-%m-%d %H:%M"))"

yarn exe src/commands/2-sources/osm/1-fetchBuildings.ts
yarn exe src/commands/2-sources/osm/9-extractOutputLayer.ts

git add ../data/regions/penza/sources/osm/fetched-buildings.geojson

git commit -m ${COMMIT_MESSAGE}
```

Обновление тайлов

```sh
yarn exe src/commands/2-sources/osm/tiles/markAsDirty.ts

OSM_TILE_VERSION=$(date +"%Y-%m-%d-%H%M")
echo ${OSM_TILE_VERSION}

OSM_TILE_VERSION=${OSM_TILE_VERSION} yarn exe src/commands/2-sources/osm/tiles/fetchImages.ts
OSM_TILE_VERSION=${OSM_TILE_VERSION} yarn exe src/commands/2-sources/osm/tiles/fetchImages.ts
```

Обработка карт из QGIS

```sh
MAP_VERSION=2021-03-03-2308
MAP_DIR="/Users/ak/Desktop/mapping party"

MAP_TYPE=diff
MAP_TYPE=progress

convert "${MAP_DIR}/qgis-layout-osm-${MAP_TYPE}.png" -quality 80% "${MAP_DIR}/Penza mapping party ${MAP_TYPE} ${MAP_VERSION}.jpg"

convert "${MAP_DIR}/qgis-layout-osm-${MAP_TYPE}.png" -resize 3000 -quality 80% "${MAP_DIR}/Penza mapping party ${MAP_TYPE} ${MAP_VERSION}.preview.jpg"
```
