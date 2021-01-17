import requests
import pandas as pd
import xml.etree.ElementTree as ET
import time


squares=pd.read_csv("kazan/k_squares.csv") # считываем координаты углов квадратов
#kml=pd.read_csv("kazan/result_wkt_kml.csv", index_col='ID') # эта строка нужна если не первая попытка - открывает файл результат на дозапись


i_min=0 # номер строки с которой начинаем

for row_ind in squares.index:
    if row_ind>=i_min:

        lat_min = str(squares["lat_min"][row_ind])
        lat_max = str(squares["lat_max"][row_ind])
        lon_min = str(squares["lon_min"][row_ind])
        lon_max =str( squares["lon_max"][row_ind])
        
        payload = {"BBOX":lon_min+','+lat_min+','+lon_max+','+lat_max} # формируем строку запроса к викимапии
        url = 'http://wikimapia.org/d'
        r = requests.get(url,params=payload) # запрос

        print('request'+str(row_ind))

        time.sleep(1) # таймаутом надо играть на практике - сервак может обрубать если слишком часто

        result = ET.XML(r.text)
        for placemark in result[0][3]:
            wm_id=placemark.attrib['id'][2:]
            print(wm_id)
            wm_name=placemark[2].text.replace('\n','').split('<br>')[0]
            print(wm_name)
            wm_x=placemark[4][1][0].text[:-3].split(',')[0]
            wm_y = placemark[4][1][0].text[:-3].split(',')[1]

            coords=placemark[4][0][0].text.replace('\n','').split(',0')
            wkt='POLYGON (('
            for xy in coords:
                wkt+=xy.replace(',',' ')
                wkt+=', '
            wkt=wkt[:-4]+'))'

            print(wkt)

            kml=kml.append({'wm_id':wm_id,'wm_name':wm_name,"wm_x":wm_x,'wm_y':wm_y,'wkt':wkt}, ignore_index=1)   # парсинг ответа - записываем айди обьекта википамии его название , центр точку и геометрию вкт
            print(kml)
        print(r.status_code)
        kml=kml.drop_duplicates() # а еще часто мы получаем один и тот же обьект дважды - убиваем дубликаты
        if row_ind%500==0:
            kml=kml.drop_duplicates()
            kml.to_csv('kazan/result_wkt_kml.csv') # от греха подальше автосейв раз в 500

kml.to_csv('kazan/result_wkt_kml.csv') #  если вдруг дошли до конца - сохраняем результат

        # ids=[]
        # final=pd.DataFrame()
        # print(r.status_code)
        #
        # for item in result['folder']:
        #                 ids.append(item["id"])
        #
        # for id in ids:
        #
        #                 payload = {'key': api_key, "id":id, 'language': 'ru', 'format': "json", "data_blocks":'main,geometry,location,photos,translate'}
        #                 url = 'http://api.wikimapia.org/?function=place.getbyid'
        #
        #
        #                 r = requests.get(url, params=payload)
        #                 answer=r.text
        #                 count += 1
        #                 print('c ' + str(count))
        #                 print(answer)
        #
        #                 r_pandas=pd.read_json(answer, orient='index' ).T
        #
        #
        #
        #                 r_json=r.json()
        #
        #                 time.sleep(3)
        #
        #                 if 'polygon' in r_json.keys():
        #                     poly = r_json['polygon']
        #                     WKT='POLYGON (('
        #
        #                     for coords in r_json['polygon']:
        #                             WKT+=str(coords['x'])+' '+str(coords['y'])+','
        #                     WKT =WKT[:-1]+'))'
        #                     r_pandas['polygon']=WKT
        #                 else:
        #                     r_pandas['polygon'] = ''
        #
        #                 if 'location' in r_json.keys():
        #                     location = r_json['location']
        #
        #                     if location:
        #                         r_pandas['Location_lon']=location['lon']
        #                         r_pandas['Location_lat']=location["lat"]
        #
        #
        #
        #                 if 'photos' in r_json.keys():
        #                     photos = r_json['photos']
        #                     r_pandas = r_pandas.drop(columns=['photos'])
        #                     if photos:
        #                         photos_pd=pd.DataFrame.from_dict(photos[0], orient='index' ).T
        #                         photos_pd = photos_pd.drop(columns=['id'])
        #                         result = pd.concat([r_pandas, photos_pd],axis=1)
        #                     else:
        #                         result = r_pandas
        #                 else:
        #
        #                     result= r_pandas
        #
        #
        #                 final=pd.concat([final,result], axis=0, ignore_index=1)
        #
        #
        # print('Aaaaaaaa ITEM '+str(row_ind)+'done')
        # if row_ind%1000==0:
        #     final.to_csv('kazan/results/k_'+str(item)+'.csv')
        #
