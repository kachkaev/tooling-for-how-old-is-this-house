# Tooling for adding new cities to [how-old-is-this.house](https://how-old-is-this.house/en)

This repository contains commands for assembling a dataset with building ages for a specified area.
The commands collect data from various publicly available sources, process it and combine together into a single map layer.

Because [how-old-is-this.house](https://how-old-is-this.house/en) focuses on cities in Russia, the instructions below are in Russian.
Although some of the data sources are country-specific, parts of the repo can still be recycled for a global re-use.

👀 [English version via Google Translate](https://translate.google.com/translate?sl=ru&tl=en&u=https://github.com/kachkaev/tooling-for-how-old-is-this-house/blob/main/README.md)

---

## Источники данных

🔢 данные, попадающие в финальный набор (цифра означает приоритет)  
⏳ временно используемые вспомогательные данные  
🗑 данные игнорируются из-за редкости или низкого качества

📍 точка (point)  
🟥 контур (polygon / multipolygon)

<!-- prettier-ignore-start -->

| | адрес | геометрия | год | этажность | название | википедия | фотография |
| :- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **[МинЖКХ](https://mingkh.ru)**           | 3️⃣ | ⏳ 📍 | 4️⃣ | 2️⃣ |
| **[Минкульт](https://opendata.mkrf.ru)**  | 2️⃣ | ⏳ 📍 | 1️⃣ |    | 2️⃣ |   | 1️⃣ |
| **[ОСМ](https://www.openstreetmap.org)**  | 1️⃣ | 1️⃣ 🟥 | 3️⃣ | 1️⃣ | 4️⃣ | 3️⃣ |
| **[Росреестр](https://rosreestr.gov.ru)** | 4️⃣ | ⏳ 📍 | 5️⃣ | 3️⃣ | 🗑
| **[Викиданные](https://www.wikidata.org)**|   | ⏳ 📍 |    |    | 1️⃣ | 1️⃣ | 2️⃣ |
| **[Викимапия](https://wikimapia.org)**    | 🗑 | ⏳ 🟥 | 6️⃣ |    | 5️⃣ | 🗑 | 4️⃣ |
| **[Викигид](https://ru.wikivoyage.org)**  | 5️⃣ | ⏳ 📍 | 2️⃣ |    | 3️⃣ | 2️⃣ | 3️⃣ |

<!-- prettier-ignore-end -->

## Инструкции

Чтобы создать новую карту возрастов зданий, вам понадобятся:

- базовое понимание [командной строки](https://ru.wikipedia.org/wiki/Интерфейс_командной_строки) (терминала),
- небольшой опыт работы с [гитом](https://ru.wikipedia.org/wiki/Git) (системой контроля версий),
- поверхностное знакомство с форматами [GeoJSON](https://ru.wikipedia.org/wiki/GeoJSON) и [YAML](https://ru.wikipedia.org/wiki/YAML).

В качестве текстового редактора рекомендуется [VSCode](https://code.visualstudio.com) с расширениями
[DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv),
[Geo Data Viewer](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.geo-data-viewer),
[Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph),
[Git Lens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens),
[Wikitext](https://marketplace.visualstudio.com/items?itemName=rowewilsonfrederiskholme.wikitext) и
[Yaml](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).
Для визуализации полученных данных подойдёт любая геоинформационная программа, например, [QGIS](https://qgis.org/ru/site/).

В упоминаемых папках и файлах `/path/to` условно обозначает локальную папку, выделенную под проект.
Например, если на вашем компьютере это `/Users/me/projects/how-old-is-this-house`, то `/path/to/some-folder` означает `/Users/me/projects/how-old-is-this-house/some-folder`.

### Требования к системе

Для запуска команд подойдёт любой относительно современный компьютер с любой операционной системой (Linux, macOS, Windows).
Для обработки территории с населением порядка миллиона человека хватит 2-4 ГБ оперативной памяти и порядка 1 ГБ свободного места на диске.
Скорее всего, бутылочным горлышком будет пропускная способность интернета и ограничения, которые накладывают источники на скорость скачивания данных.

### Настройка команд

Эти шаги достаточно выполнить один раз, даже если вы планируете сбор данных для нескольких территорий.

1.  Убедитесь, что на машине установлены [гит](https://git-scm.com/) (система контроля версий) и [нода](https://nodejs.org/ru/) (среда запуска команд).
    При установке ноды рекомендуется выбрать версию LTS.

    Команды для проверки установки:

    ```sh
    git --version
    ## покажет ≥ 2.30
    
    node --version
    ## покажет ≥ 14.16
    ```

1.  Установите последнюю версию [ярна](https://yarnpkg.com) (менеджера зависимостей):

    ```sh
    npm install --global yarn
    ```

    Команда для проверки установки:

    ```sh
    yarn --version
    ## покажет ≥ 1.22
    ```

1.  [Клонируйте](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) этот репозиторий в папку `/path/to/tooling`.

    Если результат оказался в другой папке, например, `/path/to/tooling-for-how-old-is-this-house` или `/path/to/tooling/tooling-for-how-old-is-this-house`, то папку можно перенести.
    Связь с Гитхабом при этом не потеряется.
    В качестве самопроверки убедитесь, что на вашем компьютере существует файл `/path/to/tooling/README.md`.

    > Про `/path/to` написано выше.

1.  Откройте терминал, перейдите в папку `/path/to/tooling`:

    ```sh
    cd "/path/to/tooling"
    ```

    Название этой папки должно появиться слева от места ввода команды.

1.  Будучи в папке `/path/to/tooling`, установите зависимые библиотеки:

    ```sh
    yarn install
    ```

    Это займёт пару минут.

1.  Будучи в папке `/path/to/tooling`, создайте пустой файл `.env.local` и заодно проверьте общую работоспособность команд:

    ```sh
    yarn exe src/commands/ensureDotEnvLocal.ts
    ```

    Если возникает ошибка, следует заново пройтись по инструкции (видимо, что-то пропустили).

### Подготовка данных Минкульта

Этот раздел можно пропустить, если вы присоединяетесь к работе над территорией, которую уже начал кто-то другой.

Нижеперечисленные шаги достаточно выполнить один раз, даже если вы планируете сбор данных для нескольких территорий.

1.  Скачайте список объектов с сайта Министерства Культуры РФ:  
    [opendata.mkrf.ru/opendata/7705851331-egrkn](https://opendata.mkrf.ru/opendata/7705851331-egrkn)

    Ссылка на архив — в правом верхнем углу страницы.
    Файл должен быть в формате `jsons` (с `s` на конце).

1.  Разархивируйте скаченный файл и поместить его в папку `/path/to/data/sources/mkrf`.
    Название файла желательно не менять.

    > 🚩 **Пользователям macOS и Ubuntu**  
    > Встроенная программа для распаковки архивов отрезает у файла хвост.
    > Чтобы этого избежать, откройте папку со скаченным архивом в терминале и распакуйте его командой `unzip`:
    >
    > ```sh
    > unzip data-50-structure-6.jsons.zip -d .
    > ```

1.  Откройте файл `/path/to/tooling/.env.local` как текстовый и задайте переменную `MKRF_JSONS_DUMP_FILE_PATH`.
    Она указывает путь к скаченному файлу.
    Файл `.env.local` станет выглядеть примерно так:

    ```ini
    MKRF_JSONS_DUMP_FILE_PATH=../data/sources/mkrf/data-50-structure-6.jsons
    ```

    В пути к файлу может быть другая цифра вместо `50`.
    Она означает версию данных.

1.  Будучи в папке `/path/to/tooling`, проверьте выполнение предыдущих шагов:

    ```sh
    yarn exe src/commands/2-sources/mkrf/0-checkJsonsDump.ts
    ```

### Обработка выбранной территории

Команды в этом репозитории подходят для обработки любой части РФ.
Рекомендуется ограничиваться компактной территорией, например, одной городской агломерацией.
Из-за особенностей процесса получения данных, попытка за раз охватить большую, но при этом малонаселённую территорию, будет неэффективной.

Созданные в рамках этого проекта данные желательно хранить в гит-репозитории.
Это позволяет отслеживать изменения в файлах, делать их резервные копии и над территориями совместно.
Репозиторий с данными и репозиторий с кодом команд хранятся отдельно друг от друга.

#### Подготовка территории

Перед выполнением шагов в этом разделе вам надо получить доступ к репозиторию с данными.
Для вас будет создана новая гит-ветка из специальной ветки-шаблона `territories/_blank`.
После этого:

1.  Создайте локальную папку `/path/to/data/territories`.

1.  Клонируйте соответствующую ветку репозитория с данными в папку `/path/to/data/territories/TERRITORY_NAME`.

    `TERRITORY_NAME` — это название города или части субъекта РФ (например, `penza` или `penza_oblast_kuznetsk`).
    Название папки соответствует названию ветки репозитория (`territories/TERRITORY_NAME`).

1.  Откройте файл `/path/to/tooling/.env.local` как текстовый и укажите путь к выбранной территории.
    Это делается добавлением такой строчки:

    ```ini
    TERRITORY_DATA_DIR_PATH=../data/territories/TERRITORY_NAME
    ```

    Часть `TERRITORY_NAME` надо заменить на реальное название папки.

1.  Если территория новая (то есть ещё не начата кем-то другим), заполните файл `/path/to/data/territories/TERRITORY_NAME/territory-config.yml`.
    Этот ямл уже должен быть создан гитом.
    Внутри — комментарии с подсказками.

1.  Если территория новая, постройте её границу согласно настройкам в `territory-config.yml` → `extent`:

    ```sh
    yarn exe src/commands/1-buildTerritoryExtent.ts
    ```

    Эта команда создаст файл `/path/to/data/territories/TERRITORY_NAME/territory-extent.geojson`.

    Вместо запуска команды, вы можете задать границу территории самостоятельно.
    Для этого достаточно самостоятельно сохранить любой объект `Polygon` в файл `territory-extent.geojson`.

    Желательно подбирать границы территории так, чтобы они повторяли контуры кадастровых кварталов.
    Это повысит эффективность работы с АПИ Росреестра.

1.  Закоммитить и запушить изменения в файлах `territory-config.yml` и `territory-extent.yml` при помощи гита.

    Этот шаг упростит дальнейшую работу над территорий и избавит вас от необходимости делать резервные копии данных.

#### Получение исходных данных

Все нижеперечисленные команды выполняются из папки `/path/to/tooling`.
Перед их запуском важно выполнить инструкции в предыдущих разделах.

Команды выполняются по очереди сверху вниз.
Если у вас возникает проблема с одним из источников, вы можете по-прежнему запускать команды, которые не упоминают этот источник.
Например, если что-то пошло не так с Росреестром, достаточно начать игнорировать все последующие команды `src/commands/2-sources/rosreestr/*`, и можно продолжать.

Если вы совместно работаете с кем-то ещё над одной территорией, то вам можно будет пропустить некоторые команды.
Какие именно — зависит от того, что уже успели сделать до вас.

После запуска команд важно не забывать проверять статус локального гит-репозитория с данными: `/path/to/data/territories/TERRITORY_NAME`.

- Полученные исходные данные отображаются как изменения в репозитории.
  Эти файлы важно коммитить и пушить.

- Промежуточные и итоговые наборы данных дешевле перегенерировать локально, чем хранить в репозитории.
  Такие файлы перечислены в `/path/to/data/territories/TERRITORY_NAME/.gitignore`.
  Благодаря этой настройке вы не увидите изменений в гит-репозитории после запуска некоторых команд.

Потратив пару лишних минут на гит после запуска очередной команды, вы можете сэкономить себе несколько часов.
Гиту даёт возможность откатить данные до предыдущей версии, если что-то пошло не так.
Такая защита позволяет проводить любые эксперименты без страха что-то испортить или удалить.

##### [МинЖКХ](https://dom.mingkh.ru)

1.  Скачайте списки зданий на страницах, которые перечислены в файле `territory-config.yml`:

    ```sh
    yarn exe src/commands/2-sources/mingkh/1-fetchHouseLists.ts
    ```

1.  Скачайте и обработайте данные по зданиями:

    ```sh
    yarn exe src/commands/2-sources/mingkh/2-fetchRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/3-parseRawHouseInfos.ts
    ```

1.  ![][опционально]  
    Создайте файл для анализа промежуточного результата:

    ```sh
    yarn exe src/commands/2-sources/mingkh/4-previewHouseInfos.ts
    ```

##### [Минкульт](https://opendata.mkrf.ru)

1.  Извлеките данные для вашей территории из скаченного ранее дампа:

    ```sh
    yarn exe src/commands/2-sources/mkrf/1-extractObjectsFromJsonsDump.ts
    ```

##### [ОСМ](https://www.openstreetmap.org)

1.  Скачайте контуры зданий и административные границы:

    ```sh
    yarn exe src/commands/2-sources/osm/1-fetchBuildings.ts
    yarn exe src/commands/2-sources/osm/2-fetchBoundariesForRegions.ts
    yarn exe src/commands/2-sources/osm/3-fetchBoundariesForSettlements.ts
    ```

1.  ![][опционально]  
    Скачайте контуры водных объектов и дорог (они понадобятся только для визуализации):

    ```sh
    yarn exe src/commands/2-sources/osm/4-fetchRailways.ts
    yarn exe src/commands/2-sources/osm/5-fetchRoads.ts
    yarn exe src/commands/2-sources/osm/6-fetchWaterObjects.ts
    ```

##### [Росреестр](https://pkk.rosreestr.ru)

1.  Скачайте геопривязанные ОКС (объекты капитального строительства) и земельные участки:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/1-fetchTilesWithCcos.ts
    yarn exe src/commands/2-sources/rosreestr/2-fetchTilesWithLots.ts
    ```

1.  ![][опционально]  
    Создайте файла для анализа промежуточного результата:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/3-previewTileData.ts
    ```

1.  Создайте файлы-страницы для хранения деталей объектов:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/4-generateInitialObjectInfoPages.ts
    ```

1.  Скачайте детали объектов из АПИ `fir_object`:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/5-fetchObjectInfosFromFirApi.ts
    ```

    Эта команда поддерживает многозадачность.
    Вы можете открыть до десяти терминалов и запустить её в каждом окне, чтобы ускорить процесс.

1.  Скачайте детали объектов из АПИ ПКК, чтобы закрыть оставшиеся пробелы:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/6-fetchObjectInfosFromPkkApi.ts
    ```

    Эта команда не поддерживает многозадачность.
    Запуск слишком большого числа запросов приводит к блокировке айпи-адреса.

1.  Расширьте список кадастровых номеров, если это необходимо.

    Созданные ранее файлы-страницы заканчиваются несколькими десятками пустых кадастровых номеров.
    В процессе скачивания деталей объектов списки кадастровых номеров в некоторых кварталах могут заполниться данными «под завязку».
    Это значит, что есть вероятность найти больше объектов, если добавить ещё страниц.

    ```sh
    yarn exe src/commands/2-sources/rosreestr/7-addExtraObjectInfoPages.ts
    ```

    Если новые страницы добавились, следует перезапустить команду `5-fetchObjectInfosFromFirApi`.

    Вероятно, процесс добавления и простукивания страниц придётся повторять несколько раз.
    Если очередной запуск команды `7-addExtraObjectInfoPages` не добавил ни одной страницы, данные Росреестра можно считать собранными.

    ***

    Списки кадастровых номеров иногда содержат пустоты длиной в несколько сотен объектов.
    Они возникают при сносе зданий.
    Если за такими пустотами следуют только объекты без координат, то расширение и простукивание диапазонов кадастровых номеров не даст «дотянуться» до некоторых данных.

    Вероятность такой ситуации крайне мала; вы узнаете о ней только после смешивания и визуализации всех данных.
    Проблема даст о себе знать большим количеством зданий без года постройки в одном из районов.

    Если вы нашли кадастровые номера, до которых команды «не дотягиваются», то вы можете вручную указать их в файле `territory-config.yml`:

    ```yml
    sources:
      # ...
      rosreestr:
        handpickedCnsForPageInfos:
          - ××:××:×××××××:×××
          - ××:××:×××××××:×××
    ```

    На каждый проблемный квартал достаточно ввести только один кадастровый номер (желательно максимальный из найденных).
    После обновления файла `territory-config.yml` надо перезапустить команду `4-generateInitialObjectInfoPages` и все последующие, которые связаны с Росреестром и смешиванием слоёв.

#### [Викиданные](https://www.wikidata.org)

1.  Скачайте записи внутри территории:

    ```sh
    yarn exe src/commands/2-sources/wikidata/1-fetchItems.ts
    ```

##### [Викимапия](https://wikimapia.org)

1.  Скачайте контуры объектов:

    ```sh
    yarn exe src/commands/2-sources/wikimapia/1-fetchTiles.ts
    ```

1.  ![][опционально]  
    Создайте файл для анализа промежуточного результата:

    ```sh
    yarn exe src/commands/2-sources/wikimapia/2-previewTileData.ts
    ```

1.  Скачайте и обработайте детали объектов:

    ```sh
    yarn exe src/commands/2-sources/wikimapia/3-fetchRawObjectInfos.ts
    yarn exe src/commands/2-sources/wikimapia/4-parseRawObjectInfos.ts
    ```

##### [Викигид](https://ru.wikivoyage.org)

1.  Скачайте данные страниц, указанных в файле `territory-config.yml`:

    ```sh
    yarn exe src/commands/2-sources/wikivoyage/1-fetchPages.ts
    ```

#### Создание каталога геокодов

Геокодирование — процесс связывания адреса объекта и его координат.
В собранных нами данных есть здания с адресом и координатами, а также записи, где координаты отсутствуют.
Собрав каталог геокодов, мы уменьшим количество объектов без координат.

Команды для пока ещё неготовых источников следует пропустить.
Их можно запускать в любом порядке.

```sh
yarn exe src/commands/2-sources/mingkh/8-reportGeocodes.ts
yarn exe src/commands/2-sources/mkrf/8-reportGeocodes.ts
yarn exe src/commands/2-sources/osm/8-reportGeocodes.ts
yarn exe src/commands/2-sources/rosreestr/8-reportGeocodes.ts
yarn exe src/commands/2-sources/wikidata/8-reportGeocodes.ts
yarn exe src/commands/2-sources/wikimapia/8-reportGeocodes.ts
yarn exe src/commands/2-sources/wikivoyage/8-reportGeocodes.ts
```

Результат работы команд будет в папке `/path/to/data/territories/TERRITORY_NAME/geocoding`.
Созданные файлы игнорируются гитом, поэтому команды следует выполнять каждый раз после клонирования или обновления репозитория с данными.

<!-- TODO: Написать про territory-config.yml → addressHandling -->

#### Заполнение пробелов в каталоге геокодов

![][опционально]

Сопоставление адресов и географических координат из разных источников существенно улучшает качество смешивания данных.
Тем не менее, координаты некоторых зданий по-прежнему остаются неизвестными.
Для их получения можно воспользоваться сторонним сервисом, в частности [геокодером от Яндекса](https://yandex.ru/dev/maps/geocoder/).
Этот этап улучшает финальный результат, но не является решающим.
Его можно пропустить или выполнить позже.

Полнота данных ОСМ на выбранной территории существенно влияет на количество пробелов в каталоге геокодов.
Чтобы уменьшить зависимость от стороннего геокодера, попробуйте улучшить данные в ОСМ и потом скачать их заново.
Пример такого мини-проекта — [пензенская картовечеринка](https://wiki.openstreetmap.org/wiki/RU:Пенза/встречи).

Чтобы воспользоваться геокодером от Яндекса, вам потребуется ключ для их АПИ.
Его получают на странице [developer.tech.yandex.ru/services](https://developer.tech.yandex.ru/services) (следует выбрать _JavaScript API и HTTP Геокодер_).
Важно, чтобы у вас было разрешение кэшировать ответы сервера, иначе вы будете нарушать лицензионное соглашение.

Ключ от АПИ надо добавить в файл `/path/to/tooling/.env.local`:

```ini
YANDEX_GEOCODER_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

1.  Запустите геокодер и сохраните результат в кэш:

    ```sh
    yarn exe src/commands/2-sources/yandex/1-geocodeAddressesWithoutPosition.ts
    ```

    В зависимости от лимита запросов для вашего ключа, вам может понадобиться несколько дней, чтобы закрыть все пробелы.
    Можно продолжать обработку данных, не дожидаясь полного геокодирования адресов, а потом вернуться к этому шагу.

1.  Добавьте полученные геокоды в каталог:

    ```sh
    yarn exe src/commands/2-sources/yandex/8-reportGeocodes.ts
    ```

    Как и на предыдущем шаге, результат команды `*/8-reportGeocodes.ts` не попадает в гит-репозиторий.
    Значит, эту команду надо выполнить каждый раз при клонировании или обновлении репозитория с данными.

---

Если вы подготавливаете данные итерациями, некоторые геокоды Яндекса могут стать лишними.
Например, это происходит после улучшения данных ОСМ.
Чтобы удалить лишние файлы из кэша, воспользуетесь этой командой:

```sh
yarn exe src/commands/2-sources/yandex/2-deleteCacheEntriesForUnusedAddresses.ts
```

#### Подготовка слоёв к смешиванию

У нас есть исходные данные из нескольких источников, а также локальный каталог геокодов.
Чтобы склеить источники, нам нужно привести все данные к единому формату, подмешав при этом недостающие геокоды.

Единица смешивания данных — стандартизированный файл (слой).
Для каждого источника создаётся по одному слою.

Команды для пока ещё неготовых источников следует пропустить.
Их можно запускать в любом порядке.

```sh
yarn exe src/commands/2-sources/mingkh/9-extractOutputLayer.ts
yarn exe src/commands/2-sources/mkrf/9-extractOutputLayer.ts
yarn exe src/commands/2-sources/osm/9-extractOutputLayer.ts
yarn exe src/commands/2-sources/rosreestr/9-extractOutputLayer.ts
yarn exe src/commands/2-sources/wikidata/9-extractOutputLayer.ts
yarn exe src/commands/2-sources/wikimapia/9-extractOutputLayer.ts
yarn exe src/commands/2-sources/wikivoyage/9-extractOutputLayer.ts
```

Результатом работы команд станут файлы `/path/to/data/territories/TERRITORY_NAME/sources/*/output-layer.geojson`.
Они игнорируется гитом, потому что их дешевле перегенерировать, чем хранить.
Файлы `output-layer.geojson` следует перегенерировать после изменения исходных данных или обновления каталога геокодов.

<!-- TODO: добавить про territory-config → sources → mkrf → fixedLonLatById -->

#### Смешивание слоёв

Этот финальный этап обработки данных смешивает файлы, которые мы получили на предыдущем шаге.

Исходные слои выполняют одну из двух ролей: являются _базой_ (источником геометрии и характеристик) или _заплаткой_ (только источником характеристик).
Роль базового слоя выполняет ОСМ, все остальные источники — заплатки.

1.  Смешайте базовые слои и заплатки:

    ```sh
    yarn exe src/commands/3-mixOutputLayers.ts
    ```

1.  Запустите команду выбора финальных характеристик из нескольких вариантов:

    ```sh
    yarn exe src/commands/4-mixPropertyVariants.ts
    ```

Всё готово! 🎉

#### Просмотр черновика постера

Результат смешивания слоёв доступен в виде веб-страницы.
Чтобы её открыть, надо запустить локальный веб-сервер из папки `/path/to/tooling`:

```sh
yarn dev
```

Эта команда остаётся запущенной в терминале до нажатия `ctrl+c`.
Пока веб-сервер работает, черновик постера доступен в браузере по адресу [localhost:3000/poster](http://localhost:3000/poster).

Чтобы сгенерировать изображение с постером, надо открыть второй терминал, перейти в папку `/path/to/tooling` и запустить команду:

```sh
yarn exe src/commands/9-makePoster.ts
```

Размеры, цвета и другие параметры постера задаются в `territory-config.yml` → `poster`.

#### Корректировка результата

Запуск команд не требует ручных шагов по обработке данных.
Как следствие, ошибки в источниках неизбежно попадают в итоговый файл.

Чтобы повысить качество и полноту результата, предусмотрена возможность подмешивать локальные данные, которые подготовлены вручную.
Это позволяет добавлять на карту особые объекты (например, мосты) или исправлять ошибки в характеристиках (например, корректировать год постройки).

Как и файлы `/path/to/data/territories/TERRITORY_NAME/sources/*/output-layer.geojson`, ручные слои — это файлы `*.geojson`.
Их помещают в папку `/path/to/data/territories/TERRITORY_NAME/sources/manual`.
Название файла может быть любым (например, `bridges.geojson`), а число таких файлов неограниченно.
Структура содержимого — такая же, как у файлов `output-layer.geojson`.

Данные из папки `manual` имеют приоритет над остальными источниками.
При создании нового файла `*.geojson` важно не забыть указать `"layerRole": "base"` или `"layerRole": "patch"` — иначе этот слой будет проигнорирован.

При ручном создании объекта-заплатки есть специальная возможность перечислить данные, которые следует проигнорировать при смешивании.
Например, в слое Минкульта может быть снесённое здание, на месте которого построено новое, с уже правильными данными в Росреестре.
Чтобы исключить данные по снесённому зданию из результата, мы создаём файл `/path/to/data/territories/TERRITORY_NAME/sources/manual/patches.geojson` (`"layerRole": "patch"`).
В него добавляем точку с координатами внутри контура проблемного здания:

```json
{
  "type": "FeatureCollection",
  "layerRole": "patch",
  "privateNote": "Слой с заплатками (в этом месте может быть любая заметка)",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [12.345678, 12.345678]
      },
      "properties": {
        "dataToOmit": "mkrf",
        "privateNote": "ул. Тестовая 42 отмечен как памятник архитектуры, а это уже небоскрёб"
      }
    }
  ]
}
```

Увидев `"dataToOmit": "mkrf"`, команды исключат характеристики здания по версии Минкульта из финального набора данных.
Чтобы исправить другие случаи неправильного смешивания данных, следует добавить больше объектов `Feature` в этот же файл.

Кроме названия игнорируемого источника, можно указывать идентификатор объекта и конкретной характеристики через разделитель `|`.
Также разрешается перечислять несколько правил через запятую:

```json
"dataToOmit": "mkrf"
"dataToOmit": "mkrf|id12345"
"dataToOmit": "mkrf|id12345|completionDates"
"dataToOmit": "mkrf|*|completionDates"
"dataToOmit": "mkrf|id12345,mingkh|*|completionDates"
```

После обновления файлов `/path/to/data/territories/TERRITORY_NAME/sources/manual/*.geojson`, следует повторить команды в разделе «Смешивание слоёв».

Важно не заниматься ручным редактированием файлов во всех папках `/path/to/data/territories/TERRITORY_NAME/sources/*`, кроме `manual`.
Исправления в других подпапках сотрутся при обновлении данных.

Неточности в ОСМ проще всего исправлять на сайте [osm.org](https://www.openstreetmap.org), а потом заново скачивать улучшенные данные.
Инструкции для участия в проекте вы найдёте на [wiki.osm.org](https://wiki.openstreetmap.org/wiki/RU:Заглавная_страница).
При добавлении любых данных в базу ОСМ важно пользоваться только разрешёнными источниками.
Копировать содержимое других карт запрещено — сомнительные правки будут удалены участниками сообщества. [См. FAQ](https://wiki.openstreetmap.org/wiki/RU:FAQ).

#### Выгрузка данных

![][опционально]

Перед выгрузкой данных на сайт [how-old-is-this.house](https://how-old-is-this.house) запустите эту команду:

```sh
yarn exe src/commands/5-prepareUpload.ts
```

Она создаст копию результата в подходящем для сайта формате.

[опционально]: https://img.shields.io/badge/-опционально-white.svg
