function uploadFile() 
{
  //var url=document.getElementById("url").value;
  var url="http://localhost:3000"; //CHANGE
  var file = document.getElementById("file1").files[0];
  var form=document.getElementById('upload_form');
  var formdata = new FormData();
  formdata.append("file1", file);
  var loc=document.getElementById("loc").value;
  formdata.append("loc", loc);

  var ajax = new XMLHttpRequest();
  ajax.upload.addEventListener("progress", progressHandler, false);
  ajax.addEventListener("load", successHandler, false);
  ajax.addEventListener("error", errorHandler, false);
  url=url+"/submit"
  ajax.open("POST", url); 
  ajax.send(formdata);

  ajax.onreadystatechange=function()
  {
    if (ajax.readyState==4 && ajax.status==200)
    {
      document.getElementById("myDiv").innerHTML="RESULT: "+ajax.responseText;
      console.log(ajax.responseText);
    }
  }
  return false;
}
function progressHandler(event) 
{
  if(event.lengthComputable)
  {
    var percent = (event.loaded / event.total) * 100;
    document.getElementById("progressBar").value = Math.round(percent);
    document.getElementById("status").innerHTML = Math.round(percent) + "% uploaded";
  }
  else
    document.getElementById("status").innerHTML = "Cant compute";
}
function successHandler(event) 
{
  document.getElementById("status").innerHTML = "Upload Successful";
  document.getElementById("progressBar").value =100; 
}
function errorHandler(event) 
{
  document.getElementById("status").innerHTML="Upload Failed";
}

function pinSymbol(color) 
{
  return {
    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#000',
    strokeWeight: 1,
    scale: 0.4
  };
}
function placeMarker() 
{
  //var url=document.getElementById("url").value;
  var url="http://localhost:3000"; //CHANGE
  url=url+"/map";
  console.log(url);
  var ajax = new XMLHttpRequest();
  ajax.open("POST", url); 
  var urlOfFile=document.getElementById("urlOfFile").value;
  var json = JSON.stringify(urlOfFile); 
  ajax.send(json);

  var response="",FloodCenter="";
  ajax.onreadystatechange=function()
  {
    if (ajax.readyState==4 && ajax.status==200)
    {
      response=ajax.responseText;
      borders=response.split("border")[1]
      response=response.split("border")[0]
      FloodCenter=response.split("!")[1]
      response=response.split("!")[0]
      response=response.split(")");

      var map = new google.maps.Map(document.getElementById("dvMap"), 
      {
        center: 
        {
          lat:parseFloat(response[0].split("(")[1].split(",")[0]),
          lng:parseFloat(response[0].split("(")[1].split(",")[1])
        },
        zoom: 11
      });
      

      document.getElementById("FloodCenter").innerHTML="Areas Affected: "+FloodCenter;

      var urlarray=[]
      var cluster=[]
      var color= ['blue', 'yellow', 'green', 'red','orange', 'aqua', 'fuchsia','lime', 'maroon', 'navy', 'olive', 'purple',
      'silver', 'teal', 'white','black'];
      var infowindow = new google.maps.InfoWindow();
      for(i=0;i<response.length-1;i++)
      {
        urlarray[i]=response[i].split("(")[0].split('@')[0]
        cluster[i]=response[i].split("(")[0].split('@')[1]
        console.log(urlarray[i]);
        var val=response[i].split("(")[1].split(",");
        var la = parseFloat(val[0]);
        var lo = parseFloat(val[1]);

        var u = {lat: la, lng: lo};
        //var url=document.getElementById("url").value;
        var url="http://localhost:3000"; //CHANGE
        var contentString='<img src="'+url+'/'+urlarray[i]+'">';
        var markers = new google.maps.Marker(
        {
          position: u, 
          map: map,
          title: contentString,
          icon: pinSymbol(color[cluster[i]])
        });


        google.maps.event.addListener(markers, "click", (function (markers,i) 
        {
          return function() 
          {
            var lat=markers.position.lat();
            var lon=markers.position.lng();
            var urlOfFile=document.getElementById("urlOfFile").value;
            var x= (lat+","+lon+"@"+urlOfFile);
            var formdata = new FormData();
            formdata.append("coordinates", x);
            //var url=document.getElementById("url").value;
            var url="http://localhost:3000"; //CHANGE
            url=url+"/marker";
            var ajax = new XMLHttpRequest();
            ajax.open("POST", url); 
            ajax.setRequestHeader("Content-type", "application/json");
            var json = JSON.stringify(x); 
            ajax.send(json);

            var contentString=markers.title;
            infowindow.setContent(contentString);
            infowindow.open(map,markers);
            //___________________________________________________
            //var url=document.getElementById("url").value;
            var url="http://localhost:3000"; //CHANGE
            var response="";
           //to open seperate page to view images
           // ajax.onreadystatechange=function()
            //{
              //if (ajax.readyState==4 && ajax.status==200)
              //{
                //response=ajax.responseText;
                //window.open(url+"/files/PicViewer.html?"+encodeURI(response));  //--->>> OPEN PICVIEWER.html
              //}
            //}
            //____________________________________________________
          }
        })(markers,i));

      } //-->forloop end
    }//-->if end

  }
  
}

function heatmap() 
{
  //var url=document.getElementById("url").value;
  var url="http://localhost:3000"; //CHANGE
  url=url+"/map";
  console.log(url);
  var ajax = new XMLHttpRequest();
  ajax.open("POST", url); 
  var urlOfFile=document.getElementById("urlOfFile").value;
  var json = JSON.stringify(urlOfFile); 
  ajax.send(json);

  var response="",FloodCenter="";
  ajax.onreadystatechange=function()
  {
    if (ajax.readyState==4 && ajax.status==200)
    {
      response=ajax.responseText;
      borders=response.split("border")[1]
      response=response.split("border")[0]
      FloodCenter=response.split("!")[1]
      response=response.split("!")[0]
      response=response.split(")");

      var map = new google.maps.Map(document.getElementById("dvMap"), 
      {
        center: 
        {
          lat:parseFloat(response[0].split("(")[1].split(",")[0]),
          lng:parseFloat(response[0].split("(")[1].split(",")[1])
        },
        zoom: 11
      });
      document.getElementById("FloodCenter").innerHTML="Areas Affected: "+FloodCenter;

      var heatmapData=[] //new
      for(i=0;i<response.length-1;i++)
      {
        var val=response[i].split("(")[1].split(",");
        var la = parseFloat(val[0]);
        var lo = parseFloat(val[1]);

        heatmapData[i]=new google.maps.LatLng(la,lo);//new

      } //-->forloop end

      var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
      });
      heatmap.setMap(map);

//TO DRAW OUTLINE OF CLUSTERS
      var border_each_cluster=[];
      border_each_cluster=borders.split("/");
      for(i=0;i<border_each_cluster.length;i++)
      {
        var flightPlanCoordinates = [];
        var edge_points=border_each_cluster[i].split(',');
        for(j=0;j<edge_points.length-1;j+=2)
        {
          var la = parseFloat(edge_points[j]);
          var lo = parseFloat(edge_points[j+1]);
          flightPlanCoordinates[j/2] =
            {lat: la, lng: lo};
        }
        var flightPath = new google.maps.Polyline({
          path: flightPlanCoordinates,
          geodesic: true,
          strokeColor: '#000000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });
        flightPath.setMap(map);
      }
//_____________________________________

    }//-->if end

  }
  
}