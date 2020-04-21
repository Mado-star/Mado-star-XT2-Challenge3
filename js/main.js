// Set api token
mapboxgl.accessToken = 'pk.eyJ1IjoiZGFuaWVsa3JhYWsiLCJhIjoiY2s5NjBzcHd2MDN0MDNmdGMwdnJoYm5wZiJ9.XICOU5BubdDlEw38qa9W5Q';

// api token for openWeatherMap
var openWeatherMapUrl = 'https://api.openweathermap.org/data/2.5/weather';
var openWeatherMapUrlApiKey = '3cf13041c07f9e5d7db02c5851f2decc';

// api token for zomato
var zomatoApiKey = '00ba345ec27f71ca1ae1f1f20902b5a2';
var zomatoUrl = 'https://developers.zomato.com/api/v2.1/'


var temperature = 30;
var wind = 2.0;
var restaurantDataFound = 0;
var numRestaurantsFound = 0;


// Init map
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  /*center: [4.32284, 52.067101],*/
  center: [-73.98529314771758, 40.74191464076671],
  zoom: 11.15
});

function updateWeather(lon, lat) {
    var request = openWeatherMapUrl + '?' + 'appid=' + openWeatherMapUrlApiKey + '&lon=' + lon + '&lat=' + lat;

    console.log(request)

    // Get current weather based on cities' coordinates
    fetch(request)
      .then(function(response) {
        if(!response.ok) throw Error(response.statusText);
        return response.json();
      })
      .then(function(response) {

        /* update weather data in html */

        /* update icon */
        weather_id = response.weather[0].id;
        document.getElementById("weather-icon").innerHTML = '<i class=\"wi wi-owm-' + weather_id + '\"></i>'; 

        temperature = response.main.temp-273.15; // convert to celcius
        wind = response.wind.speed;
        
        document.getElementById('temp-data').innerHTML = temperature.toFixed(0) + 'C'
        document.getElementById('wind-data').innerHTML = wind.toFixed(1) + ' m/s'

        updateAdvice();
      })
      .catch(function (error) {
        console.log('ERROR:', error);
      });
}


function updateRestaurants(lon, lat) {

    var url = zomatoUrl + 'geocode?lat='+ lat + '&lon=' + lon;

    // Create our request constructor with all the parameters we need
    let data = {
        "user-key": zomatoApiKey,
        "Accept": "application/json"
    }
    var request = new Request(url, {
        method: 'GET', 
        /*body: data, */
        headers: data
    });


    // fetch data
    fetch(request)
      .then(function(response) {
        if(!response.ok) throw Error(response.statusText);
        return response.json();
      })
      .then(function(response) { // got valid response
        console.log(response);
        restaurantDataFound = 1;

        /* check if restaurants are near */
        var num_restaurants = response.nearby_restaurants.length;
        numRestaurantsFound = num_restaurants;

        if(num_restaurants == 0) {
            document.getElementById('restaurants').innerHTML = 'No nearby restaurants found.';
            
        }
        else {
            document.getElementById('restaurants').innerHTML = '';

            var len;
            if(num_restaurants > 6) {
                len=6;
            }
            else {
                len=num_restaurants;
            }
            for(var i=0; i<len; i++) {
                document.getElementById('restaurants').innerHTML += '<div><a href="'+ response.nearby_restaurants[i].restaurant.url + '"> <h2>' + response.nearby_restaurants[i].restaurant.name + '</h2></a>' + '<div id=\'restaurant-data-grid\'>  <div> Cuisine </div> <div>'+ response.nearby_restaurants[i].restaurant.cuisines+'</div> <div> Rating </div> <div>' + response.nearby_restaurants[i].restaurant.user_rating.aggregate_rating  + '</div> </div></div>';

/*
                document.getElementById('restaurants').innerHTML += '<a href="'+ response.nearby_restaurants[i].restaurant.url + '"> <h2>' + response.nearby_restaurants[i].restaurant.name + '</h2></a>';


                document.getElementById('restaurants').innerHTML += '<div id=\'restaurant-data-grid\'>  <div> Cuisine </div> <div>'+ response.nearby_restaurants[i].restaurant.cuisines+'</div> <div> Rating </div> <div>' + response.nearby_restaurants[i].restaurant.user_rating.aggregate_rating  + '</div> </div>';
*/
            }

        }
        updateAdvice();

      })
      .catch(function (error) {
        restaurantDataFound = 0;
        document.getElementById('restaurants').innerHTML = 'No restaurant data available for selected location.';
        updateAdvice();
      });

}

/* check weather and restaurant info to create a landing advice */
function updateAdvice() { 
    console.log('temp ' + temperature);
    console.log('wind ' + wind);
    console.log('restaurantDataFound ' + restaurantDataFound);
    console.log('numRestaurantsFound ' + numRestaurantsFound);

    if(wind > 10.8) { // meer dan windkracht 6
        document.getElementById('advice-data').innerHTML = 'Not safe to land. Too much wind!'
        document.getElementById('dot').style.backgroundColor = "red";
        document.getElementById('weather-icon').style.color = "red";
    }
    else if(temperature < 0) {
        document.getElementById('advice-data').innerHTML = 'It is safe to land, but the landing environment is very cold!'
        document.getElementById('dot').style.backgroundColor = "orange";
        document.getElementById('weather-icon').style.color = "orange";
    }
    else if(restaurantDataFound == 0) {
        document.getElementById('advice-data').innerHTML = 'It is safe to land, but there may not be any restaurants!'
        document.getElementById('dot').style.backgroundColor = "orange";
        document.getElementById('weather-icon').style.color = "green";
    }
    else if(numRestaurantsFound == 0) {
        document.getElementById('advice-data').innerHTML = 'It is safe to land, but there are no restaurants nearby!'
        document.getElementById('dot').style.backgroundColor = "orange";
        document.getElementById('weather-icon').style.color = "green";
    }
    else if(numRestaurantsFound <= 3) {
        document.getElementById('advice-data').innerHTML = 'This is a good landing location. Nice weather and there are restaurants nearby!'
        document.getElementById('dot').style.backgroundColor = "green";
        document.getElementById('weather-icon').style.color = "green";
    }
    else {
        document.getElementById('advice-data').innerHTML = 'This is a great landing location. Nice weather and many restaurants!'
        document.getElementById('dot').style.backgroundColor = "green";
        document.getElementById('weather-icon').style.color = "green";
    }

}

/* on click, update the marker */
var marker = new mapboxgl.Marker()
map.on('click', function(e) {

    console.log(JSON.stringify(e.lngLat.wrap()));

    /* update marker */
    marker.setLngLat(e.lngLat)
    marker.addTo(map);

    /* update weather data */
    updateWeather(e.lngLat["lng"], e.lngLat["lat"]);

    /* update restaurant data */
    updateRestaurants(e.lngLat["lng"], e.lngLat["lat"]);
})


/* init map on startup */
/* update marker */
marker.setLngLat({"lng":-73.98529314771758,"lat":40.74191464076671})
marker.addTo(map);

/* update weather data */
updateWeather(-73.98529314771758, 40.74191464076671);

/* update restaurant data */
updateRestaurants(-73.98529314771758, 40.74191464076671);
