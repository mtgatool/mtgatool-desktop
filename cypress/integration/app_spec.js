describe("Sign Up", () => {
  it("Adds person to course", () => {
    cy.visit("/");

    cy.get(
      "#root > div > form > div > div > div.auth-pages-container-main > div > div:nth-child(2) > div:nth-child(2) > input[type=text]"
    )
      .click()
      .type("Manuel777")
      .should("have.value", "Manuel777");

    cy.get(
      "#root > div > form > div > div > div.auth-pages-container-main > div > div:nth-child(2) > div:nth-child(4) > input[type=password]"
    )
      .click()
      .type("Udontcare123");

    cy.get(
      "#root > div > form > div > div > div.auth-pages-container-main > div > div:nth-child(2) > button"
    ).click();

    cy.get(
      "#root > div > div.top-nav-container > div.info > div > div.top-username",
      { timeout: 15000 }
    ).should("contain", "Manuel777");
  });
});
