import pandas as pd
import os

final=pd.DataFrame()
filelist=os.listdir('saint-p/passports/') # создали массив с именами всех файлов в этой директории
i=0
for filename in filelist:
    try:
        i += 1
        if i>0:
            passport = pd.read_json("saint-p/passports/"+filename, orient='index').T  # читаем файл в панда датафрэйм, пофиг какое будет расширение - по факту это json

            passport['CAD_N_request']=filename[0:-5]                                
            objectData=pd.json_normalize(passport['objectData'])
            parcelData=pd.json_normalize(passport['parcelData'])
            passport=passport.drop(columns=['objectData','parcelData','oldNumbers']). #  тут мы по всякому приводим данные в порядок 
            result=pd.merge(passport,objectData)
            result=pd.merge(result,parcelData)
            final=pd.concat([final,result]). # дописываем в результат 
            print(i)

    except:
        print("error")
        error_log = open('saint-p/missed_parser.txt', 'a'). # если что то сломалось пишем ошибка и записываем имя файла где сломалась 
        error_log.write(filename + '\n')
        error_log.close()
    if i%5000==0:
        final.to_csv('saint-p/results/result'+str(i)+'.csv')  # каждые 5тысяч строк записываем в отдельный csv файл 
        final = pd.DataFrame() # обнуляем датафрейм  final 


final.to_csv('saint-p/results/result_last.csv') # записывваем хвостик 


