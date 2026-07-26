; ---------------------------------------------------------------------------
; TelegramFreeRich — NSIS customisation
;
; Upgrading over an existing installation used to dead-end with two dialogs:
;
;   "Failed to uninstall old application files. Please try running the
;    installer again.: 2"
;   "TelegramFreeRich cannot be closed. Please close it manually and click
;    Retry to continue."
;
; Both come from the *previous* version's uninstaller, which the new installer
; runs before copying files. That uninstaller checks whether
; TelegramFreeRich.exe is running; if it cannot close it, it exits with code 2,
; and electron-builder's default handling turns any non-zero code into a hard
; abort of the whole installation. A single leftover process — a crashed copy,
; a Chromium helper, or a second window the app used to allow — is enough to
; make the app permanently un-upgradable.
;
; Two changes fix that from the new installer's side:
;   1. close the app ourselves, before the old uninstaller ever looks, and
;   2. never abort the install because the old uninstaller was unhappy; the
;      new files are written over the old ones either way.
; ---------------------------------------------------------------------------

; Close every TelegramFreeRich process. Politely first, so the app can flush
; its encrypted settings, then by force.
;
; The installer itself is named "TelegramFreeRich Setup <version>.exe" and the
; uninstaller runs as a copy in %TEMP%, so neither matches /IM and neither can
; kill itself here.
!macro tfrCloseApp
  DetailPrint "Closing ${PRODUCT_NAME} if it is running..."

  nsExec::Exec `"$SYSDIR\taskkill.exe" /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $0
  Sleep 1200

  ; /T also takes the GPU, utility and renderer children Chromium spawns —
  ; they hold the same files open as the main process.
  nsExec::Exec `"$SYSDIR\taskkill.exe" /F /T /IM "${APP_EXECUTABLE_FILENAME}"`
  Pop $0
  Sleep 600
!macroend

!macro customInit
  !insertmacro tfrCloseApp
!macroend

!macro customUnInit
  !insertmacro tfrCloseApp
!macroend

; Replaces the default "MessageBox + SetErrorLevel 2 + Quit" handling of the
; old uninstaller's exit code. A failed uninstall leaves stale files behind,
; which is worth a line in the details log — but it is not a reason to refuse
; to install the new version.
!macro tfrHandleUninstallResult
  IfErrors 0 +3
    DetailPrint "Could not run the previous uninstaller — installing over the existing files."
    Return

  ${if} $R0 != 0
    DetailPrint "Previous uninstaller reported error code $R0 — installing over the existing files."
  ${endif}
!macroend

!macro customUnInstallCheck
  !insertmacro tfrHandleUninstallResult
!macroend

!macro customUnInstallCheckCurrentUser
  !insertmacro tfrHandleUninstallResult
!macroend
