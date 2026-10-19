interface ImportMetaEnv {
  /** The site's name, defined once in `vite/site.ts`. */
  readonly SITE_NAME: string;
  /** The published site's address (origin and path), also on the dev server; see `vite/site.ts`. */
  readonly SITE_URL: string;
  /** La app key de YouVersion (NVI-S y RVES); sin ella esas versiones no se ofrecen. */
  readonly VITE_YVP_APP_KEY?: string;
}
