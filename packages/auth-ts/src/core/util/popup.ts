/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getUA } from '@firebase/util';
import { AUTH_ERROR_FACTORY, AuthErrorCode } from '../errors';

const BASE_POPUP_OPTIONS_ = {
  location: 'yes',
  resizable: 'yes',
  statusbar: 'yes',
  toolbar: 'no'
};

const DEFAULT_WIDTH_ = 500;
const DEFAULT_HEIGHT_ = 600;

const CHROME_IOS_UA_ = 'crios/';
const FIREFOX_UA_ = 'firefox/';
const FIREFOX_EMPTY_URL_ = 'http://localhost';

export class AuthPopup {
  public associatedEvent: string | null = null;

  private constructor(public readonly window: Window) {}

  close() {
    try {
      this.window.close();
    } catch (e) {}
  }

  static open(
    url?: string,
    name?: string,
    width = DEFAULT_WIDTH_,
    height = DEFAULT_HEIGHT_
  ): AuthPopup {
    const top = Math.min(
      (window.screen.availHeight - height) / 2,
      0
    ).toString();
    const left = Math.min((window.screen.availWidth - width) / 2, 0).toString();
    let target = '';

    const options: { [key: string]: string } = {
      ...BASE_POPUP_OPTIONS_,
      width: width.toString(),
      height: height.toString(),
      top,
      left
    };

    // Chrome iOS 7 and 8 is returning an undefined popup win when target is
    // specified, even though the popup is not necessarily blocked.
    const ua = getUA().toLowerCase();

    if (name) {
      target = ua.includes(CHROME_IOS_UA_) ? '_blank' : name;
    }

    if (ua.includes(FIREFOX_UA_)) {
      // Firefox complains when invalid URLs are popped out. Hacky way to bypass.
      url = url || FIREFOX_EMPTY_URL_;
      // Firefox disables by default scrolling on popup windows, which can create
      // issues when the user has many Google accounts, for instance.
      options.scrollbars = 'yes';
    }

    let optionsString = '';
    for (const option of Object.keys(options)) {
      optionsString += `${option}=${options[option]},`;
    }

    // TODO: Plain-old window.open isn't going to work for iOS, need to fix this
    //       (see goog.window.open)

    // about:blank getting sanitized causing browsers like IE/Edge to display
    // brief error message before redirecting to handler.
    const newWin = window.open(url || '', target, optionsString);
    if (newWin) {
      // Flaky on IE edge, encapsulate with a try and catch.
      try {
        newWin.focus();
      } catch (e) {}
    } else {
      throw AUTH_ERROR_FACTORY.create(AuthErrorCode.POPUP_BLOCKED, {
        appName: ''
      });
    }

    return new AuthPopup(newWin);
  }
}
