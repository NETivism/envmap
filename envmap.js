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
      "twCounty": "/envmap/data/twCounty2010.json",
      "factory": "/sites/default/files/factory/finerealtime.js",
      "factoryPopupCallback": factoryDetail,
      "airquality": "/sites/default/files/airq/realtime.json",
      "toggleFactory": "#edit-factory-distbution",
      "toggleAirquality": "#edit-qualitystation"
   });


//factory & pollution option
   $('select#edit-factory-type').append($('select#edit-industry-name option').clone());
   $('select#edit-factory-poltype').append($('select#edit-poltype option').clone());


//factory select
   $("#edit-factory-distbution").change(function() {
      $("#edit-factory-fine, #edit-factory-realtime, #edit-factory-overhead").prop("checked", false);
   });

//loading icon
   $("head").append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">');
   $("#envmap-form .submit-button").append('<i class="fa fa-spinner fa-spin"></i>');
   $(".fa-spinner").hide();
   $("#envmap-form .submit-button").click(function() {
      $(".fa-spinner").show();
      setTimeout(function() { $(".fa-spinner").hide(); }, 1000);
   });



});


