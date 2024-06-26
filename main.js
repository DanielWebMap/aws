/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 10);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    wind: L.featureGroup(),
    snowheight: L.featureGroup().addTo(map),
    rainviewer: L.featureGroup().addTo(map),
}

//Test
// Hintergrundlayer
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur (°C)":themaLayer.temperature,
    "Wind (km/h)":themaLayer.wind,
    "Schneehöhe (cm)":themaLayer.snowheight,
    
} 
).addTo(map);



//RAINVIEWER

L.control.rainviewer({ 
    position: 'topright',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);



// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

//Farben abgreifen 

function getColor(value, ramp){
    console.log("getCOlor: value: ", value, "ramp: ", ramp);
    for (let rule of ramp) {
        console.log("Rule: ", rule);
        if(value >= rule.min && value < rule.max) {
            return rule.color; 
        }
    }
} 



//TEMPERATUR

function showTemperature(geojson) {
    L.geoJSON(geojson, {
        filter: function(feature) {  //Filtern des GeoJSON nach Vorgaben
            //feature.properties.LT
            if (feature.properties.LT > -50 && feature.properties.LT <50){
                return true;
            }
        },
        pointToLayer: function(feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};">${feature.properties.LT.toFixed(1)}</span>`
            })
            
            })
    }}).addTo(themaLayer.temperature)

}


//WIND


function showWind(geojson) {
    L.geoJSON(geojson, {
        filter: function(feature) {  //Filtern des GeoJSON nach Vorgaben
            //feature.properties.LT
            if (feature.properties.WG >= 0 && feature.properties.WG <200){
                return true;
            }
        },
        pointToLayer: function(feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon-wind",
                    html: `<span title="${feature.properties.WG.toFixed(1)} km/h"><i style="transform:rotate(${feature.properties.WR}deg);color:${color}" class="fa-solid fa-circle-arrow-up"></i></span>`
            })
            })
    }}).addTo(themaLayer.wind)
}



//SCHNEEHÖHE

function showSnow(geojson) {
    L.geoJSON(geojson, {
        filter: function(feature) {
            if (feature.properties.HS >= 0 && feature.properties.HS <800){
                return true; 
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.HS, COLORS.snow); 
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon-snow",
                    html: `<span style="background-color:${color};">${feature.properties.HS.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.snowheight)


}






// GeoJSON der Wetterstationen laden
async function showStations(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    // Wetterstationen mit Icons und Popups
    //console.log(geojson)


    //Lefleat GeoJSON erstellen und Icons mit Popups erstellen 

    L.geoJSON(geojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'icons/wifi.png',
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            })
        },

        onEachFeature: function (feature, layer) {

            //console.log(feature.properties)
            //console.log(feature.geometry)
            let pointInTime = new Date(feature.properties.date) // Mit New Operator wird ein neues Format erstellt, Datum, und in Variable gespeichert
            //console.log(pointInTime)
            layer.bindPopup(`<h4>${feature.properties.name} (${feature.geometry.coordinates[2]}m)</h4>
            <p><ul>
            <li>Lufttemperatur (°C): ${feature.properties.LT || "-"}</li>
            <li>Relative Luftfeuchte (%): ${feature.properties.RH || "-"}</li>
            <li>Windgeschwindigkeit (km/h): ${feature.properties.WG || "-"}</li>
            <li>Schneehöhe (cm): ${feature.properties.HS || "-"}</li>
            </ul></p>

            <span>${pointInTime.toLocaleString()}</span>
            
        `, { className: 'stylePopup' })  //Pop-Ups erhalten Klassenname für CSS Styling

        }
    }).addTo(themaLayer.stations);
    showTemperature(geojson);
    showWind(geojson);
    showSnow(geojson);
}
showStations("https://static.avalanche.report/weather_stations/stations.geojson");
