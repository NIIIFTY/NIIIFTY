import config, { EnvironmentType } from "../../niiifty.config";
import urljoin from "url-join";

// is deployed on Vercel
export const isProduction = process.env.NODE_ENV === "production";

const isStaging = config.environment === "staging";

// firebaseConfig won't work if using an env var
export const env: EnvironmentType = isStaging ? "staging" : "default";

const getApiUrl = () => {
  if (isProduction) {
    if (isStaging) {
      return urljoin(config.environments["staging"].site, "api");
    }
    return urljoin(config.environments["default"].site, "api");
  }

  return urljoin(config.localhost, "api");
};

export const api = getApiUrl();
export const firebaseConfig = config.environments[env].firebaseConfig;
export const basicAuthDisabled = config.environments[env].basicAuthDisabled;
export const recaptchaSiteKey = config.environments[env].recaptchaSiteKey;
// export const email = config.environments[env].email;
export const headerTitle = config.environments[env].headerTitle;
export const theme = config.environments[env].theme;
export const site = config.environments[env].site;
export const title = config.environments[env].title;
export const description = config.environments[env].description;
export const maxFileSize = config.environments[env].maxFileSize;
