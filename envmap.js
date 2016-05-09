jQuery(document).ready(function($){
  var factoryDetail = function(e, factory){
    var popup = e.target.getPopup();

    var data = $.getJSON('http://thaubing.gcaa.org.tw/json/factory/' + factory[0], function(json){
      var popupText = '';
      var facility = json.factory[0];

      //工廠名
      popupText += '<div class="factory"><a href="/facility/'+facility.registration_no+'">' + facility.facility_name + '</a></div>';

      //列管類別
      /*
      var poltype = [];
      for (var index in facility) {
        var type = {"is_air":1, "is_water":1, "is_waste":1, "is_toxic":1};
        if (typeof type[index] !== 'undefined') {
          if(facility[index] == 1){
            poltype.push('<span class="' + index + '">' + index + '</span>');
          }
        }
      }
	    popupText += '<div class="type">列管類型：'+ poltype.join(' ') +'</div>';
      */

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
    "twCounty": Drupal.settings.basePath + Drupal.settings.envmap + "/envmap/data/twCounty2010.json",
    "factory": "/envmap/data/{factory.type}_{factory.poltype}_{factory.fine}_{factory.realtime}_{factory.overhead}",
    "factoryPopupCallback": factoryDetail,
    "airquality": "/sites/default/files/airq/realtime.json",
    "formBinding": "#envmap-form"
  });

  //factory & pollution option
  $('select#edit-factory-type').append($('select#edit-industry-name option').clone());
  $('select#edit-factory-poltype').append($('select#edit-poltype option').clone());

  //loading icon
  $("head").append('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">');
  $("#envmap-form .submit-button").append('<i class="fa fa-spinner fa-spin"></i>');
  $(".fa-spinner").hide();
  $("#envmap-form .submit-button").click(function() {
    $(".fa-spinner").show();
    setTimeout(function() { $(".fa-spinner").hide(); }, 1000);
  });

  // $("#block-envmap-mapform").before('<div class="map-description">完整空氣品質測站資料請見<a href="http://taqm.epa.gov.tw/taqm/tw/PsiMap.aspx">行政院環保署空氣品質監測網</a></div>');

  /* override autocomplete dropdown select */
  Drupal.jsAC.prototype.select = function (node) {
    this.input.value = $(node).data('autocompleteValue');
    $(this.input).trigger('autocompleteSelect', [node]);
    
    if($(this.input).attr('id') == 'edit-factory-name') {
      $(this.input).change();
    }
  };

  /**
   * override the suggestions popup and starts a search.
   */
  Drupal.jsAC.prototype.populatePopup = function () {
    var $input = $(this.input);
    var position = $input.position();
    // Show popup.
    if (this.popup) {
      $(this.popup).remove();
    }
    this.selected = false;
    this.popup = $('<div id="autocomplete"></div>')[0];
    this.popup.owner = this;
    $(this.popup).css({
      top: parseInt(position.top + this.input.offsetHeight, 10) + 'px',
      left: parseInt(position.left, 10) + 'px',
      width: $input.innerWidth() + 'px',
      display: 'none'
    });
    $input.before(this.popup);

    // Do search.
    if($input.attr('id') == 'edit-factory-name' && $('#edit-fa').length) {
      this.db.owner = this;
      var params = [];
      $('#edit-fa select, #edit-fa input').each(function(){
        var value;
        if($(this).attr('type') == 'checkbox') {
          value = $(this).is(":checked") ? '1' : '0';
        }
        else{
          value = $(this).val();
        
        }
        params.push(value);
      });
      params = params.join('_').toLowerCase();
      this.db.search(this.input.value+'::'+params);
    }
    else{
      this.db.owner = this;
      this.db.search(this.input.value);
    }
  };
});


