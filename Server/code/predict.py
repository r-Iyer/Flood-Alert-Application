import numpy as np
import pandas as pd
import time
import cv2
import matplotlib.pyplot as plt
import os
import sys, getopt, time
import tensorflow.keras
from tensorflow.keras.applications import VGG19
from tensorflow.keras.applications.vgg19 import preprocess_input
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras import models
from tensorflow.keras import layers
from tensorflow.keras import optimizers
import requests
import json

def main(argv):
   (winW, winH) = (48,48)
   vgg19 = VGG19(weights='imagenet', include_top=False, input_shape = ((48,48,3)))
   def sliding_window(image, stepSize, windowSize):
      for y in range(0, image.shape[0], stepSize):
         for x in range(0, image.shape[1], stepSize):
            yield (x, y, image[y:y + windowSize[1], x:x + windowSize[0]])

   from tensorflow.keras.models import load_model
   model = load_model('../models/model2.h5', compile=False)
   model.load_weights('../models/model2.h5')

   img1=cv2.imread(argv[0],cv2.IMREAD_COLOR);
   img1 = cv2.resize(img1, (400, 400))  
   #img1 = img1.astype('float32')
   #img1/=255
   (winW, winH) = (48,48)
   steps=48
   img1= np.pad(img1, pad_width=steps, mode='constant', constant_values=0)
   img1=img1[:,:,steps:steps+3]
   mask=np.zeros(np.asarray(img1).shape[:2])
   mask.shape
   i=0
   for (x, y, window) in sliding_window(img1, stepSize=32, windowSize=(winW, winH)):
       if window.shape[0] != winH or window.shape[1] != winW:
            continue
       X= np.expand_dims(window, axis=0)
       pred = vgg19.predict(np.array(X), batch_size=32, verbose=False)
       pred = np.reshape(pred, (1,512))
       Y_pred=model.predict(pred)
       #Y_pred=model.predict(X)
       y_pred = np.argmax(Y_pred, axis=1)
       
       mask[y:y + winW, x:x + winH]+=np.full((48,48), y_pred)
       
       clone = img1.copy()
       val=int(255*y_pred[0])

       i=i+1

   img1=img1[steps:-steps,steps:-steps]
   mask=mask[steps:-steps,steps:-steps]
   maxval = np.amax(mask)
   from sklearn.preprocessing import MinMaxScaler
   scaler = MinMaxScaler()
   mask3= scaler.fit_transform(mask)
   mask3*=255
   mask2=mask/maxval


   for i in range(img1.shape[:1][0]):
      for j in range(img1.shape[1:2][0]):
            if(mask2[i,j]>=0.0002):
                  mask2[i][j]=255
            else:
                  mask2[i,j]=0
   ret,thresh1 = cv2.threshold(mask3,127,255,cv2.THRESH_BINARY)

   x=mask2.shape[0]*mask2.shape[1]
   y=0
   for i in range(mask2.shape[0]):
      for j in range(mask2.shape[1]):
         y=y+(mask2[i][j]/255)
   if(((y/x)*100)<30):
      os.remove(argv[0])
   print("Percentage of water in the image is: ", (y/x)*100);

if __name__ == "__main__":
	main(sys.argv[1:]) 
