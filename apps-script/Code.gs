// ============================================================
// Code.gs - Main Router: doGet / doPost
// ============================================================

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'Toneri FC API is running 🟢' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    const action = data.action;

    if (!action) {
      return respond(error('Missing action'));
    }

    let result;

    switch (action) {
      // ---- Auth ----
      case 'login':           result = login(data); break;
      case 'register':        result = register(data); break;
      case 'logout':          result = logout(data); break;
      case 'getProfile':      result = getProfile(data); break;
      case 'updateProfile':   result = updateProfile(data); break;
      case 'updateUserStats': result = updateUserStats(data); break;
      case 'getUsers':        result = getUsers(data); break;
      case 'adminUpdateUser': result = adminUpdateUser(data); break;

      // ---- Matches ----
      case 'createMatch':     result = createMatch(data); break;
      case 'getMatches':      result = getMatches(data); break;
      case 'getUpcomingMatches': result = getUpcomingMatches(data); break;
      case 'updateMatch':     result = updateMatch(data); break;
      case 'deleteMatch':     result = deleteMatch(data); break;
      case 'getMatchDetail':  result = getMatchDetail(data); break;

      // ---- Attendance ----
      case 'vote':            result = vote(data); break;
      case 'getAttendance':   result = getAttendance(data); break;
      case 'getMyVote':       result = getMyVote(data); break;

      // ---- Guest Teams ----
      case 'addGuestTeam':    result = addGuestTeam(data); break;
      case 'getGuestTeams':   result = getGuestTeams(data); break;
      case 'deleteGuestTeam': result = deleteGuestTeam(data); break;

      // ---- Team Formation ----
      case 'suggestTeams':    result = suggestTeams(data); break;
      case 'saveTeams':       result = saveTeams(data); break;
      case 'getTeams':        result = getTeams(data); break;

      // ---- Results ----
      case 'saveMatchResult': result = saveMatchResult(data); break;
      case 'getResults':      result = getResults(data); break;
      case 'generateSchedule': result = generateRoundRobinSchedule(data); break;
      case 'addMatchResult':  result = addMatchResult(data); break;
      case 'deleteMatchResults': result = deleteMatchResults(data); break;
      case 'deleteMatchResult': result = deleteMatchResult(data); break;

      // ---- Ratings ----
      case 'getLeaderboard':  result = getLeaderboard(data); break;
      case 'getRatingHistory': result = getRatingHistory(data); break;
      case 'awardMVP':        result = awardMVP(data); break;
      case 'adminAdjustRating': result = adminAdjustRating(data); break;

      default:
        result = error(`Unknown action: ${action}`);
    }

    return respond(result);

  } catch (err) {
    Logger.log('Error in doPost: ' + err.message + '\n' + err.stack);
    return respond(error(err.message));
  }
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Keep-Warm: Ngăn GAS "ngủ" để tránh cold start 2-5 giây
//
// SETUP (làm 1 lần sau khi deploy):
//   1. Vào Apps Script Editor → biểu tượng đồng hồ (Triggers) ở sidebar trái
//   2. Nhấn "+ Add Trigger" (góc dưới phải)
//   3. Cấu hình:
//      - Function: keepWarm
//      - Event source: Time-driven
//      - Type: Minutes timer
//      - Interval: Every 4 minutes
//   4. Save → Authorize nếu được yêu cầu
//
// Kết quả: GAS luôn "warm", cold start từ 2-5s → <500ms
// ============================================================
function keepWarm() {
  Logger.log('[Keep-Warm] ping at ' + new Date().toISOString());
}
