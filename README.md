# 🚀 全端個人作品集網站 (React + Express + SQLite/JSON DB)

這是一個結合現代化視覺美學與互動式應用的全端 Web 專案。採用黑底霓虹科技風（Neon Glassmorphic Style）進行介面設計，並整合了完整的會員系統、互動式打地鼠挑戰與留言板。

---

## 🌟 專案核心功能

### 1. 🔑 完整會員認證系統
- **註冊與登入**：採用密碼學雜湊加密（Bcrypt.js）保障密碼安全，並結合 JSON Web Token (JWT) 作為連線憑證。
- **持久化狀態**：登入後 Token 儲存於 `localStorage`，重新整理網頁無需重新登入。
- **身分識別連動**：登入會員在留言板或提交分數時會顯示「已驗證會員」專屬標記，且留言時自動關聯會員稱呼。

### 2. 🎮 打地鼠挑戰 & 排行榜
- **多種地鼠類型**：包含金地鼠（+50分）、銀地鼠（+20分）、一般地鼠（+10分）與黑炸彈地鼠（扣10分），並附帶精美漂浮分數動畫。
- **難度漸進**：地鼠出現頻率與存留時間會隨著遊戲剩餘時間縮短而逐漸加速。
- **全域排行榜 (TOP 10)**：結算時可提交分數。會員玩家可免填名一鍵上傳，並在排行榜名稱旁展示發光的「★」標章。

### 3. 💬 留言板 (Guestbook)
- 訪客與會員可以留下名字與內容，留言將會儲存於資料庫中。
- 會員發表的留言會帶有漸變發光的「會員」專屬徽章。
- 支援流暢的滾動載入與輸入聚焦發光特效。

### 4. 🎨 個人客製化與主題設定
- **色彩切換器**：支援 6 種不同的霓虹發光色系（Cyan 藍綠、Purple 紫色、Pink 粉紅、Green 綠色、Orange 橘色、Yellow 黃色）一鍵切換。
- **深淺模式切換**：支援「科技深色」與「極簡淺色」主題，並針對淺色模式的彩度進行高對比度優化，確保字體清晰易讀。

---

## 🛠️ 技術棧

- **前端 (Frontend)**：
  - React 19
  - TypeScript
  - Vite (前端打包與開發伺服器)
  - Lucide React (現代化圖標)
  - 原生 CSS (Glassmorphism 玻璃擬物設計系統)

- **後端 (Backend)**：
  - Node.js (Express.js 框架)
  - BcryptJS (密碼加密)
  - JsonWebToken (身份驗證憑證)

- **資料庫 (Database)**：
  - **雙模防錯驅動**：預設使用 **SQLite** 檔案資料庫。若系統環境（如 Windows）缺少 C++ 編譯器導致 `sqlite3` 安裝失敗，系統會**自動無縫切換**為純 JavaScript 實作的 `db.json` 檔案資料庫，確保在任何電腦上都能 100% 成功執行且不遺失功能。

---

## 💻 快速開始與執行步驟

由於 Windows PowerShell 預設的安全原則可能會停用指令檔執行，導致執行 `npm` 發生權限錯誤，請依照下列步驟執行：

### 1. 安裝專案依賴
在專案根目錄下，開啟終端機執行：
```powershell
npm.cmd install
```
*(使用 `.cmd` 結尾能自動繞過 PowerShell 對 `.ps1` 的安全性限制)*

### 2. 同時啟動前端與後端 (推薦 🚀)
在終端機中執行：
```powershell
npm.cmd run dev:all
```
啟動成功後，即可使用瀏覽器訪問：
- **前端網頁：** [http://localhost:5173/-/](http://localhost:5173/-/)
- **後端伺服器：** `http://localhost:3001`

---

## 📝 常用開發指令一覽

| 功能 | 繞過限制指令 (推薦 Windows) | 一般指令 (Linux/MacOS 或已解禁環境) |
| :--- | :--- | :--- |
| 安裝依賴套件 | `npm.cmd install` | `npm install` |
| 同時啟動前後端 | `npm.cmd run dev:all` | `npm run dev:all` |
| 單獨啟動前端 (Vite) | `npm.cmd run dev` | `npm run dev` |
| 單獨啟動後端 (Express) | `npm.cmd run server` | `npm run server` |

> 💡 **小撇步 (解除 Windows 終端機限制)**：
> 如果不想每次都輸入 `.cmd`，可以先在 PowerShell 執行以下指令，解除當前終端機視窗的執行管制：
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
> 解除後，您就可以在這個視窗內直接使用 `npm run dev:all` 等一般指令了！
