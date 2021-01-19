import { AdminApi, Configuration } from "@ory/hydra-client";
import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";

const hydraAdmin = new AdminApi(
  new Configuration({
    basePath: String(process.env.HYDRA_ADMIN_URL),
  })
);

const db = new JsonDB(
  new Config(String(process.env.DB_LOCATION), true, false, "/")
);

export { hydraAdmin, db };
