var maxAccountCount = 20;

function makeTradeStrategy(userId, userSheetUrl) {
  
  var data = new Array(); 

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var record = ss.getSheetByName('Temp Record');  
  
  var currentPrice = getCurrentPrice();
  var userSS = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1OIPXj4zLDTuc2uN7uhQI1PEAGY-i_hhsNci1Wfoz-Yo/edit');
  
  var invest = userSS.getSheetByName('설정').getRange(1, 2).getValue();
  if (invest == '') {
    sendMessage(userId, '투자금을 설정해주세요.');
    return;
  }
  
  var reverageCount = 0;
  var inverseCount = 0;
  
  if (userSS.getSheetByName('KODEX 레버리지').getLastRow() < maxAccountCount + 1) {    
    data[0] = new Date().yyyymmdd();
    data[1] = userId;
    data[2] = 'KODEX 레버리지';
    data[3] = '매수';
    data[4] = currentPrice[0];
    data[5] = Math.floor(userSS.getSheetByName('설정').getRange(1, 2).getValue() / maxAccountCount / 2 / currentPrice[0]);
    record.appendRow(data);
    reverageCount += data[5];
  }  
  
  if (userSS.getSheetByName('일지').getLastRow() > maxAccountCount * 2 + 1) {
    var sellreverage = findSellingCount(userSS, 'KODEX 레버리지', currentPrice[0]);    
    for (var i = 0; i < sellreverage.length; i++) {    
      data[0] = new Date().yyyymmdd();
      data[1] = userId;
      data[2] = 'KODEX 레버리지';
      data[3] = '매도';
      data[4] = sellreverage[i][0];
      data[5] = sellreverage[i][1];
      record.appendRow(data);
      reverageCount -= data[5];
    }
  }  
  
  if (userSS.getSheetByName('KODEX 인버스').getLastRow() < maxAccountCount + 1) {    
    data[0] = new Date().yyyymmdd();
    data[1] = userId;
    data[2] = 'KODEX 인버스';
    data[3] = '매수';
    data[4] = currentPrice[1];
    data[5] = Math.floor(userSS.getSheetByName('설정').getRange(1, 2).getValue() / maxAccountCount / 2 / currentPrice[1]);
    record.appendRow(data);
    inverseCount += data[5];
  } 
  
  if (userSS.getSheetByName('일지').getLastRow() > maxAccountCount * 2 + 1) {
    var sellInverse = findSellingCount(userSS, 'KODEX 인버스', currentPrice[1]);
    for (var i = 0; i < sellInverse.length; i++) {    
      data[0] = new Date().yyyymmdd();
      data[1] = userId;
      data[2] = 'KODEX 인버스';
      data[3] = '매도';
      data[4] = sellInverse[i][0];
      data[5] = sellInverse[i][1];
      record.appendRow(data);
      inverseCount -= data[5];
    }   
  } 
  
  var mesasge;
  if (reverageCount > 0) {
    message = "KODEX 레버리지: " + currentPrice[0].format() + ", 매수 " + reverageCount.format() + "주";
  }
  else if (reverageCount < 0) {
    message = "KODEX 레버리지: " + currentPrice[0].format() + ", 매도 " + (-1 * reverageCount).format() + "주";
  }
  message += "\n";
  
  if (inverseCount > 0) {
    message += "KODEX 인버스: " + currentPrice[1].format() + ", 매수 " + inverseCount.format() + "주";
  }
  else if (inverseCount < 0) {
    message += "KODEX 인버스: " + currentPrice[1].format() + ", 매도 " + (-1 * inverseCount).format() + "주";
  }
  sendMessage(userId, message);
}

function findSellingCount(ss, code, price) {
  
  var empty = new Array();
  
  var ret = new Array();      
  
  var sheet = ss.getSheetByName(code);
  var accountCount = sheet.getLastRow() - 1;
  if (accountCount <= 0) return empty;
  var accounts = sheet.getRange(2, 1, accountCount, 2).getValues();
  
  accounts.sort(function(a, b) { return b[0] == a[0] ? b[1] - a[1] : a[0] - b[0] });
  
  var sellCount = 3;
  if (accountCount > maxAccountCount) sellCount += accountCount - maxAccountCount;
  else if (accountCount < 3) sellCount = accountCount;
  
  empty[0] = '';
  empty[1] = '';
  
  for (var i = 0; i < sellCount; i++) {
    if (accounts[0][0] < price) {
      ret[i] = new Array();
      ret[i][0] = accounts[0][0];
      ret[i][1] = accounts[0][1];
    
      accounts.shift();
      accounts[accountCount - 1] = empty;  
    }    
  }  
  
  sheet.getRange(2, 1, accountCount, 2).setValues(accounts);
  
  return ret;
}

function messageHandler() {
  
  var response = UrlFetchApp.fetch('https://api.telegram.org/bot225251306:AAH6Ppb5twedzjYo8_AynsvWMVZPrxmnXhY/getUpdates');
  var dataAll = JSON.parse(response); 
 
  var count = dataAll['result'].length;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var message = ss.getSheetByName('message');
  var resolvedMessageId = message.getRange(1,1).getValue();
                                                
  for (var i = 0; i < count; i++) {
    if (dataAll['result'][i]['message']['message_id'] > resolvedMessageId) {   
      var message_body = dataAll['result'][i]['message']['text'];
      
      switch (message_body) {
        case '/reverage':
          sendMessage(dataAll['result'][i]['message']['chat']['id'], '레버리지 거래를 등록할 수 있습니다.');
          break;
          
        case '/inverse':
          sendMessage(dataAll['result'][i]['message']['chat']['id'], '인버스 거래를 등록할 수 있습니다.');
          break;
          
        case '/help':
          sendMessage(dataAll['result'][i]['message']['chat']['id'], '현재 탄생 대기중입니다.\n기대해주세요.\n현재 공짜 인프라를 사용중이라 실시간 응대는 불가합니다.\n저는 1분에 한번씩만 고객님의 소리를 귀 기울여 듣습니다.');
          break;
          
        default:
          sendMessage(dataAll['result'][i]['message']['chat']['id'], '명령어만 알아듣습니다.\n더 열심히 노력하겠습니다.\n현재 공짜 인프라를 사용중이라 실시간 응대는 불가합니다.\n저는 1분에 한번씩만 고객님의 소리를 귀 기울여 듣습니다.');
      }      
    }
  }
  
  resolvedMessageId = dataAll['result'][count - 1]['message']['message_id'];
  message.getRange(1,1).setValue(resolvedMessageId);
}

function timeRun() {
  
  var date = new Date();
  if (date.getDay() == 0 || date.getDay() == 6 || isHoliday(date) == true) return;
  if (date.getHours() == 14 && date.getMinutes() == 30) {
    runModel();
  }
}

function runModel() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = ss.getSheetByName('settings');
  var count = settings.getLastRow() - 1; 
  var charIds = settings.getRange(2,2,count,2).getValues();
 
  for (var i = 0; i < count; i++) {    
    if (charIds[i][0] == '163572084') {       
      makeTradeStrategy(charIds[i][0], charIds[i][1]);
    }
  }
}

function getCurrentPrice() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var daum = ss.getSheetByName('daum');
  daum.getRange(1,1).setFormula("=importhtml(\"http://finance.daum.net/quote/all.daum?type=S&stype=P\",\"table\",2)");
  
  var cpSheet = ss.getSheetByName('currentPrice');
  var cp = cpSheet.getRange(1, 1, 2).getValues();
  var currentPrice = new Array();
  currentPrice[0] = cp[0][0];
  currentPrice[1] = cp[1][0]; 
  
  return currentPrice;
}

function sendMessage(charId, message) {
  
  if (message == '') return;
  
  var url = 'https://api.telegram.org/bot225251306:AAH6Ppb5twedzjYo8_AynsvWMVZPrxmnXhY/sendMessage?chat_id=' + charId + '&text=' + encodeURIComponent(message);
  UrlFetchApp.fetch(url);
}

// 빨간날은 주식장이 열리지 않는다.
function isHoliday(date) {
  
  var cal = CalendarApp.getCalendarById("blffot637do35g8hc1hf9a046s@group.calendar.google.com");  
  var events = cal.getEventsForDay(date);  
  
  if (events.length == 0) {
    return false;
  }  
  return true;  
}

// 숫자 타입에서 쓸 수 있도록 format() 함수 추가
Number.prototype.format = function(){
    if(this==0) return 0;
 
    var reg = /(^[+-]?\d+)(\d{3})/;
    var n = (this + '');
 
    while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');
 
    return n;
};
 
// 문자열 타입에서 쓸 수 있도록 format() 함수 추가
String.prototype.format = function(){
    var num = parseFloat(this);
    if( isNaN(num) ) return "0";
 
    return num.format();
};

// yyyymmdd 형태로 포매팅된 날짜 반환
Date.prototype.yyyymmdd = function()
{
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString();
    var dd = this.getDate().toString();


    return yyyy + '-' + (mm[1] ? mm : '0'+mm[0]) + '-' + (dd[1] ? dd : '0'+dd[0]);
}
