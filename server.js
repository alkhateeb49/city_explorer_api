'use strict';


// reqiure statment import packge 
let express = require('express');

// init and config
let app = express();
// for .env file 
require('dotenv').config();

const cors = require('cors');
const superagent = require('superagent');

let pg = require('pg');
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,ssl: { rejectUnauthorized: false } });


app.use(cors());

// gor var from .env
const PORT = process.env.PORT;

// routes - endpoints
app.get('/location', handlelocation);
app.get('/weather', handleweather);
app.get('/parks', handleparks);
app.get('/movies', handlemovies);
app.get('/yelp', handleyelp);

// handle function
function handlelocation(req, res) {
  try {
    let searchQuery = req.query.city;
    getLocationData(searchQuery, res);
  } catch (error) {
    res.status(500).send('Sorry, something went wron' + error);
  }
}

function handleweather(req, res) {
  try {
    let searchQuery = req.query.search_query;
    let longitude = req.query.longitude;
    let latitude = req.query.latitude;
    getWeatherData(searchQuery, longitude, latitude, res);
  } catch (error) {
    res.status(500).send('Sorry, something went wron' + error);
  }
}

function handleparks(req, res) {
  try {
    let searchQuery = req.query.search_query;
    getParksData(searchQuery, res);
  } catch (error) {
    res.status(500).send('Sorry, something went wron' + error);
  }
}
function handlemovies(req, res) {
  try {
    let searchQuery = req.query.search_query;
    getMoviesData(searchQuery, res);
  } catch (error) {
    res.status(500).send('Sorry, something went wron' + error);
  }
}
function handleyelp(req, res) {
  try {
    let searchQuery = req.query.search_query;
    getYelpData(searchQuery,res);
  } catch (error) {
    res.status(500).send('Sorry, something went wron' + error);
  }
}



function checkExist(searchQuery, res) {

  let sqlQuery = "SELECT * FROM citylocation WHERE cname = ($1) ";
  let value = [searchQuery];
  client.query(sqlQuery, value).then(data => {

    if (data.rows.length === 0) {
      const query = {
        key: process.env.GEOCODE_API_KEY,
        q: searchQuery,
        limit: 1,
        format: 'json'
      }


      let url = `https://us1.locationiq.com/v1/search.php`;
      superagent.get(url).query(query).then(data => {
        // console.log(data.body[0].lat);
        try {
          let longitude = data.body[0].lon;
          let latitude = data.body[0].lat;
          let displayName = data.body[0].display_name;
          let sqlQuery = `insert into citylocation(cname,display_name, lat, lon) values ($1,$2,$3,$4)returning *`;
          let value = [searchQuery, displayName, latitude, longitude];
          client.query(sqlQuery, value).then(data => {
            console.log('data returned back from db ', data);
          });
          let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
          res.status(200).send(responseObject);
        } catch (error) {
          res.status(500).send(error);
        }

      }).catch(error => {
        res.status(500).send("Cannot connect with the api " + error);

      });
    }
    else {
      let responseObject = new CityLocation(data.rows[0].cname, data.rows[0].display_name, data.rows[0].lat, data.rows[0].lon);
      res.status(200).send(responseObject);
    }

  }).catch(error => {
    console.log('canoot data returned back from db in check function ', error);
  });
}



//handle data for function
function getLocationData(searchQuery, res) {
  checkExist(searchQuery, res);

  // const query = {
  //   key: process.env.GEOCODE_API_KEY,
  //   q: searchQuery,
  //   limit: 1,
  //   format: 'json'
  // };
  // let url = 'https://us1.locationiq.com/v1/search.php';
  // superagent.get(url).query(query).then(data => {
  //   try {
  //     let longitude = data.body[0].lon;
  //     let latitude = data.body[0].lat;
  //     let displayName = data.body[0].display_name;

  //     let sqlQuery = `insert into citylocation(cname,lat,long) values ($1,$2,$3)returning*`;
  //     let value = [displayName, latitude, longitude];
  //     client.query(sqlQuery, value).then(data => {
  //       console.log("data inserted" + data);
  //       // res.status(200).send("data inserted",data.text[0].lat);
  //     }).catch(error => {
  //       // console.log("data not inserted"+error);
  //       res.status(500).send("data not inserted", error);
  //     });


  //     let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
  //     res.status(200).send(responseObject);
  //   } catch (error) {
  //     res.status(500).send('Sorry, something went wron' + error);
  //   }

  // }).catch(error => {
  //   res.status(500).send('Sorry, something went wron' + error);
  // });

}


function getWeatherData(searchQuery, longitude, latitude, res) {
  const weatherquery = {
    key: process.env.WEATHER_API_KEY,
    city: searchQuery,
    longitude: longitude,
    latitude: latitude,
    days: 8
  };
  //   let url ='http://api.weatherbit.io/v2.0/current';
  let url = 'http://api.weatherbit.io/v2.0/forecast/daily';
  superagent.get(url).query(weatherquery).then(data => {
    try {
      //   res.status(200).send(data["count"]);
      //   res.status(200).send(JSON.parse(data.text).data[0]);
      //   res.status(200).send(JSON.parse(data.text).data[0].weather.description);
      //   console.log(JSON.parse(data.text).data[0].weather.description);
      let weatherArray = [];
      for (let i = 0; i < 8; i++) {
        let weatherDesc = JSON.parse(data.text).data[i].weather.description;
        let date = JSON.parse(data.text).data[i].datetime;
        let responseObject = new Cityweather(weatherDesc, date);
        weatherArray.push(responseObject);
      }
      res.status(200).send(weatherArray);
      //   console.log(weatherArray);
    } catch (error) {
      res.status(500).send('Sorry, something went wron' + error);
    }

  }).catch(error => {
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
    } catch (error) {
      res.status(500).send("Sorry, something went wrong");
    }
  }).catch((error) => {
    res.status(500).send("Sorry, something went wrong from promise" + error);
  });
}

function getMoviesData(searchQuery, res) {
  let query = {
    api_key: process.env.MOVIE_API_KEY,
    query: searchQuery
  };
  let url = 'https://api.themoviedb.org/3/search/movie';
  superagent.get(url).query(query).then(data => {
    try {
      let arrayOfObjects = [];
      data.body.results.forEach(value => {
        let title =value.title;
        let overview=value.overview;
        let average_votes=value.average_votes;
        let total_votes=value.total_votes;
        let image_url='https://image.tmdb.org/t/p/w500/'+value.poster_path;
        let popularity=value.popularity;
        let released_on=value.released_on;
        let responseObject = new CityMovies(title, overview, average_votes, total_votes, image_url,popularity,released_on);
        arrayOfObjects.push(responseObject);
      });
      res.status(200).send(arrayOfObjects);
    } catch (error) {
      res.status(500).send("Sorry, something went wrong"+error);
    }
  }).catch((error) => {
    res.status(500).send("Sorry, something went wrong from promise" + error);
  });
}
var page = 1;
function getYelpData(searchQuery,res) {
  const pageNum = 20;
  const start = ((page - 1) * pageNum + 1);
  const yelpKey=process.env.YELP_API_KEY;
  let query = {
    location:searchQuery,
    limit:pageNum,
    offset:start
  };
  page++;
  let url = "https://api.yelp.com/v3/businesses/search";
  superagent.get(url).query(query).set('Authorization', `Bearer ${yelpKey}`).then(data => {
    try {
      let arr=[];
      JSON.parse(data.text).businesses.forEach(data=>{
        arr.push(new CityYelp(data.name,data.image_url,data.price,data.rating,data.url));
      });
      res.status(200).send(arr);
    } catch (error) {
      res.status(500).send("Sorry, something went wrong"+error);
    }
  }).catch((error) => {
    res.status(500).send("Sorry, something went wrong from promise" + error);
  });
}



//constructors
function CityLocation(searchQuery, displayName, lat, lon) {
  this.search_query = searchQuery;
  this.formatted_query = displayName;
  this.latitude = lat;
  this.longitude = lon;
}
function Cityweather(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}
function CityParks(name, address, fee, description, url) {
  this.name = name;
  this.address = address;
  this.fee = fee;
  this.description = description;
  this.url = url;
}
function CityYelp(name,image_url,price,rating,url){
  this.name = name;
  this.image_url =image_url ;
  this.price =price ;
  this.rating = rating;
  this.url =url ;
}
function CityMovies(title, overview, average_votes, total_votes, image_url,popularity,released_on){
  this.title = title;
  this.overview =overview ;
  this.average_votes =average_votes ;
  this.total_votes = total_votes;
  this.image_url =image_url ;
  this.popularity =popularity ;
  this.released_on =released_on ;
}


client.connect().then((data) => {
  app.listen(PORT, () => {
    console.log('the app is listening to ' + PORT);
  });
}).catch(error => {
  console.log('error in connect to database ' + error);
});
