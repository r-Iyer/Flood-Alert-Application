var list_of_points=[];

function uploadFile() 
{
	var url=document.getElementById("url").value;
	url=url+"/submit"
	console.log(url);
	
	var file = document.getElementById("file1").files[0];
	var form=document.getElementById('upload_form');
	var loc=document.getElementById("loc").value;
	
	var formdata = new FormData();
	formdata.append("file1", file);
	formdata.append("loc", loc);
	
	var ajax = new XMLHttpRequest();
	ajax.upload.addEventListener("progress", progressHandler, false);
	ajax.addEventListener("load", successHandler, false);
	ajax.addEventListener("error", errorHandler, false);
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

function createHttpPostRequest(url)
{
	var ajax = new XMLHttpRequest();
	ajax.open("POST", url);
	
	return ajax;
}
function initialise_map(parseResponse)
{
	return new google.maps.Map(document.getElementById("dvMap"), 
		{
			center: 
			{
				lat:parseFloat(parseResponse["images"][0]["coordinates"]["latitude"]),
				lng:parseFloat(parseResponse["images"][0]["coordinates"]["longitude"])
			},
			zoom: 11
		});
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

function display_centroid_locations(parseResponse)
{
	var FloodCenter="";
	for (i in parseResponse["areas"])
		FloodCenter+=parseResponse["areas"][i]["location"]+",";
	FloodCenter = FloodCenter.substring(0, FloodCenter.length - 1);
	document.getElementById("FloodCenter").innerHTML="Areas Affected: "+FloodCenter;
}

function selecting_coordinates_for_route(map)
{
	list_of_points=[];
	document.getElementById("route-selection").addEventListener("click", function(){
		generateRoutes(map);
		},{once:true}
	); //So that event listener does not get added again
	
	//Adding Code for selecting coordinates for route
	var route=[],no_points=0;
	var latlngbounds = new google.maps.LatLngBounds();
	google.maps.event.addListener(map, 'click', function (e) {
		list_of_points.push({"latitude":e.latLng.lat(),"longitude":e.latLng.lng()});
	});
	google.maps.event.addListener(map, 'click', function(event) {
		placeMarker(event.latLng);
	});

	function placeMarker(location) {
		var marker = new google.maps.Marker({
			animation: google.maps.Animation.DROP,
			position: location, 
			map: map
		});
		
		no_points++;
		route[no_points]=location;
		
		if(no_points!=1){
			var coordinates = [
				route[no_points-1],
				route[no_points]
			];
			//Drawing straight line between source and destination

			/*var line = new google.maps.Polyline({
				path: coordinates,
				strokeColor: "#FF0000",
				strokeOpacity: 1.0,
				strokeWeight: 3,
				map: map
			});*/
		}
	}
}

function generateRoutes(map)
{
	console.log(list_of_points);
	var url=document.getElementById("url").value;
	url=url+"/GetRoute";
	console.log(url);
	var ajax = new XMLHttpRequest();
	ajax.open("POST", url);
	var json = JSON.stringify(list_of_points);
	ajax.send(json);
	
	var responseData="";
	ajax.onreadystatechange=function()
	{
		if (ajax.readyState==4 && ajax.status==200)
		{
			responseData=ajax.responseText;
			parseResponse = JSON.parse(responseData);
			drawRoutes(parseResponse,map);
			calculateCost();
		}
	}
}

function placeMarker() 
{
	document.getElementById("route-selection").className="show";
	
	var url=document.getElementById("url").value;
	url=url+"/map";
	console.log(url);
	
	var urlarray=[],cluster=[],parseResponse="",borders="",responseData="",color= ['blue', 'yellow', 'green', 'red','orange', 'aqua', 'fuchsia','lime', 'maroon', 'navy', 'olive', 'purple','silver', 'teal', 'white','black'];
	
	//Sending Http Post
	var reqBody = JSON.stringify(document.getElementById("urlOfFile").value);
	var ajax = createHttpPostRequest(url);
	ajax.send(reqBody);
	
	ajax.onreadystatechange=function()
	{
		if (ajax.readyState==4 && ajax.status==200)
		{
			responseData=ajax.responseText;
			parseResponse = JSON.parse(responseData);
			console.log(parseResponse);
			borders=parseResponse["border"][0];
			
			var map = initialise_map(parseResponse); // Intitialising the map
	  
			var infowindow = new google.maps.InfoWindow();
			
			//Displaying centroid locations			
			display_centroid_locations(parseResponse);
			
			//Showing markers for every image and adding onClick event
			for(i=0;i<parseResponse["images"].length-1;i++)
			{
				urlarray[i]=parseResponse["images"][i]["path"];
				cluster[i]=parseResponse["images"][i]["cluster_number"];
				
				var pos = {lat: parseFloat(parseResponse["images"][i]["coordinates"]["latitude"]), lng: parseFloat(parseResponse["images"][i]["coordinates"]["longitude"])};				
				var url=document.getElementById("url").value;
				var contentString='<img src="'+url+'/'+urlarray[i]+'">';
				
				var markers = new google.maps.Marker(
				{
					position: pos,
					map: map,
					title: contentString,
					icon: pinSymbol(color[cluster[i]])
				});

				google.maps.event.addListener(markers, "click", (function (markers,i) 
				{
					return function() 
					{
						console.log(markers.title);
						infowindow.setContent(markers.title);
						infowindow.open(map,markers);
					}
				})(markers,i));

			}
			//Calling the function to select coordinates for route
			selecting_coordinates_for_route(map);
		}
	}

}

function heatmap() 
{
	document.getElementById("route-selection").className="show";
	
	var url=document.getElementById("url").value;
	url=url+"/map";
	console.log(url);
	
	var responseData="",borders="";
	
	//Sending Http Post
	var reqBody = JSON.stringify(document.getElementById("urlOfFile").value);
	var ajax = createHttpPostRequest(url);
	ajax.send(reqBody);
	
	ajax.onreadystatechange=function()
	{
		if (ajax.readyState==4 && ajax.status==200)
		{
			responseData=ajax.responseText;
			parseResponse = JSON.parse(responseData);
			borders=parseResponse["border"][0];
			
			var map = initialise_map(parseResponse); // Intitialising the map
	
			//Displaying centroid locations			
			display_centroid_locations(parseResponse);

			//Drawing Heatmap
			var heatmapData=[]
			for(i=0;i<parseResponse["images"].length-1;i++)
				heatmapData[i]=new google.maps.LatLng(parseFloat(parseResponse["images"][i]["coordinates"]["latitude"]),parseFloat(parseResponse["images"][i]["coordinates"]["longitude"]));

			var heatmap = new google.maps.visualization.HeatmapLayer({
				data: heatmapData
			});
			heatmap.setMap(map);
			
			//Drawing outline of each cluster
			var border_each_cluster=[];
			border_each_cluster=borders.split("/");
			console.log(border_each_cluster);
			for(i=0;i<border_each_cluster.length;i++)
			{
				var flightPlanCoordinates = [];
				var edge_points=border_each_cluster[i].split(',');
				for(j=0;j<edge_points.length-1;j+=2)
					flightPlanCoordinates[j/2] = {lat: parseFloat(edge_points[j]), lng: parseFloat(edge_points[j+1])};
				var flightPath = new google.maps.Polyline({
					path: flightPlanCoordinates,
					geodesic: true,
					strokeColor: '#000000',
					strokeOpacity: 1.0,
					strokeWeight: 2
				});
				flightPath.setMap(map);
			}
			//Calling the function to select coordinates for route
			selecting_coordinates_for_route(map);
		}
	}
}

function drawRoutes(thelines,map)
{
	console.log(thelines);
	var src_lng=list_of_points[0]['longitude']//Co-ordinates of the source
	var src_lat=list_of_points[0]['latitude'];
	var dest_lng=list_of_points[1]['longitude'];//Co-ordinates of the destination
	var dest_lat=list_of_points[1]['latitude'];
	var flightPlanCordfn=[];//It is an array of array. It Stores the co-ordinates of all the routes.
	var n=thelines.length;
	list_of_points=[];
	for(var lp=0;lp<n;lp++)//Considering one route at a time
	{
		  var flightPlanCoordinates=[];//A 1D array to store one route.
		  for(var i=0;i<thelines[lp].length;i++)
		  {
				const path=google.maps.geometry.encoding.decodePath(thelines[lp][i]);//Decoding the encoded polyline
				for(var x in path)
				{
					  flightPlanCoordinates.push({lat:path[x].lat(),lng:path[x].lng()});//Storing the points obtained by decoding the polylines
				}
		  }

		//Here goes the loop removing
		var dict={};
		var ind1,ind2,lati,longi,flag=0,loop_count=0;
		var s="";
		ind1=-1;
		while(true)//Removing the loops on the route
		{
			flag=0;

			if(loop_count>1000)//A safety measure to restrict infinite loop
			  break;

			for(var x=ind1+1;x<flightPlanCoordinates.length;x++)
			{
				lati=flightPlanCoordinates[x]['lat'];
				longi=flightPlanCoordinates[x]['lng'];
				s="";
				s=s+lati+","+longi;
				if(s in dict)//If coordinate is already available in dictionary then a loop is there
				{
				  ind1=dict[s];
				  ind2=x;
				  flag=1;
				  break;
				}
				else
				{
				  dict[s]=x;
				}
			}

			if(flag==1)
			{
			  flightPlanCoordinates.splice(ind1,ind2-ind1);//removing the loop here
			}
			else//If no loop is there on the route then break the while loop
			  break;

			loop_count++;//Total loop count on the route
		}

		  //Storing the route after removing the loops
		flightPlanCordfn.push(flightPlanCoordinates);
	}
	var flightPath = [];
	var clr=["#FF0000","#030894","#000000","#006312","#34e2eb","#9914ff"];//Red,Blue,Black,Green,Orange,Violet
	n=flightPlanCordfn.length;
	for(var i=0;i<n;i++)
	{
	  //Drawing the routes on the map
	  flightPath.push(new google.maps.Polyline({
		map:map,
		path: flightPlanCordfn[i],
		geodesic: true,
		strokeColor: clr[i],
		strokeOpacity: 1,
		strokeWeight: 5
	  }));
	}
//______________

//Distance of a route through a cluster calculation section start

	n=flightPlanCordfn.length;//No. of routes
	var x1,x2,y1,y2,xsrc,ysrc,rad,m,f,A,B,C,x,y,root,checkX1,checkX2,checkY1,checkY2;
	var dist=new Array(n);
	var distances_of_path=new Array(n);
	var intersectPts=new Array(n);
	for(var i=0;i<n;i++)
	{
		dist[i]=new Array(noCluster);
		intersectPts[i]=new Array(noCluster);
		for(var k=0;k<noCluster;k++)
		{
			intersectPts[i][k]=[];
		}

		var len_i_th_route=flightPlanCordfn[i].length;
		distances_of_path[i]=0;
		for(var j=1;j<len_i_th_route;j++)
		{
			//Taking two consecutive points
			x1=flightPlanCordfn[i][j-1]['lng'];
			x2=flightPlanCordfn[i][j]['lng'];
			y1=flightPlanCordfn[i][j-1]['lat'];
			y2=flightPlanCordfn[i][j]['lat'];
			distances_of_path[i]+=haversine(y1,x1,y2,x2);

			checkX1=Math.min(x1,x2);
			checkX2=Math.max(x1,x2);
			checkY1=Math.min(y1,y2);
			checkY2=Math.max(y1,y2);


			if(x1!=x2)
			{
				m=(y1-y2)/(x1-x2);
				f=y1-(x1*m);
			}

			for(var k=0;k<noCluster;k++)
			{ //Solving the equation of a straight line and cluster circle to obtain intersecting points

				xsrc=centroidsData[k][0];
				ysrc=centroidsData[k][1];
				rad=radius[k];
				

				if(x1!=x2)
				{
					A=(m*m+1);
					B=(2*m*f-2*xsrc-2*ysrc*m);
					C=(xsrc*xsrc+ysrc*ysrc+f*f-rad*rad-2*ysrc*f);
					root=B*B-4*A*C;

					if(root>=0 && A!=0)
					{
						x=(-B+Math.sqrt(root))/(2*A);
						y=m*x+f;
						

						if((checkX1<=x && x<=checkX2) && (checkY1<=y && y<=checkY2))
						{
							intersectPts[i][k].push({lng:x,lat:y,ind:j});
						}

						x=(-B-Math.sqrt(root))/(2*A);
						y=m*x+f;
						

						if((checkX1<=x && x<=checkX2) && (checkY1<=y && y<=checkY2))
						{
							intersectPts[i][k].push({lng:x,lat:y,ind:j});
						}
					}
				}
				else
				{
					x=x1;
					y=ysrc+Math.sqrt(rad*rad-((x1-xsrc)*(x1-xsrc)));


					if((checkX1<=x && x<=checkX2) && (checkY1<=y && y<=checkY2))
					{
						intersectPts[i][k].push({lng:x,lat:y,ind:j});
					}

					y=ysrc-Math.sqrt(rad*rad-((x1-xsrc)*(x1-xsrc)));

					if((checkX1<=x && x<=checkX2) && (checkY1<=y && y<=checkY2))
					{
						intersectPts[i][k].push({lng:x,lat:y,ind:j});
					}
				}
			}
		}

		for(var k=0;k<noCluster;k++)
		{ //For each of the cluster calculating distance between two intersecting points

			dist[i][k]=0;
			if(intersectPts[i][k].length!=0)
			{
				var len_intersectPts=intersectPts[i][k].length;
				for(var l=1;l<len_intersectPts;l+=2)
				{
					var st=intersectPts[i][k][l-1]['ind'];
					var end=intersectPts[i][k][l]['ind'];
					dist[i][k]+=euclidean(intersectPts[i][k][l-1]['lng'],intersectPts[i][k][l-1]['lat'],flightPlanCordfn[i][st]['lng'],flightPlanCordfn[i][st]['lat']);

					for(var itr=st+1;itr<end;itr++)
					  dist[i][k]+=euclidean(flightPlanCordfn[i][itr]['lng'],flightPlanCordfn[i][itr]['lat'],flightPlanCordfn[i][itr-1]['lng'],flightPlanCordfn[i][itr-1]['lat']);

					dist[i][k]+=euclidean(intersectPts[i][k][l]['lng'],intersectPts[i][k][l]['lat'],flightPlanCordfn[i][end-1]['lng'],flightPlanCordfn[i][end-1]['lat']);
				}

				if(len_intersectPts==1)//If only one intersecting point then either the source is situated within
				{                      //the cluster or the destination is situated within the cluster.

					xsrc=centroidsData[k][0];
					ysrc=centroidsData[k][1];
					rad=radius[k];

					x1=flightPlanCordfn[i][0]['lng'];
					y1=flightPlanCordfn[i][0]['lat'];

					if ((x1-xsrc)*(x1-xsrc)+(y1-ysrc)*(y1-ysrc)-rad*rad<=0)//Checking if the source is situated within the cluster using equation of circles
						dist[i][k]+=euclidean(flightPlanCordfn[i][0]['lng'],flightPlanCordfn[i][0]['lat'],intersectPts[i][k][len_intersectPts-1]['lng'],intersectPts[i][k][len_intersectPts-1]['lat']);
					else
						dist[i][k]+=euclidean(flightPlanCordfn[i][len_i_th_route-1]['lng'],flightPlanCordfn[i][len_i_th_route-1]['lat'],intersectPts[i][k][len_intersectPts-1]['lng'],intersectPts[i][k][len_intersectPts-1]['lat']);
				}
			}

		}
	}

//Distance of a route through a cluster calculation section end


//Cost calculation section start

	var cost=new Array(n);
	var eachRouteParam=new Array(n);//Concatenating the parameters considered for cost calculation. It has not been used though.
	var eachRouteTotalDist;
	var eachRouteTotalClusPts;
	var min;
	var minIndex;


	for(var i=0;i<n;i++)//For each route
	{
		cost[i]=0;
		eachRouteTotalDist=0;
		eachRouteTotalClusPts=0;
		for(var k=0;k<noCluster;k++)
		{
			if(dist[i][k]!=0)
			{
				cost[i]+=(dist[i][k]*pointsInEachCluster[k]);
				eachRouteTotalDist+=dist[i][k];
				eachRouteTotalClusPts+=pointsInEachCluster[k];
			}
		}

		eachRouteParam[i]=new Array(eachRouteTotalDist,eachRouteTotalClusPts);

		//Calculating the minimum cost route.
		if(i==0)
		{
			min=cost[i];
			minIndex=i;
		}
		else
		{
			if(min>cost[i])
			{
				min=cost[i];
				minIndex=i;
			}
		}
	}
	var color=["Red","Blue","Black","Green","Orange","Violet"];
	document.getElementById("cost").className="show";
	document.getElementById("route-selection").className="hide";
	for(var i=0;i<n;i++)
	{
	  document.getElementById("cost").innerHTML+=("cost of route "+color[i]+": "+cost[i]+"<br>");
	  document.getElementById("cost").innerHTML+=("distance of route "+color[i]+": "+(distances_of_path[i])+" km<br>");
	}
//Cost calculation section end
}
