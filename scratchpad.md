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
yarn exe src/commands/2-sources/osm/tiles/markAsDirty.ts

sleep 1800 # 30 mins

OSM_TILE_VERSION=$(date -u +"%Y-%m-%d-%H%M")
echo ${OSM_TILE_VERSION}

OSM_TILE_VERSION=${OSM_TILE_VERSION} yarn exe src/commands/2-sources/osm/tiles/fetchImages.ts
OSM_TILE_VERSION=${OSM_TILE_VERSION} yarn exe src/commands/2-sources/osm/tiles/fetchImages.ts
```

Обновление зданий

```sh
MAP_VERSION=$(date -u +"%Y-%m-%d-%H%M")
COMMIT_MESSAGE="Update fetched OSM buildings (${MAP_VERSION})"

yarn exe src/commands/2-sources/osm/1-fetchBuildings.ts
yarn exe src/commands/2-sources/osm/8-reportGeocodes.ts
yarn exe src/commands/2-sources/osm/9-extractOutputLayer.ts

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

## Конфиг

```yml
overrides: ## эта часть конфигурации не используется скриптами (логика не реализована)
  - houseId: 478507
    change:
      centerPoint: null
  - houseId: 968209
    change:
      year: 1956
```

## TODO

- time utc
- цветовая схема
- manual-(objects|patches)
- геокодер
