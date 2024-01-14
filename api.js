export default class API {
  static API_URL = "http://localhost:4200";

  static fetchPrices(start, end) {
    return fetch(
      this.API_URL + "/prices" + "?start=" + start + "&end=" + end
    ).then((res) => res.json());
  }
}
