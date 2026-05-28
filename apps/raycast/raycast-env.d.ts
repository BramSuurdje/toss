/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API URL - Toss API base URL (no trailing slash) */
  "apiUrl": string,
  /** Web App URL - Toss web app origin used for share links */
  "webUrl": string,
  /** Link validity - How long the share link stays available */
  "retention": "15m" | "30m" | "1h" | "3h" | "12h" | "24h" | "3d" | "7d"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `share-file` command */
  export type ShareFile = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `share-file` command */
  export type ShareFile = {}
}

