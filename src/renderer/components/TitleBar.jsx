/**
 * TitleBar — frameless-window chrome: draggable strip, a connection dot with
 * settings/preview toggles on the leading side and the window controls on the
 * trailing side (hidden on macOS, where the native traffic lights are used).
 *
 * @module components/TitleBar
 */

import { useEffect, useState } from 'react';
import {
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  PreviewIcon,
  RestoreIcon,
  SettingsIcon,
} from './Icons.jsx';
import { useI18n } from '../i18n/index.js';

/**
 * @param {{
 *   tokenSet: boolean,
 *   previewOpen: boolean,
 *   onTogglePreview: () => void,
 *   onOpenSettings: () => void,
 * }} props
 */
export default function TitleBar({ tokenSet, previewOpen, onTogglePreview, onOpenSettings }) {
  const { t } = useI18n();
  const [maximized, setMaximized] = useState(false);
  const platform = (window.app && window.app.platform) || 'linux';
  const showControls = platform !== 'darwin';

  useEffect(() => {
    if (!window.app || !window.app.win) return undefined;
    let cancelled = false;
    window.app.win
      .isMaximized()
      .then((value) => {
        if (!cancelled) setMaximized(!!value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const win = (action) => async () => {
    if (!window.app || !window.app.win) return;
    if (action === 'maximize') {
      const next = await window.app.win.toggleMaximize();
      setMaximized(!!next);
      return;
    }
    window.app.win[action]();
  };

  return (
    <div className="titlebar">
      <div className="titlebar-lead">
        <button
          type="button"
          className="tl-btn"
          title={t('titlebar.settings')}
          aria-label={t('titlebar.settings')}
          onClick={onOpenSettings}
        >
          <SettingsIcon size={15} />
          <span className={`tl-dot${tokenSet ? ' on' : ''}`} />
        </button>
        <button
          type="button"
          className={`tl-btn${previewOpen ? ' active' : ''}`}
          title={t('titlebar.preview')}
          aria-label={t('titlebar.preview')}
          onClick={onTogglePreview}
        >
          <PreviewIcon size={15} />
        </button>
      </div>

      <div className="titlebar-drag" />

      {showControls && (
        <div className="titlebar-controls">
          <button
            type="button"
            className="win-btn"
            title={t('window.minimize')}
            aria-label={t('window.minimize')}
            onClick={win('minimize')}
          >
            <MinimizeIcon />
          </button>
          <button
            type="button"
            className="win-btn"
            title={maximized ? t('window.restore') : t('window.maximize')}
            aria-label={maximized ? t('window.restore') : t('window.maximize')}
            onClick={win('maximize')}
          >
            {maximized ? <RestoreIcon /> : <MaximizeIcon />}
          </button>
          <button
            type="button"
            className="win-btn close"
            title={t('window.close')}
            aria-label={t('window.close')}
            onClick={win('close')}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}
