/* Set these variables */
// Twitter consumer key, consumer secret, access token, and access token secret
var consumerKey = ''
var consumerSecret = ''
var accessToken = ''
var accessTokenSecret = ''

// Target tweet id of retweets
var tweetId = ''

// Google sheet name to save retweets (default: Sheet1)
var sheetName = 'Sheet1'

/* Do not edit below this line */
function main() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  if (!sheet) {
    Logger.log('Sheet not found: %s', sheetName)
    return
  }
  var lastRow = sheet.getLastRow()
  var savedIds = getIds_(sheet, lastRow)

  var service = twitterService_()
  var response = service.fetch('https://api.twitter.com/1.1/statuses/retweets.json?count=100&id=' + tweetId)
  var content = response.getContentText()
  var retweets = JSON.parse(content)

  Logger.log('Fetched retweets of the tweet %s.', tweetId)

  if (retweets.length) {
    Logger.log('Found %s retweets.', retweets.length)

    var newRetweets = retweets.filter(function(rt) {
      return !savedIds[rt.id_str]
    })
    if (newRetweets.length > 0) {
      saveRetweets_(sheet, newRetweets)
      Logger.log('Saved %s retweets.', newRetweets.length)
    } else {
      Logger.log('There are no new retweets.')
    }
  } else if (retweets.length === 0) {
    Logger.log('There are no retweets.')
  } else {
    Logger.log('There may be an error: %s', content)
  }
}

/**
 * Get saved retweets' ids in the sheet.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Number} lastRow
 * @returns {Object} Object whose keys are retweet ids
 */
function getIds_(sheet, lastRow) {
  if (lastRow === 0) {
    return {}
  }
  var ids = {}
  var values = sheet.getRange(1, 1, lastRow).getValues()
  for (var i = 0; i < values.length; i++) {
    ids[values[i][0]] = true
  }
  return ids
}

/**
 * Insert retweets as rows into the top of the sheet.
 * Columns: retweet_id, careted_at, user_id, user_name, screen_name
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {any[]} retweets
 */
function saveRetweets_(sheet, retweets) {
  sheet.insertRows(1, retweets.length)
  for (var i = 0; i < retweets.length; i++) {
    var rt = retweets[i]
    var values = [rt.id_str, rt.created_at, rt.user.id_str, rt.user.name, rt.user.screen_name]
    var range = sheet.getRange(i + 1, 1, 1, values.length)
    range.setValues([values])
  }
}

function twitterService_() {
  return OAuth1.createService('Twitter')
    .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
    .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
    .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
    .setConsumerKey(consumerKey)
    .setConsumerSecret(consumerSecret)
    .setAccessToken(accessToken, accessTokenSecret)
}
