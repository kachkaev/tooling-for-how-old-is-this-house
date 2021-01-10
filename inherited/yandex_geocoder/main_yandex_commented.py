import numpy as np
import pandas as pd
import requests
import json
import time
import os


from geopy.geocoders import Yandex


raw = pd.read_csv('Kazan.csv') #pandas читаем файл на входе, csvшка c одним из полей текстовой строкой адресом
raw = raw.fillna('')


geolocator = Yandex(api_key="",lang='ru_RU') # сюда подставляем ключик геокодера из кабинета разработчика яндекса

raw['X_yandex'] = np.nan
raw['Y_yandex'] = np.nan
raw['precision']= np.nan
raw['kind']= np.nan  # создаем поля для координат, типа отгеокодированного обьекти и точности по яндексу

failed = pd.DataFrame()

for item in raw.index:
    if (item % 100 == 0):
        os.system("say " + str(item))
        raw.to_csv('result_Kazan.csv')
        failed.to_csv('failded_Kazan.csv')  # иногда оно падает поэтому раз в сто строчек я сохранял результаты и те строки что не удалось отгокодировтаь
    try:
        print(raw['address'][item])
        if raw['shortname_region']=='':
            location = geolocator.geocode('Казань, '+raw['address'][item]) # это собсвенно говоря геокодирование, тут собираем строчку для поиска для концретной csv это вот так еслми поле с регионом пустое
        else:
            location = geolocator.geocode(raw['address'][item]) # а если не пустое просто берем столбец adress и геокодируем его
        print(location)
        precision = location.raw['metaDataProperty']['GeocoderMetaData']['precision'] #записываем точность
        kind = location.raw['metaDataProperty']['GeocoderMetaData']['kind'] #записываем тип обьекта в отедельные переменные
        raw['precision'][item] = precision
        raw['kind'][item] = kind
        raw['X'][item] = location.latitude
        raw['Y'][item] = location.longitude # записываем все добро в датафрейм панадас
        print('s' + str(item) + '. ' + str(location.latitude) + '. ' + str(location.longitude)+' kind '+kind+' precision '+precision)

    except Exception as why:
            os.system('say fail')
            rows = raw.loc[item, :]
            failed = failed.append(rows, ignore_index=True)
            print('request exception :' + str(why))
            raw.to_csv('result_Kazan.csv')
            failed.to_csv('failded_Kazan.csv') # если что то сломалось запомним строчку и на всякий сохроанимся





print('yea')
os.system("say finished")
raw.to_csv('result_Kazan.csv')
failed.to_csv('failded_Kazan.csv') # ну и если дойдем до конца тоже сохранимся
