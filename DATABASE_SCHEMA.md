# Toneri FC - Database Schema (Google Sheets)

## Tổng quan cấu trúc

App deploy trên GitHub Pages (static) + Google Apps Script làm backend API + Google Sheets làm database.

---

## Sheet 1: USERS

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | user_id | STRING | UUID tự sinh (e.g. USR_001) |
| B | username | STRING | Tên đăng nhập (unique) |
| C | password_hash | STRING | SHA-256 hash của password |
| D | full_name | STRING | Tên đầy đủ |
| E | email | STRING | Email |
| F | phone | STRING | Số điện thoại |
| G | is_admin | BOOLEAN | TRUE/FALSE |
| H | positions | STRING | Comma-separated: "FW,MF" hoặc "GK" |
| I | avatar_url | STRING | URL ảnh đại diện (tùy chọn) |
| J | pace | INTEGER | 1-99 (PAC - Tốc độ) |
| K | shooting | INTEGER | 1-99 (SHO - Sút bóng) |
| L | passing | INTEGER | 1-99 (PAS - Chuyền bóng) |
| M | dribbling | INTEGER | 1-99 (DRI - Rê bóng) |
| N | defending | INTEGER | 1-99 (DEF - Phòng thủ) |
| O | physical | INTEGER | 1-99 (PHY - Thể lực) |
| P | gk_diving | INTEGER | 1-99 (Chỉ dùng cho GK - Bắt bóng) |
| Q | gk_handling | INTEGER | 1-99 (Chỉ dùng cho GK - Cầm bóng) |
| R | gk_reflexes | INTEGER | 1-99 (Chỉ dùng cho GK - Phản xạ) |
| S | overall_rating | INTEGER | Tự tính theo công thức (xem bên dưới) |
| T | rating_points | INTEGER | Điểm ELO (mặc định: 1000) |
| U | total_matches | INTEGER | Tổng số trận đã đá |
| V | total_wins | INTEGER | Số trận thắng |
| W | total_losses | INTEGER | Số trận thua |
| X | total_draws | INTEGER | Số trận hòa |
| Y | total_goals | INTEGER | Tổng bàn thắng |
| Z | total_assists | INTEGER | Tổng kiến tạo |
| AA | status | STRING | "active" / "inactive" |
| AB | created_at | DATETIME | Ngày tạo tài khoản |
| AC | last_login | DATETIME | Lần đăng nhập cuối |

**Dữ liệu mặc định Admin:**
- username: admin | password_hash: [hash of "admin123"] | is_admin: TRUE

---

## Sheet 2: MATCHES (Lịch thi đấu)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | match_id | STRING | UUID (e.g. MTH_001) |
| B | match_date | DATE | Ngày đá (YYYY-MM-DD) |
| C | start_time | TIME | Giờ bắt đầu (HH:MM) |
| D | end_time | TIME | Giờ kết thúc (HH:MM) |
| E | venue_name | STRING | Tên sân (e.g. "Sân ABC") |
| F | venue_address | STRING | Địa chỉ sân |
| G | num_players_per_team | INTEGER | 5 / 6 / 7 |
| H | num_teams | INTEGER | 2 / 3 / 4 |
| I | match_format | STRING | "5v5" / "6v6" / "7v7" |
| J | status | STRING | "scheduled" / "ongoing" / "completed" / "cancelled" |
| K | notes | STRING | Ghi chú thêm |
| L | created_by | STRING | user_id của admin tạo |
| M | created_at | DATETIME | Thời điểm tạo |
| N | voting_deadline | DATETIME | Hạn chót vote tham gia |

---

## Sheet 3: MATCH_ATTENDANCE (Vote tham gia)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | attendance_id | STRING | UUID (e.g. ATT_001) |
| B | match_id | STRING | FK → MATCHES.match_id |
| C | user_id | STRING | FK → USERS.user_id |
| D | vote_status | STRING | "YES" / "NO" / "MAYBE" |
| E | note | STRING | Ghi chú của user |
| F | voted_at | DATETIME | Lần vote đầu tiên |
| G | updated_at | DATETIME | Lần cập nhật cuối |

*Unique constraint: (match_id, user_id) - mỗi user chỉ có 1 vote/trận*

---

## Sheet 4: GUEST_TEAMS (Đội khách mời)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | guest_team_id | STRING | UUID (e.g. GST_001) |
| B | team_name | STRING | Tên đội khách |
| C | representative_name | STRING | Tên người đại diện |
| D | contact_phone | STRING | SĐT liên hệ |
| E | match_id | STRING | FK → MATCHES.match_id (đội này đá trận nào) |
| F | notes | STRING | Ghi chú |
| G | created_at | DATETIME | Ngày thêm |

---

## Sheet 5: MATCH_TEAMS (Đội hình trong trận)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | team_id | STRING | UUID (e.g. TMT_001) |
| B | match_id | STRING | FK → MATCHES.match_id |
| C | team_name | STRING | Tên đội (e.g. "Đội Đỏ", "Đội Xanh") |
| D | team_color | STRING | Mã màu hex (e.g. "#FF0000") |
| E | team_type | STRING | "internal" (từ USERS) / "guest" (từ GUEST_TEAMS) |
| F | guest_team_id | STRING | FK → GUEST_TEAMS (nếu là đội khách) |
| G | formation | STRING | "2-1-2" / "2-2-1" / v.v. |
| H | total_score | INTEGER | Tổng bàn thắng trong vòng tròn |
| I | total_wins | INTEGER | Số trận thắng |
| J | total_losses | INTEGER | Số trận thua |
| K | total_draws | INTEGER | Số trận hòa |
| L | created_at | DATETIME | |

---

## Sheet 6: TEAM_PLAYERS (Cầu thủ trong đội hình)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | id | STRING | UUID |
| B | team_id | STRING | FK → MATCH_TEAMS.team_id |
| C | match_id | STRING | FK → MATCHES.match_id |
| D | user_id | STRING | FK → USERS (NULL nếu là người ngoài) |
| E | guest_player_name | STRING | Tên người không có tài khoản |
| F | position_played | STRING | Vị trí thực tế đá trong trận (FW/MF/DF/GK) |
| G | jersey_number | INTEGER | Số áo |
| H | is_captain | BOOLEAN | Đội trưởng |
| I | goals_scored | INTEGER | Bàn thắng trong trận |
| J | assists | INTEGER | Kiến tạo trong trận |
| K | yellow_cards | INTEGER | Thẻ vàng |
| L | red_cards | INTEGER | Thẻ đỏ |
| M | rating_in_match | INTEGER | Đánh giá cầu thủ trong trận (1-10) |

---

## Sheet 7: MATCH_RESULTS (Kết quả từng cặp đấu)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | result_id | STRING | UUID (e.g. RES_001) |
| B | match_id | STRING | FK → MATCHES.match_id |
| C | round_number | INTEGER | Vòng đấu thứ mấy |
| D | team_home_id | STRING | FK → MATCH_TEAMS.team_id |
| E | team_away_id | STRING | FK → MATCH_TEAMS.team_id |
| F | score_home | INTEGER | Bàn thắng đội nhà |
| G | score_away | INTEGER | Bàn thắng đội khách |
| H | status | STRING | "pending" / "ongoing" / "completed" |
| I | started_at | DATETIME | Giờ bắt đầu cặp đấu |
| J | ended_at | DATETIME | Giờ kết thúc |
| K | notes | STRING | Ghi chú |

---

## Sheet 8: RATING_HISTORY (Lịch sử thay đổi chỉ số)

| Cột | Tên cột | Kiểu | Mô tả |
|-----|---------|------|-------|
| A | history_id | STRING | UUID |
| B | user_id | STRING | FK → USERS.user_id |
| C | match_id | STRING | FK → MATCHES.match_id |
| D | result_id | STRING | FK → MATCH_RESULTS.result_id |
| E | change_type | STRING | Xem bảng change_type bên dưới |
| F | points_change | INTEGER | Số điểm thay đổi (+/-) |
| G | rating_before | INTEGER | rating_points trước khi thay đổi |
| H | rating_after | INTEGER | rating_points sau khi thay đổi |
| I | description | STRING | Mô tả chi tiết |
| J | created_at | DATETIME | |

**Các loại change_type:**
- `match_win` → +20 điểm
- `match_loss` → -15 điểm
- `match_draw` → +5 điểm
- `goal_scored` → +3 điểm/bàn
- `assist` → +2 điểm/kiến tạo
- `clean_sheet` → +5 điểm (GK/DF nếu không thủng lưới)
- `mvp` → +10 điểm (được bình chọn)
- `admin_adjust` → +/- tùy admin (điều chỉnh thủ công)

---

## Công thức tính Overall Rating

### Cho FW (Forward):
```
Overall = SHO×0.30 + DRI×0.25 + PAC×0.20 + PAS×0.15 + PHY×0.10
```

### Cho MF (Midfielder):
```
Overall = PAS×0.30 + DRI×0.20 + PHY×0.15 + PAC×0.15 + SHO×0.10 + DEF×0.10
```

### Cho DF (Defender):
```
Overall = DEF×0.35 + PHY×0.25 + PAS×0.15 + PAC×0.15 + DRI×0.10
```

### Cho GK (Goalkeeper):
```
Overall = GK_Reflexes×0.30 + GK_Diving×0.30 + GK_Handling×0.25 + GK_Speed×0.15
```

*Nếu user có nhiều vị trí: tính overall cho từng vị trí, lấy vị trí nào cao nhất làm overall chính.*

---

## Thuật toán Xếp đội (Team Balancing)

### Bước 1: Thu thập dữ liệu
- Lấy danh sách user vote "YES" cho trận đấu
- Lấy overall rating của từng người

### Bước 2: Phân loại theo vị trí
- Nhóm: GK, DF, MF, FW
- Ưu tiên vị trí chính (position đầu tiên trong danh sách)

### Bước 3: Xếp đội bằng Snake Draft
```
Ví dụ 12 người → 2 đội × 6 người:
- Sắp xếp theo overall giảm dần: P1, P2, P3, ..., P12
- Vòng 1: Đội A ← P1, Đội B ← P2
- Vòng 2: Đội B ← P3, Đội A ← P4  (đảo chiều)
- Vòng 3: Đội A ← P5, Đội B ← P6
- ...tiếp tục
```

### Bước 4: Đảm bảo phân bổ vị trí
- Mỗi đội phải có ít nhất 1 GK (nếu có người đăng ký GK)
- Ưu tiên xếp theo sở trường vị trí của từng người

### Bước 5: Tính độ chênh lệch
```
Team Balance Score = |avg_rating(ĐộiA) - avg_rating(ĐộiB)|
Mục tiêu: Score < 5 điểm
```

### Bước 6: Tối ưu (nếu chênh lệch > 5)
- Thử hoán đổi từng cặp cầu thủ giữa 2 đội
- Chọn hoán đổi làm giảm chênh lệch nhất
- Lặp tối đa 10 lần

---

## Hệ thống ELO Points

### Công thức tính điểm kỳ vọng (Expected Score):
```
E_A = 1 / (1 + 10^((R_B - R_A) / 400))
```

### Cập nhật sau trận:
```
R_new = R_old + K × (S - E)

Trong đó:
- K = 30 (hệ số thay đổi)
- S = 1 (thắng), 0.5 (hòa), 0 (thua)
- E = điểm kỳ vọng tính từ rating trung bình 2 đội
```

### Bonus cố định:
- Mỗi bàn thắng: +3 điểm
- Mỗi kiến tạo: +2 điểm  
- Clean sheet (GK): +5 điểm
- MVP bình chọn: +10 điểm

---

## Luồng dữ liệu tổng thể

```
[Admin tạo MATCHES]
        ↓
[Users vote → MATCH_ATTENDANCE]
        ↓
[Admin chốt đội hình → MATCH_TEAMS + TEAM_PLAYERS]
  (kéo thả trên UI, ghi đè suggestion của thuật toán)
        ↓
[Đá vòng tròn → cập nhật MATCH_RESULTS từng cặp]
        ↓
[Nhập bàn thắng, kiến tạo → cập nhật TEAM_PLAYERS]
        ↓
[Kết thúc trận → tự động tính ELO → RATING_HISTORY]
        ↓
[Cập nhật USERS: rating_points, total_matches, total_wins...]
```

---

## Quyền truy cập

| Chức năng | User | Admin |
|-----------|------|-------|
| Đăng ký/đăng nhập | ✅ | ✅ |
| Xem lịch thi đấu | ✅ | ✅ |
| Vote tham gia | ✅ | ✅ |
| Sửa vote của mình | ✅ | ✅ |
| Tự set chỉ số ban đầu | ✅ (1 lần) | ✅ |
| Tạo/sửa lịch thi đấu | ❌ | ✅ |
| Thêm đội khách | ❌ | ✅ |
| Xếp và chỉnh đội hình | ❌ | ✅ |
| Nhập kết quả trận đấu | ❌ | ✅ |
| Chỉnh chỉ số cầu thủ | ❌ | ✅ |
| Xem bảng xếp hạng | ✅ | ✅ |
| Xem lịch sử thi đấu | ✅ | ✅ |
