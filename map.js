(function ($) {

$.fn.envmap = function(settings) {
  var o = $.extend({
    "factory": "data/factory.js",
    "factoryPopupLoading": "Loading ...",
    "factoryPopupCallback": "",
    "factoryPopupLoading": "",
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
  var colorplatePM25 = ['#9CFF9C','#31FF00','#31CF00','#FFFF00','#FFCF00','#FF9A00','#FF6464','#FF0000','#990000','#CE30FF'];

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
    var tileOpt = {"tms": true, "maxZoom": maxZoom, "zIndex": 11};
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
      maplayers.twcounty.setZIndex(10);
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
          var factory = factoryPoints[i];
          var title = factory[1];
          var registrationNo = factory[0];
          var marker = L.marker(L.latLng(factory[2], factory[3]), {"title": title});
          if(o.factoryPopupCallback && o.factoryPopupCallback.length){
            marker.bindPopup(o.factoryPopupLoading);
            marker.on('click', function(e){
              o.factoryPopupCallback(e, factory);
            });
          }
          else{
            marker.bindPopup(title + '<br>' + registrationNo);
          }
          factoryList.push(marker);
        }
        maplayers.factory.addLayers(factoryList);
        maplayers.factory.setZIndex(20);
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
            var prop = feature.properties;

            // PSI
            /*
            if(prop.PSI > 300) {  color = 5; }
            else if(prop.PSI > 200 ) {  color = 4; }
            else if(prop.PSI > 150 ) {  color = 3; }
            else if(prop.PSI > 100 ) {  color = 2; }
            else if(prop.PSI > 50) {  color = 1; }
            */

            // test PM25 
            if(prop['PM2.5'] > 70) {  color = 9; }
            else if(prop['PM2.5'] >= 65) {  color = 8; }
            else if(prop['PM2.5'] >= 59) {  color = 7; }
            else if(prop['PM2.5'] >= 54) {  color = 6; }
            else if(prop['PM2.5'] >= 48) {  color = 5; }
            else if(prop['PM2.5'] >= 42) {  color = 4; }
            else if(prop['PM2.5'] >= 36) {  color = 3; }
            else if(prop['PM2.5'] >= 24) {  color = 2; }
            else if(prop['PM2.5'] >= 12) {  color = 1; }

            return circleMarker = L.circleMarker(latlng, {
              radius: 9,
              fillColor: colorplatePM25[color],
              color: "#FFF",
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.8,
              className: 'airq-station'
            });
          },
          onEachFeature: function (feature, layer) {
            var popupText = '';
            console.log(feature.properties);
   
            popupText += feature.properties['SiteName'];
            popupText += ' <label>PM2.5:</label>' + feature.properties['PM2.5']; 
            popupText += ' <label>PSI:</label>' + feature.properties['PSI']; 
           /*
            for (var index in feature.properties) {
              popupText += index + ':' + feature.properties[index] + '<br>';
            }
           */
            layer.bindPopup(popupText);
            layer.on('mouseover', function(){
              layer.openPopup();
            });
          }
        });
        maplayers.airQuality.setZIndex(1000);
        if(typeof map != 'undefined'){
          maplayers.airQuality.addTo(map);
          // fixes https://github.com/Leaflet/Leaflet.markercluster/issues/431
          //current.find('.leaflet-overlay-pane').css('z-index', '100');
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
    mapControl();
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

  var mapControl = function(){
    if(typeof o.control !== 'undefined'){
      $(o.control).on('click', function(){
        for (var prop in o) {
          if(prop.match(/^toggle/)){
            var layerid = prop.replace(/toggle/, '').toLowerCase();
            var value = currentVal($(o[prop]));
            if(value && !mapobj.hasLayer(maplayers[layerid])){ 
              mapobj.addLayer(maplayers[layerid]);
            }
            if(!value && mapobj.hasLayer(maplayers[layerid])){
              mapobj.removeLayer(maplayers[layerid]);
            }
          }
        }
      });
    }
  }

  var currentVal = function(ele){
    var value = 0;
    var tag = ele.prop('tagName').toLowerCase();
    if(tag == 'select'){
      value = ele.val();
    }
    else
    if(tag == 'input'){
      switch(ele.attr('type')){
        case 'checkbox':
          if(ele.prop("checked")){
            value = 1;
          }
          else{
            value = 0;
          }
          break;
        case 'radio':
        case 'input':
          value = ele.val();
          break;
      }
    }
    return value;
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

