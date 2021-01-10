import pandas as pd
import os
import requests
import time
import json


raw = pd.read_csv('saint-p/missed.txt')
raw.drop_duplicates()


for item in raw.index:
    try:
        #if (item % 100 == 0):
           # os.system("say " + str(item))
         if item >-1:
            print ('reqest:'+raw['CAD_N'][item] )
            url = 'http://rosreestr.ru/api/online/fir_objects/'+raw['CAD_N'][item]   #
            r = requests.get(url)

            if r.ok:
                if r.status_code!=200:
                 #   os.system("say error "+str(r.status_code))
                    print(str(r.status_code))
                    error_log = open('saint-p/missed.txt', 'a')
                    error_log.write(raw['CAD_N'][item] + ',' + str(r.status_code) + '\n')
                    error_log.close()
                   # time.sleep(1)
                else:

                    resp=r.json()[0]
                    print(resp)
                    id=resp["objectId"]
                    url = 'http://rosreestr.ru/api/online/fir_object/'+id   #
                    print ('requested ID:'+id )
                    r2 = requests.get(url)

                    if r.ok:
                        if r.status_code!=200:
                         #   os.system("say error deep "+str(r.status_code))
                            print(str(r.status_code))
                            error_log = open('saint-p/missed.txt', 'a')
                            error_log.write(raw['CAD_N'][item] + ',' + str(r.status_code) + '\n')
                            error_log.close()
                        #    time.sleep(1)
                        else:

                            with open('saint-p/passports/'+ raw['CAD_N'][item] + '.json', 'w') as output_file:

                                print('ok '+str(item))
                                output_file.write(str(r2.text.encode("utf-8")))
                            #    time.sleep(1)
                    else:
                      #  os.system("say     WTF deep")
                        str(r.status_code)
                        error_log = open('saint-p/missed.txt', 'a')
                        error_log.write(raw['CAD_N'][item]+ ',' + str(r.status_code) + '\n')
                        error_log.close()
                        print(r.reason)
                        #print("Request  error:", r.status_code)
                        #print('Break? YN')
                        #a = input()
                        #if a == 'Y' or a == 'y':
                        #    break
            else:

                    #os.system("say     WTF")
                    str(r.status_code)
                    error_log = open('saint-p/missed.txt', 'a')
                    error_log.write(raw['CAD_N'][item]+ ',' + str(r.status_code) + '\n')
                    error_log.close()
                    print(r.reason)
                    #print("Request  error:", r.status_code)
                    #print('Break? YN')
                    #a = input()
                    #if a == 'Y' or a == 'y':
                    #    break

    except:
        os.system("say     WTF")

        error_log = open('saint-p/missed.txt', 'a')
        error_log.write(raw['CAD_N'][item] + ','  + '\n')
        error_log.close()
        print("exception")
        # print("Request  error:", r.status_code)
        # print('Break? YN')
        # a = input()
        # if a == 'Y' or a == 'y':
        #    break