'use strict';


// reqiure statment import packge 
let express = require('express');

// init and config
let app = express();
// for .env file 
require('dotenv').config();

const cors = require('cors');
const superagent = require('superagent');




app.use(cors());

// gor var from .env
const PORT = process.env.PORT;

// routes - endpoints
app.get('/location',handlelocation);
app.get('/weather',handleweather);
app.get('/parks',handleparks);

// handle function
function handlelocation(req,res){
  try{
    let searchQuery = req.query.city;
    getLocationData(searchQuery,res);
  }catch(error){
    res.status(500).send('Sorry, something went wron' + error);
  }
}

function handleweather(req,res){
  try{
    let searchQuery = req.query.search_query;
    let longitude =req.query.longitude;
    let latitude = req.query.latitude;
    getWeatherData(searchQuery,longitude,latitude,res);
  }catch(error){
    res.status(500).send('Sorry, something went wron' + error);
  }
}

function handleparks(req,res){
  try{
    let searchQuery = req.query.search_query;
    let longitude =req.query.longitude;
    let latitude = req.query.latitude;
    getParksData(searchQuery,res);
  }catch(error){
    res.status(500).send('Sorry, something went wron' + error);
  }
}




//handle data for function
function getLocationData(searchQuery,res){
  const query ={
    key:process.env.GEOCODE_API_KEY,
    q:searchQuery,
    limit:1,
    format:'json'
  };
  let url='https://us1.locationiq.com/v1/search.php';
  superagent.get(url).query(query).then(data =>{
    try{
      let longitude = data.body[0].lon;
      let latitude = data.body[0].lat;
      let displayName = data.body[0].display_name;
      let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
      res.status(200).send(responseObject);
    }catch(error){
      res.status(500).send('Sorry, something went wron' + error);
    }

  }).catch(error=>{
    res.status(500).send('Sorry, something went wron' + error);
  });

}


function getWeatherData(searchQuery,longitude,latitude,res){
  const weatherquery ={
    key:process.env.WEATHER_API_KEY,
    city:searchQuery,
    longitude:longitude,
    latitude:latitude,
    days:8
  };
//   let url ='http://api.weatherbit.io/v2.0/current';
  let url ='http://api.weatherbit.io/v2.0/forecast/daily';
  superagent.get(url).query(weatherquery).then(data =>{
    try{
    //   res.status(200).send(data["count"]);
    //   res.status(200).send(JSON.parse(data.text).data[0]);
    //   res.status(200).send(JSON.parse(data.text).data[0].weather.description);
    //   console.log(JSON.parse(data.text).data[0].weather.description);
      let weatherArray =[];
      for(let i = 0 ; i <8; i++ ){
      let weatherDesc =JSON.parse(data.text).data[i].weather.description;
      let date = JSON.parse(data.text).data[i].datetime;
      let responseObject = new Cityweather(weatherDesc, date);
      weatherArray.push(responseObject);
      }
      res.status(200).send(weatherArray);
    //   console.log(weatherArray);
    }catch(error){
      res.status(500).send('Sorry, something went wron' + error);
    }

  }).catch(error=>{
    res.status(500).send('Sorry, something went wron' + error);
  });



// // get data array from json 
// let weatherData = require('./data/weather.json'); 
// // get value from array 
// let weatherArray = [];
// for(let i = 0 ; i <weatherData.data.length; i++ ){
//     let weatherDesc = weatherData.data[i].weather['description'];
//     let time = weatherData.data[i].datetime;
//     time = time.replace("-","/");
//     let date = new Date(time).toString().slice(" ",16);
    
//     let responseObject = new Cityweather(weatherDesc, date);
//     weatherArray.push(responseObject);
// }
// return weatherArray;  
}



// function getParksData(searchQuery,longitude,latitude,res){
//   const parkquery ={
//     api_key:process.env.PARKS_API_KEY,
//     q:searchQuery

//   };
//   let url ='https://developer.nps.gov/api/v1/parks';
//   superagent.get(url).query(parkquery).then(data =>{
//     try{
//       res.status(200).send(data);
//     //   let parksArray =[];
//     //   for(let i = 0 ; i <8; i++ ){
//     //     let weatherDesc =JSON.parse(data.text).data[i].weather.description;
//     //     let date = JSON.parse(data.text).data[i].datetime;
//     //     let responseObject = new Cityweather(weatherDesc, date);
//     //     parksArray.push(responseObject);
//     //   }
//     //   res.status(200).send(parksArray);
//     //   console.log(weatherArray);
//     }catch(error){
//       res.status(500).send('Sorry, something went wron' + error);
//     }

// }).catch(error=>{
//     res.status(500).send('Sorry, something went wron' + error);
// });

// }
function getParksData(searchQuery, res) {
  let query = {
    q: searchQuery,
    api_key: process.env.PARKS_API_KEY
  };
  let url = "https://developer.nps.gov/api/v1/parks";
  superagent.get(url).query(query).then((data) => {
    try {
      let arrayOfObjects = [];
      data.body.data.forEach(value => {
        let name = value.fullName;
        let address = value.addresses[0].line1 + " " + value.addresses[0].city + " " + value.addresses[0].stateCode + " " + value.addresses[0].postalCode;
        let fee = value.entranceFees[0].cost;
        let description = value.description;
        let url = value.url;
        let responseObject = new CityParks(name, address, fee, description, url);
        arrayOfObjects.push(responseObject);
      });
      res.status(200).send(arrayOfObjects);
    } catch(error){
      res.status(500).send("Sorry, something went wrong");
    }
  }).catch((error) => {
    res.status(500).send("Sorry, something went wrong from promise" + error);
  });
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
function CityParks(name, address,fee,description, url){
    this.name=name;
    this.address=address;
    this.fee=fee;
    this.description=description;
    this.url=url;
}


app.listen(PORT, ()=>{
    console.log('the app is listening to '+ PORT);
});