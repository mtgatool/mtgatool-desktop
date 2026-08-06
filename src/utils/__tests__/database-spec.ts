/* eslint-env jest */
import database from "../mtga/database";
import request from "../request";
import testSeedDatabase from "../testSeedDatabase";

testSeedDatabase();

interface Latest {
  latest: string;
  lang: string;
  updated: number;
  size: number;
}

it("is updated", async () => {
  const response = await request("https://mtgatool.com/api/database/latest");
  const latestDb: Latest | undefined = JSON.parse(response);
  const version = latestDb ? parseInt(latestDb.latest, 10) : 0;
  expect(database.version).toBeGreaterThan(version - 10);
});
