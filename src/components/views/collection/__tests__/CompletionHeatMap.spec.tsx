import { render } from "@testing-library/react";
import { Provider } from "react-redux";

import store from "../../../../redux/stores/rendererStore";
import CompletionHeatMap from "../CompletionHeatMap";

/**
 * A set with no statistics has no card data, and this used to index straight
 * into it — which threw out of the whole collection view rather than showing an
 * empty grid. It happened for real whenever the selected set's Arena code
 * differs from its paper one (Dominaria is DAR to Arena, DOM on paper): the
 * stats lookup missed, and the section rendered anyway because `a && b` is
 * `undefined`, not `false`, and Section only hides on an exact `false`.
 */
function draw(cardData?: any) {
  // The card cells read hover state from the store.
  return render(
    <Provider store={store}>
      <CompletionHeatMap cardData={cardData} />
    </Provider>
  );
}

describe("CompletionHeatMap", () => {
  it("renders an empty grid when the set has no card data", () => {
    expect(() => draw(undefined)).not.toThrow();
  });

  it("renders when a colour in the set has no cards", () => {
    // Sparse on purpose: only the third colour has anything, so the others are
    // holes rather than empty objects.
    const cardData: any[] = [];
    cardData[3] = { rare: [{ id: 1, owned: 2, wanted: 4 }] };

    expect(() => draw(cardData)).not.toThrow();
  });

  it("still draws a column for every colour", () => {
    const { container } = draw(undefined);
    // White, blue, black, red, green, colourless and multicolour.
    expect(
      container.querySelectorAll(".completion-table-color-title")
    ).toHaveLength(7);
  });
});
