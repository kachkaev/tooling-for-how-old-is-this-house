from bs4 import BeautifulSoup
import re
import os
import pandas as pd



filelist=os.listdir('kazan/results/html')
print(filelist)
item_n=0
item_min = 0
result=pd.DataFrame()

for filename  in filelist:
  if item_n>=item_min:
        item_n+=1


        wm_id = filename[:-5]
        print(wm_id)
        filename = "kazan/results/html/"+str(wm_id)+'.html'


        def read_file(filename):
            with open(filename) as input_file:
                text = input_file.read()
            return text

        text=read_file(filename)
        if text:
            print(filename)
            soup=BeautifulSoup(text,features="html.parser")
            try:
                item=soup.find('div',{'id':'placeinfo-categories'})

                cats=item.find_all('strong')
                categories_ids=[]
                categories_names=[]
                for item in cats:
                    categories_ids.append(item.get('id'))
                    categories_names.append(item.contents[0])
                print (categories_names)
                print (categories_ids)
            except:
                categories_ids = []
                categories_names = []

            try:
                photo=soup.find('div',{'id':'place-photos'}).find("a")

                photo_url=photo.get("data-full-url")
                photo_uname=photo.get("data-user-name")
                print(photo_url)
                print(photo_uname)
            except:
                photo_url = ''
                photo_uname = ''


        result=result.append({"wm_id":str(wm_id),"categories_ids" :categories_ids,"categories_names" :categories_names, "photo_url":photo_url,"photo_uname":photo_uname}, ignore_index=1)
        print(result)
        if item_n % 100000 == 0:

            result.to_csv('kazan/wm_result'+str(item_n)+'.csv')
            result=pd.DataFrame()
            print(str(item_n)+'saved')

result.to_csv('kazan/wm_result_all.csv')