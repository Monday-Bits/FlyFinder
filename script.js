const api_key = "&api_key=3f5a48ed-abe9-4a84-9f46-e1657026b0a4";
const api_base = "https://airlabs.co/api/v9/";
const flight_iata_url = "flight?flight_iata=";
const name_suggest_url = "suggest?q=";
const dep_flight_schedule_url = "schedules?dep_iata=";
const arr_flight_schedule_url = "schedules?arr_iata=";
const airportInfo = "airports?iata_code=";
const nearByAPI = "nearby?";


//Create world map
const mymap = L.map('map-container').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  maxZoom: 18,
  zoomSnap: 0.25
}).addTo(mymap);


let airport_marker;
function airportSearch(){
  document.getElementById("submit-airport").onclick = async function(){
    var query = document.getElementById("airport-search").value;
    const response = await fetch(api_base+name_suggest_url+query+api_key);
    const data = await response.json().then(data => {
      var airport_name = data.response.airports[0].name;
      var airport_iata = data.response.airports[0].iata_code;
      var airport_lat = data.response.airports[0].lat;
      var airport_lng = data.response.airports[0].lng;

      if (airport_lat && airport_lng) {
        if (airport_marker) {airport_marker.remove();}
        
        //add airport marker on map
        airport_marker = L.marker([airport_lat, airport_lng], {bounceOnAdd: true, bounceOnAddOptions: {duration: 1000, height: 250, loop: 1}}).addTo(mymap);
        airport_marker.bindPopup(`<b>${airport_name}   ${airport_iata}</b>`).openPopup();
        
        fillScheduleTable(airport_iata).then(mymap.whenReady(function(){(mymap.setView([airport_lat, airport_lng], 7))}));
      } else {
        // handle the case where the data is not valid
        window.alert("Something went wrong with the airport search :(");
      }
    });
  }
}
airportSearch();


function activateLightBox() {
  document.body.insertAdjacentHTML("beforeend", `
      <div class="lightbox" id="lightbox" style="display: none;">
          <div class="lightbox__inner">
              <button type="button" class="lightbox__close">
                  &times;
              </button>
              <div class="lightbox__content">
                  This is the main cont.
              </div>
          </div>
      </div>
  `);

  const lightbox = document.querySelector("#lightbox");
  const btnClose = lightbox.querySelector(".lightbox__close");
  const content = lightbox.querySelector(".lightbox__content");

  const closeLightbox = () => {
      lightbox.style.display = "none";
      content.innerHTML = "";
  };

  lightbox.addEventListener("mousedown", e => {
      if(e.target.matches("#lightbox")) {
          closeLightbox();
      }
  });

  btnClose.addEventListener("click", () => {
      closeLightbox();
  });
}

function showLightBox(htmlOrElement) {
  const content = document.querySelector("#lightbox .lightbox__content");

  document.querySelector("#lightbox").style.display = null;

  if (typeof htmlOrElement === "string") {
      content.innerHTML = htmlOrElement;
  } else {
      content.innerHTML = "";
      content.appendChild(htmlOrElement);
  }
}

activateLightBox();
showLightBox("<p>Welcome to FlyFinder, an interactive website that will take you on an adventure around the world! With our cutting-edge technology, you can easily search for flights and airports, and explore the globe like never before. Our sleek design and user-friendly interface make it a breeze to find your dream destination and plan your next trip. Our world map will amaze you with its stunning visuals and interactive features, allowing you to zoom in and out of any location you desire. So buckle up and get ready for takeoff with FlyFinder!</p>");

let grid; let flight_iata;
async function fillScheduleTable(airport_iata){
  const response = await fetch(api_base+dep_flight_schedule_url+airport_iata+api_key);
  const data = await response.json();
 
  console.log(data.response);

  if (grid) {
    grid.destroy();
  }

  grid = new gridjs.Grid({
    sort: true,
    search: true,
    pagination: true,

    columns: ["Flight #", "Departure Time", "Arrival Time", "Status"],
    
    data: data.response.map(schedule => [
      schedule.flight_iata,
      schedule.dep_time,
      schedule.arr_time,
      schedule.status
      ])
    });
    document.getElementById("table-container").innerHTML = "";
    grid.render(document.getElementById("table-container"));
}

function minutesToHoursMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

let plane_marker;
function getFlightInfo(flight_iata){
  document.getElementById("submit-flight-iata").onclick = async function(){
    var flight_iata = document.getElementById("flight-iata").value;


    // Call updatePlaneLocation immediately when the button is pressed
    updatePlaneLocation(flight_iata);

    async function updatePlaneLocation(flight_iata){
    const response = await fetch(api_base+flight_iata_url+flight_iata+api_key);
    const data = await response.json().then(async data => {
    const plane_lat = data.response.lat;
    const plane_lng = data.response.lng;
    const plane_direction = data.response.dir;
    const dep_iata = data.response.dep_iata;
    const arr_iata = data.response.arr_iata;
    const plane_speed = data.response.speed;
    const plane_eta = minutesToHoursMinutes(data.response.eta);
    console.log(data);

    if (plane_lat && plane_lng === null) {
      window.alert("Something went wrong with the plane coordinates :(");
    }
  //add plane marker on map
  var planeIcon = L.icon({
    iconUrl: 'icons/plane.svg',
    iconSize:     [50, 100], // size of the icon
    iconAnchor:   [25, 50], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -25] // point from which the popup should open relative to the iconAnchor
  })

  if (plane_marker) {plane_marker.remove();}

  plane_marker = new L.RotatedMarker([plane_lat, plane_lng], {
    icon: planeIcon,
    rotationAngle: plane_direction,
    rotationOrigin: "center center"
  }).addTo(mymap);
  plane_marker.bindPopup(`<b>Current Location of flight ${flight_iata}<br>Speed: ${plane_speed}km/h<br>ETA: ${plane_eta}</b>`).openPopup();

  //get departing coordinates:
  const response1 = await fetch(api_base+airportInfo+arr_iata+api_key);
  const data1 = await response1.json().then(async data1 => {
  const arr_lat = data1.response[0].lat;
  const arr_lng = data1.response[0].lng;

  const response2 = await fetch(api_base+airportInfo+dep_iata+api_key);
  const data2 = await response2.json().then(data2 => {
  const dep_lng = data2.response[0].lng;
  const dep_lat = data2.response[0].lat;

    //add plane path on map
    const plane_path = L.polyline.antPath([[dep_lat, dep_lng], [plane_lat, plane_lng], [arr_lat, arr_lng]], {color: 'red'}, {hardwareAccelerated: true}).addTo(mymap);
  });
});
      //zoom map to plane location
      mymap.setView([plane_lat, plane_lng], 7);
    });
  }
}
}
getFlightInfo();

async function locateUser(mymap){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async function(position) {
      const user_lat = position.coords.latitude;
      const user_lng = position.coords.longitude;
      
        mymap.setView([user_lat, user_lng], 9);
        
        //find nearest airport
        const response = await fetch(api_base+nearByAPI+'lat='+user_lat+'&lng='+user_lng+'&distance=30'+api_key);
          const data = await response.json().then(data => {

                console.log(data);

            var airport_name = data.response.airports[0].name;
            var airport_iata = data.response.airports[0].iata_code;
            var distance = data.response.airports[0].distance;
            var airport_lat = data.response.airports[0].lat;
            var airport_lng = data.response.airports[0].lng;

            if (airport_marker) {airport_marker.remove();}

              if (airport_lat && airport_lng) {
               const nearest_airport_marker = new L.marker([airport_lat, airport_lng], {bounceOnAdd: true, bounceOnAddOptions: {duration: 500, height: 250, loop: 1}}).addTo(mymap);
               nearest_airport_marker.bindPopup(`<b>The nearest airport to you:<br>${airport_name}   ${airport_iata}</b>`).openPopup();
              } else {
                // handle the case where the data is not valid
                window.alert("Something went wrong with the airport data :(");
              }
          }).catch(error => {
            console.error(error);
          });
    });
  } else {
    window.alert("Geolocation is not supported by this browser.");
  }
}
locateUser(mymap);