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

  // copy
  $('#copy-label, #copy, #copy-link').click(function(){
    $('input#copy').select();
  });

  // $("#block-envmap-mapform").before('<div class="map-description">完整空氣品質測站資料請見<a href="http://taqm.epa.gov.tw/taqm/tw/PsiMap.aspx">行政院環保署空氣品質監測網</a></div>');

  // introjs
  var intro = introJs();
  intro.setOptions({
    "nextLabel": ' → ',
    "prevLabel": ' ←  ',
    "skipLabel": "略過",
    "doneLabel": "結束",
    "steps": [
      { 
        intro: "歡迎來到透明足跡網站！政府開放了107家企業，共316根煙道的連續自動監測資料。"
      },
      {
        element: document.querySelector('#quicktabs-front_content li.first'),
        position: 'bottom',
        intro: "你可以從這裡選擇要用「環境地圖」以地圖的方式搜尋，或者是用「事業單位查詢」以列表的方式搜尋這些企業的環境資料。"
      },
      {
        element: document.querySelector('#envmap-form'),
        position: 'right',
        intro: "環境地圖以地址或企業名稱搜尋時，亦可依據「工廠類型」、「排放類型」、「有無裁罰記錄」、「有無自動連續監測數據」，「最近一個月的連續自動監測數據有無超標」等做篩選。亦可選擇是否顯示空氣品質測站（PM2.5）的資料。"
      },
      {
        element: document.querySelector('#edit-realtime'),
        position: 'top',
        intro: '你可以直接篩選超標的紀錄，來進行下一步'
      },
      {
        element: document.querySelector('#mapgcaa'),
        position: 'left',
        intro: '點選地圖上呈現的搜尋結果，可進入到企業基本資料、連續自動監測數據及裁罰記錄的頁面。'
      },
      {
        element: document.querySelector('#menu-734-1'),
        position: 'bottom',
        intro: '查詢不到要找的污染企業，表示政府監測數量不足，你可以在這邊通報污染訊息，作為我們一起要求政府擴大監測的基礎。'
      }
    ]
  });
  intro.onchange(function(ele) {
    if (typeof ele.id !== 'undefined') {
      switch(ele.id) {
        case 'edit-realtime':
          $('#edit-factory-overhead').trigger('click');
          break;
      }
    }
  });
  intro.onafterchange(function(ele) {
    if (typeof ele.id !== 'undefined') {
      switch(ele.id) {
        case 'edit-realtime':
          window.setTimeout(function(){
            if (factoryPoints.length) {
              var name = factoryPoints[0][1];
              if (name) {
                $('#edit-factory-name').val(name).trigger('change');
              }
            }
          }, 1000); 
          break;
      }
    }
  });

  intro.start();

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


