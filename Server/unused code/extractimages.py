from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import numpy as np
import pandas as pd
import time
import cv2
import matplotlib.pyplot as plt
import os
import sys
import json
def main(argv):
    x=argv
    request= json.loads(x[0]);
    class ImageMetaData(object):
        '''
        Extract the exif data from any image. Data includes GPS coordinates, 
        Focal Length, Manufacture, and more.
        '''
        exif_data = None
        image = None

        def __init__(self, img_path):
            self.image = Image.open(img_path)
            #print(self.image._getexif())
            self.get_exif_data()
            super(ImageMetaData, self).__init__()

        def get_exif_data(self):
            """Returns a dictionary from the exif data of an PIL Image item. Also converts the GPS Tags"""
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
            #print(exif_data)
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
    filename="files/"+request["url"].lower()+"/";
    images1=load_images_from_folder(filename)
    img=np.array(images1)

    lat=[0,0]
    lon=[0,0]
    R=6373.0
    from math import sin, cos, sqrt, atan2, radians
    msg="";
    for i in range(img.shape[0]):
        path_name = filename+img[i]
        meta_data =  ImageMetaData(path_name)
        latlng =meta_data.get_lat_lng()
        latlng=str(latlng)
        latlng=latlng.replace("(","")
        latlng=latlng.replace(")","")
        latlng=latlng.replace(" ","")
        latitude=float(latlng.split(",")[0])
        longitude=float(latlng.split(",")[1])
        lat[0]=radians(latitude)
        lon[0]=radians(longitude)
        lat[1]=radians(float(request["latitude"]))
        lon[1]=radians(float(request["longitude"]))
        dlon=lon[1]-lon[0]
        dlat=lat[1]-lat[0]
        a= sin(dlat/ 2)**2 + cos(lat[0]) * cos(lat[1]) * sin(dlon/ 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        distance = R * c
        if(distance<=0.05):
            msg=path_name
            break

if __name__ == "__main__":
    main(sys.argv[1:]) 