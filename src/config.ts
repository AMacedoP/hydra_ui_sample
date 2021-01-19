import { AdminApi, Configuration } from "@oryd/hydra-client";

const hydraAdmin = new AdminApi(
  new Configuration({
    basePath: String(process.env.HYDRA_ADMIN_URL),
  })
);

export { hydraAdmin };
