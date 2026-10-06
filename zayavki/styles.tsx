import { jsx } from '@app/html-jsx'

const css = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #f4f6fb;
  color: #1c2437;
}
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}
.page__title {
  margin: 0 0 6px;
  font-size: 26px;
  line-height: 1.2;
}
.page__subtitle {
  margin: 0 0 20px;
  color: #5c6780;
  font-size: 15px;
}
.page__nav {
  margin: 0 0 18px;
  font-size: 14px;
}
.page__nav a { color: #2a6cf6; text-decoration: none; }
.page__nav a:hover { text-decoration: underline; }
.card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(28, 36, 55, 0.08);
  overflow: hidden;
}
.chat__head {
  padding: 18px 20px;
  border-bottom: 1px solid #eef1f7;
}
.chat__head h1 { margin: 0 0 4px; font-size: 18px; }
.chat__head p { margin: 0; color: #6b7590; font-size: 13px; }
.chat__feed {
  padding: 18px 20px;
  height: 52vh;
  min-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fbfcfe;
}
.chat__hint { color: #8b94ab; font-size: 14px; margin: 0; }
.msg { display: flex; }
.msg--mine { justify-content: flex-end; }
.msg__bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 15px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg--agent .msg__bubble {
  background: #ffffff;
  border: 1px solid #e6eaf3;
  border-bottom-left-radius: 4px;
}
.msg--mine .msg__bubble {
  background: #2a6cf6;
  color: #ffffff;
  border-bottom-right-radius: 4px;
}
.msg__pending { opacity: 0.6; font-size: 12px; }
.chat__start {
  align-self: center;
  margin-top: 8px;
}
.chat__form {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid #eef1f7;
  background: #ffffff;
}
.chat__input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  font-size: 15px;
  color: inherit;
  border: 1px solid #dbe1ee;
  border-radius: 12px;
  outline: none;
}
.chat__input:focus { border-color: #2a6cf6; }
.button {
  display: inline-block;
  padding: 12px 18px;
  font-size: 15px;
  font-family: inherit;
  text-decoration: none;
  border: 0;
  border-radius: 12px;
  background: #2a6cf6;
  color: #ffffff;
  cursor: pointer;
}
.button:hover { background: #1c58d8; }
.button[disabled] { background: #b9c6e4; cursor: default; }
.button--ghost { background: #eef2fb; color: #2a6cf6; }
.button--ghost:hover { background: #e2e9fa; }
.notice {
  padding: 12px 20px;
  font-size: 13px;
  color: #a4551a;
  background: #fff6e8;
  border-top: 1px solid #ffe6c7;
}
.table-wrap { overflow-x: auto; }
.leads {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.leads th, .leads td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eef1f7;
  vertical-align: top;
}
.leads th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #7b8399;
  background: #fbfcfe;
  white-space: nowrap;
}
.leads tr:last-child td { border-bottom: 0; }
.leads__phone { white-space: nowrap; }
.leads__date { color: #6b7590; white-space: nowrap; font-size: 13px; }
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  background: #eef2fb;
  color: #2a6cf6;
}
.badge--progress { background: #fff6e8; color: #a4551a; }
.badge--done { background: #e9f7ef; color: #1f7a46; }
.status-group { display: flex; gap: 6px; }
.status-btn {
  font-family: inherit;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid #dbe1ee;
  background: #ffffff;
  color: #5c6780;
  cursor: pointer;
  white-space: nowrap;
}
.status-btn:hover { border-color: #2a6cf6; color: #2a6cf6; }
.status-btn[disabled] { opacity: 0.6; cursor: default; }
.status-btn--active { background: #2a6cf6; border-color: #2a6cf6; color: #ffffff; }
.status-btn--active:hover { color: #ffffff; }
.status-btn--in_progress.status-btn--active { background: #f0a13a; border-color: #f0a13a; }
.status-btn--done.status-btn--active { background: #22a06b; border-color: #22a06b; }
.button--small { padding: 6px 12px; font-size: 12px; border-radius: 999px; }
.row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.brand { margin: 0 0 18px; }
.brand__logo { display: block; max-height: 64px; max-width: 240px; }
.brand__name { font-size: 20px; font-weight: 600; letter-spacing: 0.01em; color: #1c2437; }
.form__block { display: flex; flex-direction: column; gap: 8px; }
.logo-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.logo-preview { max-height: 56px; max-width: 200px; }
.logo-placeholder {
  display: inline-block;
  padding: 10px 14px;
  border: 1px dashed #dbe1ee;
  border-radius: 10px;
  color: #8b94ab;
  font-size: 14px;
}
.logo-upload { position: relative; overflow: hidden; cursor: pointer; }
.logo-upload input[type='file'] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #eef1f7;
}
.toolbar__count { font-size: 14px; color: #6b7590; }
.toolbar__actions { display: flex; gap: 10px; }
.leads__none { color: #b3bacb; }
.empty { padding: 36px 20px; text-align: center; color: #8b94ab; }
.form { padding: 20px; display: flex; flex-direction: column; gap: 18px; }
.form__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.form__label { font-size: 14px; color: #5c6780; }
.form__input {
  font-family: inherit;
  font-size: 15px;
  color: inherit;
  padding: 10px 12px;
  border: 1px solid #dbe1ee;
  border-radius: 10px;
  background: #ffffff;
}
.form__input:focus { outline: none; border-color: #2a6cf6; }
.form__input--time { width: 120px; }
.form__input--select { width: auto; }
.form__fieldset { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 12px; }
.form__fieldset legend { margin-bottom: 10px; padding: 0; }
.form__check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid #dbe1ee;
  border-radius: 10px;
  cursor: pointer;
}
.form__actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.form__hint { font-size: 13px; color: #7b8399; }
.form__saved { margin: 0; font-size: 14px; color: #1f7a46; }
.form--inline { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 10px; }
.form__input--grow { flex: 1; min-width: 220px; }
.form__input--price { width: 140px; }
.page__section { margin: 28px 0 6px; font-size: 20px; }
`

export function Styles() {
  return <style>{css}</style>
}
