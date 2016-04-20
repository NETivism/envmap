jQuery(document).ready(function($){
  var factoryDetail = function(e, factory){
    var popup = e.target.getPopup();

    var data = jQuery.getJSON('http://thaubing.gcaa.org.tw/json/factory/' + factory[0], function(json){
      var popupText = '';
      var facility = json.factory[0];

      //工廠名
      popupText += '<div class="factory"><a href="/facility/'+facility.registration_no+'">' + facility.facility_name + '</a></div>';

      //列管類別
      for (var index in facility) {
        var type = ["is_air", "is_water", "is_waste", "is_toxic"];
        if (typeof type[index] !== 'undefined') {
          if(facility[index] == 1){
	          popupText += '<div class="type">列管類型：<span class="' + index + '">' + index + '</span></div>';
          }
        }
      }

      //所屬公司
      if(facility.corp_id.length) {
        popupText += '<div class="owner">所屬公司：<a href="/corp/'+facility.corp_id+'">' + facility.corp_name + '</a></div>';
      }
      else{
        popupText += '<div class="owner">所屬公司：' + facility.corp_name + '</div>';
      }

      //最近開罰紀錄
      popupText += '<div class="recent">最近一次開罰紀錄：' + facility.penalty_date_last + ' - ' + facility.penalty_money_last + '元</div>';

      //開罰總額
      popupText += '<div class="statement">共被開罰</div><div class="focus">' + facility.penalty_count + '</div><div class="statement">次，' + '合計</div><div class="focus">' + facility.penalty_money + '</div><div class="statement">元</div>';

      popupText += '<div class="more"><a href="/facility/'+facility.registration_no+'">&raquo; 更多詳情</a></div>';
 
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


