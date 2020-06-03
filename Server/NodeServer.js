var express= require('express');
var formidable = require('formidable');
var path = require('path');
const app = express();
const cors=require('cors');
var fs =require('fs');
app.use(express.static(__dirname + 'public'));
app.use(express.static('public'))
app.use('/files', express.static(__dirname + '/files'));
app.use('/icon', express.static(__dirname + '/icon'));

var msg="";
var corsOptions = 
{
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));


app.post('/submit', (req, res) => 
{
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
      {
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



app.post('/marker', (req, res) => 
{
  var clientData="";
  req.on('data', function (chunk) 
  {
    clientData+=chunk;
  });
  req.on('end',function()
  {
    console.log(JSON.parse(clientData));

    const path = require('path')
    const {spawn} = require('child_process')

    function runScript()
    {
      return spawn('python',["./code/extractimages.py",clientData]);
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

  })

});

app.listen(3000,()=>
{
  console.log('Server Running at port 3000');
});