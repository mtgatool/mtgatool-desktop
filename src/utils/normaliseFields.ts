import _ from "lodash";

/* eslint-disable no-param-reassign */
export default function normaliseFields(object: any): any {
  if (typeof object == "object") {
    if (Array.isArray(object)) {
      return _.transform(object, (result: any, value: any, key: number) => {
        result[key] = normaliseFields(value);
      });
    }
    return _.transform(object, (result: any, value: any, key: string) => {
      result[key.replace(/List$/, "")] = normaliseFields(value);
    });
  }
  return object;
}
