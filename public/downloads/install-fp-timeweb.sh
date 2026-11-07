#!/usr/bin/env bash
# Install the reviewed FP Group release into an existing Timeweb document root.
set -Eeuo pipefail
umask 077

FP_RELEASE=6aefdc1
FP_ARCHIVE_URL="https://raw.githubusercontent.com/thekingooo/site/${FP_RELEASE}/public/downloads/fp-group-evercoat.zip"
FP_ARCHIVE_SHA256=2ee49a9a108c39029ee12a3347431ae366e7b14aeacea567c5d3021df3dc61e5

fail() { printf 'ОШИБКА: %s\n' "$*" >&2; exit 1; }
[[ $# -eq 1 ]] || fail 'Укажите один аргумент: полный путь к public_html.'
[[ "$1" = /* && -d "$1" && ! -L "$1" ]] || fail 'Папка сайта должна существовать и не быть символической ссылкой.'
fp_site_root=$(cd -- "$1" && pwd -P)
[[ "${fp_site_root##*/}" = public_html ]] || fail 'Ожидается папка с именем public_html.'
fp_parent=${fp_site_root%/*}
[[ -w "$fp_parent" && -x "$fp_parent" ]] || fail 'Нет доступа на запись в родительскую папку сайта.'
for fp_tool in curl sha256sum unzip mktemp mkdir mv cp chmod rm; do
  command -v "$fp_tool" >/dev/null 2>&1 || fail "Не найдена команда $fp_tool. Файлы сайта не изменены."
done

fp_stage=''
fp_backup=''
cleanup() {
  local fp_status=$?
  trap - EXIT INT TERM HUP
  # Restore the previous root if activation failed after moving it to backup.
  if [[ -n "$fp_backup" && -d "$fp_backup/public_html" && ! -e "$fp_site_root" && ! -L "$fp_site_root" ]]; then
    if mv -- "$fp_backup/public_html" "$fp_site_root"; then
      printf 'Предыдущая папка сайта восстановлена.\n' >&2
    else
      printf 'Резервная копия сохранена здесь: %s/public_html\n' "$fp_backup" >&2
      fp_status=1
    fi
  fi
  if [[ -n "$fp_stage" && -d "$fp_stage" ]]; then rm -rf -- "$fp_stage"; fi
  exit "$fp_status"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

fp_stage=$(mktemp -d "$fp_parent/.fp-stage.XXXXXXXX")
printf 'Скачиваем FP Group (%s) для %s\n' "$FP_RELEASE" "$fp_site_root"
curl --fail --location --show-error --retry 2 --connect-timeout 20 --max-time 600 \
  "$FP_ARCHIVE_URL" --output "$fp_stage/site.zip"
printf '%s  %s\n' "$FP_ARCHIVE_SHA256" "$fp_stage/site.zip" | sha256sum --check --status \
  || fail 'Контрольная сумма архива не совпала. Файлы сайта не изменены.'
mkdir "$fp_stage/public_html"
unzip -q "$fp_stage/site.zip" -d "$fp_stage/public_html"
[[ -s "$fp_stage/public_html/index.html" && -d "$fp_stage/public_html/assets" && -d "$fp_stage/public_html/media" ]] \
  || fail 'В архиве не найдены необходимые файлы сайта.'
# Retain certificate validation files managed by the hosting provider.
if [[ -e "$fp_site_root/.well-known" || -L "$fp_site_root/.well-known" ]]; then
  cp -a -- "$fp_site_root/.well-known" "$fp_stage/public_html/"
fi
chmod 755 "$fp_stage/public_html"

fp_backup=$(mktemp -d "$fp_parent/.fp-backup.XXXXXXXX")
printf 'FP Group release: %s\nArchive SHA256: %s\nDocument root: %s\n' \
  "$FP_RELEASE" "$FP_ARCHIVE_SHA256" "$fp_site_root" > "$fp_backup/DEPLOYMENT.txt"
mv -- "$fp_site_root" "$fp_backup/public_html"
mv -- "$fp_stage/public_html" "$fp_site_root"

printf '\nГОТОВО: файлы сайта установлены.\n'
printf 'Папка сайта: %s\n' "$fp_site_root"
printf 'Предыдущие файлы: %s/public_html\n' "$fp_backup"
printf 'Теперь откройте технический адрес сайта в панели Timeweb.\n'
printf 'Форма пока подготавливает письмо; автоматическая отправка через SMTP ещё не подключена.\n'
