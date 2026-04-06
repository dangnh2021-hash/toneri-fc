// ============================================================
// Setup.gs - Khởi tạo Google Sheets và dữ liệu mặc định
// Chạy hàm setupSpreadsheet() một lần duy nhất để tạo DB
// ============================================================

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetsConfig = {
    'USERS': [
      'user_id', 'username', 'password_hash', 'full_name', 'email', 'phone',
      'is_admin', 'positions', 'avatar_url',
      'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical',
      'gk_diving', 'gk_handling', 'gk_reflexes',
      'overall_rating', 'rating_points',
      'total_matches', 'total_wins', 'total_losses', 'total_draws',
      'total_goals', 'total_assists',
      'status', 'created_at', 'last_login', 'session_token', 'token_expiry'
    ],
    'MATCHES': [
      'match_id', 'match_date', 'start_time', 'end_time',
      'venue_name', 'venue_address',
      'num_players_per_team', 'num_teams', 'match_format',
      'status', 'notes', 'created_by', 'created_at', 'voting_deadline'
    ],
    'MATCH_ATTENDANCE': [
      'attendance_id', 'match_id', 'user_id', 'vote_status', 'note', 'voted_at', 'updated_at'
    ],
    'GUEST_TEAMS': [
      'guest_team_id', 'team_name', 'representative_name', 'contact_phone',
      'match_id', 'notes', 'created_at'
    ],
    'MATCH_TEAMS': [
      'team_id', 'match_id', 'team_name', 'team_color', 'team_type',
      'guest_team_id', 'formation', 'total_score', 'total_wins', 'total_losses', 'total_draws', 'created_at'
    ],
    'TEAM_PLAYERS': [
      'id', 'team_id', 'match_id', 'user_id', 'guest_player_name',
      'position_played', 'jersey_number', 'is_captain',
      'goals_scored', 'assists', 'yellow_cards', 'red_cards', 'rating_in_match'
    ],
    'MATCH_RESULTS': [
      'result_id', 'match_id', 'round_number', 'team_home_id', 'team_away_id',
      'score_home', 'score_away', 'status', 'started_at', 'ended_at', 'notes'
    ],
    'RATING_HISTORY': [
      'history_id', 'user_id', 'match_id', 'result_id', 'change_type',
      'points_change', 'rating_before', 'rating_after', 'description', 'created_at'
    ]
  };

  const existingNames = ss.getSheets().map(s => s.getName());

  Object.entries(sheetsConfig).forEach(([name, headers]) => {
    let sheet;
    if (existingNames.includes(name)) {
      sheet = ss.getSheetByName(name);
    } else {
      sheet = ss.insertSheet(name);
    }
    // Chỉ ghi header nếu sheet trống
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#166534');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
  });

  // Xóa Sheet1 mặc định nếu còn tồn tại
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  // Tạo admin mặc định
  createDefaultAdmin();

  const result = { success: true, message: 'Setup hoàn tất!', spreadsheetId: ss.getId() };
  Logger.log(JSON.stringify(result));
  return result;
}

function createDefaultAdmin() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
  const data = sheet.getDataRange().getValues();

  // Kiểm tra admin đã tồn tại chưa
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'admin') {
      Logger.log('Admin đã tồn tại');
      return;
    }
  }

  const adminRow = [
    'USR_ADMIN_001',
    'admin',
    hashPassword('admin123'),
    'Administrator',
    'admin@tonerifc.com',
    '',
    true,            // is_admin
    'FW,MF,DF,GK',  // positions
    '',              // avatar_url
    70, 70, 70, 70, 70, 70,  // PAC, SHO, PAS, DRI, DEF, PHY
    70, 70, 70,               // GK_DIV, GK_HAN, GK_REF
    70,              // overall_rating
    1000,            // rating_points
    0, 0, 0, 0,      // total_matches, wins, losses, draws
    0, 0,            // total_goals, assists
    'active',
    new Date().toISOString(),
    '',              // last_login
    '',              // session_token
    ''               // token_expiry
  ];

  sheet.appendRow(adminRow);
  Logger.log('Admin user đã được tạo: admin / admin123');
}
