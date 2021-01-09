import numpy as np
import pandas as pd
import requests
import json
import time
import os

from geopy.geocoders import Yandex

raw = pd.read_csv('kazan/k_kadastr_150000_155458.csv')  # raw data
raw = raw.fillna('')

geolocator = Yandex(api_key="")  # insert your api key
raw['X'] = np.nan
raw['Y'] = np.nan
raw['precision']= np.nan
raw['kind']= np.nan

failed = pd.DataFrame()

for item in raw.index:
    if item<24950:
        if (item % 500 == 0):  # saving everty 1000 in case of fail

            raw.to_csv('kazan/result150f.csv')  # result file
            failed.to_csv('kazan/failed150f.csv')  # list of failed items
        try:
            print(raw['objectAddress.addressNotes'][item])  # 'address' - name of feld fo r geocode request

            location = geolocator.geocode(raw['objectAddress.addressNotes'][item])
            print(location)
            precision = location.raw['metaDataProperty']['GeocoderMetaData']['precision']
            kind = location.raw['metaDataProperty']['GeocoderMetaData']['kind']
            raw['precision'][item] = precision
            raw['kind'][item] = kind
            raw['Y'][item] = location.latitude
            raw['X'][item] = location.longitude
            print('s' + str(item) + '. ' + str(location.latitude) + '. ' + str(
                location.longitude) + ' kind ' + kind + ' precision ' + precision)

        except Exception as why:

            rows = raw.loc[item, :]
            failed = failed.append(rows, ignore_index=True)
            print('request exception :' + str(why))
            #raw.to_csv('result_1V.csv')  # result file
            failed.to_csv('kazan/failed150f.csv')  # list of failed items


print('yea')

raw.to_csv('kazan/result150f.csv')  # result file
failed.to_csv('kazan/failed150f.csv')  # list of failed items