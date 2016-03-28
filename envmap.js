jQuery(document).ready(function($){
  var factoryDetail = function(e, factory){
    var popup = e.target.getPopup();
    jQuery.getJSON('http://thaubing.gcaa.org.tw/json/factory/' + factory[0], function(popupJson){
      var popupText = '';
      for (var index in popupJson["factory"][0]) {
        popupText += index + ':' + popupJson["factory"][0][index] + '<br>';
      }
      popup.setContent(popupText);
      popup.update();
    });
  }

   $("#block-envmap-mapform").envmap({
      "control": "#edit-submit",
      "factory": "/sites/default/files/factory/finerealtime.js",
      "factoryPopupCallback": factoryDetail,
      "airQuality": "/sites/default/files/airq/realtime.json",
      "toggleFactory": "#edit-factory-distbution",
      "toggleAirq": "#edit-qualitystation"
   });


   $('select#edit-factory-type').append($('select#edit-industry-name option').clone());
   $('select#edit-factory-poltype').append($('select#edit-poltype option').clone());


});


