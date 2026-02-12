"use client";

import { useState } from "react";

export default function TelegramTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function testBot() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage("✅ Đã gửi tin nhắn test thành công! Kiểm tra Telegram của bạn.");
      } else {
        setMessage(`❌ Lỗi: ${data.error || "Không thể gửi tin nhắn"}`);
      }
    } catch (e) {
      setMessage(`❌ Lỗi: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkPolling() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/telegram/polling", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Đã xử lý ${data.processed || 0} tin nhắn. Nếu bạn đã gửi /start, bot sẽ trả lời ngay!`);
      } else {
        setMessage(`❌ Lỗi: ${data.error || "Không thể check tin nhắn"}`);
      }
    } catch (e) {
      setMessage(`❌ Lỗi: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function setupWebhook() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/telegram/setup-webhook", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage(`✅ Webhook đã được setup thành công!\nURL: ${data.webhookUrl}\n\nBây giờ bot sẽ tự động trả lời khi bạn gửi /start!`);
      } else {
        setMessage(`❌ Lỗi: ${data.error || "Không thể setup webhook"}`);
      }
    } catch (e) {
      setMessage(`❌ Lỗi: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={testBot}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#e6b800] hover:bg-[#d4a800] text-[#0a0a0c] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang gửi..." : "Test Bot (Gửi tin nhắn)"}
        </button>
        <button
          onClick={checkPolling}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang check..." : "Check Tin Nhắn (/start)"}
        </button>
        <button
          onClick={setupWebhook}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Đang setup..." : "Setup Webhook (Tự động)"}
        </button>
      </div>
      {message && (
        <div className={`mt-2 px-4 py-2 rounded-lg text-sm ${
          message.includes("✅") 
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
