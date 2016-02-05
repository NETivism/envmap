(function ($) {

$.fn.envmap = function(settings) {
  var o = $.extend({
    "factory": "data/factory.json",
    "twCounty": "data/twCounty2010.json",
    "airQuality": "data/airquality.json"
  }, settings);

  var current = this;
  
  // global vars
  var mapopt = {
    "latlng": [24.292754, 120.653797],
    "zoom": 10,
    "basemap": 'satellite',
    "factory":{
      "enabled" : 1,
    },
    "airq": {
      "enabled": 1,
    }
    /*
    "realtime": {
      "enabled": 0,
    }
    */
  };

  var mapobj;
  var mapid = "mapgcaa";
  var maplayers = {};
  var colorplate = ['#01E400','#FFFF00','#FF7E00','#FE0000','#98004B','#7E0123'];

  var layerOsm = function(map){
    // osm tile
    maplayers.osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      "zIndex": 10,
      "attribution": '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });
    if(mapopt.basemap != 'street'){ 
      return;
    }

    if(typeof map != 'undefined'){
      map.addLayer(maplayers.osm);
    }
  }

  var layerSatellite = function(map){
    var maxZoom = 17;
    var tileOpt = {"tms": true, "maxZoom": maxZoom, "zIndex": 100};
    maplayers.satellite = L.layerGroup();
    if(mapopt.basemap != 'satellite'){ 
      return;
    }
    maplayers.satellite.addLayer(L.tileLayer('http://l1.jimmyhub.net/processed/LC81170452013250LGN00/tiles-rgb/{z}/{x}/{y}.png', tileOpt));
    maplayers.satellite.addLayer(L.tileLayer('http://l1.jimmyhub.net/processed/LC81170432014365LGN00/tiles-rgb/{z}/{x}/{y}.png', tileOpt));
    maplayers.satellite.addLayer(L.tileLayer('http://l1.jimmyhub.net/processed/LC81180442015311LGN00/tiles-rgb/{z}/{x}/{y}.png', tileOpt));
    maplayers.satellite.addLayer(L.tileLayer('http://l1.jimmyhub.net/processed/LC81170442015336LGN00/tiles-rgb/{z}/{x}/{y}.png', tileOpt));
    maplayers.satellite.addLayer(L.tileLayer('http://l1.jimmyhub.net/processed/LC81180432014356LGN00/tiles-rgb/{z}/{x}/{y}.png', tileOpt));

    if(typeof map != 'undefined'){
      map.addLayer(maplayers.satellite);
    }
  }

  var layerTWCounty = function(map){
    if(mapopt.basemap !== 'satellite'){ 
      return;
    }
    maplayers.twcounty = L.geoJson();
    $.getJSON(o.twCounty, function(twgeojson){
      maplayers.twcounty = L.geoJson(twgeojson, {
        style: function(feature) {
          return {
            "weight": 3,
            "color": "#EEE",
            "opacity": 0.5,
            "fillColor": "#000",
            "fillOpacity": 0
          };
        }
      });
      maplayers.twcounty.setZIndex(200);
      if(typeof map != 'undefined'){
        map.addLayer(maplayers.twcounty);
      }
    });
  }

  var layerFactory = function(map){
    var $progress = $('#progress');
    var $progressBar = $('#progress-bar');
    maplayers.factory = L.markerClusterGroup({ chunkedLoading: true, chunkProgress: function(processed, total, elapsed, layersArray){
      if (elapsed > 1000) {
        // if it takes more than a second to load, display the progress bar:
        $progress.css('display', 'block');
        $progressBar.css('width', Math.round(processed/total*100) + '%');
      }

      if (processed >= total) {
        // all markers processed - hide the progress bar:
        $progress.hide();
      }  
    }});
    if(mapopt.factory.enabled && !map.hasLayer(maplayers.factory)){ 
      var factoryList = [];
      $.getScript(o.factory, function(data, textStatus, jqxhr) {
        for (var i = 0; i < factoryPoints.length; i++) {
          if(!factoryPoints[i][2] || ! factoryPoints[i][3]) {
            continue;
          }
          var title = factoryPoints[i][1];
          var marker = L.marker(L.latLng(factoryPoints[i][2], factoryPoints[i][3]), {"title": title});
          marker.bindPopup(factoryPoints[i][1] + '<br>' + factoryPoints[i][0]);
          factoryList.push(marker);
        }
        maplayers.factory.addLayers(factoryList);
        maplayers.factory.setZIndex(500);
        if(typeof map != 'undefined'){
          maplayers.factory.addTo(map);
        }
      });
    }
    else
    if(!mapopt.factory.enabled && map.hasLayer(maplayers.factory)){ 
      map.removeLayer(maplayers.factory);
    }
    /* factory - geojson sample
    maplayers.factory = L.markerClusterGroup();
    $.getJSON(o.factory, function(factoryjson){
      var geojson = L.geoJson(factoryjson, {
        style: function (feature) {
          return {color: feature.properties.color};
        },
        onEachFeature: function (feature, layer) {
          var popupText = ''; 
          if (feature.properties.name) {
            popupText = feature.properties.name;
          }
          layer.bindPopup(popupText);
        }
      });
      geojson.addLayer(new L.Marker(mapopt.latlng))
      maplayers.factory.addLayer(geojson);
      maplayers.factory.addTo(map);
    });
    */
  }

  var layerAirquality = function(map){
    maplayers.airQuality = L.geoJson();
    if(mapopt.airq.enabled && !map.hasLayer(maplayers.airQuality)){ 
      $.getJSON(o.airQuality, function(airjson){
        maplayers.airQuality = L.geoJson(airjson, {
          pointToLayer: function (feature, latlng) {
            var color = 0;
            if(feature.PSI > 300) {  color = 5; }
            else if(feature.PSI > 200 ) {  color = 4; }
            else if(feature.PSI > 150 ) {  color = 3; }
            else if(feature.PSI > 100 ) {  color = 2; }
            else if(feature.PSI > 50) {  color = 1; }
            
            return L.circleMarker(latlng, {
              radius: 6,
              fillColor: colorplate[color],
              color: "#555",
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.8
            });
          },
          onEachFeature: function (feature, layer) {
            var popupText = ''; 
            for (var index in feature.properties) {
              popupText += index + ':' + feature.properties[index] + '<br>';
            }
            layer.bindPopup(popupText);
          }
        });
        maplayers.airQuality.setZIndex(800);
        if(typeof map != 'undefined'){
          maplayers.airQuality.addTo(map);
        }
      });
    }
    else
    if(!mapopt.airQuality.enabled && map.hasLayer(maplayers.airQuality)){ 
      map.removeLayer(maplayers.airQuality);
    }
  }

  var mapBaseLayer = function(){
    var currentZoom = mapobj.getZoom();
    if(currentZoom > 13 && mapobj.hasLayer(maplayers.satellite)){
      mapobj.removeLayer(maplayers.satellite);
      mapobj.removeLayer(maplayers.twcounty);
      mapobj.addLayer(maplayers.osm);
    }
    else
    if(currentZoom <= 13 && mapobj.hasLayer(maplayers.satellite) === false){
      mapobj.addLayer(maplayers.satellite);
      mapobj.addLayer(maplayers.twcounty);
      mapobj.removeLayer(maplayers.osm);
    }
  }

  /**
   * Make a object for osm
   */
  var mapInitLayers = function(){
    var maxZoom = 17;
    var map = new L.map(mapid, {
      center: mapopt.latlng,
      zoom: mapopt.zoom,
      maxZoom: maxZoom
    });
    mapobj = map;

    if(!mapobj.hasLayer(maplayers.osm)) {
      layerOsm(map);
    }
    if(!mapobj.hasLayer(maplayers.satellite)) {
      layerSatellite(map);
    }
    if(!mapobj.hasLayer(maplayers.twcounty)) {
      layerTWCounty(map);
    }
    if(!mapobj.hasLayer(maplayers.factory)) {
      layerFactory(map);
    }
    if(!mapobj.hasLayer(maplayers.airQuality)) {
      layerAirquality(map);
    }
    mapBaseLayer();

    map.on('dragend', mapMove);
    map.on('zoomend', function(){
      mapMove();
      mapBaseLayer();
    });
    return map;
    /*
    obj.on('overlayadd', function(e) {
      if (e.name=='SwirNir view'){
        ga('send', 'event', 'nav', 'click', 'swir-switch');
        (name == 'before') ? l[0] = 'swir' : l[1] = 'swir';
        var opt = {

        };
        hashUpdate(hash);
        legend.addTo(obj);
      }
      if (e.name=='RGB view'){
        ga('send', 'event', 'nav', 'click', 'rgb-switch');
      }
    });
    obj.on('overlayremove', function(e) {
      if (e.name=='SwirNir view'){
        (name == 'before') ? l[0] = 'rgb' : l[1] = 'rgb';
        var hash = [];
        hash[6] = l.join('-');
        hashUpdate(hash);
        legend.removeFrom(obj);
      }
    });
    */;
  }

  /**
   * Help function for leaflet drag event
   */
  var mapMove = function(){
    var center = mapobj.getCenter();
    var zoom = mapobj.getZoom();
    var opt = {
      "latlng": [center.lat, center.lng],
      "zoom": zoom,
    };
    hashUpdate(opt);
  }

  /**
   * Help function for update hashtag
   */
  var hashUpdate = function(opt){
    if(opt){
      var newopt = {};
      $.extend(newopt, mapopt, opt);
      window.location.hash = JSON.stringify(newopt);
      mapopt = newopt;
    }
    // $("input#copy").val(window.location);
  }

  /**
   * Help function for get hashtag value
   */
  var hashResolv = function(method){
    var f = window.location.hash.replace(/^#/, '');
    if(f){
      var opt = JSON.parse(f);
      if(opt.hasOwnProperty('latlng')){
        // override global opt
        mapopt = opt;
      }
      if(method){
        return mapopt[method];
      }
    }
    return mapopt;
  }

  var mapReset = function(){
    hashResolv();
    $('#'+mapid).remove();
    $('<div id="'+mapid+'" class="map"><div id="progress"><div id="progress-bar"></div></div>').appendTo(current);

    // initialize map height
    $(".map").height($(window).height() - 80);
    mapInitLayers();
  }


  /**
   * Main function for start map. callback after json loaded
   */
  var mapStart = function(pos){
    if(typeof pos.coords !== 'undefined'){
      mapopt.latlng = [pos.coords.latitude, pos.coords.longitude];
    }

    var resizing = 0;
    $(window).resize(function(){
      if(!resizing){
        resizing = 1;
        window.setTimeout(function(){
          resizing = 0;
          // mapReset();
        }, 600);
      }
    });

    mapReset();
  }


  // main
  var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  navigator.geolocation.getCurrentPosition(mapStart, mapStart, options);
}

}(jQuery));

