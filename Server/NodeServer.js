var express= require('express');
var formidable = require('formidable');
var path = require('path');
const app = express();
const cors=require('cors');
var fs =require('fs');
var api_key="AIzaSyAQCOr2z_gBhaKfuniDbEJI9DNleVDFbdk"
var bing_api_key="AtoecFuQmBsA4-YGrKu_-R4ePtIdK92ljEwh4lwy8mNaIVicq24DTGxf3uH4p5D9";
app.use(express.static(__dirname + 'public'));
app.use(express.static('public'))
app.use('/files', express.static(__dirname + '/files'));
app.use('/icon', express.static(__dirname + '/icon'));

var msg="";
var allines=[];
var corsOptions = 
{
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));


app.post('/submit', (req, res) => 
{
  var ip = req.connection.remoteAddress;
  console.log("IP : "+ip);
  var form = new formidable.IncomingForm();   
  form.parse(req, function(err, fields, file)
  {
    var path= __dirname +"/files/"+fields['loc']+"/";
    var fs = require("fs");
    while (!fs.existsSync(path)) 
    {
      console.log(path);var mkdirp=require("mkdirp-sync");
      fs.mkdirSync(path, { recursive: true },(err) => 
      {});
    }
    fs.rename(file["file1"]["path"], "files/"+fields['loc']+"/"+file["file1"]["name"],function(err)
    {
      if(err)
        throw err;    
      console.log('Upload Successful');

      const path = require('path');
      const {spawn} = require('child_process');
      function runScript()
      {console.log("files/"+fields['loc']+"/"+file["file1"]["name"]);
        return spawn('python',["./code/predict.py", "files/"+fields['loc']+"/"+file["file1"]["name"]]);
      }
	  
      const subprocess = runScript()
      subprocess.stdout.on('data', (data) => 
      {
        console.log(`data:${data}`);
        res.send(data.toString());
      });
      subprocess.stderr.on('data', (data) => 
      {
        console.log(`error:${data}`);
      });
      subprocess.stderr.on('close', () => 
      {
        console.log("Closed");
      });

    } );

  });

});



app.post('/map', (req, res) => 
{
  var clientData="";
  req.on('data', function (chunk) 
  {
    clientData+=chunk;
  });
  req.on('end',function()
  {
    const path = require('path');
    const {spawn} = require('child_process');

    function runScript()
    {
      return spawn('python',["./code/GeoLocation.py",clientData]);
    }
    const subprocess = runScript()
    subprocess.stdout.on('data', (data) => 
    {
    console.log(`data:${data}`);
      try{
      res.send(data.toString());
      }
      catch(err){}
    });
    subprocess.stderr.on('data', (data) => 
    {
      console.log(`error:${data}`);
    });
    subprocess.stderr.on('close', () => 
    {
      console.log("Closed");
    });
  });

});

app.post('/GetRoute', (req, res) => 
{
	var clientData="";
	req.on('data', function (chunk) 
	{
		clientData+=chunk;
	});
	req.on('end',function()
	{
		console.log(clientData);
		const func = async function()
		{
			await generateRoutes(clientData);
			async function generateRoutes(clientData)
			{
				var routes="",waypoints=""; 
				var waypts=[]
				var parseRequest = JSON.parse(clientData);
				var base_url="https://maps.googleapis.com/maps/api/directions/json?";
				var paramString = "origin="+parseRequest[0]["latitude"] + "," + parseRequest[0]["longitude"]+"&destination="+parseRequest[1]["latitude"] + "," + parseRequest[1]["longitude"];
				var url=base_url;
				url += paramString;
				//url=url+"&key="+api_key;
				url=url+"&key="+api_key;
				var axios = require('axios');
				console.log(url);
				await axios.get(url).then(async (data1) =>
				{
					response=data1.data;
					if(response!=null)
					{
						data=response;
						console.log(data);
						console.log(data['routes'][0]['legs']);
						stcor=data['routes'][0]['legs'][0]['start_location'];//Source co-ordinate

						var lines=[];
						for(var key in data['routes'][0]['legs'])
						{
							for(var step_key in data['routes'][0]['legs'][key]['steps'])
							{
								lines.push(data['routes'][0]['legs'][key]['steps'][step_key]['polyline']['points']);//Storing all the polylines obtained from the API call
																			  //in an array.

								endcor=data['routes'][0]['legs'][key]['steps'][step_key]['end_location'];//Destination co-ordinate
							}
						}
						allines.push(lines);
						slat=parseRequest[0]["latitude"];
						slng=parseRequest[0]["longitude"];

						endlat=parseRequest[1]["latitude"];
						endlng=parseRequest[1]["longitude"];


						s=((slat-endlat)/(slng-endlng));// Slope
						xc=(slng+endlng)/2;// Centre of the ellipse x-cord
						yc=(slat+endlat)/2;// Centre of the ellipse y-cord


						//Tranformed source co-ordinate
						sx_tranformed=((slng-xc)+(slat-yc)*s)/(Math.sqrt(1+s*s));
						sy_tranformed=((slat-yc)-(slng-xc)*s)/(Math.sqrt(1+s*s));


						//Transformed destination co-ordinate
						dx_tranformed=((endlng-xc)+(endlat-yc)*s)/(Math.sqrt(1+s*s));
						dy_tranformed=((endlat-yc)-(endlng-xc)*s)/(Math.sqrt(1+s*s));


						a=Math.sqrt(((sx_tranformed-dx_tranformed)*(sx_tranformed-dx_tranformed))+((sy_tranformed-dy_tranformed)*(sy_tranformed-dy_tranformed)));// Major Axis
						b=(2/3)*a;// Minor Axis


						mul=1000000;//Needed for generating random waypoints
						sd=0;       //Needed for generating random waypoints

						latitude=[]; //For storing latitude & longitude of the waypoints
						longitude=[];

						for(no=0;no<3;no++)
						{
							waypts_lat=[];
							waypts_lng=[];
							for(i=1;i<4;i++)
							{ //Creating a random way point
						
								//mt_srand(27*i+sd);//Giving a seed value
						
								if(sx_tranformed<dx_tranformed)
								{
									x=(Math.random()*(dx_tranformed*mul-sx_tranformed*mul)+sx_tranformed*mul)/mul;
									console.log("Random point "+x);
								}
								else
								{
									x=(Math.random()*(sx_tranformed*mul-dx_tranformed*mul)+dx_tranformed*mul)/mul;
									console.log("Random point "+x);
								}

								y_upper=b*(Math.sqrt(1-((x*x)/(a*a))));
								y_lower=(-1)*y_upper;

								y=Math.random(y_lower*mul,y_upper*mul)/mul;
						
								x_tranform=(((x)-(y)*s)/(Math.sqrt(1+s*s)))+xc;
								y_tranform=(((y)+(x)*s)/(Math.sqrt(1+s*s)))+yc;
							
								waypts_lng.push(x_tranform);
								waypts_lat.push(y_tranform);
								console.log("Inside Loop " + waypts_lat);
								console.log("Inside Loop " +waypts_lng);
							}

							sd+=(29+(no*20));
							url=base_url;
							url+=paramString;
							console.log(waypts_lat);
							console.log(waypts_lng);
							url=url+"&waypoints=optimize:true%7C"+waypts_lat[0]+"%2C"+waypts_lng[0]+"%7C"+waypts_lat[1]+"%2C"+waypts_lng[1]+"%7C"+waypts_lat[2]+"%2C"+waypts_lng[2];
							url=url+"&key="+api_key;
							await axios.get(url).then(async (data1) =>
							{
									response=data1.data;
									//Requesting the route from source to destination with the waypoints
								
									for(var key in waypts_lng)
									{
										longitude.push(waypts_lng[key]);
									}

									for(var key in waypts_lat)
									{
										latitude.push(waypts_lat[key]);
									}


									if(response!=null)
									{
										data=response;
									
										if(data['status']=='OK')
										{
											lines=[];
											for(var key in data['routes'][0]['legs'])
											{
										
												for(var step_key in data['routes'][0]['legs'][key]['steps'])
												{
													lines.push(data['routes'][0]['legs'][key]['steps'][step_key]['polyline']['points']);//Storing all the polylines obtained from the API call
																									//in an array.
												}
											}
								
											allines.push(lines);
										}
										else
										{
											no--; //If no route found with the specified waypoints. Ignore them
											//and generate another set of waypoints.
										}
									}
								
							});
						}
					}
				});					
							
			}
			return allines;
		}
		func().then((response) =>
		{
			res.send(response);
			console.log("hi");
			allines=[];
		});
	});
});

app.listen(3000,()=>
{
  console.log('Server Running at port 3000');
});