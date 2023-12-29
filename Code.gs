const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
function doPost(e) {
  let eventData = JSON.parse(e.postData.contents).events[0];
  let replyToken = eventData.replyToken;
  let userId = eventData.source.userId;
  let groupId = eventData.source.groupId;
  let source = eventData.source.type;
  let adaptiveId = ((source == "user") ? userId : groupId);
  let calender = CalendarApp.getCalendarById("ksmucdqse3lp8gap8ntljji3v8@group.calendar.google.com");
  let selfUserId = "Ua050cbd832777e0aef1f4340feee0c17";

  try {
    switch (eventData.type) {
      case "join":
        if (source == "group") {
          reply([{
            'type': 'text',
            'text': '招待ありがとうございます。'
          }, {
            "type": "template",
            "altText": 'グループでホールを予約するにはグループ名の登録が必要となります。',
            "template": {
              "type": "buttons",
              "text": 'グループでホールを予約するにはグループ名の登録が必要となります。\n"/name グループ名"と送信して設定を完了してください。',
              "actions": [{
                "type": "postback",
                "label": "グループ名の登録",
                "data": "null",
                "inputOption": "openKeyboard",
                "fillInText": "/name "
              }]
            }
          }]);
        }
        break;
      case "leave":
        deleteGroupData(groupId);
        break;
      case "message":
        switch (eventData.message.text.split(" ")[0]) {
          case "!ID":
            reply([{
              'type': 'text',
              'text': source + "\n" + groupId + "\n" + userId,
            }]);
            break;
          case "/name":
            let newName = eventData.message.text.slice(6);
            switch (source) {
              case "user":
                updateUserData(userId, newName);
                reply([{
                  'type': 'text',
                  'text': `登録名が"${newName}"に変更されました。`
                }]);
                break;
              case "group":
                if (getGroupData(groupId) == null) {
                  createGroupData(groupId, newName);
                  reply([{
                    'type': 'text',
                    'text': `グループ名を"${newName}"で登録しました。`
                  }, {
                    "type": "template",
                    "altText": '団体予約のためのメニューを表示したい場合は、"!menu"と送信してください。',
                    "template": {
                      "type": "buttons",
                      "text": '団体予約のためのメニューを表示したい場合は、"!menu"と送信してください。',
                      "actions": [{
                        "type": "message",
                        "label": "メニューの表示",
                        "text": "!menu"
                      }]
                    }
                  }]);
                } else {
                  updateGroupData(groupId, newName);
                  reply([{
                    'type': 'text',
                    'text': `グループ名が"${newName}"に変更されました。`
                  }]);
                }
                break;
            }
            break;
          case "!menu":
            if (source == "group") {
              let groupData = getGroupData(groupId);
              if (groupData == null) {
                reply([{
                  "type": "template",
                  "altText": '団体予約メニューを表示するにはグループ名の登録が必要となります。',
                  "template": {
                    "type": "buttons",
                    "text": '団体予約メニューを表示するにはグループ名の登録が必要となります。\n"/name グループ名"と送信して設定を完了してください。',
                    "actions": [{
                      "type": "postback",
                      "label": "グループ名の登録",
                      "data": "null",
                      "inputOption": "openKeyboard",
                      "fillInText": "/name "
                    }]
                  }
                }]);
              } else {
                reply([{
                  "type": "template",
                  "altText": '団体予約メニュー',
                  "template": {
                    "type": "buttons",
                    "title": '団体予約メニュー',
                    "text": 'グループ名：' + groupData[2],
                    "actions": [{
                      "type": "postback",
                      "label": "新規予約",
                      "data": "reserve"
                    }, {
                      "type": "postback",
                      "label": "予約取消",
                      "data": "cancelRequest"
                    }]
                  }
                }]);
              }
              break;
            }
        }
        break;


      case "postback":
        let postbackData = eventData.postback.data
        let userData = getUserData(userId);
        if (postbackData != "null") {
          if (userData == null) {
            if (source == "user") {
              let initUserName = getDisplayName(userId);
              createUserData(userId, initUserName);
              reply([{
                'type': 'text',
                'text': `初回利用時には、名前の登録が必要となります。\n現在「${initUserName}」として仮登録されています。`
              }, {
                "type": "template",
                "altText": '名前を変更したい場合は、\n"/name 新しい名前"を送信してください。\n変更しない場合はこのメッセージを無視してください。',
                "template": {
                  "type": "buttons",
                  "text": '名前を変更したい場合は、\n"/name 新しい名前"を送信してください。',
                  "actions": [{
                    "type": "postback",
                    "label": "登録名の変更",
                    "data": "null",
                    "inputOption": "openKeyboard",
                    "fillInText": "/name "
                  }]
                }
              }]);
            } else {
              reply([{
                'type': 'text',
                'text': `名前が未登録です。\nこのアカウントの個別チャットに移動し、「個人設定」から登録を完了してください。`
              }]);
            }
          } else {
            let adaptiveName = ((source == "user") ? getUserData(userId)[2] : getGroupData(groupId)[2]);
            let startPoint = new Date();
            let endPoint = new Date(startPoint);
            endPoint.setDate(endPoint.getDate() + 15);
            endPoint.setHours(0);
            endPoint.setMinutes(0);
            let futureEvents = calender.getEvents(startPoint, endPoint).filter((event) => (event.getDescription() == adaptiveId));

            switch (eventData.postback.data.split("?")[0]) {
              case "reserve":
                {
                  if (futureEvents.length == 4) {
                    reply([{
                      'type': 'text',
                      'text': `既に4件の予約が入っています。\n5件以上の予約を入れることはできません。`
                    }]);
                  } else {
                    let dateRange = startDateRange()
                    reply([{
                      "type": "template",
                      "altText": "ホール予約の開始日時を選択してください。",
                      "template": {
                        "type": "buttons",
                        "text": "ホール予約の開始日時を選択してください。",
                        "actions": [
                          {
                            "type": "datetimepicker",
                            "label": "開始日時を選択...",
                            "data": "startDate",
                            "mode": "datetime",
                            "initial": dateRange[0],
                            "max": dateRange[1],
                            "min": dateRange[0]
                          }
                        ]
                      }
                    }]);
                  }
                  break;

                }
              case "groupReserve":
                reply([{
                  'type': 'text',
                  'text': 'このアカウントをLINEグループに招待してください。\n招待済みの場合は、"!menu"でメニューを表示できます。'
                }]);
                break;
              case "cancelRequest":
                {
                  if (futureEvents.length == 0) {
                    reply([{
                      'type': 'text',
                      'text': `取り消し可能な予約がありません。`
                    }]);
                  } else {
                    reply([{
                      "type": "template",
                      "altText": "取り消す予約を選択してください。",
                      "template": {
                        "type": "buttons",
                        "text": "取り消す予約を選択してください。",
                        "actions": futureEvents.slice(0, 4).map(function (event) {
                          return ({
                            "type": "postback",
                            "label": Utilities.formatDate(event.getStartTime(), 'Asia/Tokyo', "MM/dd HH:mm") + "～" + Utilities.formatDate(event.getEndTime(), 'Asia/Tokyo', "HH:mm"),
                            "data": "cancel?eventId=" + event.getId(),
                            "inputOption": "openRichMenu"
                          });
                        })
                      }
                    }]);
                  }
                }
                break;
              case "profile":
                reply([{
                  'type': 'text',
                  'text': `登録名：${userData[2]}\n初回利用：${userData[0]}\n最終更新：${userData[1]}`
                }, {
                  "type": "template",
                  "altText": '名前を変更したい場合は、\n"/name 新しい名前"と送信してください。',
                  "template": {
                    "type": "buttons",
                    "text": '名前を変更したい場合は、\n"/name 新しい名前"と送信してください。',
                    "actions": [{
                      "type": "postback",
                      "label": "登録名の変更",
                      "data": "null",
                      "inputOption": "openKeyboard",
                      "fillInText": "/name "
                    }]
                  }
                }]);
                break;
              case "startDate":
                {
                  let startDateString = eventData.postback.params.datetime;
                  // 開始日
                  let startDate = new Date(startDateString);
                  // 最小日
                  let minDate = new Date(startDate);
                  minDate.setMinutes(minDate.getMinutes() + 1)
                  // 最大日
                  let maxDate = new Date(startDate);
                  maxDate.setHours(23);
                  maxDate.setMinutes(59);
                  // 初期日候補
                  let initDateTmp = new Date(startDate);
                  initDateTmp.setHours(initDateTmp.getHours() + 2);
                  let initDate = (initDateTmp > maxDate) ? maxDate : initDateTmp;
                  // 終了日までの時間
                  function timeDelta(d1) {
                    let minutes = Math.floor((d1.getTime() - startDate.getTime()) / (1000 * 60));
                    let hr = Math.floor(minutes / 60);
                    let min = (minutes % 60);
                    return String(hr).padStart(2, "0") + ":" + String(min).padStart(2, "0");
                  }
                  reply([{
                    "type": "template",
                    "altText": "ホール予約の終了時刻・または利用時間を選択してください。",
                    "template": {
                      "type": "buttons",
                      "text": "ホール予約の終了時刻または利用時間を選択してください。\n開始時刻：" + startDateString.replace("T", " "),
                      "actions": [
                        {
                          "type": "datetimepicker",
                          "label": "終了時刻を選択...",
                          "data": "endTime?startDate=" + startDateString,
                          "mode": "time",
                          "initial": Utilities.formatDate(initDate, 'Asia/Tokyo', "HH:mm"),
                          "max": "23:59",
                          "min": Utilities.formatDate(minDate, 'Asia/Tokyo', "HH:mm")
                        },
                        {
                          "type": "datetimepicker",
                          "label": "利用時間を選択...",
                          "data": "duration?startDate=" + startDateString,
                          "mode": "time",
                          "initial": timeDelta(initDate),
                          "max": timeDelta(maxDate),
                          "min": "00:01"
                        }
                      ]
                    }
                  }]);
                  break;
                }
              case "endTime":
                // 終了時刻
                {
                  let startDateString = postbackData.slice(18);
                  let startDate = new Date(startDateString);
                  let endDate = new Date((startDateString.split("T")[0]) + "T" + (eventData.postback.params.time));
                  lastReply(startDate, endDate);
                  break;
                }
              case "duration":
                // 経過時間
                {
                  let startDateString = postbackData.slice(19);
                  let duration = eventData.postback.params.time.split(":").map(function (value) {
                    return Number(value)
                  });
                  let startDate = new Date(startDateString);
                  let endDate = new Date(startDateString);
                  endDate.setHours(endDate.getHours() + duration[0]);
                  endDate.setMinutes(endDate.getMinutes() + duration[1]);
                  lastReply(startDate, endDate)
                  break;
                }
              case "cancel":
                {
                  let eventId = postbackData.slice(15);
                  let eventToCancel = calender.getEventById(eventId);
                  eventToCancel.deleteEvent()
                  reply([{
                    'type': 'text',
                    'text': `予約を取り消しました。`,
                  }]);
                  sendLineNotify(`${adaptiveName}が${Utilities.formatDate(eventToCancel.getStartTime(), 'Asia/Tokyo', "MM/dd HH:mm")}から${Utilities.formatDate(eventToCancel.getEndTime(), 'Asia/Tokyo', "HH:mm")}までのホール予約を取り消しました。`)
                  break;
                }
            }
            function lastReply(startDate, endDate) {
              let conflictedEvents = calender.getEvents(startDate, endDate);
              if (conflictedEvents.length == 0) {
                let startDateStr = Utilities.formatDate(startDate, 'Asia/Tokyo', "yyyy/MM/dd HH:mm");
                let endTimeStr = Utilities.formatDate(endDate, 'Asia/Tokyo', "HH:mm");
                let newEvent = calender.createEvent(adaptiveName + "のホール予約", startDate, endDate, { description: adaptiveId });
                newEvent.removeAllReminders();
                reply([{
                  'type': 'text',
                  'text': `${startDateStr}～${endTimeStr}でホールを予約します。`
                }]);
                sendLineNotify(`${adaptiveName}が${startDateStr}から${endTimeStr}までホールを予約しました。`);
              } else {
                let conflictedEventsStr = conflictedEvents.map(function (event) {
                  return (`${Utilities.formatDate(event.getStartTime(), 'Asia/Tokyo', "yyyy-MM-dd HH:mm")}から${Utilities.formatDate(event.getEndTime(), 'Asia/Tokyo', "HH:mm")}まで${event.getTitle().slice(0, -6)}の予約`);
                }).join("、\n");
                reply([{
                  'type': 'text',
                  'text': conflictedEventsStr + "が入っているため、予約することができません。",
                }]);
              }
            }
          }
        }
        break;
    }
  } catch (error) {
    reply([{
      'type': 'text',
      'text': `エラーが発生しました。\n${error.name} : ${error.message}`,
    }]);
  }
  function reply(content) {
    const options = {
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      'method': 'post',
      'payload': JSON.stringify({
        replyToken: replyToken,
        messages: content
      })
    }
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", options);
  }


  return;
}

function getDisplayName(id) {
  const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
  const options = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    'method': 'get'
  };
  const url = "https://api.line.me/v2/bot/profile/" + id;
  let response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  return response.displayName;
}

function startDateRange() {
  let date1 = new Date();
  let date2 = new Date(date1);
  date2.setDate(date2.getDate() + 14);
  date2.setHours(23);
  date2.setMinutes(58);
  return [date1, date2].map(function (value) {
    return dateToString(value);
  })
}

function dateToString(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', "yyyy-MM-dd/HH:mm").replace("/", "T");
}

function sendLineNotify(message) {
  const options =
  {
    "method": "post",
    "payload": { "message": message },
    "headers": { "Authorization": "Bearer " + PropertiesService.getScriptProperties().getProperty("LINENotifyToken") }
  };
  UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
};

function getCalendars() {
  console.log(CalendarApp.getAllOwnedCalendars().map(function (calender) {
    return [calender.getName(), calender.getId()];
  }))
}

{
  let firestore = FirestoreApp.getFirestore(PropertiesService.getScriptProperties().getProperty("FirestoreClientEmail"), PropertiesService.getScriptProperties().getProperty("FirestorePrivateKey").replace(/\\n/g, "\n"), "hall-manager-9ce85");

  function getUserData(userId) {
    try {
      let doc = firestore.getDocument("users/" + userId);
      let dateCreated = new Date(doc.createTime);
      let dateCreatedStr = Utilities.formatDate(dateCreated, 'Asia/Tokyo', "yyyy-MM-dd HH:mm:ss");
      let dateUpdated = new Date(doc.updateTime);
      let dateUpdatedStr = Utilities.formatDate(dateUpdated, 'Asia/Tokyo', "yyyy-MM-dd HH:mm:ss");

      let name = doc.fields.name.stringValue
      return [dateCreatedStr, dateUpdatedStr, name];
    } catch (e) {
      return null;
    }
  }
  function updateUserData(userId, name) {
    let data = {
      "name": name
    }
    firestore.updateDocument("users/" + userId, data, true);
  }
  function createUserData(userId, name) {
    let data = {
      "name": name
    }
    firestore.createDocument("users/" + userId, data);
  }

  function getGroupData(groupId) {
    try {
      let doc = firestore.getDocument("groups/" + groupId);
      let dateCreated = new Date(doc.createTime);
      let dateCreatedStr = Utilities.formatDate(dateCreated, 'Asia/Tokyo', "yyyy-MM-dd HH:mm:ss");
      let dateUpdated = new Date(doc.updateTime);
      let dateUpdatedStr = Utilities.formatDate(dateUpdated, 'Asia/Tokyo', "yyyy-MM-dd HH:mm:ss");

      let name = doc.fields.name.stringValue;
      return [dateCreatedStr, dateUpdatedStr, name];
    } catch (e) {
      return null;
    }
  }
  function updateGroupData(groupId, name) {
    let data = {
      "name": name
    }
    firestore.updateDocument("groups/" + groupId, data, true);
  }
  function createGroupData(groupId, name) {
    let data = {
      "name": name
    }
    firestore.createDocument("groups/" + groupId, data);
  }
  function deleteGroupData(groupId) {
    firestore.deleteDocument("groups/" + groupId);
  }

}
