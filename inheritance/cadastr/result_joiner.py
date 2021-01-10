import pandas as pd
import os

final=pd.DataFrame()
filelist=os.listdir('saint-p/results/')
print(filelist)

results=[]
for item in filelist:
    results.append(pd.read_csv('saint-p/results/'+item))

result=pd.concat(results)

result.to_csv('saint-p/result_all.csv')