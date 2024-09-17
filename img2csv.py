from PIL import Image
import numpy as np
import sys
import os
import csv

OUTPUT_CSV="output.csv"
LABEL='andy'
# default format can be changed as needed
def createFileList(myDir, format='.png'):
    fileList = []
    print(myDir)
    labels = []
    names = []
    for root, dirs, files in os.walk(myDir, topdown=True):
            for name in files:
                if name.endswith(format):
                    fullName = os.path.join(root, name)
                    fileList.append(fullName)
                    labels.append(LABEL)
                    names.append(name)
    return fileList, labels, names

try:
    os.remove(OUTPUT_CSV)
except OSError:
    pass

# load the original image
myFileList, labels, names  = createFileList('images')
i = 0
for file in myFileList:
    print(file)
    img_file = Image.open(file)
    # img_file.show()
# get original image parameters...
    width, height = img_file.size
    format = img_file.format
    mode = img_file.mode
# Make image Greyscale
    # img_file = img_file.convert('L')
    #img_grey.save('result.png')
    #img_grey.show()
# Save Greyscale values
    data = img_file.getdata()
    value = np.asarray(img_file.getdata(), dtype=np.int16).reshape((width, height,3))
    value = value.flatten()
    
    value = np.append(value,labels[i])
    i +=1
    
    # print(value)
    with open(OUTPUT_CSV, 'a') as f:
        writer = csv.writer(f)
        writer.writerow(value)