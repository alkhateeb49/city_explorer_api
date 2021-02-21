'use strict';


// reqiure statment import packge 
let express = require('express');

// init and config
let app = express();
// for .env file 
require('dotenv').config();

const cors = require('cors');
app.use(cors());

// gor var from .env
const PORT = process.env.PORT;

// routes - endpoints
app.get('/location',handlelocation);
app.get('/weather',handleweather);

// handle function
function handlelocation(req,res){
    let searchQuery = req.query.city;
    let locationObject = getLocationData(searchQuery);
    res.status(200).send(locationObject);
}

function handleweather(req,res){
    let searchQuery = req.query.city;
    let weatherObject = getWeatherData(searchQuery);
    res.status(200).send(weatherObject);
}




//handle data for function
function getLocationData(searchQuery){
    //get array from json
    let locationData = require('./data/location.json');
    //get values from objects
    let longitude = locationData[0].lon;
    let latitude = locationData[0].lat;
    let displayName = locationData[0].display_name;
    let responseObject =new CityLocation(searchQuery,displayName,latitude,longitude);
    return responseObject;
}


function getWeatherData(searchQuery){
    // get data array from json 
    let weatherData = require('./data/weather.json'); 
    // get value from array 
    let weatherArray = [];
    for(let i = 0 ; i <weatherData.data.length; i++ ){
        let weatherDesc = weatherData.data[i].weather['description'];
        let time = weatherData.data[i].datetime;
        time = time.replace("-","/");
        let date = new Date(time).toString().slice(" ",16);
                
        let responseObject = new Cityweather(weatherDesc, date);
        weatherArray.push(responseObject);
    }
    return weatherArray;  
}


//constructors
function CityLocation(searchQuery,displayName,lat,lon){
this.search_query=searchQuery;
this.formatted_query=displayName;
this.latitude=lat;
this.longitude=lon;
}
function Cityweather(forecast,time){
    this.forecast=forecast;
    this.time=time;
}


app.listen(PORT, ()=>{
    console.log('the app is listening to '+ PORT);
});