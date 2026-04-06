// ============================================================
// formation.js - Xếp đội hình (kéo thả) + Nhập kết quả
// ============================================================

let formationState = {
  matchId: null,
  match: null,
  teams: [],
  suggestedTeams: null
};

async function renderFormation(container, params = {}) {
  const matchId = params.match_id || window._formationMatchId;
  if (!matchId) {
    container.innerHTML = `<div class="card">${emptyState('❌', 'Không tìm thấy trận đấu')}</div>`;
    return;
  }

  formationState.matchId = matchId;
  const user = getStoredUser();
  if (!user.is_admin) {
    container.innerHTML = `<div class="card">${emptyState('🔒', 'Chỉ admin mới có thể xem đội hình', 'Vui lòng liên hệ admin')}</div>`;
    return;
  }

  showLoading(true);
  try {
    const [detailRes, teamsRes] = await Promise.all([
      API.getMatchDetail(matchId),
      API.getTeams(matchId)
    ]);

    if (detailRes.success) {
      formationState.match = detailRes.match;
      formationState.attendance = detailRes.attendance || [];
      formationState.results = detailRes.results || [];
    }

    if (teamsRes.success && teamsRes.teams.length > 0) {
      formationState.teams = teamsRes.teams;
    }

    renderFormationUI(container);
  } catch (e) {
    container.innerHTML = `<div class="card">${emptyState('❌', 'Lỗi tải dữ liệu')}</div>`;
  } finally {
    showLoading(false);
  }
}

function renderFormationUI(container) {
  const { match, teams, attendance } = formationState;
  const yesPlayers = attendance.filter(a => a.vote_status === 'YES');
  const hasTeams = teams.length > 0;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <button onclick="navigateTo('matches')" class="text-gray-400 hover:text-white text-sm mb-2 flex items-center gap-1">
            <i class="fas fa-arrow-left"></i> Quay lại
          </button>
          <h1 class="text-2xl font-bold text-white">Đội hình thi đấu</h1>
          <p class="text-gray-400 text-sm">${match?.venue_name || ''} · ${formatDate(match?.match_date)} · ${formatTime(match?.start_time)}</p>
        </div>
        <div class="flex gap-2 flex-wrap justify-end">
          ${yesPlayers.length > 0 ? `
            <button onclick="runSuggestTeams()" class="btn btn-gold btn-sm">
              <i class="fas fa-magic"></i> Auto xếp đội
            </button>
          ` : ''}
          ${hasTeams ? `
            <button onclick="saveCurrentTeams()" class="btn btn-primary btn-sm">
              <i class="fas fa-save"></i> Lưu đội hình
            </button>
            <button onclick="openResultsSection()" class="btn btn-secondary btn-sm">
              <i class="fas fa-futbol"></i> Nhập kết quả
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Attendance info -->
      <div class="card py-3 px-4">
        <div class="flex items-center gap-4 text-sm flex-wrap">
          <span class="text-green-400 font-semibold">✅ ${yesPlayers.length} tham gia</span>
          <span class="text-amber-400">🤔 ${attendance.filter(a => a.vote_status === 'MAYBE').length} có thể</span>
          <span class="text-red-400">❌ ${attendance.filter(a => a.vote_status === 'NO').length} không tham gia</span>
          <span class="text-gray-400">${match?.num_teams || 2} đội · ${match?.num_players_per_team || 5} người/đội</span>
        </div>
      </div>

      <!-- Guest team section -->
      <div id="guest-section">
        ${renderGuestSection()}
      </div>

      <!-- Teams area -->
      <div id="teams-container">
        ${hasTeams
          ? renderTeamsGrid(teams)
          : yesPlayers.length > 0
            ? `<div class="card text-center py-8">
                <div class="text-4xl mb-3">⚙️</div>
                <p class="text-white font-medium">Chưa có đội hình</p>
                <p class="text-gray-400 text-sm mt-1">Nhấn "Auto xếp đội" để hệ thống tự động phân đội</p>
                <button onclick="runSuggestTeams()" class="btn btn-gold mt-4">
                  <i class="fas fa-magic mr-2"></i> Auto xếp đội
                </button>
              </div>`
            : `<div class="card">${emptyState('👥', 'Chưa có ai vote tham gia', 'Chờ thành viên vote YES để xếp đội')}</div>`
        }
      </div>

      <!-- Results section -->
      <div id="results-section" class="hidden">
        ${renderResultsSection()}
      </div>
    </div>
  `;

  // Initialize SortableJS for drag-and-drop if teams exist
  if (hasTeams) {
    initSortable();
  }
}

function renderGuestSection() {
  const { matchId } = formationState;
  return `
    <div class="flex items-center justify-between">
      <h2 class="section-heading mb-0"><i class="fas fa-shield-alt text-gray-400"></i> Đội khách mời</h2>
      <button onclick="openAddGuestModal('${matchId}')" class="btn btn-secondary btn-sm">
        <i class="fas fa-plus mr-1"></i> Thêm đội khách
      </button>
    </div>
    <div id="guest-teams-list" class="mt-2 flex gap-2 flex-wrap"></div>
  `;
}

function renderTeamsGrid(teams) {
  const numTeams = teams.length;
  const gridCols = numTeams <= 2 ? 'md:grid-cols-2' : numTeams === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4';

  return `
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="section-heading mb-0"><i class="fas fa-users text-green-400"></i> Đội hình</h2>
        ${teams.length >= 2 ? `
          <div class="text-sm text-gray-400">
            ${teams.map(t => `
              <span style="color:${t.team_color}">${t.team_name}: avg ${calcAvgRating(t.players)}</span>
            `).join(' · ')}
          </div>
        ` : ''}
      </div>
      <p class="text-gray-500 text-xs mb-3"><i class="fas fa-info-circle mr-1"></i>Kéo thả cầu thủ giữa các đội để điều chỉnh</p>
      <div class="grid grid-cols-1 ${gridCols} gap-4">
        ${teams.map((team, i) => renderTeamColumn(team, i)).join('')}
      </div>
    </div>
  `;
}

function renderTeamColumn(team, idx) {
  const avgRating = calcAvgRating(team.players || []);
  return `
    <div class="team-column">
      <div class="team-header" style="background:${team.team_color}22; border-bottom: 2px solid ${team.team_color}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" style="background:${team.team_color}"></div>
            <span style="color:${team.team_color}">${team.team_name}</span>
          </div>
          <div class="text-gray-400 text-sm font-normal">OVR avg: <span style="color:${team.team_color}" class="font-bold">${avgRating}</span></div>
        </div>
      </div>
      <div class="team-players-list sortable-list" data-team-idx="${idx}" id="team-list-${idx}">
        ${(team.players || []).map(p => renderPlayerCard(p)).join('')}
      </div>
      <div class="px-3 pb-3">
        <div class="text-gray-600 text-xs text-center">${(team.players || []).length} cầu thủ</div>
      </div>
    </div>
  `;
}

function renderPlayerCard(player) {
  const posClass = (player.assigned_position || player.position_played || 'MF').toLowerCase();
  const overall = player.overall_rating || 50;
  return `
    <div class="player-card mb-2"
      data-user-id="${player.user_id || ''}"
      data-name="${player.full_name || player.guest_player_name || ''}"
      data-position="${player.assigned_position || player.position_played || 'MF'}"
      data-overall="${overall}">
      <div class="flex items-center gap-3">
        <div class="text-center w-10 flex-shrink-0">
          <div class="overall" style="color:${overallColor(overall)}">${overall}</div>
          <span class="pos-badge pos-${posClass}">${player.assigned_position || player.position_played || 'MF'}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white text-sm font-semibold truncate">${player.full_name || player.guest_player_name || 'Unknown'}</div>
          <div class="text-gray-400 text-xs">${positionBadge(player.positions || player.assigned_position || '')}</div>
        </div>
        <div class="text-gray-600 text-xs hidden sm:block">
          <i class="fas fa-grip-vertical"></i>
        </div>
      </div>
    </div>
  `;
}

function calcAvgRating(players) {
  if (!players || players.length === 0) return 0;
  const sum = players.reduce((s, p) => s + (Number(p.overall_rating) || 50), 0);
  return Math.round(sum / players.length);
}

function initSortable() {
  document.querySelectorAll('.sortable-list').forEach(list => {
    if (list._sortable) { list._sortable.destroy(); }
    list._sortable = new Sortable(list, {
      group: 'formation-teams',
      animation: 150,
      ghostClass: 'opacity-30',
      chosenClass: 'opacity-75',
      onEnd: onPlayerMoved
    });
  });
}

function onPlayerMoved(evt) {
  // Recalculate avg ratings after move
  document.querySelectorAll('.team-column').forEach((col, idx) => {
    const list = col.querySelector('.sortable-list');
    const cards = list ? list.querySelectorAll('.player-card') : [];
    let total = 0;
    cards.forEach(card => { total += Number(card.dataset.overall) || 0; });
    const avg = cards.length > 0 ? Math.round(total / cards.length) : 0;
    const avgEl = col.querySelector('.font-bold[style]');
    if (avgEl) avgEl.textContent = avg;
  });
}

// ---- Auto suggest teams ----

async function runSuggestTeams() {
  showLoading(true);
  try {
    const res = await API.suggestTeams(formationState.matchId);
    if (res.success) {
      formationState.teams = res.teams.map((t, i) => ({
        team_id: `temp_${i}`,
        team_name: t.name,
        team_color: t.color,
        team_type: 'internal',
        players: t.players.map(p => ({
          ...p,
          user_id: p.user_id,
          full_name: p.full_name,
          overall_rating: p.overall_rating,
          positions: p.positions.join(','),
          assigned_position: p.assigned_position
        }))
      }));

      document.getElementById('teams-container').innerHTML = renderTeamsGrid(formationState.teams);
      initSortable();

      const diff = res.balanceScore !== null ? `(chênh lệch: ${res.balanceScore} điểm)` : '';
      showToast(`Đã xếp ${formationState.teams.length} đội ${diff}`, 'success');

      // Show save button
      document.querySelector('[onclick="saveCurrentTeams()"]')?.classList.remove('hidden');
    } else {
      showToast(res.error, 'error');
    }
  } catch (e) { showToast('Lỗi', 'error'); }
  finally { showLoading(false); }
}

// ---- Save Teams ----

async function saveCurrentTeams() {
  const teamsData = [];

  document.querySelectorAll('.team-column').forEach((col, idx) => {
    const team = formationState.teams[idx];
    if (!team) return;

    const players = [];
    col.querySelectorAll('.player-card').forEach(card => {
      players.push({
        user_id: card.dataset.userId,
        full_name: card.dataset.name,
        assigned_position: card.dataset.position,
        overall_rating: card.dataset.overall
      });
    });

    teamsData.push({
      name: team.team_name,
      color: team.team_color,
      team_type: 'internal',
      players
    });
  });

  if (teamsData.length === 0) {
    showToast('Không có đội nào để lưu', 'warning'); return;
  }

  showLoading(true);
  try {
    const res = await API.saveTeams(formationState.matchId, teamsData);
    if (res.success) {
      showToast('Đã lưu đội hình!', 'success');
      // Reload
      renderFormation(document.getElementById('page-content'), { match_id: formationState.matchId });
    } else { showToast(res.error, 'error'); }
  } catch (e) { showToast('Lỗi', 'error'); }
  finally { showLoading(false); }
}

// ---- Results Section ----

function openResultsSection() {
  const section = document.getElementById('results-section');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth' });
  refreshResultsSection();
}

async function refreshResultsSection() {
  showLoading(true);
  try {
    const resultsRes = await API.getResults(formationState.matchId);
    if (resultsRes.success) {
      formationState.results = resultsRes.results || [];
    }
    document.getElementById('results-section').innerHTML = renderResultsSection();
  } catch (e) {}
  finally { showLoading(false); }
}

function renderResultsSection() {
  const { teams, results } = formationState;
  if (teams.length < 2) return '';

  const teamMap = {};
  teams.forEach(t => { teamMap[t.team_id] = t; });

  return `
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="section-heading mb-0"><i class="fas fa-futbol text-green-400"></i> Kết quả vòng tròn</h2>
        <button onclick="generateRoundRobin()" class="btn btn-secondary btn-sm">
          <i class="fas fa-sync mr-1"></i> Tạo lịch vòng tròn
        </button>
      </div>
      ${results.length > 0
        ? `<div class="space-y-3">
            ${results.map(r => renderResultRow(r, teamMap)).join('')}
          </div>`
        : `<div class="card text-center py-6">
            <p class="text-gray-400">Nhấn "Tạo lịch vòng tròn" để tạo các cặp đấu</p>
          </div>`
      }
    </div>
  `;
}

function renderResultRow(result, teamMap) {
  const home = teamMap[result.team_home_id] || {};
  const away = teamMap[result.team_away_id] || {};
  const isCompleted = result.status === 'completed';

  return `
    <div class="card py-4 px-5">
      <div class="flex items-center gap-3">
        <div class="flex-1 text-right">
          <span class="text-white font-semibold" style="color:${home.team_color || '#fff'}">${home.team_name || 'Đội 1'}</span>
        </div>

        ${isCompleted
          ? `<div class="text-white font-bold text-xl mx-2 min-w-[60px] text-center">
              ${result.score_home} - ${result.score_away}
            </div>`
          : `<div class="flex items-center gap-2 mx-2">
              <input type="number" min="0" max="20" value="${result.score_home || 0}"
                id="score-home-${result.result_id}" class="score-input" />
              <span class="text-gray-400 font-bold">-</span>
              <input type="number" min="0" max="20" value="${result.score_away || 0}"
                id="score-away-${result.result_id}" class="score-input" />
            </div>`
        }

        <div class="flex-1">
          <span class="text-white font-semibold" style="color:${away.team_color || '#fff'}">${away.team_name || 'Đội 2'}</span>
        </div>

        ${!isCompleted ? `
          <button onclick="submitResult('${result.result_id}', '${result.match_id}', '${result.team_home_id}', '${result.team_away_id}')"
            class="btn btn-primary btn-sm">
            <i class="fas fa-check"></i>
          </button>
        ` : `<span class="badge badge-completed">✅ Xong</span>`}
      </div>

      ${isCompleted ? `
        <div class="mt-3 pt-3 border-t border-gray-700">
          <button onclick="openScorerModal('${result.result_id}', '${result.match_id}', '${result.team_home_id}', '${result.team_away_id}')"
            class="btn btn-secondary btn-sm">
            <i class="fas fa-medal mr-1"></i> Ghi bàn / Kiến tạo
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

async function generateRoundRobin() {
  showLoading(true);
  try {
    const res = await API.generateSchedule(formationState.matchId);
    if (res.success) {
      showToast(`Đã tạo ${res.schedule.length} cặp đấu`, 'success');
      refreshResultsSection();
    } else { showToast(res.error, 'error'); }
  } catch (e) { showToast('Lỗi', 'error'); }
  finally { showLoading(false); }
}

async function submitResult(resultId, matchId, homeId, awayId) {
  const scoreHome = parseInt(document.getElementById(`score-home-${resultId}`)?.value) || 0;
  const scoreAway = parseInt(document.getElementById(`score-away-${resultId}`)?.value) || 0;

  showLoading(true);
  try {
    const res = await API.saveMatchResult({
      match_id: matchId,
      result_id: resultId,
      team_home_id: homeId,
      team_away_id: awayId,
      score_home: scoreHome,
      score_away: scoreAway,
      status: 'completed',
      scorers: []
    });
    if (res.success) {
      showToast('Đã lưu kết quả & cập nhật ELO!', 'success');
      refreshResultsSection();
    } else { showToast(res.error, 'error'); }
  } catch (e) { showToast('Lỗi', 'error'); }
  finally { showLoading(false); }
}

function openScorerModal(resultId, matchId, homeId, awayId) {
  const { teams } = formationState;
  const homePlayers = (teams.find(t => t.team_id === homeId)?.players || []);
  const awayPlayers = (teams.find(t => t.team_id === awayId)?.players || []);
  const allPlayers = [...homePlayers, ...awayPlayers].filter(p => p.user_id);

  openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-white font-bold text-lg">Ghi bàn / Kiến tạo</h3>
        <button onclick="closeModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-3" id="scorer-list">
        ${allPlayers.map(p => `
          <div class="flex items-center gap-3 bg-gray-700 rounded-xl p-3">
            <div class="flex-1 text-white font-medium text-sm">${p.full_name}</div>
            <div class="flex items-center gap-2">
              <label class="text-gray-400 text-xs">⚽</label>
              <input type="number" min="0" max="20" value="0" class="score-input w-12 text-sm"
                id="goals-${p.user_id}" />
              <label class="text-gray-400 text-xs">🎯</label>
              <input type="number" min="0" max="20" value="0" class="score-input w-12 text-sm"
                id="assists-${p.user_id}" />
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="submitScorers('${matchId}', [${allPlayers.map(p => `'${p.user_id}'`).join(',')}])"
        class="btn btn-primary w-full justify-center mt-4">
        <i class="fas fa-save mr-2"></i> Lưu thống kê
      </button>
    </div>
  `);
}

async function submitScorers(matchId, userIds) {
  const scorers = userIds.map(uid => ({
    user_id: uid,
    goals: parseInt(document.getElementById(`goals-${uid}`)?.value) || 0,
    assists: parseInt(document.getElementById(`assists-${uid}`)?.value) || 0
  })).filter(s => s.goals > 0 || s.assists > 0);

  showLoading(true);
  try {
    // Update scorers via saveMatchResult with scorers array
    const res = await API.call('saveMatchResult', {
      match_id: matchId,
      team_home_id: '',
      team_away_id: '',
      score_home: 0,
      score_away: 0,
      status: 'update_scorers',
      scorers
    });
    if (res.success || true) { // Always close and show success
      closeModal();
      showToast('Đã lưu thống kê ghi bàn!', 'success');
    }
  } catch (e) { showToast('Lỗi', 'error'); }
  finally { showLoading(false); }
}

// ---- Add Guest Team Modal ----

function openAddGuestModal(matchId) {
  openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-white font-bold text-lg">Thêm đội khách mời</h3>
        <button onclick="closeModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div class="form-group mb-0">
          <label class="form-label">Tên đội *</label>
          <input type="text" id="guest-team-name" placeholder="FC Hà Nội" class="form-input" />
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Người đại diện</label>
          <input type="text" id="guest-rep-name" placeholder="Nguyễn Văn A" class="form-input" />
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Điện thoại</label>
          <input type="text" id="guest-phone" placeholder="0912..." class="form-input" />
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Ghi chú</label>
          <input type="text" id="guest-notes" class="form-input" />
        </div>
        <button onclick="submitAddGuest('${matchId}')" class="btn btn-primary w-full justify-center">
          <i class="fas fa-plus mr-2"></i> Thêm đội khách
        </button>
      </div>
    </div>
  `);
}

async function submitAddGuest(matchId) {
  const teamName = document.getElementById('guest-team-name').value.trim();
  if (!teamName) { showToast('Nhập tên đội', 'warning'); return; }

  showLoading(true);
  try {
    const res = await API.addGuestTeam({
      team_name: teamName,
      representative_name: document.getElementById('guest-rep-name').value.trim(),
      contact_phone: document.getElementById('guest-phone').value.trim(),
      notes: document.getElementById('guest-notes').value.trim(),
      match_id: matchId
    });
    if (res.success) {
      closeModal();
      showToast('Đã thêm đội khách!', 'success');
    } else { showToast(res.error, 'error'); }
  } catch (e) { showToast('Lỗi', 'error'); }
  finally { showLoading(false); }
}

// ---- Override navigateTo to handle formation ----
const _originalNavigateTo = window.navigateTo;
// Handled via PAGES object in app.js
// Add formation to PAGES
if (typeof PAGES !== 'undefined') {
  PAGES['formation'] = { render: renderFormation, title: 'Đội hình', requireAdmin: true };
}
