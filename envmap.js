jQuery(document).ready(function($){
  var factoryDetail = function(e, factory){
    var popup = e.target.getPopup();

    var data = jQuery.getJSON('http://thaubing.gcaa.org.tw/json/factory/' + factory[0], function(popupJson){
      var popupText = '';
//      for (var index in popupJson["factory"][0]) {
//	var ar = ["registration_no", "facility_name", "penalty_date","penalty_money"];
//	if(jQuery.inArray(index, ar) != -1){
//           popupText += index + ':' + popupJson["factory"][0][index] + '<br>';}
//      }

      //紀錄筆數
      var cnt = 0;
      for (var record in popupJson["factory"]){
        cnt++;
      }
      console.log(cnt);

      //工廠名
      popupText += '<div class="factory">' + popupJson["factory"][0]["facility_name"] + '</div>';

      //列管類別
      for (var index in popupJson["factory"][0]) {
         var type = ["is_air", "is_water", "is_waste", "is_toxic"];
         if(jQuery.inArray(index, type) != -1){
            if(popupJson["factory"][0][index] == 1){
	       popupText += '<div class="' + index + '">' + index + '</div>';
            }
         }
      }

      //所屬公司
      popupText += '<div class="owner">所屬公司：' + popupJson["factory"][0]["corp_name"] + '</div>';

      //最近開罰紀錄
      popupText += '<div class="recent">最近一次開罰紀錄：' + popupJson["factory"][cnt-1]["penalty_date"] + ' - ' + popupJson["factory"][cnt-1]["penalty_money"] + '元</div>';

      //開罰總額
      var money = 0;
      for(var i = 0; i < cnt; i++){
         money += parseInt(popupJson["factory"][i]["penalty_money"]);
      }
      popupText += '<div class="statement">共被開罰</div><div class="focus">' + cnt + '</div><div class="statement">次，' + '合計</div><div class="focus">' + money + '</div><div class="statement">元</div>';
 

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


