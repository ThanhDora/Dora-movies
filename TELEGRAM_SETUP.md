# Hướng dẫn thiết lập Telegram Bot

## Bước 1: Tạo Bot Telegram

1. Mở Telegram và tìm kiếm `@BotFather`
2. Gửi lệnh `/newbot`
3. Đặt tên cho bot (ví dụ: `Dora Movies Bot`)
4. Đặt username cho bot (phải kết thúc bằng `bot`, ví dụ: `doramovies_bot`)
5. BotFather sẽ cung cấp cho bạn một **Bot Token** (dạng: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Bước 2: Lấy Chat ID

1. Gửi một tin nhắn bất kỳ cho bot bạn vừa tạo
2. Truy cập URL sau (thay `YOUR_BOT_TOKEN` bằng token bạn nhận được):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Tìm `"chat":{"id":123456789}` trong kết quả trả về
4. Số `123456789` chính là **Chat ID** của bạn

## Bước 3: Cấu hình Environment Variables

Thêm vào file `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## Bước 4: Thiết lập Webhook hoặc Polling

### Cách 1: Setup Webhook (Khuyến nghị cho production)

Sau khi deploy ứng dụng lên Vercel:

1. **Tự động setup** (sau khi deploy):
   - Đăng nhập admin
   - Gọi API: `POST /api/telegram/setup-webhook`
   - Hoặc truy cập URL này trong trình duyệt (đã đăng nhập admin)

2. **Setup thủ công**:
   - Thay `YOUR_BOT_TOKEN` và `YOUR_DOMAIN`:
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook
   ```

### Cách 2: Dùng Polling (Cho localhost/testing)

Nếu bạn đang chạy trên localhost và không thể dùng webhook:

1. Gửi `/start` cho bot trên Telegram
2. Gọi API: `POST /api/telegram/polling` (phải đăng nhập admin)
3. Bot sẽ check và trả lời tin nhắn `/start`

**Lưu ý**: Polling chỉ check tin nhắn khi bạn gọi API, không tự động như webhook.

## Bước 5: Deploy

Nếu bạn đang deploy trên Vercel:
1. Vào Settings → Environment Variables
2. Thêm `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`
3. Redeploy ứng dụng
4. Sau khi deploy xong, gọi `/api/telegram/setup-webhook` để setup webhook

## Chức năng

Bot sẽ tự động gửi thông báo về:
- 🚨 **Lỗi hệ thống**: Khi có lỗi xảy ra trong ứng dụng
- 🎬 **Phim mới**: Khi có phim mới được đồng bộ (tối đa 10 phim đầu tiên)
- 👤 **Người dùng mới**: Khi có người đăng ký tài khoản mới
- 🤖 **Trả lời /start**: Bot sẽ chào mừng khi bạn gửi lệnh `/start`
