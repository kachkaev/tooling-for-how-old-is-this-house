# Scratchpad

```sh
INSTANCE="NAME"

RANGE=100 yarn ts-node src/commands/2-sources/rosreestr/5-fetch-object-infos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn ts-node src/commands/2-sources/rosreestr/5-fetch-object-infos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn ts-node src/commands/2-sources/rosreestr/5-fetch-object-infos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn ts-node src/commands/2-sources/rosreestr/5-fetch-object-infos.ts || say "Error ${INSTANCE}"
RANGE=100 yarn ts-node src/commands/2-sources/rosreestr/5-fetch-object-infos.ts || say "Error ${INSTANCE}"
say "Finished ${INSTANCE}"
```

Обработка карты из QGIS

```sh
MAP_VERSION=$(date -u +"%Y-%m-%d-%H%M")
MAP_DIR="/Users/ak/Desktop/mapping party"
FILE_NAME_PREFIX="Годы постройки зданий в Пензе (черновик)"
echo ${MAP_VERSION}

convert "${MAP_DIR}/qgis-layout-result-check.png" -quality 80% "${MAP_DIR}/${FILE_NAME_PREFIX} ${MAP_VERSION}.jpg"
convert "${MAP_DIR}/qgis-layout-result-check.png" -resize 5000 -quality 80% "${MAP_DIR}/${FILE_NAME_PREFIX} ${MAP_VERSION}.preview.jpg"
```

## Команды для картовечеринки

Обновление тайлов

```sh
yarn ts-node src/commands/2-sources/osm/tiles/mark-as-dirty.ts

sleep 1800 # 30 mins

OSM_TILE_VERSION=$(date -u +"%Y-%m-%d-%H%M")
echo ${OSM_TILE_VERSION}

OSM_TILE_VERSION=${OSM_TILE_VERSION} yarn ts-node src/commands/2-sources/osm/tiles/fetch-images.ts
OSM_TILE_VERSION=${OSM_TILE_VERSION} yarn ts-node src/commands/2-sources/osm/tiles/fetch-images.ts
```

Обновление зданий

```sh
MAP_VERSION=$(date -u +"%Y-%m-%d-%H%M")
COMMIT_MESSAGE="Update fetched OSM buildings (${MAP_VERSION})"

yarn ts-node src/commands/2-sources/osm/1-fetch-buildings.ts
yarn ts-node src/commands/2-sources/osm/8-report-geocodes.ts
yarn ts-node src/commands/2-sources/osm/9-extract-output-layer.ts

cd ../data/territories/penza
git add sources/osm/fetched-buildings.geojson
git commit -m ${COMMIT_MESSAGE}
cd -
```

Обработка карт из QGIS

```sh
# MAP_VERSION=
MAP_SUFFIX='.with-mapcraft'
MAP_DIR="/Users/ak/Desktop/mapping party"

echo ${MAP_VERSION}

for MAP_TYPE in diff progress; do
  convert "${MAP_DIR}/qgis-layout-osm-${MAP_TYPE}.png" -quality 80% "${MAP_DIR}/Penza mapping party ${MAP_TYPE} ${MAP_VERSION}${MAP_SUFFIX}.jpg"

  convert "${MAP_DIR}/qgis-layout-osm-${MAP_TYPE}.png" -resize 3000 -quality 80% "${MAP_DIR}/Penza mapping party ${MAP_TYPE} ${MAP_VERSION}${MAP_SUFFIX}.preview.jpg"
done
```

Сохранение обновлённых геокодов

```sh
# MAP_VERSION=
COMMIT_MESSAGE="Update geocodes (${MAP_VERSION})"

cd ../data/territories/penza
git add geocoding/*
git commit -m ${COMMIT_MESSAGE}
cd -
```

```sh
cd ../data/territories/penza
git push
cd -
```

## Цикл ручной обработки данных

1.  Обновить один из файлов в папке sources/manual

1.  Запустить

    ```sh
    CUSTOM_PATH=sources/manual yarn ts-node src/commands/format-data-files.ts \
      && yarn ts-node src/commands/3-mixing/1-mix-output-layers.ts \
      && yarn ts-node src/commands/3-mixing/2-mix-property-variants.ts
    ```

## Цикл обновления данных в ОСМ

1.  Исправить данные на сайте ОСМ

1.  Подождать пару минут, чтобы они попали на сервер Overpass API

1.  Запустить

    ```sh
    yarn ts-node src/commands/2-sources/osm/1-fetch-buildings.ts \
      && yarn ts-node src/commands/2-sources/osm/8-report-geocodes.ts \
      && yarn ts-node src/commands/2-sources/osm/9-extract-output-layer.ts \
      && yarn ts-node src/commands/2-sources/mkrf/9-extract-output-layer.ts \
      && yarn ts-node src/commands/2-sources/rosreestr/9-extract-output-layer.ts \
      && yarn ts-node src/commands/2-sources/wikivoyage/9-extract-output-layer.ts \
      && yarn ts-node src/commands/3-mixing/1-mix-output-layers.ts \
      && yarn ts-node src/commands/3-mixing/2-mix-property-variants.ts
    ```

## TODO

### Релиз чистовика Пензы

- Исправить

  - зоопарк павильоны и вокруг
  - церкви (?)

- Узнать про мосты

### Потом

- Заречный, Ахунская 25 (адрес гаража)

## Другие источники

### Госуслуги

Карта домов:  
<https://dom.gosuslugi.ru/#!/houses/gisMap>

Карточка дома:  
<https://dom.gosuslugi.ru/#!/house-view?guid=481b5137-ae2f-44a8-a78b-22001a80114f&typeCode=1>

JSON API:  
<https://dom.gosuslugi.ru/homemanagement/api/rest/services/houses/public/1/481b5137-ae2f-44a8-a78b-22001a80114f>s

## Геосемантика

### Слои

```txt
background | how-old-is-this.house Пенза: задний план (черновик YYYY-MM-DD)
buildings  | how-old-is-this.house Пенза: дома (черновик YYYY-MM-DD)
foreground | how-old-is-this.house Пенза: передний план (черновик YYYY-MM-DD)
```

### Стили

```txt
how-old-is-this.house Пенза: задний план
how-old-is-this.house Пенза: дома
how-old-is-this.house Пенза: передний план
```

- Слой копирайты HTML

```txt
&copy; 2021 how-old-is-this.house, источники данных:
<a target="_blank" href="https://openstreetmap.org">ОСМ,</a>
<a target="_blank" href="https://pkk.rosreestr.ru">Росреестр,</a>
<a target="_blank" href="https://opendata.mkrf.ru">Минкультуры,</a>
<a target="_blank" href="https://dom.mingkh.ru">«МинЖКХ»,</a>
<a target="_blank" href="https://ru.wikivoyage.org/wiki/Культурное_наследие_России">Викигид,</a>
<a target="_blank" href="https://wikidata.org">Викиданные,</a>
<a target="_blank" href="https://wikimapia.org">Викимапия</a>
```

- Слой семантика

| поле            | тип             | метка поля                                |
| --------------- | --------------- | ----------------------------------------- |
| r_name          | многостр. текст | название                                  |
| r_photo_url     | изображение     | фото                                      |
| r_adress        | многостр. текст | адрес                                     |
| r_years_str     | многостр. текст | время постройки                           |
| r_floors        |                 | этажность                                 |
| r_architect     | многостр. текст | архитектор                                |
| r_style         | многостр. текст | стиль                                     |
| r_mkrf          | ссылка          | запись в реестре Культурного наследия ⭐️ |
| r_wikipedia     | ссылка          | статья на Википедии                       |
| r_wikidata      | ссылка          | элемент на Викиданных                     |
| r_url           | ссылка          | сайт                                      |
| r_copyrights    | многостр. текст | " " (пробел)                              |
| r_year_int      |                 | ×                                         |
| fid             |                 | ×                                         |
| геосементика ID |                 | ×                                         |
| площадь         |                 | ×                                         |
| периметр        |                 | ×                                         |

При редактировании здания внизу карточки появится поле «комментарии».
Оно относится к правке, а не самому объекту.
