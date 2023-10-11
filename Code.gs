function doPost(e) {
  const token = PropertiesService.getScriptProperties().getProperty("LINEToken");
  let eventData = JSON.parse(e.postData.contents).events[0];
  let replyToken = eventData.replyToken;
  let eventType = eventData.type
  let userId = eventData.source.userId;
  let userName = getDisplayName(userId);
  let calender = CalendarApp.getCalendarById("ksmucdqse3lp8gap8ntljji3v8@group.calendar.google.com");

  if (eventData.source.type == "user") {
    switch (eventData.type) {
      case "message":
        switch (eventData.message.text) {
          case "!ID":
            reply([{
              'type': 'text',
              'text': eventData.source.type + "\n" + eventData.source.groupId + "\n" + eventData.source.userId,
            }]);
            break;
          case "!reserve":
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
            break;
          case "!cancel":
            let startPoint = new Date();
            let endPoint = new Date(startPoint);
            endPoint.setDate(endPoint.getDate() + 15);
            endPoint.setHours(0);
            endPoint.setMinutes(0);
            let futureEvents = calender.getEvents(startPoint, endPoint).filter((event) => (event.getDescription().slice(13) == userId));
            if (futureEvents.length == 0) {
              reply([{
                'type': 'text',
                'text': `予約がないため取り消すことができません。`
              }]);
            } else {
              reply([{
                "type": "template",
                "altText": "取り消す予約を選択してください。",
                "template": {
                  "type": "buttons",
                  "text": "取り消す予約を選択してください。" + (futureEvents.length <= 4 ? "" : "\n4件以上の予約があるため、5件目以降が非表示になっています。"),
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

            break;
        }
        break;
      case "postback":
        let postbackData = eventData.postback.data
        if (postbackData == "startDate") {
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
          }, {
            'type': 'text',
            'text': "選択後、処理に時間がかかることがあります。30秒経っても返信がない場合は、もう1度お試しください。",
          }]);
        } else if (postbackData.startsWith("endTime?startDate=")) {
          // 終了時刻
          let startDateString = postbackData.slice(18);
          let startDate = new Date(startDateString);
          let endDate = new Date((startDateString.split("T")[0]) + "T" + (eventData.postback.params.time));
          lastReply(startDate, endDate);
        } else if (postbackData.startsWith("duration?startDate=")) {
          // 経過時間
          let startDateString = postbackData.slice(19)
          let duration = eventData.postback.params.time.split(":").map(function (value) {
            return Number(value)
          });
          let startDate = new Date(startDateString);
          let endDate = new Date(startDateString);
          endDate.setHours(endDate.getHours() + duration[0]);
          endDate.setMinutes(endDate.getMinutes() + duration[1]);
          lastReply(startDate, endDate)
        } else if (postbackData.startsWith("cancel")) {
          let eventId = postbackData.slice(15);
          let eventToCancel = calender.getEventById(eventId);
          eventToCancel.deleteEvent()
          reply([{
            'type': 'text',
            'text': `予約を取り消しました。`,
          }]);
          sendLineNotify(`${userName}が${Utilities.formatDate(eventToCancel.getStartTime(), 'Asia/Tokyo', "MM/dd HH:mm")}から${Utilities.formatDate(eventToCancel.getEndTime(), 'Asia/Tokyo', "HH:mm")}までのホール予約を取り消しました。`)
        }
        function lastReply(startDate, endDate) {
          let conflictedEvents = calender.getEvents(startDate, endDate);
          if (conflictedEvents.length == 0) {
            let startDateStr = Utilities.formatDate(startDate, 'Asia/Tokyo', "yyyy/MM/dd HH:mm");
            let endTimeStr = Utilities.formatDate(endDate, 'Asia/Tokyo', "HH:mm");
            let newEvent = calender.createEvent(userName + "のホール予約", startDate, endDate, { description: "User LINE ID:" + userId });
            newEvent.removeAllReminders();
            reply([{
              'type': 'text',
              'text': `${startDateStr}～${endTimeStr}でホールを予約します。`
            }]);
            sendLineNotify(`${userName}が${startDateStr}から${endTimeStr}までホールを予約しました。`);
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
        break;
    }
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

function getCalendars(){
  console.log(CalendarApp.getAllOwnedCalendars().map(function (calender) {
    return [calender.getName() ,calender.getId()];
  }))
}
