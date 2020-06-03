# -*- coding: utf-8 -*-
"""
Created on Mon Jan 13 21:01:06 2020

@author: USER
"""

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
import json
import os
import urllib2
import argparse
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
import sys
import time
def is_not_already_added(image_urls,present_url): # by rohit
    for i in image_urls:
        if(i==present_url):
            print("ALREADY EXISTS")
            return 0
    return 1
_,searchterm,totalcount = sys.argv # will also be the name of the folder
totalcount=int(totalcount)
url = "https://www.google.co.in/search?q="+searchterm+"&source=lnms&tbm=isch"
# NEED TO DOWNLOAD CHROMEDRIVER, insert path to chromedriver inside parentheses in following line
browser = webdriver.Chrome("chromedriver.exe")
browser.get(url)
header={'User-Agent':"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36"}
counter = 0
succounter = 0
if not os.path.exists(searchterm):
    os.mkdir(searchterm)


SCROLL_PAUSE_TIME=5 # can be modified
last_height = browser.execute_script("return document.body.scrollHeight")
while True:
    try:
       browser.find_element_by_xpath("//input[@value='Show more results']").click()
       last_height = browser.execute_script("return document.body.scrollHeight")
    except Exception as e:
    # Scroll down to bottom
        browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        # Wait to load page
        time.sleep(SCROLL_PAUSE_TIME)
        # Calculate new scroll height and compare with last scroll height
        new_height = browser.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height
#___________________For Scrolling_________________________________    



thumbnail_results = browser.find_elements_by_css_selector("img.Q4LuWd")  # All thumbnail results
number_results = len(thumbnail_results)
image_urls = set()
results_start = 0        
        
for img in thumbnail_results[results_start:number_results]:
    try:
        img.click() #click on a thumbnail
        time.sleep(3)   # can be modified
    except Exception:
        continue

    # extract image urls    
    actual_images = browser.find_elements_by_css_selector('img.n3VNCb')
    for actual_image in actual_images:
        if(succounter>=totalcount):
            print succounter, "pictures succesfully downloaded"
            browser.close()
            exit()
        counter = counter + 1
        if actual_image.get_attribute('src') and 'http' in actual_image.get_attribute('src'):
            if(is_not_already_added(image_urls,actual_image.get_attribute('src'))):
                if(actual_image.get_attribute('src').startswith("https://encrypted-tbn0.gstatic.com")):
                    print("This is a thumbnail")
                    continue
                else:
                    image_urls.add(actual_image.get_attribute('src'))
            else:
                continue    
        try:
            req = urllib2.Request(actual_image.get_attribute('src'), headers={'User-Agent': header})
            raw_img = urllib2.urlopen(req).read()
            File = open(os.path.join(searchterm , searchterm + "_" + str(succounter) + "." + "jpg"), "wb")
            File.write(raw_img)
            File.close()
            succounter = succounter + 1
            print "Total Count:", counter
            print "Succsessful Count:", succounter
            print actual_image.get_attribute('src')
            break
        except:
                print "can't get img"