// first-start.spec.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

/* ==== Test Created with Cypress Studio ==== */
it(`should load the app's homepage and show what's new`, function() {
  /* ==== Generated with Cypress Studio ==== */
  cy.visit('http://localhost:3000');
  /* ==== End Cypress Studio ==== */
  /* ==== Generated with Cypress Studio ==== */
  const whatsNewModal = cy.get('#markdown-help').parent().parent();
  whatsNewModal.should('be.visible');
  whatsNewModal.find('.modal-footer > .btn').click();
  /* ==== End Cypress Studio ==== */
  cy.get('.brand-logo').should('be.visible');
});
