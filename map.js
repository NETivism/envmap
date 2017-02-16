(function ($) {

$.fn.envmap = function(settings) {
  var o = $.extend({
    "factory": "data/factory.js",
    "factoryPopupLoading": "Loading ...",
    "factoryPopupCallback": "",
    "factoryPopupLoading": "",
    "twCounty": "data/twCounty2010.json",
    "airquality": "data/airquality.json",
    "formBinding": '',
    "mapid": ''
  }, settings);

  var current = this;
  $.ajaxSetup({ cache: true });
  
  // global vars
  var mapopt = {
    "latlng": [24.292754, 120.653797],
    "zoom": 10,
    "basemap": 'satellite',
    "factory":{
      "name": '',
      "enabled" : 1,
      "type": 'All',
      "poltype": 'All',
      "fine": 1,
      "realtime": 1,
      "overhead": 0
    },
    "airquality": {
      "enabled": 1,
    }
  };

  var mapobj;
  var mapid = o.mapid;
  var maplayers = {};

  var colorPlate = function(type, v){
    var colorplatePsi = ['#00ff00','#FFFF00','#ff0000','#800080','#633300','#7E0123'];
    var colorplatePm25= ['#9CFF9C','#31FF00','#31CF00','#FFFF00','#FFCF00','#FF9A00','#FF6464','#FF0000','#990000','#CE30FF'];
    var color = 0;

    if(type == 'pm25'){
      if(v > 70) {  color = 9; }
      else if(v >= 65) {  color = 8; }
      else if(v >= 59) {  color = 7; }
      else if(v >= 54) {  color = 6; }
      else if(v >= 48) {  color = 5; }
      else if(v >= 42) {  color = 4; }
      else if(v >= 36) {  color = 3; }
      else if(v >= 24) {  color = 2; }
      else if(v >= 12) {  color = 1; }

      return colorplatePm25[color];
    }
    if(type == 'psi'){
      if(v >= 300) {  color = 4; }
      else if(v > 200 ) {  color = 3; }
      else if(v > 100 ) {  color = 2; }
      else if(v > 50) {  color = 1; }

      return colorplatePsi[color];
    }
  }

  var layerSearch = function(map){
  	var input = document.getElementById("edit-factory-address");
    var searchBox = new google.maps.places.SearchBox(input);

    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      var zoom = 13;
      var place = places[0];
      var group = L.featureGroup();
      var amarker = L.AwesomeMarkers.icon({
        "icon": "search",
        "prefix": "fa",
        "iconColor": "white",
        "markerColor": "orange"
      });

      var marker = L.marker(
        [ place.geometry.location.lat(), place.geometry.location.lng() ],
        { title: place.name, icon: amarker }
      );
      ga('send', 'event', 'map', 'search-place', place.name);

      group.addLayer(marker);
      map.addLayer(group);
      map.panTo(marker.getLatLng());
      if( typeof place.types == 'object' && place.types.length > 0) {
        var type = place.types[0];
        switch(type){
          case 'administrative_area_level_3':
            zoom = 13;
            break;
          case 'administrative_area_level_2':
            zoom = 11;
            break;
          case 'administrative_area_level_1':
            zoom = 9;
            break;
          case 'route':
            zoom = 15;
            break;
        }
        if(place.types[1] == 'point_of_interest') {
          zoom = 15;
        }
      }
      map.setZoom(zoom);
    });

  }

  var layerOsm = function(map){
    // osm tile
    maplayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
    //var tileOpt = {"tms": true, "maxZoom": maxZoom, "zIndex": 11};
    maplayers.satellite = L.layerGroup();
    if(mapopt.basemap != 'satellite'){ 
      return;
    } 
    var url='http://maps.nlsc.gov.tw/S_Maps/wmts';
    maplayers.satellite.addLayer(new L.TileLayer.WMTS( url , {   
      layer: 'PHOTO2',  
      style: "default",  
      tilematrixSet: "GoogleMapsCompatible",  
      format: "image/jpeg",  
      attribution: "<a href='https://github.com/mylen/leaflet.TileLayer.WMTS'>GitHub</a>&copy; <a href='http://maps.nlsc.gov.tw'>NLSC</a>"  
    }));


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
    if (mapopt.factory.realtime) {
      var disableCluster = 9;
    }
    else{
      var disableCluster = 14;
    }
    maplayers.factory = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: disableCluster,
      chunkProgress: function(processed, total, elapsed, layersArray){
      if (elapsed > 100) {
        // if it takes more than a second to load, display the progress bar:
        $progress.css('display', 'block');
        $progressBar.css('width', Math.round(processed/total*100) + '%');
      }

      if (processed >= total) {
        // all markers processed - hide the progress bar:
        setTimeout(function(){
          $progress.hide();
          $(".freeze").remove();
        }, 600);
      }  
    }});
    if(mapopt.factory.enabled && !map.hasLayer(maplayers.factory)){ 
      var tokens = {
        '{factory.type}': String(mapopt.factory.type).toLowerCase(),
        '{factory.poltype}': String(mapopt.factory.poltype).toLowerCase(),
        '{factory.fine}':mapopt.factory.fine ? 1 : 0,
        '{factory.realtime}':mapopt.factory.realtime ? 1 : 0,
        '{factory.overhead}':mapopt.factory.overhead ? 1 : 0
      };
      var url = replaceToken(o.factory, tokens);
      $.getScript(url, function(data, textStatus, jqxhr) {
        var factoryList = [];
        var selectedFactory;
        for (var i = 0; i < factoryPoints.length; i++) {
          if(!factoryPoints[i][2] || ! factoryPoints[i][3]) {
            continue;
          }
          var factory = factoryPoints[i];
          var title = factory[1];
          var registrationNo = factory[0];
          var amarker = L.AwesomeMarkers.icon({
            "icon": factory[4] == 1 ? "exclamation-triangle" : "building",
            "prefix": "fa",
            "iconColor": "white",
            "markerColor": factory[4] == 1 ? 'red' : 'blue'
          });
          var marker = L.marker(L.latLng(factory[2], factory[3]), {
            "title": title,
            "icon": amarker
          });
          if(o.factoryPopupCallback && o.factoryPopupCallback.length){
            marker.bindPopup(o.factoryPopupLoading);
            (function(f){
              marker.on('click', function(e){
                ga('send', 'event', 'map', 'click-marker', f[1]);
                mapopt.factory.name = f[1];
                hashUpdate(mapopt);
                if (o.formBinding) {
                  $(o.formBinding).bindings('set')('factory.name', f[1]);
                }
                o.factoryPopupCallback(e, f);
              });
            })(factory);
          }
          else{
            marker.bindPopup(title + '<br>' + registrationNo);
          }
          factoryList.push(marker);
          if(mapopt.factory.name == title){
            selectedFactory = marker;   
          }
        }
        maplayers.factory.addLayers(factoryList);
        maplayers.factory.setZIndex(20);
        if(typeof map != 'undefined'){
          map.addLayer(maplayers.factory);
          if (selectedFactory) {
            setTimeout(function(){
              maplayers.factory.zoomToShowLayer(selectedFactory, function () {
                selectedFactory.fire('click');
              });
            }, 500);
          }
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

  var layerFactoryLabel = function(map){
    maplayers.legend = L.control({'position':'topright'});
    maplayers.legend.onAdd = function(map){
      this._div = L.DomUtil.create('div', 'leaflet-custom-legend');
      var html = '<div><div class="awesome-marker-icon-red awesome-marker" tabindex="0" style="position: static; width: 35px; height: 45px; display:inline-block"><i class="fa fa-exclamation-triangle  icon-white" style="margin-top:10px"></i> </div>30天內超標單位</div>';
      html += '<div><div class="awesome-marker-icon-blue awesome-marker leaflet-zoom-animated" tabindex="0" style="position:static;width: 35px; height: 45px; display:inline-block;"><i class="fa fa-building  icon-white" style="margin:10px 0 0 2px"></i> </div>未超標的單位</div>';
      this._div.innerHTML = html;
      return this._div;
    }
    maplayers.legend.addTo(map);
  }

  var layerAirquality = function(map){
    maplayers.airquality = L.geoJson();
    if(mapopt.airquality.enabled && !map.hasLayer(maplayers.airquality)){ 
      $.getJSON(o.airquality, function(airjson){
        maplayers.airquality = L.geoJson(airjson, {
          pointToLayer: function (feature, latlng) {
            var prop = feature.properties;
            var color = colorPlate('pm25', prop['PM2.5']);

            return circleMarker = L.circleMarker(latlng, {
              radius: 7,
              fillColor: color,
              color: "#FFF",
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.8,
              className: 'airq-station'
            });
          },
          onEachFeature: function (feature, layer) {
            var popupText = '';
   
            popupText += ' <div class="station">' + feature.properties['SiteName'] + '測站</div>';

            var pm25 = feature.properties['PM2.5'];
            var color = colorPlate('pm25', pm25);
            var level = '';

            // pm 2.5
            if(pm25 >= 70) { level = '非常高'; }
            else if(pm25 >= 54) { level = '高'; }
            else if(pm25 >= 36) { level = '中'; }
            else { level = '低'; }
            popupText += '<label>PM2.5</label>' + '<div class="pmvalue"  style="color: #555;border-color:'+color+'">' + feature.properties['PM2.5'] + '，'+level+'</div>';

            // psi
            var psi = feature.properties['PSI'];
            level = '';
            color = colorPlate('psi', psi);
            if(psi >= 300) { level = '有害'; }
            else if(psi >= 200) { level = '非常不良'; }
            else if(psi >= 101) { level = '不良'; }
            else if(psi >= 51) { level = '普通'; }
            else { level = '良好'; }

            popupText += '<label>PSI</label>' + '<div class="psivalue" style="color: #555; border-color:'+color+'; font-size: 16px;">' + psi + '，'+level+'</div>';

	    popupText += '<div class="time">資料更新時間：' + feature.properties['PublishTime'] + '</div>';

            layer.bindPopup(popupText);
            layer.on('mouseover', function(){
              layer.openPopup();
            });
          }
        });
        maplayers.airquality.setZIndex(1000);
        if(typeof map != 'undefined'){
          maplayers.airquality.addTo(map);
          // fixes hover problem 
          // https://github.com/Leaflet/Leaflet.markercluster/issues/431
          var svg = $('#'+mapid+' .leaflet-overlay-pane svg');
          setTimeout(function(){
            $('#'+mapid+' .leaflet-overlay-pane svg > g').each(function(){
              if($(this).children('.airq-station').length > 0){
                $(this).appendTo(svg);
              }
            });
          }, 2000);
        }
      });
    }
    else
    if(!mapopt.airquality.enabled && map.hasLayer(maplayers.airquality)){ 
      map.removeLayer(maplayers.airquality);
    }
  }

  var mapBaseLayer = function(){
    var currentZoom = mapobj.getZoom();
    if(currentZoom > 12 && mapobj.hasLayer(maplayers.satellite)){
      mapobj.removeLayer(maplayers.satellite);
      // mapobj.removeLayer(maplayers.twcounty);
      mapobj.addLayer(maplayers.osm);
    }
    else
    if(currentZoom <= 12 && mapobj.hasLayer(maplayers.satellite) === false){
      mapobj.addLayer(maplayers.satellite);
      // mapobj.addLayer(maplayers.twcounty);
      mapobj.removeLayer(maplayers.osm);
    }
  }

  /**
   * Make a object for osm
   */
  var mapInitLayers = function(){
    var maxZoom = 17;
    var map = L.map(mapid, {
      center: mapopt.latlng,
      zoom: mapopt.zoom,
      maxZoom: 17
    });
    mapobj = map;

    if(!mapobj.hasLayer(maplayers.osm)) {
      layerOsm(map);
    }
    if(!mapobj.hasLayer(maplayers.satellite)) {
      layerSatellite(map);
    }
    if(!mapobj.hasLayer(maplayers.twcounty)) {
      if(!/MSIE/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent) && !/Trident/.test(navigator.userAgent)){
        layerTWCounty(map);
      }
    }
    if(!mapobj.hasLayer(maplayers.factory)) {
      layerFactory(map);
      layerFactoryLabel(map);
    }
    if(!mapobj.hasLayer(maplayers.airquality)) {
      layerAirquality(map);
    }
    
    layerSearch(map);
    mapBaseLayer();

    map.on('dragend', mapMove);
    map.on('zoomend', function(){
      mapMove();
      mapBaseLayer();
    });

    // binding option
    if (o.formBinding) {
      $(o.formBinding).bindings('create')(mapopt);

      // change
      $(o.formBinding).on('model-change', function(e, path, value, model, name, element) {
        hashUpdate(model);
        var status;
        if(path == 'airquality.enabled'){
          status = value ? 'on' : 'off';
          ga('send', 'event', 'map', 'search-airquality', status);
          formControl(model);
        }

        if(path == 'factory.enabled') {
          mapToggleLayer(maplayers.factory, 'remove');
          formControl(model);
        }

        if(path == 'factory.name' ||
           path == 'factory.type' ||
           path == 'factory.poltype' ||
           path == 'factory.fine' ||
           path == 'factory.realtime' ||
           path == 'factory.overhead') {
          model.factory.enabled = 1;
          ga('send', 'event', 'map', 'search-'+path.replace('.', '-'), value);
          mapToggleLayer(maplayers.factory, 'remove');
          formControl(model);
        }
      });
    }
    return map;
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

  var mapToggleLayer = function(layer, action){
    if(action === 'add') {
      mapobj.addLayer(layer);
    }
    else if(mapobj.hasLayer(layer)) {
      if(action === 'remove') {
        mapobj.removeLayer(layer);
      }
    }
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
    if ($("input#copy").length) {
      var location = window.location.href;
      location = location.replace('/#', '/envmap?qt-front_content=0#');
      $("input#copy").val(location);
    }
  }

  /**
   * Help function for get hashtag value
   */
  var hashResolv = function(method){
    var f = window.location.hash.replace(/^#/, '');
    if(f){
      var testjson = /^[\],:{}\s]*$/.test(f.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
      if(testjson){
        var opt = JSON.parse(f);
        if(opt.hasOwnProperty('latlng')){
          // override global opt
          mapopt = opt;
          if (o.formBinding) {
            $(o.formBinding).bindings('update')(mapopt);
          }
        }
      }
    }
    if(method){
      return mapopt[method];
    }
    return mapopt;
  }

  var replaceToken = function(string, token){
    for(var t in token) {
      string = string.replace(t, token[t]);
    }
    return string;
  }

  var mapReset = function(){
    hashResolv();
    hashUpdate(mapopt);
    $('#'+mapid).remove();
    $('<div id="'+mapid+'" class="map"><div id="progress"><div id="progress-bar"></div></div></div>').prependTo(current);

    // initialize map height
    $(".map").height($(window).height() - 80);
    mapInitLayers();
  }

  var formControl = function(model){
    var show;
    var $loading = $('<div class="freeze">');

    // factory layer show hide
    if(model.factory.enabled) {
      show = true;
    }
    else{
      show = false;
    }
    for (var ele in model.factory) {
      var dataModel = 'factory\\.'+ele;
      var $fieldset = $('[data-model='+dataModel+']').closest('fieldset');
      if($fieldset.length) {
        if(show){
          $fieldset.show();
          if(!mapobj.hasLayer(maplayers.factory)) {
            mapToggleLayer(maplayers.factory, 'remove');
            if(!$(o.formBinding).find(".loading").length){
              $loading.prependTo(o.formBinding);
              $loading.height($(o.formBinding).height());
              $loading.width($(o.formBinding).width());
            }
            layerFactory(mapobj);
          }
        }
        else{
          mapToggleLayer(maplayers.factory, 'remove');
          $fieldset.hide();
        }
        break;
      }
    }

    // overhead form element
    dataModel = 'factory\\.overhead';
    $fieldset = $('[data-model='+dataModel+']').closest('fieldset');
    if($fieldset.length){
      if(model.factory.realtime) {
        $fieldset.show();
      }
      else{
        $('[data-model='+dataModel+']').prop('checked', false);
        $('[data-model=factory\\.overhead]').prop('checked', false);
        $fieldset.hide();
      }
    }
    
    // air quality layer control
    if (model.airquality.enabled) {
      mapToggleLayer(maplayers.airquality, 'add');
    }
    else {
      mapToggleLayer(maplayers.airquality, 'remove');
    }
  }

  /**
   * Main function for start map. callback after json loaded
   */
  var mapStart = function(pos){
    if(typeof pos != 'undefined' && typeof pos.coords != 'undefined'){
      mapopt.latlng = [pos.coords.latitude, pos.coords.longitude];
    }

    var resizing = 0;
    $(window).resize(function(){
      if(!resizing){
        resizing = 1;
        window.setTimeout(function(){
          resizing = 0;
          mapReset();
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
  // mapStart();
}

}(jQuery));

