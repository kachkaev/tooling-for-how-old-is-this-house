import requests
from bs4 import BeautifulSoup
import sys
import os
import time
import pandas as pd

wm_ids=pd.read_csv("kazan/result_kml.csv")
item_min=35000

for row_ind in wm_ids.index:
  if row_ind>=item_min:


    print ('item'+str(row_ind))
    wm_id=wm_ids['wm_id'][row_ind]
    url = 'http://wikimapia.org/' +str(wm_id)+'/' #
    r = requests.get(url)
    if r.ok:
        with open('kazan/results/html/' + str(wm_id) + '.html', 'a') as output_file:
         print('ok '+str(row_ind))
         output_file.write(r.text)
         time.sleep(1)

    else:
        if r.status_code==404:
          print(404)
          error_log = open('kazan/missed_wm_id.txt', 'a')
          error_log.write(str(wm_id) + ',' + str(r.status_code) + '\n')
          error_log.close()
          time.sleep(1)
        else:
            os.system("say     fuck " )
            error_log = open('kazan/missed_wm_id.txt', 'a')
            error_log.write(str(wm_id) + ',' + str(r.status_code) + '\n')
            error_log.close()
            print(r.reason)
            print("Request  error:",r.status_code)
            print('Break? YN')
            a = input()
            if a == 'Y'or a=='y':
                break