var list_of_points=[];
function placeMarker() 
{	
	var url=document.getElementById("url").value;
	url=url+"/map";
	console.log("URL called : " + url);
	
	var urlarray=[],cluster=[],parseResponse="",responseData="";
	var color = ["#FF0000","#030894","#006312","#34e2eb","#00FF00","#FFD700","#FF69B4","#FFA07A","#800000","#808000","#CD853F","#FFFFFF","#00FF7F","#C0C0C0","#F4A460","#800080","#F0E68C","#B22222","#008080","#8A2BE2"]; //Red,Blue,Green,Orange,Lime,Gold,Pink,LightSalmon,Maroon,Olive,Peru,White,SpringGreen,Silver,Sandy Brown,Purple,Khaki,FireBrick,Teal,BlueViolet (Total 20)
	
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
					})(markers,i)
				);

			}
			
			//Calling the function to select coordinates for route
			var markers = selecting_coordinates_for_route(map);
			
			activateButtons();
			setEventListenerRouteSelection(parseResponse, map, markers);
		}
	}

}

function activateButtons()
{
	list_of_points=[];
	
	document.getElementById("route-selection").className="show";
	document.getElementById("clear-selection").className="hide";
	document.getElementById("cost").innerHTML="";
}

function clearPolyLines(allPolyLines, markers)
{
	activateButtons();
	for(var i=0;i<allPolyLines.length;i++)
		allPolyLines[i].setMap(null);
	for(var i=0;i<markers.length;i++)
		markers[i].setMap(null);
}

function heatmap() 
{	
	
	var url=document.getElementById("url").value;
	url=url+"/map";
	console.log("URL called : " + url);
	
	var responseData="";
	
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

			var map = initialise_map(parseResponse); // Intitialising the map
	
			//Displaying centroid locations			
			display_centroid_locations(parseResponse);

			//Drawing Heatmap
			var heatmapData=[];
			for(i=0;i<parseResponse["images"].length-1;i++)
				heatmapData[i]=new google.maps.LatLng(parseFloat(parseResponse["images"][i]["coordinates"]["latitude"]),parseFloat(parseResponse["images"][i]["coordinates"]["longitude"]));

			var heatmap = new google.maps.visualization.HeatmapLayer({
				data: heatmapData
			});
			heatmap.setMap(map);
			
			//Drawing outline of each cluster
			var border_each_cluster=[];
			border_each_cluster=parseResponse["border"][0];
			for(i=0;i<border_each_cluster.length;i++)
			{
				var flightPlanCoordinates = [];
				for(j=0;j<border_each_cluster[i].length;j++)
					flightPlanCoordinates.push({lat: parseFloat(border_each_cluster[i][j][0]), lng: parseFloat(border_each_cluster[i][j][1])});
				var flightPath = new google.maps.Polyline({
					path: flightPlanCoordinates,
					geodesic: true,
					strokeColor: '#000000',
					strokeOpacity: 1.0,
					strokeWeight: 2
				});
				flightPath.setMap(map);
			}
			
			var markers = selecting_coordinates_for_route(map);
			//Calling the function to select coordinates for route
			
			activateButtons();
			setEventListenerRouteSelection(parseResponse, map, markers);
		}
	}
}
function setEventListenerRouteSelection(parseResponse, map, markers)
{
	
	document.getElementById("route-selection").replaceWith(document.getElementById("route-selection").cloneNode(true));
	document.getElementById("route-selection").addEventListener("click", function(){
		generateRoutes(parseResponse, map, markers);
		}
	);
}
function selecting_coordinates_for_route(map)
{
	var markers=[];
	//Adding Code for selecting coordinates for route
	var route=[],no_points=0;
	var latlngbounds = new google.maps.LatLngBounds();
	google.maps.event.addListener(map, 'click', function (e) {
			list_of_points.push({"latitude":e.latLng.lat(),"longitude":e.latLng.lng()});
			var location = e.latLng;
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
			}
			marker.setMap(map);
			markers.push(marker);
		},{once:true} //So that event listener does not get added again
	);
	return markers;
}

function generateRoutes(initial_data, map, markers)
{
	console.log("Origin and Destination");
	console.log(list_of_points);
	
	var url=document.getElementById("url").value;
	url=url+"/GetRoute";
	console.log("URL called : " + url);
	
	//Sending Http Post
	var reqBody = JSON.stringify(list_of_points);
	var ajax = createHttpPostRequest(url);
	ajax.send(reqBody);
	
	var responseData="";
	ajax.onreadystatechange=function()
	{
		if (ajax.readyState==4 && ajax.status==200)
		{
			responseData=ajax.responseText;
			all_routes = JSON.parse(responseData);
			drawRoutes(initial_data, all_routes, map, markers);
		}
	}
}

function drawRoutes(initial_data, thelines, map, markers)
{
//__________________________________Initialisation_____________________
	var boundaryData=initial_data["border"][0];
	var noCluster= boundaryData.length;
	var src_lng=list_of_points[0]['longitude'], src_lat=list_of_points[0]['latitude'];//Co-ordinates of the source
	var dest_lng=list_of_points[1]['longitude'], dest_lat=list_of_points[1]['latitude'];//Co-ordinates of the destination
	var flightPlanCordfn=[];//It is an array of array. It Stores the co-ordinates of all the routes.
	
	var centroidsData = [], clusterData = [], pointsClusterWise=new Array(noCluster), pointsInEachCluster=new Array(noCluster);
	
	for(i=0;i<initial_data["images"].length-1;i++)
		clusterData.push(initial_data["images"][i]);
	for (i in initial_data["areas"])
		centroidsData.push(initial_data["areas"][i]["coordinates"]);
	
	for(var i=0;i<noCluster;i++)
		pointsClusterWise[i]=[];
	for(var i=0;i<clusterData.length;i++)
		pointsClusterWise[clusterData[i]['cluster_number']].push({lng:clusterData[i]['coordinates']['longitude'],lat:clusterData[i]['coordinates']['latitude']});

	for(var i=0;i<noCluster;i++)
		pointsInEachCluster[i]=pointsClusterWise[i].length;
//__________________________________Initialisation End_____________________

	
//Remove Loops
	flightPlanCordfn = loop_removing(thelines);
	console.log("Coordinates of all the routes ")
	console.log(flightPlanCordfn);

//Draw All the routes
	var allPolyLines = visualise_routes(map, flightPlanCordfn);

//Distance of a route through a cluster
	var response = calculate_distances(flightPlanCordfn,boundaryData);
	
	var distance_travelled_inside_cluster=response[0]; //Total distance travelled within clusters
	var distances_of_path= response[1]; //Total distance travelled
	var intersectPts=response[2]; //Intersection points of each route with all the clusters

	console.log("Distance travelled in each cluster");
	console.log(distance_travelled_inside_cluster);
	console.log("Total distance travelled in each routes");
	console.log(distances_of_path);
	console.log("Intersection Points");
	console.log(intersectPts);

//Cost calculation
	var cost = calculate_cost(distance_travelled_inside_cluster, pointsInEachCluster);
	
//Displaying Results
	var color=["Red","Blue","Black","Green","Orange","Violet"];
	
	document.getElementById("route-selection").className="hide";
	document.getElementById("cost").className="show";
	document.getElementById("clear-selection").className="show";
	
	document.getElementById("clear-selection").addEventListener("click", function(){
		clearPolyLines(allPolyLines, markers);
		},{once:true} //So that event listener does not get added again
	); 
	for(var i=0;i<n;i++)
	{
	  document.getElementById("cost").innerHTML+=("cost of route "+color[i]+": "+cost[i]+"<br>");
	  document.getElementById("cost").innerHTML+=("distance of route "+color[i]+": "+(distances_of_path[i])+" km<br>");
	}

}

function calculate_cost(dist, pointsInEachCluster)
{
	var eachRouteTotalDist;
	var eachRouteTotalClusPts;
	var min=Number.MAX_SAFE_INTEGER, minIndex=-1;
	var noCluster = pointsInEachCluster.length;
	var n = dist.length;
	var cost=new Array(n);
	for(var i=0;i<n;i++)//For each route
	{
		cost[i]=0;
		
		eachRouteTotalDist=0;
		eachRouteTotalClusPts=0;
		for(var k=0;k<noCluster;k++)
		{
			if(dist[i][k]!=0)
			{
				//cost[i]+=(dist[i][k]*pointsInEachCluster[k]);
				cost[i]+=dist[i][k];
				eachRouteTotalDist+=dist[i][k];
				eachRouteTotalClusPts+=pointsInEachCluster[k];
			}
		}

		//Calculating the minimum cost route.
		if(min>cost[i])
		{
			min=cost[i];
			minIndex=i;
		}
	}
	
	return cost;
}


function calculate_distances(flightPlanCordfn,boundaryData)
{
	var n = flightPlanCordfn.length;
	var dist=new Array(n), distances_of_path=new Array(n), intersectPts=new Array(n);
	var noCluster = boundaryData.length;
	
	var all_route_intersections_with_clusters = new Array(n);
	for(var i=0;i<n;i++)
		all_route_intersections_with_clusters[i] = [];
	
	var polygon=[];
	for(var k=0;k<noCluster;k++)
		polygon.push(turf.polygon([boundaryData[k]]));

	for(var i=0;i<n;i++)
	{
		var coordinates_of_intersection_in_each_cluster=new Array(n);
		for(var j=0;j<noCluster;j++)
			coordinates_of_intersection_in_each_cluster[j]=[];
		for(var j=1;j<flightPlanCordfn[i].length;j++)
		{		
			
			var line = turf.lineString([[flightPlanCordfn[i][j-1]['lat'],flightPlanCordfn[i][j-1]['lng']], [flightPlanCordfn[i][j]['lat'],flightPlanCordfn[i][j]['lng']]]);
			for(var k=0;k<noCluster;k++)
			{
				var intersects = turf.lineIntersect(polygon[k],line);
				if(intersects["features"].length>0)
				{
				//Instead of getting the exact interserction point, we take the source point of the straight line because the difference between them is minimal. Also, the source point needs to be present in our route array  so that it can be used to calculate the distance between the source point (entry point in the cluster) and the destination point (exit point in the cluster).
					//coordinates_of_intersection_in_each_cluster[k].push(intersects["features"][0]["geometry"]["coordinates"]);
					coordinates_of_intersection_in_each_cluster[k].push([flightPlanCordfn[i][j-1]['lat'], flightPlanCordfn[i][j-1]['lng']]);
				}
			}
		}
		
	//Appending the intersection points of a route with all the clusters
		all_route_intersections_with_clusters[i] = coordinates_of_intersection_in_each_cluster;
	}
	
	for(var i=0;i<n;i++)
	{
		dist[i]=new Array(noCluster);
		for(var j=0;j<noCluster;j++)
		{
			if(all_route_intersections_with_clusters[i][j].length==0)
				dist[i][j] = 0;
			else if(all_route_intersections_with_clusters[i][j].length>=2) //In case of more than 2 points of intersection, we ate taking the distance between the initial and final point only.
			{
				dist[i][j] = calculate_distance_between_two_points_in_a_route(flightPlanCordfn[i],[all_route_intersections_with_clusters[i][j][0][0], all_route_intersections_with_clusters[i][j][0][1]], [all_route_intersections_with_clusters[i][j][all_route_intersections_with_clusters[i][j].length-1][0], all_route_intersections_with_clusters[i][j][all_route_intersections_with_clusters[i][j].length-1][1]]);
			}
		}
		
		//Calculating total distance of a route	--> source is first point in the route array, destination is the last point in the route array
		distances_of_path[i] = calculate_distance_between_two_points_in_a_route(flightPlanCordfn[i], [flightPlanCordfn[i][0]['lat'],flightPlanCordfn[i][0]['lng']], [flightPlanCordfn[i][flightPlanCordfn[i].length-1]['lat'],flightPlanCordfn[i][flightPlanCordfn[i].length-1]['lng']]);
			
	}
	return [dist,distances_of_path,all_route_intersections_with_clusters];
	
}

function calculate_distance_between_two_points_in_a_route(route,source,destination)
{
//Flag variable used to indicate we have reached the source point in the route array
	var flag=0, n=route.length, total_distance=0;

	for(var j=1;j<n;j++)
	{
		if(route[j-1]['lat'] == source[0] && route[j-1]['lng'] == source[1])
			flag=1;

		if(flag)
			total_distance+=haversine(route[j-1]['lat'],route[j-1]['lng'],route[j]['lat'],route[j]['lng']);
		
	//We break out of the loop once we reach our destination in the route array
		if(route[j]['lat'] == destination[0] && route[j]['lng'] == destination[1])
			break;
	}
	return total_distance;
}

function loop_removing(thelines)
{
	var n = thelines.length, flightPlanCordfn = [];
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
	return flightPlanCordfn;
}

function visualise_routes(map, flightPlanCordfn)
{
	var flightPath = [],allPolyLines=[];
	var clr=["#FF0000","#030894","#000000","#006312","#34e2eb","#9914ff"];//Red,Blue,Black,Green,Orange,Violet
	n=flightPlanCordfn.length;
	for(var i=0;i<n;i++)
	{
	//Drawing the routes on the map
		var flightPath = new google.maps.Polyline({
		map:map,
		path: flightPlanCordfn[i],
		geodesic: true,
		strokeColor: clr[i],
		strokeOpacity: 1,
		strokeWeight: 5
	  });
	  flightPath.setMap(map);
	  allPolyLines.push(flightPath);
	}
	return allPolyLines;
}

function display_centroid_locations(parseResponse)
{
	var FloodCenter="";
	for (i in parseResponse["areas"])
		FloodCenter+=parseResponse["areas"][i]["location"]+",";
	FloodCenter = FloodCenter.substring(0, FloodCenter.length - 1);
	document.getElementById("FloodCenter").innerHTML="Areas Affected: "+FloodCenter;
}

function euclidean(lon1,lat1,lon2,lat2) {
	var ret=Math.sqrt((lon1-lon2)*(lon1-lon2)+(lat1-lat2)*(lat1-lat2));
	return ret;
}

function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}
//Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2-lat1);
  var dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return earthRadiusKm * c;
}

function uploadFile() 
{
	var url=document.getElementById("url").value;
	url=url+"/submit"
	console.log("URL called : " + url);
	
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