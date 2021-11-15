describe('Navigation header test ', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Visits the initial project page', () => {
    cy.location('href').should('contain', '/home');
    cy.get('[data-cy=title]').contains(
      'O dev front-end que o seu negócio precisa!'
    );
  });

  it('Visit each page from home', () => {
    //certificates
    cy.get('[data-cy=header-certificates]').click();
    cy.location('href').should('contain', '/certificates');
    cy.get('[data-cy=title]').should(
      'contain',
      'Diversos certificados em instituições nacionais e internacionais'
    );

    //projects
    cy.visit('/');
    cy.get('[data-cy=header-projects').click();
    cy.location('href').should('contain', '/projects');
    cy.get('[data-cy=title]').contains('Projetos');

    //about-me
    cy.visit('/');
    cy.get('[data-cy=header-about-me').click();
    cy.location('href').should('contain', '/about-me');
    cy.get('[data-cy=title]').contains('Samyr Oliveira Ribeiro');

    //contact
    cy.visit('/');
    cy.get('[data-cy=header-contact').click();
    cy.location('href').should('contain', '/contact');
    cy.get('[data-cy=title]').contains('Entre em contato!');
  });
});

describe('Home navigation links', () => {
  it('Home links direct to correct page', () => {
    cy.visit('/');
    //Saiba mais button redirect
    cy.get('[data-cy=know-more]').click();
    cy.location('href').should('contain', '/about-me');
    //Veja todos button redirect
    cy.visit('/');
    cy.get('[data-cy=see-all').click();
    cy.location('href').should('contain', '/projects');
  });
});

describe('Footer navigation test', () => {
  it('Visit each link from footer navigation', () => {
    cy.get('[data-cy=footer-home').click();
    cy.location('href').should('contain', '/home');
    cy.get('[data-cy=footer-about-me').click();
    cy.location('href').should('contain', '/about-me');
    cy.get('[data-cy=footer-projects').click();
    cy.location('href').should('contain', '/projects');
    cy.get('[data-cy=footer-contact').click();
    cy.location('href').should('contain', '/contact');
  });
});
