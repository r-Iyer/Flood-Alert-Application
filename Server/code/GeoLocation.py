from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import numpy as np
import pandas as pd
import time
import cv2
import matplotlib.pyplot as plt
import os
import sys
import requests
import json

import matplotlib.pyplot as plt
import numpy as np; np.random.seed(1)
#from scipy.spatial import ConvexHull
def main(argv):
	from PIL import Image
	from PIL.ExifTags import TAGS, GPSTAGS
	import numpy as np
	import pandas as pd
	import time
	import cv2
	import matplotlib.pyplot as plt
	import os
	import sys
	import numpy as np
	import matplotlib.pyplot as plt
	from sklearn.cluster import KMeans, DBSCAN
	from scipy.cluster.vq import kmeans2, whiten
	key="AIzaSyAu6PIjwW-IL4vznXvmi5KnAYlvBQWZSoA"
	class ImageMetaData(object):
	    exif_data = None
	    image = None

	    def __init__(self, img_path):
	        self.image = Image.open(img_path)
	        self.get_exif_data()
	        super(ImageMetaData, self).__init__()

	    def get_exif_data(self):
	        exif_data = {}
	        info = self.image._getexif()
	        if info:
	            for tag, value in info.items():
	                decoded = TAGS.get(tag, tag)
	                if decoded == "GPSInfo":
	                    gps_data = {}
	                    for t in value:
	                        sub_decoded = GPSTAGS.get(t, t)
	                        gps_data[sub_decoded] = value[t]

	                    exif_data[decoded] = gps_data
	                else:
	                    exif_data[decoded] = value
	                    
	        self.exif_data = exif_data
	        return exif_data

	    def get_if_exist(self, data, key):
	        if key in data:
	            return data[key]
	        return None

	    def convert_to_degress(self, value):
	        """Helper function to convert the GPS coordinates 
	        stored in the EXIF to degress in float format"""
	        d = value[0]
	        m = value[1]
	        s = value[2]

	        return d + (m / 60.0) + (s / 3600.0)

	    def get_lat_lng(self):
	        """Returns the latitude and longitude, if available, from the provided exif_data (obtained through get_exif_data above)"""
	        lat = None
	        lng = None
	        exif_data = self.get_exif_data()
	        if "GPSInfo" in exif_data:      
	            gps_info = exif_data["GPSInfo"]
	            gps_latitude = self.get_if_exist(gps_info, "GPSLatitude")
	            gps_latitude_ref = self.get_if_exist(gps_info, 'GPSLatitudeRef')
	            gps_longitude = self.get_if_exist(gps_info, 'GPSLongitude')
	            gps_longitude_ref = self.get_if_exist(gps_info, 'GPSLongitudeRef')
	            if gps_latitude and gps_longitude:
	                lat = self.convert_to_degress(gps_latitude)
	                lng = self.convert_to_degress(gps_longitude)
	        return lat, lng
	def load_images_from_folder(folder):
	    images = []
	    for filename in os.listdir(folder):
	        images.append(filename)
	    return images
	loc=argv[0].strip('"');
	loc=loc.lower()
	filename="files/"+loc+"/";
	images1=load_images_from_folder(filename)
	img=np.array(images1)

	#___Get Coordinates of each images in the folder___#
	coordinates=[]
	for i in range(img.shape[0]):
	    coordinates.append([])
	for i in range(img.shape[0]):
	    path_name = filename+img[i]
	    meta_data =  ImageMetaData(path_name)
	    latlng =meta_data.get_lat_lng()
	    coordinates[i].append(latlng[0])
	    coordinates[i].append(latlng[1])
	coordinates=np.array(coordinates)
	#________________________________________________#


	# db scan to know no. of clusters folled by kmeans to get the cluster centers
	kms_per_radian = 6371.0088
	epsilon = 1.5 / kms_per_radian
	db = DBSCAN(eps=epsilon, min_samples=1, algorithm='ball_tree', \
	            metric='haversine').fit(np.radians(coordinates))
	#plt.scatter(coordinates[:,1], coordinates[:,0], c=y);
	#plt.show()
	y = db.labels_

	for i in range(len(y)): # to prevent first cluser label = -1
	    y[i]=y[i]+1;

	kmeans = KMeans(n_clusters=max(db.labels_)).fit((np.radians(coordinates))) 
	y=kmeans.labels_

	center=kmeans.cluster_centers_
	center=np.rad2deg(center)

	#_______GET description of location that is the flood center_____#"
	location=""
	for i in range(len(center)):
	    response=requests.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+str(center[i][0])+","+str(center[i][1])+"&key="+key)
	    data = json.loads(response.text)
	    if(data['results'][0]['formatted_address'].split(",")[-3].lower().strip(' ')==loc): # loc = folder name = city name
	        location=location+data['results'][0]['formatted_address'].split(",")[-4]+" , "
	    else:
	        location=location+data['results'][0]['formatted_address'].split(",")[-3]+" , "
	location=location[:-2] #to remove last ' ,'
	#______________________________________________________________#

	#________msg printed to console__#
	msg="";
	for i in range(img.shape[0]):
	    path_name = filename+img[i]
	    meta_data =  ImageMetaData(path_name)
	    latlng =meta_data.get_lat_lng()
	    msg=msg+path_name+"@"+str(y[i])+str(latlng) # '@' used as seperator

	msg=msg+"!"+location
	'''def encircle(x,y):
	    if(len(x))==1:
	        return([])
	    p = np.c_[x,y]
	    hull = ConvexHull(p)
	    poly = p[hull.vertices,:]
	    return poly''' #LIBRARY FOR ENCIRCLE
	#_____________________________________________
	from functools import reduce
	def encircle(X,Y):
	    def d(X,Y):
	        res=[]
	        for el in range(len(X)):
	            s=[X[el],Y[el]]
	            res.append(s)
	        return(res)
	    points=d(X,Y)
	    TURN_LEFT, TURN_RIGHT, TURN_NONE = (1, -1, 0)

	    def cmp(a, b):
	        return (a > b) and not(a < b)

	    def turn(p, q, r):
	        return cmp((q[0] - p[0])*(r[1] - p[1]) - (r[0] - p[0])*(q[1] - p[1]), 0)

	    def _keep_left(hull, r):
	        while len(hull) > 1 and turn(hull[-2], hull[-1], r) != TURN_LEFT:
	            hull.pop()
	        if not len(hull) or hull[-1] != r:
	            hull.append(r)
	        return hull

	    points = sorted(points)
	    l = reduce(_keep_left, points, [])
	    u = reduce(_keep_left, reversed(points), [])
	    return l.extend(u[i] for i in range(1, len(u) - 1)) or l
	    #____________________________________________________

	xcor=[]
	ycor=[]
	for i in range(max(db.labels_)):
	    xcor.append([])
	    ycor.append([])
	for i in range(max(db.labels_)):
	    for j in range(len(coordinates)):
	        if y[j]==i:
	            xcor[i].append(coordinates[j][0])
	            ycor[i].append(coordinates[j][1])
	poly=[]
	for i in range(max(db.labels_)):
	    val=encircle(xcor[i], ycor[i])
	    if(len(val)>0):
	        poly.append(np.concatenate(val).ravel())

	region=""
	for i in range(len(poly)):
	    for j in range(len(poly[i])):
	        region=region+str(poly[i][j])+','
	    region=region+str(poly[i][len(poly[i])-2])+","+str(poly[i][len(poly[i])-1])+','+str(poly[i][0])+","+str(poly[i][1])
	    region=region+'/'
	region=region[:-1]

	msg=msg+"border"+region
	print(msg)  # '!' used as seperator
	#________________________________#

if __name__ == "__main__":
    main(sys.argv[1:]) 