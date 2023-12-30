let content = {
  "size": {
    "width": 2400,
    "height": 1600
  },
  "selected": true,
  "name": "default",
  "chatBarText": "メニュー",
  "areas": [
    {
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 800,
        "height": 800
      },
      "action": {
        "type": "postback",
        "data": "groupReserve",
        "displayText": "団体予約"
      }
    }, {
      "bounds": {
        "x": 800,
        "y": 0,
        "width": 800,
        "height": 800
      },
      "action": {
        "type": "postback",
        "data": "reserve",
        "displayText": "新規予約"
      }
    }, {
      "bounds": {
        "x": 1600,
        "y": 0,
        "width": 800,
        "height": 800
      },
      "action": {
        "type": "postback",
        "data": "cancelRequest",
        "displayText": "予約取消"
      }
    }, {
      "bounds": {
        "x": 0,
        "y": 800,
        "width": 800,
        "height": 800
      },
      "action": {
        "type": "postback",
        "data": "profile",
        "displayText": "個人設定"
      }
    }, {
      "bounds": {
        "x": 800,
        "y": 800,
        "width": 800,
        "height": 800
      },
      "action": {
        "type": "uri",
        "label": "予約一覧",
        "uri": "https://toho-mlm.github.io/reservation/#%E7%8F%BE%E5%9C%A8%E3%81%AE%E4%BA%88%E7%B4%84%E7%8A%B6%E6%B3%81"
      }
    }, {
      "bounds": {
        "x": 1600,
        "y": 800,
        "width": 800,
        "height": 800
      },
      "action": {
        "type": "uri",
        "label": "ヘルプ",
        "uri": "https://toho-mlm.github.io/reservation/#%E4%BD%BF%E3%81%84%E6%96%B9"
      }
    }
  ]
};

let richMenuId = "richmenu-dd5c26e370def12a4ab9a01d91fb4571"

function getRichMenuList() {
  let apiUrl = "https://api.line.me/v2/bot/richmenu/list";

  var headers = {
    "Authorization": "Bearer " + token
  };

  var options = {
    "method": "get",
    "headers": headers
  };

  var response = UrlFetchApp.fetch(apiUrl, options);

  Logger.log(response.getContentText());
}

function validateRichMenu() {
  let apiUrl = "https://api.line.me/v2/bot/richmenu/validate";

  let headers = {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  };

  let options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(content)
  };

  let response = UrlFetchApp.fetch(apiUrl, options);
  Logger.log(response.getContentText());
}


function createRichMenu() {
  let apiUrl = "https://api.line.me/v2/bot/richmenu";

  let headers = {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  };

  let options = {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(content)
  };
  var response = UrlFetchApp.fetch(apiUrl, options).getContentText();
  Logger.log(response)
}


function uploadRichMenuContent() {
  let imageUrl = "https://github.com/Toho-MLM/hall-reserve-bot/blob/main/richMenu.png?raw=true";
  let apiUrl = "https://api-data.line.me/v2/bot/richmenu/" + richMenuId + "/content";

  let headers = {
    'Content-Type': 'image/png',
    'Authorization': 'Bearer ' + token
  };
  let imageBlob = UrlFetchApp.fetch(imageUrl).getAs("image/png");
  let options = {
    "method": "post",
    "headers": headers,
    "payload": imageBlob
  };
  let response = UrlFetchApp.fetch(apiUrl, options);

  Logger.log(response.getContentText());
}

function assignRichMenuToAllUsers() {
  let apiUrl = "https://api.line.me/v2/bot/user/all/richmenu/" + richMenuId;

  let headers = {
    "Authorization": "Bearer " + token
  };

  let options = {
    "method": "post",
    "headers": headers
  };

  let response = UrlFetchApp.fetch(apiUrl, options);
  Logger.log(response.getContentText());
}

function deleteRichMenu() {
  let apiUrl = "https://api.line.me/v2/bot/richmenu/" + richMenuId;

  let headers = {
    "Authorization": "Bearer " + token
  };

  let options = {
    "method": "delete",
    "headers": headers
  };

  let response = UrlFetchApp.fetch(apiUrl, options);

  Logger.log(response.getContentText());
}

function linkRichMenuToUser(userId, richMenuId) {
  let apiUrl = "https://api.line.me/v2/bot/user/" + userId + "/richmenu/" + richMenuId;
  let headers = {
    "Authorization": "Bearer " + token
  };
  let options = {
    "method": "post",
    "headers": headers
  };
  let response = UrlFetchApp.fetch(apiUrl, options);
  Logger.log(response.getContentText());
}


function unlinkRichMenuToUser(userId) {
  let apiUrl = "https://api.line.me/v2/bot/user/" + userId + "/richmenu";
  let headers = {
    "Authorization": "Bearer " + token
  };
  let options = {
    "method": "delete",
    "headers": headers
  };
  let response = UrlFetchApp.fetch(apiUrl, options);
  Logger.log(response.getContentText());
}
